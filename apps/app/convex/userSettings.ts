import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Get user settings
export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return null;
    }
    
    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    
    return settings;
  },
});

// Create or update user settings
export const upsert = mutation({
  args: {
    plan: v.optional(v.union(v.literal("free"), v.literal("pro"))),
    defaultMode: v.optional(v.union(v.literal("generate"), v.literal("edit"))),
    theme: v.optional(v.union(v.literal("light"), v.literal("dark"), v.literal("system"))),
    defaultGlobalStyles: v.optional(v.string()),
    emailSignature: v.optional(v.string()),
    preferredComponents: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    
    const now = Date.now();
    
    if (existing) {
      // Update existing settings
      const filteredUpdates = Object.fromEntries(
        Object.entries(args).filter(([_, v]) => v !== undefined)
      );
      
      await ctx.db.patch(existing._id, {
        ...filteredUpdates,
        updatedAt: now,
      });
      
      return existing._id;
    } else {
      // Create new settings
      const settingsId = await ctx.db.insert("userSettings", {
        userId,
        plan: args.plan ?? "free",
        defaultMode: args.defaultMode,
        theme: args.theme,
        defaultGlobalStyles: args.defaultGlobalStyles,
        emailSignature: args.emailSignature,
        preferredComponents: args.preferredComponents,
        createdAt: now,
        updatedAt: now,
      });
      
      return settingsId;
    }
  },
});

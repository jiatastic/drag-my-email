import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { auth } from "./auth";

// Get current authenticated user
export const current = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return null;
    }
    
    const user = await ctx.db.get(userId);
    return user;
  },
});

// Update the current user's display name
export const updateName = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    await ctx.db.patch(userId, { name: args.name });
    return await ctx.db.get(userId);
  },
});

// Generate an upload URL for the current user to upload an avatar image.
export const generateAvatarUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.storage.generateUploadUrl();
  },
});

// Update the current user's profile fields (first name, last name, avatar).
export const updateProfile = mutation({
  args: {
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    avatarStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const existing = await ctx.db.get(userId);
    if (!existing) {
      throw new Error("User not found");
    }

    const updates: Record<string, unknown> = {};

    if (args.firstName !== undefined) updates.firstName = args.firstName;
    if (args.lastName !== undefined) updates.lastName = args.lastName;

    // If first/last name are being updated, keep `name` in sync for places
    // that still rely on a single display name field.
    if (args.firstName !== undefined || args.lastName !== undefined) {
      const first = (args.firstName ?? (existing as any).firstName ?? "").trim();
      const last = (args.lastName ?? (existing as any).lastName ?? "").trim();
      const displayName = `${first} ${last}`.trim();
      if (displayName) updates.name = displayName;
    }

    if (args.avatarStorageId !== undefined) {
      updates.avatarStorageId = args.avatarStorageId;
      const avatarUrl = await ctx.storage.getUrl(args.avatarStorageId);
      if (avatarUrl) {
        // `image` is the standard Convex Auth field used by OAuth providers too.
        updates.image = avatarUrl;
      }
    }

    if (Object.keys(updates).length === 0) {
      return existing;
    }

    await ctx.db.patch(userId, updates);
    return await ctx.db.get(userId);
  },
});

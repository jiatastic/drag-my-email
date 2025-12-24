import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Get all templates for the current user
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return [];
    }
    const templates = await ctx.db
      .query("templates")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    return templates;
  },
});

// Get a single template by ID
export const get = query({
  args: { id: v.id("templates") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    const template = await ctx.db.get(args.id);
    
    if (!template) {
      return null;
    }
    
    // Only return if user owns it or it's public
    if (template.userId !== userId && !template.isPublic) {
      return null;
    }
    
    return template;
  },
});

// Get public templates (for template gallery)
export const listPublic = query({
  args: {},
  handler: async (ctx) => {
    const templates = await ctx.db
      .query("templates")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .order("desc")
      .take(50);
    return templates;
  },
});

// Create a new template
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    components: v.string(),
    globalStyles: v.optional(v.string()),
    thumbnail: v.optional(v.string()),
    category: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    const now = Date.now();
    const templateId = await ctx.db.insert("templates", {
      userId,
      name: args.name,
      description: args.description,
      components: args.components,
      globalStyles: args.globalStyles,
      thumbnail: args.thumbnail,
      category: args.category,
      isPublic: args.isPublic ?? false,
      createdAt: now,
      updatedAt: now,
    });
    
    return templateId;
  },
});

// Update an existing template
export const update = mutation({
  args: {
    id: v.id("templates"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    components: v.optional(v.string()),
    globalStyles: v.optional(v.string()),
    thumbnail: v.optional(v.string()),
    category: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    const template = await ctx.db.get(args.id);
    if (!template || template.userId !== userId) {
      throw new Error("Template not found or not authorized");
    }
    
    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    
    await ctx.db.patch(args.id, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });
    
    return args.id;
  },
});

// Delete a template
export const remove = mutation({
  args: { id: v.id("templates") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    const template = await ctx.db.get(args.id);
    if (!template || template.userId !== userId) {
      throw new Error("Template not found or not authorized");
    }
    
    await ctx.db.delete(args.id);
    return true;
  },
});

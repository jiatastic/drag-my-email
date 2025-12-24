import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Get all chat histories for the current user
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return [];
    }
    const histories = await ctx.db
      .query("chatHistories")
      .withIndex("by_user_recent", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);
    return histories;
  },
});

// Get a single chat history by ID
export const get = query({
  args: { id: v.id("chatHistories") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    const history = await ctx.db.get(args.id);
    
    if (!history || history.userId !== userId) {
      return null;
    }
    
    return history;
  },
});

// Create a new chat history
export const create = mutation({
  args: {
    title: v.string(),
    messages: v.string(),
    templateId: v.optional(v.id("templates")),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    const now = Date.now();
    const historyId = await ctx.db.insert("chatHistories", {
      userId,
      title: args.title,
      messages: args.messages,
      templateId: args.templateId,
      createdAt: now,
      updatedAt: now,
    });
    
    return historyId;
  },
});

// Update a chat history (e.g., add new messages)
export const update = mutation({
  args: {
    id: v.id("chatHistories"),
    title: v.optional(v.string()),
    messages: v.optional(v.string()),
    templateId: v.optional(v.id("templates")),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    const history = await ctx.db.get(args.id);
    if (!history || history.userId !== userId) {
      throw new Error("Chat history not found or not authorized");
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

// Delete a chat history
export const remove = mutation({
  args: { id: v.id("chatHistories") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    const history = await ctx.db.get(args.id);
    if (!history || history.userId !== userId) {
      throw new Error("Chat history not found or not authorized");
    }
    
    await ctx.db.delete(args.id);
    return true;
  },
});

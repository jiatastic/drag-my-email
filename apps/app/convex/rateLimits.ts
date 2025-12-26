import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";
import { Id } from "./_generated/dataModel";

// Rate limit configuration per plan
// Free tier has daily limits, Pro tier has much higher limits
const RATE_LIMITS = {
  free: {
    brand_import: { limit: 3, windowMs: 24 * 60 * 60 * 1000 }, // 3 times/day
    asset_generate: { limit: 10, windowMs: 24 * 60 * 60 * 1000 }, // 10 times/day
    ai_assistant: { limit: 20, windowMs: 24 * 60 * 60 * 1000 }, // 20 times/day
    email_send: { limit: 20, windowMs: 24 * 60 * 60 * 1000 }, // 20 times/day
  },
  pro: {
    brand_import: { limit: 50, windowMs: 24 * 60 * 60 * 1000 }, // 50 times/day
    asset_generate: { limit: 200, windowMs: 24 * 60 * 60 * 1000 }, // 200 times/day
    ai_assistant: { limit: 999999, windowMs: 24 * 60 * 60 * 1000 }, // Unlimited
    email_send: { limit: 500, windowMs: 24 * 60 * 60 * 1000 }, // 500 times/day
  },
} as const;

export type RateLimitAction = keyof typeof RATE_LIMITS.free;

// Get rate limit configuration for an action and plan
export function getRateLimitConfig(action: RateLimitAction, plan: "free" | "pro") {
  return RATE_LIMITS[plan][action];
}

// Check if user can perform action (query - does not consume quota)
export const check = query({
  args: { action: v.string() },
  handler: async (ctx, args): Promise<{
    allowed: boolean;
    remaining: number;
    limit: number;
    resetAt: number;
    plan: "free" | "pro";
  }> => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return { allowed: false, remaining: 0, limit: 0, resetAt: 0, plan: "free" };
    }

    const action = args.action as RateLimitAction;

    // Get user's plan
    const userSettings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    const plan: "free" | "pro" = userSettings?.plan === "pro" ? "pro" : "free";

    const config = getRateLimitConfig(action, plan);
    if (!config) {
      // Unknown action, allow by default
      return { allowed: true, remaining: 999999, limit: 999999, resetAt: 0, plan };
    }

    const now = Date.now();

    // Get current rate limit record
    const existing = await ctx.db
      .query("rateLimits")
      .withIndex("by_user_action", (q) => q.eq("userId", userId).eq("action", action))
      .unique();

    // If no record exists or window expired, user has full quota
    if (!existing || now - existing.windowStart >= config.windowMs) {
      return {
        allowed: true,
        remaining: config.limit,
        limit: config.limit,
        resetAt: now + config.windowMs,
        plan,
      };
    }

    // Check current usage
    const remaining = Math.max(0, config.limit - existing.count);
    const resetAt = existing.windowStart + config.windowMs;

    return {
      allowed: remaining > 0,
      remaining,
      limit: config.limit,
      resetAt,
      plan,
    };
  },
});

// Consume a rate limit quota (mutation - increments counter)
export const consume = mutation({
  args: { action: v.string() },
  handler: async (ctx, args): Promise<{
    allowed: boolean;
    remaining: number;
    limit: number;
    resetAt: number;
  }> => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const action = args.action as RateLimitAction;

    // Get user's plan
    const userSettings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    const plan: "free" | "pro" = userSettings?.plan === "pro" ? "pro" : "free";

    const config = getRateLimitConfig(action, plan);
    if (!config) {
      // Unknown action, allow by default
      return { allowed: true, remaining: 999999, limit: 999999, resetAt: 0 };
    }

    const now = Date.now();

    // Get current rate limit record
    const existing = await ctx.db
      .query("rateLimits")
      .withIndex("by_user_action", (q) => q.eq("userId", userId).eq("action", action))
      .unique();

    // Calculate new count
    let newCount: number;
    let windowStart: number;

    if (!existing || now - existing.windowStart >= config.windowMs) {
      // New window - reset counter
      newCount = 1;
      windowStart = now;

      if (existing) {
        // Update existing record
        await ctx.db.patch(existing._id, {
          count: newCount,
          windowStart,
        });
      } else {
        // Create new record
        await ctx.db.insert("rateLimits", {
          userId,
          action,
          count: newCount,
          windowStart,
        });
      }
    } else {
      // Same window - check limit
      if (existing.count >= config.limit) {
        const resetAt = existing.windowStart + config.windowMs;
        const remaining = 0;
        
        throw new Error(
          `Rate limit exceeded for ${action}. ` +
          `Limit: ${config.limit} per day. ` +
          `Resets at: ${new Date(resetAt).toISOString()}. ` +
          `Upgrade to Pro for higher limits.`
        );
      }

      // Increment counter
      newCount = existing.count + 1;
      windowStart = existing.windowStart;
      await ctx.db.patch(existing._id, { count: newCount });
    }

    const remaining = Math.max(0, config.limit - newCount);
    const resetAt = windowStart + config.windowMs;

    return {
      allowed: true,
      remaining,
      limit: config.limit,
      resetAt,
    };
  },
});

// Get all rate limit statuses for current user
export const getAll = query({
  args: {},
  handler: async (ctx): Promise<Record<string, {
    count: number;
    limit: number;
    remaining: number;
    resetAt: number;
  }>> => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return {};

    // Get user's plan
    const userSettings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    const plan: "free" | "pro" = userSettings?.plan === "pro" ? "pro" : "free";

    const now = Date.now();
    const result: Record<string, { count: number; limit: number; remaining: number; resetAt: number }> = {};

    // Get all rate limit records for user
    const records = await ctx.db
      .query("rateLimits")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();

    // Build status for each action type
    const actions: RateLimitAction[] = ["brand_import", "asset_generate", "ai_assistant", "email_send"];
    
    for (const action of actions) {
      const config = getRateLimitConfig(action, plan);
      const record = records.find((r) => r.action === action);

      if (!record || now - record.windowStart >= config.windowMs) {
        // No record or window expired
        result[action] = {
          count: 0,
          limit: config.limit,
          remaining: config.limit,
          resetAt: now + config.windowMs,
        };
      } else {
        result[action] = {
          count: record.count,
          limit: config.limit,
          remaining: Math.max(0, config.limit - record.count),
          resetAt: record.windowStart + config.windowMs,
        };
      }
    }

    return result;
  },
});


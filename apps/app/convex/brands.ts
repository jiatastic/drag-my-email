import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { auth } from "./auth";
import { api } from "./_generated/api";

function normalizeDomain(hostname: string) {
  const lower = hostname.toLowerCase();
  return lower.startsWith("www.") ? lower.slice(4) : lower;
}

function getBrandLimit(plan: "free" | "pro") {
  return plan === "pro" ? 5 : 2;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("brands")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(100);
  },
});

export const count = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return 0;

    const all = await ctx.db
      .query("brands")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return all.length;
  },
});

export const get = query({
  args: { id: v.id("brands") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const brand = await ctx.db.get(args.id);
    if (!brand || brand.userId !== userId) return null;
    return brand;
  },
});

export const getByDomain = query({
  args: { domain: v.string() },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    return await ctx.db
      .query("brands")
      .withIndex("by_user_and_domain", (q) => q.eq("userId", userId).eq("domain", args.domain))
      .unique();
  },
});

export const remove = mutation({
  args: { id: v.id("brands") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const brand = await ctx.db.get(args.id);
    if (!brand || brand.userId !== userId) {
      throw new Error("Brand not found or not authorized");
    }

    // Best-effort cleanup: remove associated assets.
    const assets = await ctx.db
      .query("marketingAssets")
      .withIndex("by_brand", (q) => q.eq("brandId", args.id))
      .collect();
    for (const asset of assets) {
      await ctx.db.delete(asset._id);
    }

    await ctx.db.delete(args.id);
    return true;
  },
});

export const upsertFromImport = mutation({
  args: {
    domain: v.string(),
    url: v.string(),
    name: v.string(),
    brandingJson: v.string(),
    summary: v.optional(v.string()),
    metadataJson: v.optional(v.string()),
    screenshotUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("brands")
      .withIndex("by_user_and_domain", (q) => q.eq("userId", userId).eq("domain", args.domain))
      .unique();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        url: args.url,
        brandingJson: args.brandingJson,
        summary: args.summary,
        metadataJson: args.metadataJson,
        screenshotUrl: args.screenshotUrl,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("brands", {
      userId,
      name: args.name,
      url: args.url,
      domain: args.domain,
      brandingJson: args.brandingJson,
      summary: args.summary,
      metadataJson: args.metadataJson,
      screenshotUrl: args.screenshotUrl,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const importFromUrl = action({
  args: { url: v.string() },
  handler: async (ctx, args): Promise<{ brandId: string; plan: "free" | "pro"; limit: number }> => {
    // Auth
    const userId = await auth.getUserId(ctx as any);
    if (!userId) throw new Error("Not authenticated");

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(args.url);
    } catch {
      throw new Error("Invalid URL");
    }
    const domain = normalizeDomain(parsedUrl.hostname);

    const existing = await ctx.runQuery(api.brands.getByDomain, { domain });

    // Entitlements (stubbed via userSettings.plan)
    const settings: { plan?: "free" | "pro" } | null = await ctx.runQuery(api.userSettings.get, {});
    const plan: "free" | "pro" = settings?.plan === "pro" ? "pro" : "free";
    const limit = getBrandLimit(plan);

    if (!existing) {
      const currentCount = await ctx.runQuery(api.brands.count, {});
      if (currentCount >= limit) {
        throw new Error(`Brand limit reached (${currentCount}/${limit}). Upgrade to import more brands.`);
      }
    }

    // Check rate limit before expensive API call (only for new imports)
    if (!existing) {
      await ctx.runMutation(api.rateLimits.consume, { action: "brand_import" });
    }

    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      throw new Error("Missing FIRECRAWL_API_KEY environment variable");
    }

    const response = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url: parsedUrl.toString(),
        formats: [
          "branding",
          "summary",
          { type: "screenshot", fullPage: true, quality: 80 },
        ],
      }),
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        payload?.error ||
        payload?.message ||
        `Firecrawl error: ${response.status} ${response.statusText}`;
      throw new Error(message);
    }

    if (!payload?.success || !payload?.data?.branding) {
      throw new Error("Firecrawl did not return branding data");
    }

    const metadata = payload.data.metadata;
    const name =
      metadata?.ogSiteName ||
      metadata?.title ||
      domain;

    const brandId: string = await ctx.runMutation(api.brands.upsertFromImport, {
      domain,
      url: parsedUrl.toString(),
      name,
      brandingJson: JSON.stringify(payload.data.branding),
      summary: payload.data.summary,
      metadataJson: metadata ? JSON.stringify(metadata) : undefined,
      screenshotUrl: payload.data.screenshot,
    });

    return { brandId, plan, limit };
  },
});



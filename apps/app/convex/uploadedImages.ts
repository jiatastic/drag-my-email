import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";
import type { Id } from "./_generated/dataModel";

// List uploaded images for a brand
export const listByBrand = query({
  args: { brandId: v.id("brands") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    // Ensure user owns the brand
    const brand = await ctx.db.get(args.brandId);
    if (!brand || brand.userId !== userId) return [];

    const images = await ctx.db
      .query("uploadedImages")
      .withIndex("by_brand_recent", (q) => q.eq("brandId", args.brandId))
      .order("desc")
      .take(50);

    // Resolve storage URLs for each image
    const withUrls = await Promise.all(
      images.map(async (img) => {
        const url = await ctx.storage.getUrl(img.storageId);
        return { ...img, url };
      })
    );

    return withUrls;
  },
});

// Generate upload URL for client-side upload
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.storage.generateUploadUrl();
  },
});

// Save uploaded image metadata after client-side upload
export const saveUploadedImage = mutation({
  args: {
    brandId: v.id("brands"),
    storageId: v.id("_storage"),
    name: v.string(),
    mimeType: v.string(),
    size: v.number(),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Verify brand ownership
    const brand = await ctx.db.get(args.brandId);
    if (!brand || brand.userId !== userId) {
      throw new Error("Brand not found or not authorized");
    }

    const imageId = await ctx.db.insert("uploadedImages", {
      userId,
      brandId: args.brandId,
      name: args.name,
      storageId: args.storageId,
      mimeType: args.mimeType,
      size: args.size,
      width: args.width,
      height: args.height,
      category: args.category,
      createdAt: Date.now(),
    });

    // Get the URL for immediate use
    const url = await ctx.storage.getUrl(args.storageId);

    return { imageId, url };
  },
});

// Delete an uploaded image
export const remove = mutation({
  args: { id: v.id("uploadedImages") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const image = await ctx.db.get(args.id);
    if (!image || image.userId !== userId) {
      throw new Error("Image not found or not authorized");
    }

    // Delete from storage
    await ctx.storage.delete(image.storageId);

    // Delete the record
    await ctx.db.delete(args.id);

    return true;
  },
});

// Get a single uploaded image with URL
export const get = query({
  args: { id: v.id("uploadedImages") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const image = await ctx.db.get(args.id);
    if (!image || image.userId !== userId) return null;

    const url = await ctx.storage.getUrl(image.storageId);
    return { ...image, url };
  },
});


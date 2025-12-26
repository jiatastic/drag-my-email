import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  // Override Convex Auth's `users` table to extend it with profile fields.
  // Note: We must keep the same indexes required by Convex Auth.
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),

    // Profile fields editable by the user
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    avatarStorageId: v.optional(v.id("_storage")),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),

  // User saved email templates
  templates: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    components: v.string(), // JSON stringified EmailComponent[]
    globalStyles: v.optional(v.string()), // JSON stringified EmailGlobalStyles
    thumbnail: v.optional(v.string()), // Base64 or URL for preview
    category: v.optional(v.string()),
    isPublic: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_name", ["userId", "name"])
    .index("by_public", ["isPublic"]),

  // Imported brands (branding profiles + metadata) used to generate marketing assets and guide AI email generation.
  brands: defineTable({
    userId: v.id("users"),
    name: v.string(),
    url: v.string(),
    domain: v.string(),
    brandingJson: v.string(), // JSON stringified Firecrawl BrandingProfile
    summary: v.optional(v.string()),
    metadataJson: v.optional(v.string()), // JSON stringified Firecrawl metadata (title/description/og etc.)
    screenshotUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_domain", ["userId", "domain"]),

  // Uploaded product/reference images for marketing asset generation
  uploadedImages: defineTable({
    userId: v.id("users"),
    brandId: v.id("brands"),
    name: v.string(), // User-defined name or auto-generated
    storageId: v.id("_storage"), // Convex file storage ID
    mimeType: v.string(), // e.g. image/jpeg, image/png
    size: v.number(), // File size in bytes
    width: v.optional(v.number()), // Image width if known
    height: v.optional(v.number()), // Image height if known
    category: v.optional(v.string()), // e.g. "product", "lifestyle", "background"
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_brand", ["brandId"])
    .index("by_brand_recent", ["brandId", "createdAt"]),

  // Generated marketing assets (images/copy) for a brand.
  marketingAssets: defineTable({
    userId: v.id("users"),
    brandId: v.id("brands"),
    type: v.string(), // e.g. hero, banner, social_post, logo_variant
    prompt: v.string(),
    provider: v.string(), // e.g. ai-gateway
    status: v.union(
      v.literal("queued"),
      v.literal("running"),
      v.literal("succeeded"),
      v.literal("failed")
    ),
    resultJson: v.optional(v.string()), // JSON stringified provider output (urls/seed/dimensions/etc.)
    imageStorageId: v.optional(v.id("_storage")), // Convex file storage ID for large images
    error: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_brand", ["brandId"])
    .index("by_brand_recent", ["brandId", "updatedAt"]),

  // AI chat conversation histories
  chatHistories: defineTable({
    userId: v.id("users"),
    title: v.string(), // Auto-generated from first message or user-defined
    messages: v.string(), // JSON stringified ChatMessage[]
    templateId: v.optional(v.id("templates")), // Link to template if generated from this chat
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_recent", ["userId", "updatedAt"]),

  // User preferences and settings
  userSettings: defineTable({
    userId: v.id("users"),
    plan: v.optional(v.union(v.literal("free"), v.literal("pro"))),
    defaultMode: v.optional(v.union(v.literal("generate"), v.literal("edit"))),
    theme: v.optional(v.union(v.literal("light"), v.literal("dark"), v.literal("system"))),
    defaultGlobalStyles: v.optional(v.string()), // JSON stringified default styles
    emailSignature: v.optional(v.string()),
    preferredComponents: v.optional(v.array(v.string())), // Favorite component types
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // Rate limiting tracking for free tier users
  rateLimits: defineTable({
    userId: v.id("users"),
    action: v.string(), // "brand_import" | "asset_generate" | "ai_assistant" | "email_send"
    count: v.number(), // Number of actions in current window
    windowStart: v.number(), // Timestamp when the current window started
  })
    .index("by_user_action", ["userId", "action"]),
});

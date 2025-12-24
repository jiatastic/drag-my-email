import { v } from "convex/values";
import { createGateway, generateText } from "ai";
import { action, mutation, query } from "./_generated/server";
import { auth } from "./auth";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

type AssetStatus = "queued" | "running" | "succeeded" | "failed";

// Asset type specifications for agency-quality marketing assets
const ASSET_TYPE_SPECS: Record<string, {
  description: string;
  aspectRatio: string;
  targetPixels: string;
  styleGuidelines: string[];
  examples: string;
}> = {
  hero: {
    description: "A stunning hero banner image for website headers, email headers, or landing pages",
    aspectRatio: "16:9 (EXACT)",
    targetPixels: "1600x900",
    styleGuidelines: [
      "Bold, attention-grabbing composition with clear focal point",
      "Leave some negative space for optional text overlay, but avoid big blank white panels or empty boxes",
      "Dramatic lighting with depth and dimension",
      "Premium, editorial-quality photography aesthetic",
      "Subtle gradient overlays that complement the brand palette",
    ],
    examples: "Think Apple product launches, Stripe's gradient backgrounds, Airbnb's lifestyle imagery",
  },
  banner: {
    description: "A versatile banner for ads, email campaigns, or promotional sections",
    // Intercom-style email header banner: wide and short.
    aspectRatio: "3:1 (EXACT) — ideal for the top of marketing emails",
    // Generate at 2x the typical email display size (600x200) for crisp rendering on retina screens.
    targetPixels: "1200x400",
    styleGuidelines: [
      "Eye-catching but not overwhelming - designed to complement content",
      "Clear visual hierarchy with brand colors as accents",
      "Professional and polished, suitable for B2B and B2C",
      "Subtle patterns or abstract elements that reinforce brand identity",
      "Works well at multiple sizes without losing impact",
    ],
    examples: "Think LinkedIn sponsored content, Mailchimp campaign headers, Notion's clean banners",
  },
  social_post: {
    description: "A scroll-stopping social media post image optimized for engagement",
    aspectRatio: "1:1 (EXACT)",
    targetPixels: "1024x1024",
    styleGuidelines: [
      "Instantly recognizable brand presence - colors and style should scream the brand",
      "Bold, high-contrast visuals that pop on mobile feeds",
      "Modern, trendy aesthetic that feels current and relevant",
      "Room for optional text overlay (keep any text large and readable)",
      "Thumb-stopping quality - must stand out in a crowded feed",
    ],
    examples: "Think Figma's vibrant posts, Notion's minimalist aesthetic, Vercel's sleek gradients",
  },
  logo_variant: {
    description: "A creative brand mark or logo-inspired graphic element",
    aspectRatio: "1:1 (EXACT)",
    targetPixels: "1024x1024",
    styleGuidelines: [
      "Abstract interpretation of brand identity, not a literal logo",
      "Geometric patterns or shapes inspired by brand aesthetics",
      "Versatile design that works on dark and light backgrounds",
      "Premium, sophisticated execution with attention to detail",
      "Suitable for app icons, profile pictures, or brand marks",
    ],
    examples: "Think Stripe's gradient orbs, Linear's clean marks, Vercel's triangular motifs",
  },
};

function getExactAspectRatio(type: string): "16:9" | "3:1" | "1:1" {
  if (type === "banner") return "3:1";
  if (type === "social_post") return "1:1";
  if (type === "logo_variant") return "1:1";
  return "16:9";
}

function readPngDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  if (bytes.length < 24) return null;
  if (
    bytes[0] !== 0x89 ||
    bytes[1] !== 0x50 ||
    bytes[2] !== 0x4e ||
    bytes[3] !== 0x47 ||
    bytes[4] !== 0x0d ||
    bytes[5] !== 0x0a ||
    bytes[6] !== 0x1a ||
    bytes[7] !== 0x0a
  ) {
    return null;
  }

  // IHDR chunk starts at offset 8, width/height are big-endian at offset 16/20.
  const width =
    (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
  const height =
    (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;
  return { width, height };
}

function parseTargetPixels(targetPixels: string): { width: number; height: number } | null {
  const m = targetPixels.match(/^(\d+)x(\d+)$/);
  if (!m) return null;
  const width = Number.parseInt(m[1] || "", 10);
  const height = Number.parseInt(m[2] || "", 10);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;
  return { width, height };
}

function buildGeminiStrictPrompt(prompt: string, spec: { targetPixels: string }, aspectRatio: string, attempt: number): string {
  const extra =
    attempt <= 1
      ? ""
      : [
          "",
          "If you did not comply with the exact canvas size last time, fix it now.",
          "Do not upscale/downscale after rendering—render the canvas at the exact size from the start.",
          "Return ONLY the image. No text.",
        ].join("\n");

  return [
    prompt,
    "",
    "## OUTPUT CONSTRAINTS (STRICT)",
    `- Output MUST be a single image at EXACTLY ${spec.targetPixels} pixels.`,
    `- Aspect ratio MUST be EXACTLY ${aspectRatio}.`,
    "- No borders, no padding, no frames that change the canvas size.",
    "- Keep the whole composition inside the canvas (no cropping at the edges).",
    extra,
  ]
    .filter(Boolean)
    .join("\n");
}

// Professional styling presets. These blocks intentionally use concrete visual attributes
// (lens, focal length, lighting, composition) to stabilize output quality.
const STYLE_PRESETS: Record<
  string,
  { label: string; block: string; brandLockBias?: "strict" | "balanced" }
> = {
  brand_strict: {
    label: "Brand strict",
    brandLockBias: "strict",
    block: [
      "STYLE PRESET: Brand strict (clean, premium, brand-consistent)",
      "Lighting: soft studio light, controlled highlights, subtle shadows, high clarity",
      "Lens: 35mm–50mm, crisp focus, minimal distortion",
      "Composition: strong hierarchy, intentional negative space, centered focal subject",
      "Finish: premium, modern, high-end SaaS marketing quality, no clutter",
    ].join("\n"),
  },
  minimal_modern: {
    label: "Minimal modern",
    brandLockBias: "strict",
    block: [
      "STYLE PRESET: Minimal modern (whitespace, editorial layout)",
      "Lighting: bright, even, soft shadows, clean background",
      "Lens: 50mm, sharp focus, minimal noise",
      "Composition: lots of whitespace, grid alignment, minimal elements, elegant geometry",
      "Finish: minimalist, crisp, modern, premium, typography-friendly",
    ].join("\n"),
  },
  editorial_photo: {
    label: "Editorial photo",
    brandLockBias: "balanced",
    block: [
      "STYLE PRESET: Editorial photo (realistic, magazine-grade)",
      "Lighting: natural light, soft diffusion, gentle contrast, realistic reflections",
      "Lens: 85mm portrait lens, shallow depth of field, bokeh",
      "Composition: cinematic framing, subject separation, authentic texture and materials",
      "Finish: premium editorial photography, no plastic CGI look",
    ].join("\n"),
  },
  product_hero: {
    label: "Product hero",
    brandLockBias: "strict",
    block: [
      "STYLE PRESET: Product hero (studio product marketing)",
      "Lighting: controlled studio lighting, rim light, clean highlights, premium reflections",
      "Lens: 60–105mm macro/product lens, sharp detail, precise focus",
      "Composition: product centered, strong silhouette, clean backdrop, room for headline",
      "Finish: Apple-like product hero, ultra-clean, high polish",
    ].join("\n"),
  },
  gradient_abstract: {
    label: "Gradient abstract",
    brandLockBias: "strict",
    block: [
      "STYLE PRESET: Gradient abstract (modern SaaS gradients + shapes)",
      "Lighting: soft glow, subtle bloom, smooth gradients, depth via shadows",
      "Lens: 35mm, clean perspective",
      "Composition: abstract shapes/orbs, layered depth, lots of negative space for text",
      "Finish: Stripe/Vercel-like gradients, premium, modern, not noisy",
    ].join("\n"),
  },
  cinematic_3d: {
    label: "Cinematic 3D",
    brandLockBias: "balanced",
    block: [
      "STYLE PRESET: Cinematic 3D (volumetric light, premium materials)",
      "Lighting: volumetric lighting, soft haze, dramatic contrast, rim light",
      "Lens: 24–35mm wide, strong depth, controlled perspective",
      "Composition: cinematic framing, depth layers, bold focal point, negative space",
      "Finish: high-end 3D render, realistic materials, no cheap CGI",
    ].join("\n"),
  },
};

function buildPrompt(params: {
  brandName: string;
  type: string;
  stylePreset?: string;
  colors?: Record<string, unknown>;
  fonts?: Array<{ family?: string }>;
  summary?: string;
  promptOverrides?: string;
}): string {
  const spec = ASSET_TYPE_SPECS[params.type] || ASSET_TYPE_SPECS.hero;
  const preset = params.stylePreset ? STYLE_PRESETS[params.stylePreset] : STYLE_PRESETS.brand_strict;
  
  // Extract and format brand colors with semantic meaning
  const colorEntries = Object.entries(params.colors ?? {});
  const primaryColors = colorEntries.slice(0, 3);
  const accentColors = colorEntries.slice(3, 6);
  
  const colorPalette = primaryColors.length > 0
    ? `PRIMARY BRAND COLORS (use these prominently):\n${primaryColors.map(([name, hex]) => `  • ${name}: ${hex}`).join("\n")}`
    : "";
  
  const accentPalette = accentColors.length > 0
    ? `ACCENT COLORS (use for highlights and details):\n${accentColors.map(([name, hex]) => `  • ${name}: ${hex}`).join("\n")}`
    : "";

  const fontFamilies = (params.fonts ?? [])
    .map((f) => f?.family)
    .filter(Boolean)
    .slice(0, 3);

  const fontSection = fontFamilies.length > 0
    ? `TYPOGRAPHY STYLE: Inspired by ${fontFamilies.join(", ")} - ${
        fontFamilies.some(f => /mono|code/i.test(f || "")) ? "technical, developer-focused" :
        fontFamilies.some(f => /serif/i.test(f || "")) ? "elegant, editorial, sophisticated" :
        fontFamilies.some(f => /display|black|bold/i.test(f || "")) ? "bold, impactful, modern" :
        "clean, modern, professional"
      }`
    : "";

  // Build the prompt. IMPORTANT: Client requirements come first to maximize compliance.
  const sections: string[] = [];

  if (params.promptOverrides?.trim()) {
    sections.push(
      "## ⚡ CLIENT REQUIREMENTS (HIGHEST PRIORITY - FOLLOW EXACTLY) ⚡",
      params.promptOverrides.trim(),
      "",
      "These requirements override everything below. If there is a conflict, follow this section.",
      ""
    );
  }

  sections.push(
    `# CREATIVE BRIEF: ${params.brandName} Marketing Asset`,
    "",
    "## STYLE PRESET",
    preset?.block || STYLE_PRESETS.brand_strict.block,
    "",
    "## THE BRAND",
    `Brand: ${params.brandName}`,
    params.summary ? `Brand story: ${params.summary}` : "",
    "",
    "## BRAND LOCK (STRICT)",
    colorPalette,
    accentPalette,
    fontSection,
    "",
    "Color usage rules:",
    preset?.brandLockBias === "balanced"
      ? "• Keep brand colors prominent, but you may use subtle neutral tones for realism."
      : "• Brand colors must dominate the palette (aim for 60–80% of visible color).",
    "• Avoid introducing unrelated saturated colors unless required by client requirements.",
    "• Keep backgrounds clean and on-brand; avoid busy patterns unless requested.",
    "",
    "## ASSET SPECIFICATIONS",
    `Asset type: ${params.type.toUpperCase()}`,
    `Description: ${spec.description}`,
    `Aspect ratio: ${spec.aspectRatio}`,
    `Target pixel size: ${spec.targetPixels} (EXACT)`,
    "",
    "Output constraints (STRICT):",
    `• Render at ${spec.targetPixels} pixels.`,
    `• Aspect ratio must be EXACTLY ${spec.aspectRatio}. Do not deviate.`,
    "• Do not add extra borders or frames unless requested.",
    "• Keep safe margins: reserve subtle breathing room for optional headline/CTA (no large blank white rectangles).",
    "",
    "## CREATIVE GUIDELINES",
    ...spec.styleGuidelines.map((g, i) => `${i + 1}. ${g}`),
    "",
    `Reference quality: ${spec.examples}`,
    "",
    "## AVOID (NEGATIVE CONSTRAINTS)",
    "• Generic stock photo look",
    "• Low-res, blurry, noisy, artifacts, banding",
    "• Random extra text, watermarks, logos (unless client requirement asks for text)",
    "• Cluttered composition; keep a clear focal point",
    "",
    "## FINAL INSTRUCTION",
    `Create a stunning ${params.type} image for ${params.brandName}. Follow client requirements first, then apply the preset and brand lock.`
  );

  return sections.filter(Boolean).join("\n");
}

export const listByBrand = query({
  args: { brandId: v.id("brands") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    // Ensure user owns the brand
    const brand = await ctx.db.get(args.brandId);
    if (!brand || brand.userId !== userId) return [];

    const assets = await ctx.db
      .query("marketingAssets")
      .withIndex("by_brand_recent", (q) => q.eq("brandId", args.brandId))
      .order("desc")
      .take(100);

    // Resolve storage URLs for each asset that has an imageStorageId
    const withUrls = await Promise.all(
      assets.map(async (asset) => {
        let imageUrl: string | null = null;
        if (asset.imageStorageId) {
          imageUrl = await ctx.storage.getUrl(asset.imageStorageId);
        }
        return { ...asset, imageUrl };
      })
    );

    return withUrls;
  },
});

export const get = query({
  args: { id: v.id("marketingAssets") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const asset = await ctx.db.get(args.id);
    if (!asset || asset.userId !== userId) return null;
    return asset;
  },
});

export const remove = mutation({
  args: { id: v.id("marketingAssets") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const asset = await ctx.db.get(args.id);
    if (!asset || asset.userId !== userId) {
      throw new Error("Asset not found or not authorized");
    }

    await ctx.db.delete(args.id);
    return true;
  },
});

export const create = mutation({
  args: {
    brandId: v.id("brands"),
    type: v.string(),
    prompt: v.string(),
    provider: v.string(),
    status: v.union(
      v.literal("queued"),
      v.literal("running"),
      v.literal("succeeded"),
      v.literal("failed")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const brand = await ctx.db.get(args.brandId);
    if (!brand || brand.userId !== userId) {
      throw new Error("Brand not found or not authorized");
    }

    const now = Date.now();
    return await ctx.db.insert("marketingAssets", {
      userId,
      brandId: args.brandId,
      type: args.type,
      prompt: args.prompt,
      provider: args.provider,
      status: args.status as AssetStatus,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("marketingAssets"),
    status: v.union(
      v.literal("queued"),
      v.literal("running"),
      v.literal("succeeded"),
      v.literal("failed")
    ),
    resultJson: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const asset = await ctx.db.get(args.id);
    if (!asset || asset.userId !== userId) {
      throw new Error("Asset not found or not authorized");
    }

    await ctx.db.patch(args.id, {
      status: args.status as AssetStatus,
      resultJson: args.resultJson,
      imageStorageId: args.imageStorageId,
      error: args.error,
      updatedAt: Date.now(),
    });
    return true;
  },
});

export const generate = action({
  args: {
    brandId: v.id("brands"),
    type: v.string(),
    stylePreset: v.optional(v.string()),
    promptOverrides: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ assetId: Id<"marketingAssets">; imageUrl?: string }> => {
    const userId = await auth.getUserId(ctx as any);
    if (!userId) throw new Error("Not authenticated");

    const brand = await ctx.runQuery(api.brands.get, { id: args.brandId });
    if (!brand) throw new Error("Brand not found or not authorized");

    let branding: any = null;
    try {
      branding = JSON.parse(brand.brandingJson);
    } catch {
      // ignore; keep null
    }

    const prompt = buildPrompt({
      brandName: brand.name,
      type: args.type,
      stylePreset: args.stylePreset,
      colors: branding?.colors,
      fonts: branding?.fonts,
      summary: brand.summary,
      promptOverrides: args.promptOverrides,
    });

    const provider = "ai-gateway";
    const assetId = await ctx.runMutation(api.marketingAssets.create, {
      brandId: args.brandId,
      type: args.type,
      prompt,
      provider,
      status: "queued",
    });

    const gatewayKey = process.env.AI_GATEWAY_API_KEY;
    if (!gatewayKey) {
      await ctx.runMutation(api.marketingAssets.updateStatus, {
        id: assetId,
        status: "failed",
        error: "Missing AI_GATEWAY_API_KEY environment variable",
      });
      throw new Error("Missing AI_GATEWAY_API_KEY environment variable");
    }

    // Per Context7 docs, Gemini 2.5 Flash Image should be used via `generateText()` and `result.files`.
    // We intentionally lock this to Gemini to satisfy product requirements.
    const model = "google/gemini-2.5-flash-image";

    await ctx.runMutation(api.marketingAssets.updateStatus, {
      id: assetId,
      status: "running",
    });

    try {
      // Use the official AI SDK gateway provider to avoid guessing base URLs / request shapes.
      const gateway = createGateway({ apiKey: gatewayKey });
      const spec = ASSET_TYPE_SPECS[args.type] || ASSET_TYPE_SPECS.hero;
      const aspectRatio = getExactAspectRatio(args.type);

      let imageBytes: Uint8Array | undefined;
      let mediaType = "image/png";
      let width: number | undefined;
      let height: number | undefined;
      let dimensionsMatch: boolean | undefined;

      const target = parseTargetPixels(spec.targetPixels);

      // Retry a few times because Gemini may occasionally ignore strict pixel constraints.
      const maxAttempts = 3;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const result = await generateText({
          model: gateway(model),
          prompt: buildGeminiStrictPrompt(prompt, spec, aspectRatio, attempt),
        });

        const firstImageFile = result.files?.find((f) => f.mediaType?.startsWith("image/"));
        if (!firstImageFile) continue;

        mediaType = firstImageFile.mediaType || "image/png";
        imageBytes = (firstImageFile as any).uint8Array as Uint8Array | undefined;

        if (!imageBytes || imageBytes.length === 0) continue;

        const dims = mediaType.includes("png") ? readPngDimensions(imageBytes) : null;
        width = dims?.width;
        height = dims?.height;
        dimensionsMatch =
          !!target && !!dims ? dims.width === target.width && dims.height === target.height : undefined;

        // If we can measure and it matches, stop early.
        if (dimensionsMatch !== false) break;
      }

      let imageUrl: string | undefined;
      let storageId: Id<"_storage"> | undefined;

      if (imageBytes && imageBytes.length > 0) {
        // Upload to Convex file storage to avoid the 1 MiB document limit
        // Store raw bytes. Use ArrayBuffer to satisfy TS BlobPart typing (avoid ArrayBufferLike/SharedArrayBuffer mismatch).
        const imageArrayBuffer = imageBytes.slice().buffer;
        storageId = await ctx.storage.store(new Blob([imageArrayBuffer], { type: mediaType }));
        // Get the public URL for immediate use
        imageUrl = await ctx.storage.getUrl(storageId) ?? undefined;
      }

      // Store only lightweight metadata (no base64 blob)
      const resultMeta = {
        model,
        generator: "generateText",
        stylePreset: args.stylePreset || "brand_strict",
        mediaType,
        size: spec.targetPixels,
        aspectRatio,
        width,
        height,
        dimensionsMatch,
        generatedAt: Date.now(),
        hasImage: !!storageId,
      };

      await ctx.runMutation(api.marketingAssets.updateStatus, {
        id: assetId,
        status: "succeeded",
        resultJson: JSON.stringify(resultMeta),
        imageStorageId: storageId,
      });

      return { assetId, imageUrl };
    } catch (error: any) {
      const errorMessage =
        error?.message ||
        (typeof error === "string" ? error : null) ||
        (error ? JSON.stringify(error) : null) ||
        "AI Gateway image generation failed";

      await ctx.runMutation(api.marketingAssets.updateStatus, {
        id: assetId,
        status: "failed",
        error: errorMessage,
      });
      throw new Error(errorMessage);
    }
  },
});



import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { auth } from "./auth";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { fal } from "@fal-ai/client";

type AssetStatus = "queued" | "running" | "succeeded" | "failed";

// fal.ai model IDs - ByteDance Seedream v4.5
const FAL_MODEL_TEXT = "fal-ai/bytedance/seedream/v4.5/text-to-image";
const FAL_MODEL_EDIT = "fal-ai/bytedance/seedream/v4.5/edit";

// Seedream v4.5 supported image_size presets
// Docs: https://fal.ai/models/fal-ai/bytedance/seedream/v4.5/text-to-image/api
type FalImageSizePreset = 
  | "square_hd"      // 1024x1024 HD square
  | "square"         // 512x512 standard square
  | "portrait_4_3"   // 768x1024 portrait
  | "portrait_16_9"  // 576x1024 tall portrait
  | "landscape_4_3"  // 1024x768 landscape
  | "landscape_16_9" // 1024x576 widescreen
  | "auto_2K"        // Auto 2K resolution
  | "auto_4K";       // Auto 4K resolution

// Custom image size for precise control
interface FalCustomImageSize {
  width: number;
  height: number;
}

// fal.ai image_size can be preset or custom dimensions
type FalImageSize = FalImageSizePreset | FalCustomImageSize;

// Asset type specifications for marketing assets
// Using Seedream v4.5's image_size presets or custom dimensions
const ASSET_TYPE_SPECS: Record<string, {
  description: string;
  imageSize: FalImageSize;
  styleGuidelines: string[];
  cameraSettings: {
    angle: string;
    distance: string;
    lens: string;
  };
}> = {
  hero: {
    description: "Stunning hero banner for website headers, email headers, or landing pages",
    imageSize: "landscape_16_9", // 1024x576 widescreen
    styleGuidelines: [
      "Bold, attention-grabbing composition with clear focal point",
      "Dramatic lighting with depth and dimension",
      "Premium, editorial-quality aesthetic",
    ],
    cameraSettings: {
      angle: "eye level",
      distance: "wide shot",
      lens: "35mm",
    },
  },
  banner: {
    description: "Versatile banner for ads, email campaigns, or promotional sections",
    imageSize: { width: 1200, height: 400 }, // Custom 3:1 for email banners
    styleGuidelines: [
      "Eye-catching but not overwhelming",
      "Clear visual hierarchy with brand colors",
      "Professional and polished finish",
    ],
    cameraSettings: {
      angle: "eye level",
      distance: "medium shot",
      lens: "50mm",
    },
  },
  social_post: {
    description: "Scroll-stopping social media post image optimized for engagement",
    imageSize: "square_hd", // 1024x1024 HD square
    styleGuidelines: [
      "Instantly recognizable brand presence",
      "Bold, high-contrast visuals that pop on mobile",
      "Modern, trendy aesthetic",
    ],
    cameraSettings: {
      angle: "eye level",
      distance: "medium shot",
      lens: "50mm",
    },
  },
  logo_variant: {
    description: "Creative brand mark or logo-inspired graphic element",
    imageSize: "square_hd", // 1024x1024 HD square
    styleGuidelines: [
      "Abstract interpretation of brand identity",
      "Geometric patterns inspired by brand aesthetics",
      "Versatile design for dark and light backgrounds",
    ],
    cameraSettings: {
      angle: "high angle",
      distance: "close-up",
      lens: "85mm",
    },
  },
  product_detail: {
    description: "Professional e-commerce product detail page poster with bilingual copy, Apple minimalist style",
    imageSize: "portrait_16_9", // 576x1024 tall portrait (9:16)
    styleGuidelines: [
      "Premium product photography with clean studio background",
      "Bilingual typography (Chinese/English) with glass morphism or 3D embossed text effects",
      "Minimalist layout with generous whitespace (background should follow the selected style preset; not hardcoded)",
      "Professional product presentation with clear visual hierarchy",
    ],
    cameraSettings: {
      angle: "eye level",
      distance: "medium shot",
      lens: "85mm",
    },
  },
  product_showcase: {
    description: "E-commerce product showcase poster with color swatches, size guide, or feature highlights",
    imageSize: "portrait_16_9", // 576x1024 tall portrait (9:16)
    styleGuidelines: [
      "Clean product presentation with color/material inspiration boards",
      "Minimalist grid layouts for size guides or feature comparisons",
      "Clean backgrounds with flat, high-end aesthetic (background should follow the selected style preset; not hardcoded)",
      "Professional product photography with lifestyle context",
    ],
    cameraSettings: {
      angle: "eye level",
      distance: "medium shot",
      lens: "50mm",
    },
  },
  storyboard_grid: {
    description: "3x3 cinematic storyboard grid (single consistent model) for luxury e-commerce campaigns",
    // A wide canvas helps readability for 9 panels + labels.
    imageSize: { width: 1536, height: 864 }, // 16:9
    styleGuidelines: [
      "3x3 grid layout with consistent gutters and panel alignment",
      "Single consistent subject across all panels (same identity, outfit, hair, makeup)",
      "Camera shot progression across the grid (wide to close and detail shots)",
      "Premium fashion editorial tone with clean, controlled lighting",
      "Clear, readable shot labels per panel (e.g., ELS, LS, MLS...)",
      "Photorealistic skin with natural texture, pores, and subtle imperfections",
      "Authentic candid expressions, natural body language",
    ],
    cameraSettings: {
      angle: "varied (per panel)",
      distance: "varied (per panel)",
      lens: "shot on Canon EOS R5, varied focal length per panel (24-200mm range)",
    },
  },
};

// Style presets that map to JSON prompt configurations
const STYLE_PRESETS: Record<string, {
  label: string;
  style: string;
  lighting: string;
  mood: string;
  composition: string;
  background: string;
}> = {
  brand_strict: {
    label: "Brand strict",
    style: "Clean premium marketing photography with controlled studio lighting",
    lighting: "Soft studio lighting with controlled highlights and gentle shadows",
    mood: "Professional, trustworthy, premium",
    composition: "rule of thirds",
    background: "Clean, neutral studio background (white or light gray) with optional subtle brand-color accents (no forced warm tint)",
  },
  minimal_modern: {
    label: "Minimal modern",
    style: "Minimalist modern design with generous whitespace and editorial layout",
    lighting: "Bright even lighting with soft diffusion",
    mood: "Clean, sophisticated, elegant",
    composition: "centered",
    background: "Pure white or very light gray seamless background, high key, lots of negative space",
  },
  editorial_photo: {
    label: "Editorial photo",
    style: "Editorial photography with natural lighting and magazine-quality composition, shot on Sony A7R IV or Canon EOS R5, photorealistic with natural skin texture and subtle imperfections",
    lighting: "Natural window light with soft diffusion, realistic shadow falloff, golden hour warmth or overcast softbox quality, catchlights in eyes",
    mood: "Authentic, refined, aspirational, candid moment captured",
    composition: "rule of thirds with shallow depth of field, f/1.8 to f/2.8 aperture, natural bokeh",
    background: "Lifestyle/editorial environment background (tasteful, not busy), natural tones, realistic depth of field with creamy background blur",
  },
  product_hero: {
    label: "Product hero",
    style: "Studio product photography with premium reflections and Apple-style polish",
    lighting: "Controlled lighting with rim light and clean highlights",
    mood: "Premium, desirable, high-end",
    composition: "centered",
    background: "Clean studio background with subtle gradient or soft shadow falloff; may incorporate brand colors but avoid forcing warm cream tones",
  },
  gradient_abstract: {
    label: "Gradient abstract",
    style: "Modern SaaS gradient abstract with soft glowing auras and smooth transitions",
    lighting: "Ambient glow with subtle bloom effects",
    mood: "Innovative, modern, tech-forward",
    composition: "dynamic diagonal",
    background: "Abstract gradient background with smooth transitions (use brand colors only if provided; otherwise free-form modern gradients)",
  },
  cinematic_3d: {
    label: "Cinematic 3D",
    style: "Cinematic 3D visualization with volumetric lighting and premium materials",
    lighting: "Volumetric lighting with atmospheric haze and rim lighting",
    mood: "Epic, dramatic, immersive",
    composition: "dynamic diagonal",
    background: "Cinematic background with controlled atmosphere (may be darker); tasteful gradients and depth, not flat warm cream",
  },
};

// Build JSON structured prompt for FLUX.2 [pro]
// This format provides precise control over complex generations
interface JsonPrompt {
  scene: string;
  subjects: Array<{
    type: string;
    description: string;
    position: "foreground" | "midground" | "background";
  }>;
  style: string;
  color_palette: string[];
  lighting: string;
  mood: string;
  composition: string;
  camera: {
    angle: string;
    distance: string;
    lens: string;
  };
}

function buildJsonPrompt(params: {
  brandName: string;
  type: string;
  stylePreset?: string;
  brandColors?: Record<string, string>;
  summary?: string;
  promptOverrides?: string;
  productImageUrls?: string[]; // Multiple product images for reference
  ecommerceMode?: "simple" | "detailed";
  productFeatures?: string[];
}): string {
  const spec = ASSET_TYPE_SPECS[params.type] || ASSET_TYPE_SPECS.hero;
  const preset = params.stylePreset ? STYLE_PRESETS[params.stylePreset] : STYLE_PRESETS.brand_strict;

  // Only use brand colors for brand-focused presets (let creative modes have full freedom)
  const brandFocusedPresets = ["brand_strict", "product_hero", "minimal_modern"];
  const shouldUseBrandColors = brandFocusedPresets.includes(params.stylePreset || "brand_strict");

  const colorPalette: string[] = [];
  if (shouldUseBrandColors && params.brandColors) {
    // Add "hex" prefix for FLUX.2 color recognition
    Object.entries(params.brandColors).slice(0, 5).forEach(([_, hex]) => {
      if (typeof hex === "string" && hex.startsWith("#")) {
        colorPalette.push(`hex ${hex}`);
      }
    });
  }
  // Creative presets (gradient_abstract, cinematic_3d, editorial_photo) have no color constraints

  // Build scene description
  let sceneDescription = spec.description;
  if (params.summary) {
    const shortSummary = params.summary.length > 100 
      ? params.summary.slice(0, 100) + "..." 
      : params.summary;
    sceneDescription += `. Brand context: ${shortSummary}`;
  }

  // Build subject based on asset type
  const subjects: JsonPrompt["subjects"] = [];
  
  if (params.type === "product_detail" || params.type === "product_showcase") {
    // E-commerce product posters
    // Note: Product image reference will be added in the final prompt construction
    // Default to English unless specifically requested
    
    if (params.type === "product_detail") {
      subjects.push({
        type: "Product detail poster",
        description: `Professional 9:16 vertical premium product detail poster for ${params.brandName}. Clean Apple minimalist style with elegant typography. Glass morphism or 3D embossed text effects. Professional studio quality with clear visual hierarchy and generous whitespace. Background should follow the selected style preset (not hardcoded).`,
        position: "foreground",
      });
    } else if (params.type === "product_showcase") {
      subjects.push({
        type: "Product showcase poster",
        description: `Professional 9:16 vertical product showcase poster for ${params.brandName}. Clean minimalist layout with color swatches, size guide, or feature highlights. Flat, high-end aesthetic. Elegant typography with professional product presentation. Background should follow the selected style preset (not hardcoded).`,
        position: "foreground",
      });
    }
  } else if (params.type === "hero") {
    subjects.push({
      type: "Marketing visual",
      description: `Premium ${params.brandName} brand imagery with professional finish`,
      position: "midground",
    });
  } else if (params.type === "banner") {
    subjects.push({
      type: "Banner graphic",
      description: `Clean promotional banner for ${params.brandName} with brand colors`,
      position: "midground",
    });
  } else if (params.type === "social_post") {
    subjects.push({
      type: "Social media content",
      description: `Eye-catching ${params.brandName} branded content for social feeds`,
      position: "foreground",
    });
  } else if (params.type === "logo_variant") {
    subjects.push({
      type: "Abstract brand element",
      description: `Geometric brand mark inspired by ${params.brandName} identity`,
      position: "foreground",
    });
  } else if (params.type === "storyboard_grid") {
    subjects.push({
      type: "Storyboard grid",
      description:
        "3x3 cinematic storyboard grid for a luxury e-commerce fashion campaign. One consistent model across all panels, same outfit, same lighting, same identity. Clear shot labels for each panel and consistent gutters. Use the selected style preset for overall look and background (do not hardcode warm/cream backgrounds). Model should have photorealistic features: natural skin texture with visible pores and subtle imperfections, authentic expressions with natural facial asymmetry, realistic eye detail with proper catchlights, natural hair with individual strand visibility. Avoid plastic/airbrushed/doll-like appearance.",
      position: "foreground",
    });
  }

  // Enhanced style for e-commerce mode
  let finalStyle = preset.style;
  let finalLighting = preset.lighting;
  let finalMood = preset.mood;
  
  // Check if user provided a custom background override in promptOverrides
  // Format: "Background: <custom description>" at the start of promptOverrides
  let userCustomBackground: string | null = null;
  let cleanedPromptOverrides = params.promptOverrides?.trim() || "";
  
  const backgroundMatch = cleanedPromptOverrides.match(/^Background:\s*(.+?)(?:\n\n|$)/i);
  if (backgroundMatch) {
    userCustomBackground = backgroundMatch[1].trim();
    // Remove the background line from promptOverrides to avoid duplication
    cleanedPromptOverrides = cleanedPromptOverrides.replace(/^Background:\s*.+?(?:\n\n|$)/i, "").trim();
  }
  
  // Use user's custom background if provided, otherwise use preset
  const finalBackground = userCustomBackground || preset.background ||
    "Clean studio background (white or light gray) with optional subtle brand tint; do not force a warm cream/champagne look";
  
  if (params.type === "product_detail" || params.type === "product_showcase") {
    // Keep e-commerce-specific direction, but do NOT override the background into a single hardcoded warm palette.
    // Use stylePreset to control the background look and overall aesthetic.
    finalStyle = `${preset.style}. Professional e-commerce product photography, premium product presentation, elegant typography with glass morphism or 3D embossed text effects, generous whitespace. Background: ${finalBackground}.`;
    finalLighting = `Professional studio soft lighting shot on Phase One IQ4 or Hasselblad H6D, controlled highlights with gentle shadow falloff, natural diffusion through large softbox, high-end fashion photography quality, realistic texture rendering with natural skin tones, subtle catchlights in reflective surfaces`;
    finalMood = `Premium, trustworthy, sophisticated, clean, professional, high-end retail aesthetic`;
    
    // Add product features if provided
    if (params.productFeatures && params.productFeatures.length > 0) {
      const featuresText = params.productFeatures.slice(0, 5).join(", ");
      sceneDescription += `. Key product features: ${featuresText}`;
    }
  }

  // Construct the JSON prompt
  const jsonPrompt: JsonPrompt = {
    scene: sceneDescription,
    subjects,
    style: finalStyle,
    color_palette: colorPalette,
    lighting: finalLighting,
    mood: finalMood,
    composition: preset.composition,
    camera: spec.cameraSettings,
  };

  // Build final prompt
  let finalPrompt: string;
  
  if (params.type === "product_detail" || params.type === "product_showcase") {
    // For e-commerce, use detailed professional prompt format
    const jsonStr = JSON.stringify(jsonPrompt, null, 2);
    
    if (params.ecommerceMode === "detailed") {
      // Detailed mode: Full professional prompt with all specifications
      // Note: Image reference is passed separately via image_url parameter, not in prompt
      
      finalPrompt = `Professional 9:16 vertical premium e-commerce product poster for ${params.brandName}.

Technical specifications:
- Format: 9:16 vertical portrait, high resolution
- Style: Apple minimalist, clean studio photography
- Background: ${finalBackground}
- Typography: Elegant, glass morphism or 3D embossed text effects, unified style but varied layouts
- Product presentation: Professional studio quality, clear visual hierarchy, premium finish
- Camera: ${spec.cameraSettings.lens} lens, ${spec.cameraSettings.angle} angle, ${spec.cameraSettings.distance}
- Lighting: ${finalLighting}
- Mood: ${finalMood}

Detailed JSON specification:
${jsonStr}

Negative prompt: cluttered, busy, multiple patterns, harsh shadows, watermark, messy text, low quality, blurry, AI-generated artifacts, distorted text, poor typography, inconsistent style, Chinese characters, Asian text. For any human elements: plastic skin, airbrushed face, doll-like appearance, uncanny valley, dead eyes, fake smile, stiff pose, wax figure look, CGI appearance, overprocessed skin, extra fingers, distorted hands`;
    } else {
      // Simple mode: Concise prompt with JSON structure
      finalPrompt = `9:16 vertical premium product poster, Apple minimalist style, elegant typography, clean studio background. Background: ${finalBackground}. Generous whitespace. Specification: ${jsonStr}`;
    }
  } else {
    if (params.type === "storyboard_grid") {
      // Storyboard mode: add explicit grid requirements while keeping it flexible via promptOverrides.
      // Keep background dynamic via style preset.
      // Enhanced with realistic portrait photography techniques to reduce AI artifacts
      finalPrompt = `Generate a 3x3 cinematic storyboard grid, shot on Canon EOS R5 with varied lenses (24mm to 200mm across panels).

Global constraints:
- One consistent model across all panels (same identity/face, same outfit, same hair and makeup)
- Consistent lighting across all panels: ${finalLighting}
- Background: ${finalBackground}
- Tone: premium fashion editorial, luxury e-commerce style, inspired by Annie Leibovitz and Mario Testino photography
- Typography: minimal, only shot labels if included; avoid extra decorative text

Portrait realism requirements:
- Photorealistic skin texture with natural pores, fine lines, and subtle imperfections (not plastic or airbrushed)
- Natural skin tones with realistic subsurface scattering
- Authentic candid expressions with natural asymmetry
- Realistic eye catchlights and iris detail
- Natural hair with individual strand visibility
- Genuine body language and posture

Technical photography specifications:
- Shallow depth of field with natural bokeh in close-up panels
- Realistic light falloff and soft shadows
- Film grain texture similar to Kodak Portra 400 or Fuji Pro 400H
- Natural color grading, avoid oversaturation

Specification:
${JSON.stringify(jsonPrompt, null, 2)}

Negative prompt: plastic skin, airbrushed face, symmetrical face, perfect skin, doll-like appearance, uncanny valley, dead eyes, fake smile, stiff pose, wax figure look, CGI appearance, overprocessed, HDR overdone, inconsistent face, different person, multiple identities, face drift, extra limbs, distorted hands, extra fingers, broken grid layout, misaligned panels, unreadable labels, messy text, watermark, low quality, blurry, artifacts`;
    } else {
      // Standard mode: JSON structure
      finalPrompt = JSON.stringify(jsonPrompt, null, 2);
    }
  }
  
  // If user provides custom prompt overrides (excluding the background which is already applied), prepend them
  if (cleanedPromptOverrides) {
    finalPrompt = `${cleanedPromptOverrides}\n\n${finalPrompt}`;
  }

  return finalPrompt;
}

// Call fal.ai API using official client
// Uses ByteDance Seedream v4.5 for text-to-image and edit (image-to-image)
async function callFalAPI(params: {
  prompt: string;
  imageSize: FalImageSize;
  seed?: number;
  apiKey: string;
  imageUrls?: string[]; // Reference image URLs for image-to-image generation (edit mode)
}): Promise<{ 
  imageUrl: string; 
  width: number; 
  height: number; 
  seed: number;
  contentType: string;
}> {
  // Configure fal client with API key
  fal.config({
    credentials: params.apiKey,
  });

  // Determine which model to use based on whether images are provided
  const isEditMode = params.imageUrls && params.imageUrls.length > 0;
  const modelId = isEditMode ? FAL_MODEL_EDIT : FAL_MODEL_TEXT;

  console.log(`[fal.ai] Using model: ${modelId}, isEditMode: ${isEditMode}`);

  // Build input payload for Seedream v4.5
  const input: Record<string, unknown> = {
    prompt: params.prompt,
    image_size: params.imageSize,
    num_images: 1,
    max_images: 1,
    enable_safety_checker: true,
  };

  // Edit mode uses image_urls array
  if (isEditMode) {
    input.image_urls = params.imageUrls;
  }

  // Add seed for reproducibility if provided
  if (params.seed !== undefined && params.seed >= 0) {
    input.seed = params.seed;
  }

  try {
    // Use fal.subscribe which handles queue submission, polling, and result fetching
    console.log(`[fal.ai] Submitting request...`);
    
    const result = await fal.subscribe(modelId, {
      input: input as any, // Dynamic input based on model
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log(`[fal.ai] Status: IN_PROGRESS`);
        } else if (update.status === "IN_QUEUE") {
          console.log(`[fal.ai] Status: IN_QUEUE, position: ${(update as any).queue_position ?? "unknown"}`);
        }
      },
    });

    console.log(`[fal.ai] Generation completed!`);
    console.log(`[fal.ai] Result keys: ${Object.keys(result.data || {}).join(", ")}`);

    // Extract image from result
    const data = result.data as any;
    const image = data?.images?.[0] || data?.image;

    if (!image?.url) {
      console.log(`[fal.ai] Full result: ${JSON.stringify(data).slice(0, 1000)}`);
      throw new Error(`No image URL in fal.ai response. Keys: ${Object.keys(data || {}).join(", ")}`);
    }

    console.log(`[fal.ai] Image URL received: ${image.url.slice(0, 100)}...`);

    return {
      imageUrl: image.url,
      width: image.width || 1024,
      height: image.height || 1024,
      seed: data.seed || 0,
      contentType: image.content_type || "image/png",
    };
  } catch (error: any) {
    console.log(`[fal.ai] Error: ${error.message}`);
    throw new Error(`fal.ai generation failed: ${error.message}`);
  }
}

// Download image and return as bytes
async function downloadImage(url: string): Promise<{ bytes: Uint8Array; mediaType: string }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "image/png";
  const arrayBuffer = await response.arrayBuffer();
  
  return {
    bytes: new Uint8Array(arrayBuffer),
    mediaType: contentType,
  };
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
    // E-commerce specific parameters
    productImageUrls: v.optional(v.array(v.string())), // Multiple product image URLs for reference
    ecommerceMode: v.optional(v.union(v.literal("simple"), v.literal("detailed"))), // Simple or detailed prompt mode
    productFeatures: v.optional(v.array(v.string())), // Product feature list for e-commerce posters
  },
  handler: async (ctx, args): Promise<{ assetId: Id<"marketingAssets">; imageUrl?: string }> => {
    const userId = await auth.getUserId(ctx as any);
    if (!userId) throw new Error("Not authenticated");

    const brand = await ctx.runQuery(api.brands.get, { id: args.brandId });
    if (!brand) throw new Error("Brand not found or not authorized");

    // Get asset specs
    const spec = ASSET_TYPE_SPECS[args.type] || ASSET_TYPE_SPECS.hero;

    // Extract brand colors from branding data
    const brandColors: Record<string, string> = {};
    if (brand.brandingJson) {
      try {
        const branding = JSON.parse(brand.brandingJson);
        if (branding?.colors && typeof branding.colors === "object") {
          Object.assign(brandColors, branding.colors);
        }
      } catch {
        // Ignore JSON parse errors
      }
    }

    // Build JSON structured prompt for FLUX.2 [pro]
    const prompt = buildJsonPrompt({
      brandName: brand.name,
      type: args.type,
      stylePreset: args.stylePreset,
      brandColors,
      summary: brand.summary,
      promptOverrides: args.promptOverrides,
      productImageUrls: args.productImageUrls,
      ecommerceMode: args.ecommerceMode || (args.type === "product_detail" || args.type === "product_showcase" ? "detailed" : undefined),
      productFeatures: args.productFeatures,
    });

    const provider = "fal.ai/bytedance/seedream/v4.5";
    const assetId = await ctx.runMutation(api.marketingAssets.create, {
      brandId: args.brandId,
      type: args.type,
      prompt,
      provider,
      status: "queued",
    });

    // Check for fal.ai API key
    const falApiKey = process.env.FAL_KEY;
    if (!falApiKey) {
      await ctx.runMutation(api.marketingAssets.updateStatus, {
        id: assetId,
        status: "failed",
        error: "Missing FAL_KEY environment variable. Get your key at https://fal.ai/dashboard/keys",
      });
      throw new Error("Missing FAL_KEY environment variable");
    }

    await ctx.runMutation(api.marketingAssets.updateStatus, {
      id: assetId,
      status: "running",
    });

    try {
      // Call fal.ai API
      // Use Seedream v4.5 edit if product image is provided, otherwise text-to-image
      const falResult = await callFalAPI({
        prompt,
        imageSize: spec.imageSize,
        apiKey: falApiKey,
        imageUrls: args.productImageUrls && args.productImageUrls.length > 0 ? args.productImageUrls : undefined,
      });

      // Download the image and store in Convex storage
      const { bytes: imageBytes, mediaType } = await downloadImage(falResult.imageUrl);

      let imageUrl: string | undefined;
      let storageId: Id<"_storage"> | undefined;

      if (imageBytes && imageBytes.length > 0) {
        // Upload to Convex file storage
        const imageArrayBuffer = imageBytes.slice().buffer;
        storageId = await ctx.storage.store(new Blob([imageArrayBuffer], { type: mediaType }));
        // Get the public URL for immediate use
        imageUrl = await ctx.storage.getUrl(storageId) ?? undefined;
      }

      // Store metadata
      const usedEditMode = args.productImageUrls && args.productImageUrls.length > 0;
      const resultMeta = {
        provider: "fal.ai",
        model: usedEditMode ? FAL_MODEL_EDIT : FAL_MODEL_TEXT,
        stylePreset: args.stylePreset || "brand_strict",
        promptFormat: "json_structured",
        mediaType,
        imageSize: spec.imageSize,
        width: falResult.width,
        height: falResult.height,
        seed: falResult.seed,
        generatedAt: Date.now(),
        hasImage: !!storageId,
        hasReferenceImage: usedEditMode,
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
        "fal.ai image generation failed";

      await ctx.runMutation(api.marketingAssets.updateStatus, {
        id: assetId,
        status: "failed",
        error: errorMessage,
      });
      throw new Error(errorMessage);
    }
  },
});

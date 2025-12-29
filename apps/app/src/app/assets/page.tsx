"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAction, useMutation, useQuery, useConvexAuth } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogDescription,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  ScrollArea,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@react-email-builder/ui";
import {
  ExternalLink,
  Plus,
  Trash2,
  Loader2,
  Info,
  Sparkles,
  Copy,
  Upload,
  Image as ImageIcon,
  Check,
  X,
  Download,
  Maximize2,
  Send,
  FileImage,
  Calendar,
} from "lucide-react";
import { UserMenu } from "@/components/auth/UserMenu";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { getGoogleFaviconUrl } from "@/lib/social-icons";
import { TruncatedText } from "@/components/ui/truncated-text";

type BrandingProfile = {
  colorScheme?: "light" | "dark";
  colors?: Record<string, string>;
  fonts?: Array<{ family?: string }>;
  typography?: any;
  spacing?: any;
  components?: any;
  images?: {
    logo?: string;
    favicon?: string;
    ogImage?: string;
  };
  logo?: string;
  personality?: any;
};

function safeJsonParse<T>(value: string | undefined | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function toPrettyJson(value: unknown): string {
  if (value === null || value === undefined) return "";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "";
  }
}

function getPlanLimit(plan: "free" | "pro") {
  return plan === "pro" ? 5 : 1;
}

function getFirstImageUrlFromResultJson(resultJson?: string | null): string | null {
  const parsed = safeJsonParse<any>(resultJson);

  // Vercel AI Gateway (OpenAI-compatible image response)
  // { data: [{ url: string }]} or { data: [{ b64_json: string }]}
  const gatewayUrl = parsed?.data?.[0]?.url;
  if (typeof gatewayUrl === "string" && gatewayUrl.length > 0) return gatewayUrl;

  const b64 = parsed?.data?.[0]?.b64_json;
  if (typeof b64 === "string" && b64.length > 0) return `data:image/png;base64,${b64}`;

  // Legacy providers (e.g. Replicate) often return { output: string | string[] }
  const output = parsed?.output;
  if (typeof output === "string") return output;
  if (Array.isArray(output) && typeof output[0] === "string") return output[0];
  return null;
}

function getAssetAspectClass(type: string): string {
  // Match marketing asset types to a realistic preview aspect ratio.
  if (type === "banner") return "aspect-[3/1]";
  if (type === "hero") return "aspect-[16/9]";
  if (type === "social_post") return "aspect-square";
  if (type === "logo_variant") return "aspect-square";
  if (type === "product_detail") return "aspect-[9/16]";
  if (type === "product_showcase") return "aspect-[9/16]";
  if (type === "storyboard_grid") return "aspect-[16/9]";
  return "aspect-[16/9]";
}

function getMshotsScreenshotUrl(url: string, width: number) {
  // WordPress mShots: anonymous website screenshot endpoint.
  // Example: https://s0.wp.com/mshots/v1/https%3A%2F%2Fstripe.com?w=1200
  return `https://s0.wp.com/mshots/v1/${encodeURIComponent(url)}?w=${width}`;
}

function getClearbitLogoUrl(domain: string, size = 256) {
  return `https://logo.clearbit.com/${domain}?size=${size}`;
}

/**
 * Get the best available favicon/logo URL for a brand
 */
function getBrandFaviconUrl(brand: any): string | null {
  const metadata = safeJsonParse<any>(brand?.metadataJson);
  const branding = safeJsonParse<BrandingProfile>(brand?.metadataJson);
  
  // Try various sources for favicon/logo
  return (
    branding?.images?.favicon ||
    branding?.images?.logo ||
    metadata?.favicon ||
    metadata?.icon ||
    (brand?.domain ? getGoogleFaviconUrl(brand.domain, 64) : null)
  );
}

export default function AssetsPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const settings = useQuery(api.userSettings.get);
  const brands = useQuery(api.brands.list);

  const plan: "free" | "pro" = settings?.plan === "pro" ? "pro" : "free";
  const limit = getPlanLimit(plan);
  const brandCount = brands?.length ?? 0;

  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedBrandId && brands && brands.length > 0) {
      setSelectedBrandId(brands[0]!._id);
    }
  }, [brands, selectedBrandId]);

  const selectedBrand = useMemo(() => {
    if (!brands || !selectedBrandId) return null;
    return brands.find((b: any) => b._id === selectedBrandId) ?? null;
  }, [brands, selectedBrandId]);

  const branding = useMemo(() => {
    return safeJsonParse<BrandingProfile>(selectedBrand?.brandingJson) ?? null;
  }, [selectedBrand?.brandingJson]);

  const assets = useQuery(
    api.marketingAssets.listByBrand,
    selectedBrandId ? ({ brandId: selectedBrandId as any } as any) : ("skip" as any)
  );

  const importBrand = useAction(api.brands.importFromUrl);
  const removeBrand = useMutation(api.brands.remove);
  const generateAsset = useAction(api.marketingAssets.generate);
  const removeAsset = useMutation(api.marketingAssets.remove);

  const [importOpen, setImportOpen] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const [generateOpen, setGenerateOpen] = useState(false);
  const [assetType, setAssetType] = useState("hero");
  const [stylePreset, setStylePreset] = useState<
    "brand_strict" | "minimal_modern" | "editorial_photo" | "cinematic_3d" | "gradient_abstract" | "product_hero"
  >("brand_strict");
  
  // E-commerce mode state
  const [productImageUrls, setProductImageUrls] = useState<string[]>([]);
  const [productFeaturesInput, setProductFeaturesInput] = useState("");
  const [ecommerceMode, setEcommerceMode] = useState<"simple" | "detailed">("detailed");
  const [promptOverrides, setPromptOverrides] = useState("");

  // Background override (optional). This is intentionally free-form and prepended to promptOverrides.
  const [backgroundMode, setBackgroundMode] = useState<"preset" | "custom">("preset");
  const [customBackground, setCustomBackground] = useState("");

  // Storyboard mode state (kept flexible; we generate a dynamic promptOverrides template)
  const [storyboardTheme, setStoryboardTheme] = useState("French high-end double-breasted trench coat");
  const [storyboardModelDesc, setStoryboardModelDesc] = useState(
    "One consistent female model, ultra-detailed face, natural skin texture, clear pupil highlights"
  );
  const [storyboardLighting, setStoryboardLighting] = useState("Clean studio lighting, premium fashion editorial tone");
  const [storyboardGridText, setStoryboardGridText] = useState(
    "Row1: ELS, LS, MLS\nRow2: MS, MCU, CU\nRow3: ECU (details), Low Angle Shot, High Angle Shot"
  );

  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [defaultPreviewFallback, setDefaultPreviewFallback] = useState<Record<number, boolean>>({});

  // Uploaded images state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedUploadedImageIds, setSelectedUploadedImageIds] = useState<string[]>([]);

  // Asset detail modal state
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const [editPrompt, setEditPrompt] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Queries and mutations for uploaded images
  const uploadedImages = useQuery(
    api.uploadedImages.listByBrand,
    selectedBrandId ? ({ brandId: selectedBrandId as any } as any) : ("skip" as any)
  );
  const generateUploadUrl = useMutation(api.uploadedImages.generateUploadUrl);
  const saveUploadedImage = useMutation(api.uploadedImages.saveUploadedImage);
  const removeUploadedImage = useMutation(api.uploadedImages.remove);

  // Handle file upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedBrandId) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file (JPEG, PNG, etc.)");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Image must be smaller than 10MB");
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      // Get upload URL from Convex
      const uploadUrl = await generateUploadUrl();

      // Upload file directly to Convex storage
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const { storageId } = await response.json();

      // Get image dimensions
      let width: number | undefined;
      let height: number | undefined;
      try {
        const img = new window.Image();
        img.src = URL.createObjectURL(file);
        await new Promise<void>((resolve) => {
          img.onload = () => {
            width = img.naturalWidth;
            height = img.naturalHeight;
            resolve();
          };
          img.onerror = () => resolve();
        });
      } catch {
        // Ignore dimension detection errors
      }

      // Save image metadata
      await saveUploadedImage({
        brandId: selectedBrandId as any,
        storageId,
        name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
        mimeType: file.type,
        size: file.size,
        width,
        height,
        category: "product", // Default category
      });

      // Reset file input
      e.target.value = "";
    } catch (err: any) {
      setUploadError(err?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // Toggle uploaded image selection (supports multiple)
  // Note: We avoid nesting setProductImageUrls inside setSelectedUploadedImageIds to prevent
  // double-updates in React 18 Strict Mode.
  const toggleUploadedImage = (imageUrl: string, imageId: string) => {
    const isCurrentlySelected = selectedUploadedImageIds.includes(imageId);
    
    if (isCurrentlySelected) {
      // Deselect
      setSelectedUploadedImageIds((prev) => prev.filter((id) => id !== imageId));
      setProductImageUrls((urls) => urls.filter((url) => url !== imageUrl));
    } else {
      // Select (max 4 images)
      if (selectedUploadedImageIds.length >= 4) {
        return; // Don't add more than 4
      }
      setSelectedUploadedImageIds((prev) => [...prev, imageId]);
      setProductImageUrls((urls) => {
        // Prevent duplicates
        if (urls.includes(imageUrl)) return urls;
        return [...urls, imageUrl];
      });
    }
  };

  // Clear all selected images
  const clearSelectedImages = () => {
    setSelectedUploadedImageIds([]);
    setProductImageUrls([]);
  };

  const defaultPreviewTiles = useMemo(
    () => [
      /**
       * Default onboarding preview images (brand website screenshot wall).
       *
       * Screenshots are fetched via WordPress mShots (no key). If a screenshot fails,
       * we gracefully fall back to brand logos (Clearbit) so the UI never looks broken.
       */
      {
        label: "Stripe",
        url: "https://stripe.com",
        screenshotSrc: getMshotsScreenshotUrl("https://stripe.com", 1200),
        logoSrc: getClearbitLogoUrl("stripe.com", 256),
        aspect: "aspect-square",
      },
      {
        label: "Notion",
        url: "https://www.notion.so",
        screenshotSrc: getMshotsScreenshotUrl("https://www.notion.so", 1200),
        logoSrc: getClearbitLogoUrl("notion.so", 256),
        aspect: "aspect-[4/5]",
      },
      {
        label: "Figma",
        url: "https://www.figma.com",
        screenshotSrc: getMshotsScreenshotUrl("https://www.figma.com", 1200),
        logoSrc: getClearbitLogoUrl("figma.com", 256),
        aspect: "aspect-[16/9]",
      },
      {
        label: "Shopify",
        url: "https://www.shopify.com",
        screenshotSrc: getMshotsScreenshotUrl("https://www.shopify.com", 1200),
        logoSrc: getClearbitLogoUrl("shopify.com", 256),
        aspect: "aspect-[16/9]",
        colSpan: "sm:col-span-2",
      },
      {
        label: "Airbnb",
        url: "https://www.airbnb.com",
        screenshotSrc: getMshotsScreenshotUrl("https://www.airbnb.com", 1200),
        logoSrc: getClearbitLogoUrl("airbnb.com", 256),
        aspect: "aspect-square",
      },
    ],
    []
  );

  const canImportMore = brandCount < limit;
  const hasBrands = (brands?.length ?? 0) > 0;
  const hasSelectedBrand = !!selectedBrandId;
  const metadata = useMemo(() => {
    return safeJsonParse<any>(selectedBrand?.metadataJson) ?? null;
  }, [selectedBrand?.metadataJson]);

  const selectedLogoUrl =
    branding?.images?.logo ||
    branding?.logo ||
    branding?.images?.ogImage ||
    selectedBrand?.screenshotUrl ||
    null;

  const selectedFaviconUrl =
    branding?.images?.favicon ||
    (branding as any)?.favicon ||
    metadata?.favicon ||
    metadata?.icon ||
    (selectedBrand?.domain ? getGoogleFaviconUrl(selectedBrand.domain, 128) : null);

  const selectedOgImageUrl = branding?.images?.ogImage || metadata?.ogImage || metadata?.ogImageUrl || null;

  const brandingPretty = useMemo(() => toPrettyJson(branding), [branding]);
  const metadataPretty = useMemo(() => toPrettyJson(metadata), [metadata]);

  async function copyToClipboard(key: string, text: string) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 1200);
    } catch {
      // Ignore clipboard errors (e.g., non-secure contexts). No-op.
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <div className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-12 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/builder" 
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Builder
              </Link>
              <div className="h-4 w-px bg-border" />
              <span className="text-sm font-semibold text-foreground">Assets</span>
            </div>

            <div className="flex items-center gap-3">
              {/* Brand switcher (desktop) */}
              <div className="hidden sm:block w-[240px]">
                <Select
                  value={selectedBrandId ?? undefined}
                  onValueChange={(v) => setSelectedBrandId(v)}
                  disabled={!brands || brands.length === 0}
                >
                  <SelectTrigger className="h-8 border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors">
                    <SelectValue placeholder={brands && brands.length === 0 ? "No brands" : "Select brand"} />
                  </SelectTrigger>
                  <SelectContent>
                    {(brands ?? []).map((b: any) => {
                      const faviconUrl = getBrandFaviconUrl(b);
                      return (
                        <SelectItem key={b._id} value={b._id}>
                          <div className="flex items-center gap-2">
                            {faviconUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={faviconUrl} alt="" className="h-4 w-4 rounded object-contain" />
                            ) : (
                              <div className="h-4 w-4 rounded bg-muted flex items-center justify-center text-[8px] font-medium text-muted-foreground">
                                {b.name?.charAt(0)?.toUpperCase() || "?"}
                              </div>
                            )}
                            <span>{b.name}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="hidden sm:flex items-center gap-2 rounded-lg border border-border/50 bg-muted/20 px-3 py-1.5 text-xs">
                <span className="text-muted-foreground">Brands</span>
                <span className="font-semibold text-foreground">{brandCount}/{limit}</span>
              </div>

              <Button 
                size="sm" 
                onClick={() => setImportOpen(true)} 
                disabled={!isAuthenticated || !canImportMore}
                className="transition-colors"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Brand
              </Button>

              <ThemeToggle />
              <UserMenu />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Brand Assets</h1>
            <p className="text-sm text-muted-foreground">
              Visual identity and AI-generated marketing images for your brands
            </p>
          </div>

          {/* Mobile quick actions */}
          <div className="flex items-center gap-2 sm:hidden">
            <div className="w-[160px]">
              <Select
                value={selectedBrandId ?? undefined}
                onValueChange={(v) => setSelectedBrandId(v)}
                disabled={!brands || brands.length === 0}
              >
              <SelectTrigger className="h-8">
                  <SelectValue placeholder={brands && brands.length === 0 ? "No brands" : "Brand"} />
                </SelectTrigger>
                <SelectContent>
                  {(brands ?? []).map((b: any) => {
                    const faviconUrl = getBrandFaviconUrl(b);
                    return (
                      <SelectItem key={b._id} value={b._id}>
                        <div className="flex items-center gap-2">
                          {faviconUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={faviconUrl} alt="" className="h-4 w-4 rounded object-contain" />
                          ) : (
                            <div className="h-4 w-4 rounded bg-muted flex items-center justify-center text-[8px] font-medium text-muted-foreground">
                              {b.name?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                          )}
                          <span>{b.name}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setImportOpen(true)} disabled={!isAuthenticated || !canImportMore}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Import dialog */}
        <Dialog open={importOpen} onOpenChange={setImportOpen}>
          <DialogContent className="sm:max-w-lg border-border/50">
            <button
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              onClick={() => setImportOpen(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-xl font-bold">Import a brand</DialogTitle>
                  <DialogDescription className="text-base leading-relaxed">
                    Paste a public website URL. We'll fetch brand colors, fonts and logos using Firecrawl.
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand-url">Website URL</Label>
                    <Input
                      id="brand-url"
                      value={importUrl}
                      onChange={(e) => setImportUrl(e.target.value)}
                      placeholder="https://example.com"
                      autoFocus
                    />
                    <p className="text-xs text-muted-foreground">
                      Tip: include <span className="font-mono">https://</span> (e.g.{" "}
                      <span className="font-mono">https://stripe.com</span>)
                    </p>
                  </div>

                  <Card className="border-border/50 bg-gradient-to-br from-muted/30 to-muted/10">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Info className="mt-0.5 h-5 w-5 text-primary shrink-0" />
                        <div className="space-y-2">
                          <div className="text-sm font-semibold">What gets imported</div>
                          <ul className="space-y-1.5 text-sm text-muted-foreground">
                            <li className="flex items-start gap-2">
                              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                              <span>Brand colors + typography</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                              <span>Logo / favicon / OG image URLs (when available)</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                              <span>A short brand summary (when available)</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {importError && (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                      <p className="text-sm font-medium text-destructive">{importError}</p>
                    </div>
                  )}
                  {!canImportMore && (
                    <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                      <p className="text-sm text-muted-foreground">
                        You reached the brand limit for your plan. Upgrade to import more.
                      </p>
                    </div>
                  )}
                </div>

                <DialogFooter className="mt-6 gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setImportOpen(false)} 
                    disabled={importing}
                    className="border-border/50 hover:bg-muted/50"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={async () => {
                      setImportError(null);
                      setImporting(true);
                      try {
                        await importBrand({ url: importUrl });
                        setImportUrl("");
                        setImportOpen(false);
                      } catch (e: any) {
                        setImportError(e?.message ?? "Failed to import brand");
                      } finally {
                        setImporting(false);
                      }
                    }}
                    disabled={importing || !importUrl.trim()}
                    className="transition-colors"
                  >
                    {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {importing ? "Importing..." : "Import"}
                  </Button>
                </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Generate dialog */}
        <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
          <DialogContent className="sm:max-w-2xl border-border/50 max-h-[90vh] overflow-y-auto">
            <button
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              onClick={() => setGenerateOpen(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-xl font-bold">Create marketing asset</DialogTitle>
              <DialogDescription className="text-base leading-relaxed">
                Generate on-brand visuals from your brand kit.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-4">
              {/* Brand context indicator */}
              {selectedBrand && (
                <Card className="border-border/50 bg-gradient-to-br from-muted/30 to-muted/10">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 shrink-0 rounded-xl border border-border/50 bg-background overflow-hidden flex items-center justify-center ">
                        {selectedFaviconUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={selectedFaviconUrl} alt="favicon" className="h-10 w-10 object-contain p-1" />
                        ) : (
                          <span className="text-xs font-medium text-muted-foreground">Logo</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate text-foreground">{selectedBrand.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">Brand context will be applied</div>
                      </div>
                      <div className="flex gap-1.5">
                        {branding?.colors && Object.entries(branding.colors).slice(0, 4).map(([k, hex]) => (
                          <div
                            key={k}
                            className="h-6 w-6 rounded-lg border border-border/50 "
                            style={{ backgroundColor: hex }}
                            title={hex}
                          />
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                <Label>Asset type</Label>
                <Select value={assetType} onValueChange={setAssetType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hero">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Hero Image</span>
                        <span className="text-xs text-muted-foreground">Website headers, landing pages (16:9)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="banner">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Banner</span>
                        <span className="text-xs text-muted-foreground">Top-of-email header banners (3:1)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="social_post">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Social Post</span>
                        <span className="text-xs text-muted-foreground">Instagram, LinkedIn, Twitter (1:1)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="logo_variant">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Brand Mark</span>
                        <span className="text-xs text-muted-foreground">App icons, profile pictures (1:1)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="product_detail">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">🛒 Product Detail</span>
                        <span className="text-xs text-muted-foreground">E-commerce detail page, bilingual (9:16)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="product_showcase">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">🛒 Product Showcase</span>
                        <span className="text-xs text-muted-foreground">Color/size guide, feature highlights (9:16)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="storyboard_grid">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">🎬 Storyboard Grid</span>
                        <span className="text-xs text-muted-foreground">3x3 cinematic grid for campaigns (16:9)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* E-commerce specific options */}
              {(assetType === "product_detail" || assetType === "product_showcase") && (
                <div className="space-y-4 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">🛒 E-commerce Mode</span>
                    <span className="text-xs text-muted-foreground">Apple minimalist, bilingual (中/EN)</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Product Image</Label>
                      {productImageUrls.length > 0 && (
                        <span className="text-xs text-primary font-medium flex items-center gap-1">
                          ✓ Image editing mode ({productImageUrls.length})
                        </span>
                      )}
                    </div>
                    
                    {/* Uploaded images grid */}
                    {uploadedImages && uploadedImages.length > 0 && (
                      <div className="grid grid-cols-4 gap-2 mb-2">
                        {uploadedImages.map((img: any) => {
                          const isSelected = selectedUploadedImageIds.includes(img._id);
                          const selectionIndex = selectedUploadedImageIds.indexOf(img._id);
                          return (
                            <button
                              key={img._id}
                              type="button"
                              onClick={() => toggleUploadedImage(img.url, img._id)}
                              className={`relative aspect-square rounded-md overflow-hidden border-2 transition-all ${
                                isSelected
                                  ? "border-primary ring-2 ring-primary/20"
                                  : "border-transparent hover:border-muted-foreground/30"
                              }`}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={img.url}
                                alt={img.name}
                                className="w-full h-full object-cover"
                              />
                              {isSelected && (
                                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                                    {selectionIndex + 1}
                                  </span>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Upload button */}
                    <div className="flex gap-2">
                      <label className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploading}
                        />
                        <div className="flex items-center justify-center gap-2 px-3 py-2 border border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
                          {uploading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                          <span className="text-sm">
                            {uploading ? "Uploading..." : "Upload product image"}
                          </span>
                        </div>
                      </label>
                      {selectedUploadedImageIds.length > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={clearSelectedImages}
                        >
                          Clear ({selectedUploadedImageIds.length})
                        </Button>
                      )}
                    </div>

                    {uploadError && (
                      <p className="text-xs text-destructive">{uploadError}</p>
                    )}

                    {/* Manual URL input (fallback) */}
                    <div className="pt-2 border-t">
                      <Label htmlFor="product-image-urls" className="text-xs text-muted-foreground">Or paste URLs (one per line, max 4)</Label>
                      <textarea
                        id="product-image-urls"
                        value={productImageUrls.join("\n")}
                        onChange={(e) => {
                          const urls = e.target.value.split("\n").filter((u) => u.trim()).slice(0, 4);
                          setProductImageUrls(urls);
                          setSelectedUploadedImageIds([]);
                        }}
                        placeholder="https://example.com/product1.jpg&#10;https://example.com/product2.jpg"
                        className="mt-1 w-full min-h-[80px] px-3 py-2 text-sm border rounded-md bg-background"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {productImageUrls.length}/4 images selected
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="product-features">Product Features</Label>
                    <Input
                      id="product-features"
                      value={productFeaturesInput}
                      onChange={(e) => setProductFeaturesInput(e.target.value)}
                      placeholder="12h heat retention, one-touch open, 316 stainless"
                    />
                    <p className="text-xs text-muted-foreground">
                      Comma-separated features (e.g. 12小时保温, 一键开合)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Prompt Mode</Label>
                    <Select value={ecommerceMode} onValueChange={(v) => setEcommerceMode(v as "simple" | "detailed")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="detailed">
                          <div className="flex flex-col items-start">
                            <span className="font-medium">Detailed (Recommended)</span>
                            <span className="text-xs text-muted-foreground">Full specs, stable output</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="simple">
                          <div className="flex flex-col items-start">
                            <span className="font-medium">Simple</span>
                            <span className="text-xs text-muted-foreground">Concise, more AI creativity</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Storyboard specific options */}
              {assetType === "storyboard_grid" && (
                <div className="space-y-4 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">🎬 Storyboard Mode</span>
                    <span className="text-xs text-muted-foreground">3x3 grid, consistent model</span>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="storyboard-theme">Theme</Label>
                    <Input
                      id="storyboard-theme"
                      value={storyboardTheme}
                      onChange={(e) => setStoryboardTheme(e.target.value)}
                      placeholder="French high-end double-breasted trench coat"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="storyboard-model-desc">Model consistency</Label>
                    <textarea
                      id="storyboard-model-desc"
                      value={storyboardModelDesc}
                      onChange={(e) => setStoryboardModelDesc(e.target.value)}
                      placeholder="One consistent female model, same outfit, same lighting..."
                      className="w-full min-h-[84px] px-3 py-2 text-sm border rounded-md bg-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="storyboard-lighting">Lighting / tone</Label>
                    <Input
                      id="storyboard-lighting"
                      value={storyboardLighting}
                      onChange={(e) => setStoryboardLighting(e.target.value)}
                      placeholder="Premium fashion editorial tone, clean studio lighting"
                    />
                    <p className="text-xs text-muted-foreground">
                      Background will follow the selected style preset (not hardcoded).
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <Label>Reference Product Images (Optional)</Label>
                      {productImageUrls.length > 0 && (
                        <span className="text-xs text-primary font-medium flex items-center gap-1">
                          ✓ Image editing mode enabled
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {productImageUrls.length > 0 
                        ? `${productImageUrls.length} image(s) selected. AI will use flux-2-flex/edit for consistent product appearance.`
                        : "Upload product images to guide the storyboard generation. AI will use these as reference for consistent product appearance."
                      }
                    </p>
                    
                    {/* Uploaded images grid */}
                    {uploadedImages && uploadedImages.length > 0 && (
                      <div className="grid grid-cols-4 gap-2 mb-2">
                        {uploadedImages.map((img: any) => {
                          const isSelected = selectedUploadedImageIds.includes(img._id);
                          const selectionIndex = selectedUploadedImageIds.indexOf(img._id);
                          return (
                            <button
                              key={img._id}
                              type="button"
                              onClick={() => toggleUploadedImage(img.url, img._id)}
                              className={`relative aspect-square rounded-md overflow-hidden border-2 transition-all ${
                                isSelected
                                  ? "border-primary ring-2 ring-primary/20"
                                  : "border-transparent hover:border-muted-foreground/30"
                              }`}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={img.url}
                                alt={img.name}
                                className="w-full h-full object-cover"
                              />
                              {isSelected && (
                                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                                    {selectionIndex + 1}
                                  </span>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Upload button */}
                    <div className="flex gap-2">
                      <label className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploading}
                        />
                        <div className="flex items-center justify-center gap-2 px-3 py-2 border border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
                          {uploading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                          <span className="text-sm">
                            {uploading ? "Uploading..." : "Upload reference image"}
                          </span>
                        </div>
                      </label>
                      {selectedUploadedImageIds.length > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={clearSelectedImages}
                        >
                          Clear ({selectedUploadedImageIds.length})
                        </Button>
                      )}
                    </div>

                    {uploadError && (
                      <p className="text-xs text-destructive">{uploadError}</p>
                    )}

                    {/* Manual URL input (fallback) */}
                    <div className="pt-2 border-t">
                      <Label htmlFor="storyboard-product-urls" className="text-xs text-muted-foreground">Or paste URLs (one per line, max 4)</Label>
                      <textarea
                        id="storyboard-product-urls"
                        value={productImageUrls.join("\n")}
                        onChange={(e) => {
                          const urls = e.target.value.split("\n").filter((u) => u.trim()).slice(0, 4);
                          setProductImageUrls(urls);
                          setSelectedUploadedImageIds([]);
                        }}
                        placeholder="https://example.com/product1.jpg&#10;https://example.com/product2.jpg"
                        className="mt-1 w-full min-h-[80px] px-3 py-2 text-sm border rounded-md bg-background"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {productImageUrls.length}/4 images selected
                      </p>
                    </div>
                  </div>

                </div>
              )}

              <div className="space-y-2">
                <Label>Professional styling</Label>
                <Select value={stylePreset} onValueChange={(v) => setStylePreset(v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="brand_strict">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Brand strict</span>
                        <span className="text-xs text-muted-foreground">Strong brand color lock, clean + premium</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="minimal_modern">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Minimal modern</span>
                        <span className="text-xs text-muted-foreground">Whitespace, sharp typography, editorial layout</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="editorial_photo">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Editorial photo</span>
                        <span className="text-xs text-muted-foreground">Natural light, real materials, shallow depth</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="product_hero">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Product hero</span>
                        <span className="text-xs text-muted-foreground">Studio lighting, device mockups, high polish</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="gradient_abstract">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Gradient abstract</span>
                        <span className="text-xs text-muted-foreground">Modern gradients, abstract shapes, SaaS vibes</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="cinematic_3d">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Cinematic 3D</span>
                        <span className="text-xs text-muted-foreground">Volumetric lighting, premium materials, depth</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Sets the overall look. Your prompt can override it.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Background</Label>
                <Select value={backgroundMode} onValueChange={(v) => setBackgroundMode(v as "preset" | "custom")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a background mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preset">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Follow style preset</span>
                        <span className="text-xs text-muted-foreground">Dynamic background from selected style</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="custom">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Custom background</span>
                        <span className="text-xs text-muted-foreground">Override background per generation</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                {backgroundMode === "custom" && (
                  <div className="space-y-2">
                    <textarea
                      value={customBackground}
                      onChange={(e) => setCustomBackground(e.target.value)}
                      placeholder={'Examples:\n- Pure white seamless background, no gradient\n- Light gray studio backdrop, soft shadow\n- Dark charcoal background, subtle vignette\n- Use brand primary color as subtle gradient background'}
                      className="w-full min-h-[96px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      Tip: start with “Background:” and be specific (color, gradient/no gradient, texture, studio/lifestyle).
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="prompt-overrides">Prompt</Label>
                  <span className="text-xs text-muted-foreground">Optional</span>
                </div>
                <textarea
                  id="prompt-overrides"
                  value={promptOverrides}
                  onChange={(e) => setPromptOverrides(e.target.value)}
                  placeholder='Describe the look (e.g. "Dark theme, neon accents").'
                  className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Tip: be specific (subject, setting, mood, colors).
                </p>
              </div>

              {generateError && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                  <p className="text-sm font-medium text-destructive">{generateError}</p>
                </div>
              )}
            </div>

            <DialogFooter className="mt-6 gap-3">
              <Button 
                variant="outline" 
                onClick={() => setGenerateOpen(false)} 
                disabled={generating}
                className="border-border/50 hover:bg-muted/50"
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!selectedBrandId) return;
                  setGenerateError(null);
                  setGenerating(true);
                  try {
                    // Parse product features from comma-separated input
                    const productFeatures = productFeaturesInput.trim()
                      ? productFeaturesInput.split(",").map((f) => f.trim()).filter(Boolean)
                      : undefined;

                    const storyboardOverrides =
                      assetType === "storyboard_grid"
                        ? buildStoryboardOverrides({
                            theme: storyboardTheme,
                            modelDesc: storyboardModelDesc,
                            lighting: storyboardLighting,
                            gridText: storyboardGridText,
                          })
                        : "";

                    const backgroundOverride =
                      backgroundMode === "custom" && customBackground.trim()
                        ? `Background: ${customBackground.trim()}`
                        : "";

                    const combinedPromptOverrides = [backgroundOverride, storyboardOverrides, promptOverrides.trim()]
                      .filter(Boolean)
                      .join("\n\n");

                    await generateAsset({
                      brandId: selectedBrandId as any,
                      type: assetType,
                      stylePreset,
                      promptOverrides: combinedPromptOverrides || undefined,
                      // Product image URLs (for e-commerce and storyboard modes)
                      productImageUrls: productImageUrls.length > 0 ? productImageUrls : undefined,
                      ecommerceMode: (assetType === "product_detail" || assetType === "product_showcase") ? ecommerceMode : undefined,
                      productFeatures: productFeatures?.length ? productFeatures : undefined,
                    });
                    setPromptOverrides("");
                    setCustomBackground("");
                    setProductImageUrls([]);
                    setSelectedUploadedImageIds([]);
                    setProductFeaturesInput("");
                    setGenerateOpen(false);
                  } catch (e: any) {
                    setGenerateError(e?.message ?? "Failed to generate asset");
                  } finally {
                    setGenerating(false);
                  }
                }}
                disabled={generating || !selectedBrandId}
                className="transition-colors"
              >
                {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {generating ? "Generating..." : "Generate"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Asset Detail Modal */}
        <Dialog open={!!selectedAsset} onOpenChange={(open) => !open && setSelectedAsset(null)}>
          <DialogContent className="sm:max-w-5xl max-h-[90vh] p-0 overflow-hidden border-border/50 ">
            {selectedAsset && (() => {
              const imageUrl = selectedAsset.imageUrl || getFirstImageUrlFromResultJson(selectedAsset.resultJson);
              const createdDate = new Date(selectedAsset.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });
              
              return (
                <div className="flex flex-col lg:flex-row h-full max-h-[85vh]">
                  {/* Left: Image Preview */}
                  <div className="flex-1 bg-muted/30 flex items-center justify-center p-4 lg:p-6 min-h-[300px] lg:min-h-0">
                    {imageUrl ? (
                      <div className="relative w-full h-full flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={imageUrl} 
                          alt={selectedAsset.type} 
                          className="max-w-full max-h-[60vh] object-contain rounded-lg "
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <FileImage className="h-16 w-16 mb-3 opacity-50" />
                        <span>No preview available</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Right: Details & Edit */}
                  <div className="w-full lg:w-[380px] border-t lg:border-t-0 lg:border-l border-border/50 flex flex-col bg-background">
                    {/* Header */}
                    <div className="p-4 border-b border-border/50">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-lg capitalize">
                          {selectedAsset.type.replace(/_/g, " ")}
                        </h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setSelectedAsset(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        selectedAsset.status === "succeeded" 
                          ? "bg-green-500/10 text-green-600 dark:text-green-400"
                          : selectedAsset.status === "failed"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                      }`}>
                        {selectedAsset.status}
                      </div>
                    </div>
                    
                    {/* Metadata */}
                    <div className="p-4 space-y-3 border-b border-border/50">
                      <div className="flex items-center gap-3 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Created:</span>
                        <span className="font-medium">{createdDate}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Type:</span>
                        <span className="font-medium capitalize">{selectedAsset.type.replace(/_/g, " ")}</span>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    {imageUrl && (
                      <div className="p-4 border-b border-border/50 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            navigator.clipboard.writeText(imageUrl);
                            setCopiedKey("modal-url");
                            setTimeout(() => setCopiedKey(null), 2000);
                          }}
                        >
                          {copiedKey === "modal-url" ? (
                            <Check className="h-4 w-4 mr-2" />
                          ) : (
                            <Copy className="h-4 w-4 mr-2" />
                          )}
                          Copy URL
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          asChild
                        >
                          <a href={imageUrl} target="_blank" rel="noreferrer" download>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </a>
                        </Button>
                      </div>
                    )}
                    
                    {/* Original Prompt */}
                    <div className="p-4 border-b border-border/50 flex-shrink-0">
                      <Label className="text-xs text-muted-foreground mb-2 block">Original Prompt</Label>
                      <ScrollArea className="h-24 rounded-md border border-border/50 bg-muted/30 p-2">
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                          {selectedAsset.prompt || "No prompt available"}
                        </p>
                      </ScrollArea>
                    </div>
                    
                    {/* Edit with AI */}
                    <div className="p-4 flex-1 flex flex-col">
                      <Label className="text-sm font-medium mb-2">Edit with AI</Label>
                      <p className="text-xs text-muted-foreground mb-3">
                        Describe changes you want to make to this image.
                      </p>
                      <Textarea
                        placeholder="e.g., Change background to sunset, make colors warmer..."
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                        className="flex-1 min-h-[80px] resize-none text-sm"
                      />
                      <Button
                        className="mt-3 w-full"
                        disabled={!editPrompt.trim() || isEditing}
                        onClick={async () => {
                          if (!editPrompt.trim() || !selectedBrandId) return;
                          setIsEditing(true);
                          try {
                            await generateAsset({
                              brandId: selectedBrandId as any,
                              type: selectedAsset.type,
                              promptOverrides: `Original prompt: ${selectedAsset.prompt || "No original prompt"}

Edit instructions: ${editPrompt}`,
                              productImageUrls: selectedAsset.imageUrl ? [selectedAsset.imageUrl] : undefined,
                            });
                            setEditPrompt("");
                            setSelectedAsset(null);
                          } catch (err: any) {
                            setGenerateError(err.message || "Failed to generate");
                          } finally {
                            setIsEditing(false);
                          }
                        }}
                      >
                        {isEditing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Generate Variation
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* Empty state (visual onboarding) */}
        {!isLoading && isAuthenticated && !hasBrands && (
          <Card className="overflow-hidden border-border/50 ">
            <CardContent className="p-8 sm:p-10">
              <div className="grid gap-10 lg:grid-cols-[400px_1fr]">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h2 className="text-2xl font-bold tracking-tight">Create your first brand library</h2>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      Import a brand once, then generate consistent hero images, banners, and social posts with AI.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <Button 
                      onClick={() => setImportOpen(true)} 
                      disabled={!canImportMore} 
                      className="w-full h-11 text-base hover:border-border transition-all"
                      size="lg"
                    >
                      <Plus className="mr-2 h-5 w-5" />
                      Import a brand
                    </Button>
                    <Card className="border-border/50 bg-gradient-to-br from-muted/40 to-muted/20">
                      <CardContent className="p-5">
                        <div className="mb-3 text-sm font-semibold">What you'll get</div>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li className="flex items-start gap-2">
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                            <span>Brand summary, colors, fonts, and logos</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                            <span>A visual gallery of generated marketing assets</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                            <span>Reusable context for AI email generation</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-muted/20 via-background to-muted/10 p-5 sm:p-6 ">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-sm font-semibold">Gallery Preview</div>
                    <div className="text-xs text-muted-foreground">Generated from your brand</div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                    {defaultPreviewTiles.map((tile, idx) => (
                      <div
                        key={tile.url}
                        className={[
                          "group relative overflow-hidden rounded-xl border border-border/50 bg-muted/30  transition-all duration-300",
                          "hover:-translate-y-1 hover: hover:border-border",
                          tile.aspect,
                          tile.colSpan ?? "",
                        ].join(" ")}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-muted/50 via-muted/20 to-background/50" />
                        <div className="absolute inset-0 opacity-40 [background:radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.2),transparent_60%)]" />

                        {!defaultPreviewFallback[idx] ? (
                          // Website screenshot
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={tile.screenshotSrc}
                            alt={`${tile.label} website preview`}
                            className="absolute inset-0 h-full w-full object-cover opacity-90 transition-all duration-500 group-hover:opacity-100 group-hover:scale-[1.03]"
                            loading="lazy"
                            decoding="async"
                            referrerPolicy="no-referrer"
                            onError={() => {
                              setDefaultPreviewFallback((prev) => ({ ...prev, [idx]: true }));
                            }}
                          />
                        ) : (
                          // Fallback: logo if screenshot fails
                          <>
                            <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/30 to-background" />
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={tile.logoSrc}
                              alt={`${tile.label} logo`}
                              className="absolute inset-0 h-full w-full object-contain p-8 opacity-90 transition-all duration-500 group-hover:opacity-100 group-hover:scale-105"
                              loading="lazy"
                              decoding="async"
                              referrerPolicy="no-referrer"
                            />
                          </>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
                        <div className="absolute -inset-16 translate-x-[-70%] rotate-12 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-[70%]" />

                        {tile.label && (
                          <div className="absolute left-3 bottom-3">
                            <span className="inline-flex items-center rounded-lg border border-border/50 bg-background/90 px-2.5 py-1 text-[11px] font-semibold text-foreground  backdrop-blur-sm">
                              {tile.label}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {(isLoading || (!isAuthenticated && !isLoading)) && (
          <Card className="border-border/50 ">
            <CardContent className="p-12 text-center">
              {!isAuthenticated ? (
                <div className="space-y-2">
                  <p className="text-base font-medium text-foreground">
                    Please sign in to import brands and generate assets
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Create an account to get started with brand asset management
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {isAuthenticated && hasBrands && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[360px_1fr]">
            {/* Left: Brand identity sidebar */}
            <aside className="lg:sticky lg:top-8 self-start">
              <Card className="overflow-hidden border-border/50 ">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 shrink-0 rounded-xl border border-border/50 bg-muted/40 overflow-hidden flex items-center justify-center ">
                      {selectedFaviconUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={selectedFaviconUrl} alt="favicon" className="h-14 w-14 object-contain p-1" />
                      ) : (
                        <span className="text-xs font-medium text-muted-foreground">Logo</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="text-base font-bold truncate text-foreground">{selectedBrand?.name}</div>
                      <div className="text-sm text-muted-foreground truncate">{selectedBrand?.domain}</div>
                      {selectedBrand?.summary && (
                        <TruncatedText
                          text={selectedBrand.summary}
                          maxLines={3}
                          className="mt-2 text-sm"
                        />
                      )}
                    </div>
                  </div>

                  <div className="mt-6 flex items-center gap-2 border-t border-border/50 pt-5">
                    <Button 
                      size="sm" 
                      onClick={() => setGenerateOpen(true)} 
                      disabled={!hasSelectedBrand}
                      className="flex-1 transition-colors"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Create Asset
                    </Button>
                    {selectedBrand?.url && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        asChild
                        className="border-border/50 hover:bg-muted/50"
                      >
                        <a href={selectedBrand.url} target="_blank" rel="noreferrer" className="inline-flex items-center">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>

                  <div className="mt-6 space-y-6">
                    <div>
                      <div className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Colors
                      </div>
                      {branding?.colors ? (
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(branding.colors)
                            .slice(0, 18)
                            .map(([k, hex]) => (
                              <div
                                key={k}
                                className="group relative h-7 w-7 rounded-lg border border-border/50  transition-all hover:scale-110 hover: hover:z-10"
                                style={{ backgroundColor: hex }}
                                title={`${k}: ${hex}`}
                              >
                                <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-black/5" />
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">No colors detected</div>
                      )}
                    </div>

                    <div>
                      <div className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Fonts
                      </div>
                      {branding?.fonts?.length ? (
                        <div className="flex flex-wrap gap-2">
                          {branding.fonts
                            .map((f, idx) => f.family ?? `Font ${idx + 1}`)
                            .slice(0, 10)
                            .map((name) => (
                              <span 
                                key={name} 
                                className="text-xs rounded-lg border border-border/50 bg-muted/30 px-3 py-1.5 font-medium text-foreground "
                              >
                                {name}
                              </span>
                            ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">No fonts detected</div>
                      )}
                    </div>

                    <div>
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Branding Output
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2.5 border-border/50 hover:bg-muted/50"
                          onClick={() => copyToClipboard("branding", brandingPretty)}
                          disabled={!brandingPretty}
                          title="Copy branding JSON"
                        >
                          <Copy className="mr-1.5 h-3.5 w-3.5" />
                          {copiedKey === "branding" ? "Copied" : "Copy"}
                        </Button>
                      </div>

                      <Tabs defaultValue="preview" className="mt-2">
                        <TabsList className="grid w-full grid-cols-3 bg-muted/30 border border-border/50">
                          <TabsTrigger value="preview" className="text-xs data-[state=active]:bg-background">
                            Preview
                          </TabsTrigger>
                          <TabsTrigger value="branding" className="text-xs data-[state=active]:bg-background">
                            Branding
                          </TabsTrigger>
                          <TabsTrigger value="metadata" className="text-xs data-[state=active]:bg-background">
                            Metadata
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="preview" className="mt-4">
                          <div className="rounded-lg border border-border/50 bg-gradient-to-br from-muted/30 to-muted/10 p-5">
                            <div className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Favicon</div>
                            <div className="h-28 w-full rounded-lg border border-border/50 bg-background overflow-hidden flex items-center justify-center ">
                              {selectedFaviconUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={selectedFaviconUrl}
                                  alt="favicon"
                                  className="h-24 w-24 object-contain p-2"
                                  loading="lazy"
                                />
                              ) : (
                                <span className="text-xs text-muted-foreground">No favicon available</span>
                              )}
                            </div>
                            {selectedFaviconUrl && (
                              <a
                                className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline transition-colors"
                                href={selectedFaviconUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Open in new tab <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                        </TabsContent>

                        <TabsContent value="branding" className="mt-4">
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="text-[11px] text-muted-foreground">
                              Raw Firecrawl branding payload (stored in <span className="font-mono text-foreground">brands.brandingJson</span>)
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2.5 border-border/50 hover:bg-muted/50"
                              onClick={() => copyToClipboard("branding-raw", brandingPretty)}
                              disabled={!brandingPretty}
                            >
                              <Copy className="mr-1.5 h-3.5 w-3.5" />
                              {copiedKey === "branding-raw" ? "Copied" : "Copy"}
                            </Button>
                          </div>
                          <ScrollArea className="max-h-64 rounded-lg border border-border/50 bg-muted/20 p-3">
                            <pre className="text-[11px] leading-relaxed whitespace-pre-wrap break-words font-mono text-foreground">
                              {brandingPretty || "No branding JSON found for this brand."}
                            </pre>
                          </ScrollArea>
                        </TabsContent>

                        <TabsContent value="metadata" className="mt-4">
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="text-[11px] text-muted-foreground">
                              Firecrawl metadata payload (stored in <span className="font-mono text-foreground">brands.metadataJson</span>)
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2.5 border-border/50 hover:bg-muted/50"
                              onClick={() => copyToClipboard("metadata-raw", metadataPretty)}
                              disabled={!metadataPretty}
                            >
                              <Copy className="mr-1.5 h-3.5 w-3.5" />
                              {copiedKey === "metadata-raw" ? "Copied" : "Copy"}
                            </Button>
                          </div>
                          <ScrollArea className="max-h-64 rounded-lg border border-border/50 bg-muted/20 p-3">
                            <pre className="text-[11px] leading-relaxed whitespace-pre-wrap break-words font-mono text-foreground">
                              {metadataPretty || "No metadata JSON found for this brand."}
                            </pre>
                          </ScrollArea>
                        </TabsContent>
                      </Tabs>
                    </div>

                    <div className="pt-2 border-t border-border/50">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={async () => {
                          if (!selectedBrand?._id) return;
                          if (!confirm("Remove this brand and all its assets?")) return;
                          await removeBrand({ id: selectedBrand._id });
                          setSelectedBrandId(null);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete brand
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </aside>

            {/* Right: Visual asset gallery */}
            <div className="min-w-0">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-lg font-bold">Assets</div>
                  <div className="text-sm text-muted-foreground">
                    {assets ? `${assets.length} item${assets.length === 1 ? "" : "s"}` : "Loading…"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setImportOpen(true)} 
                    disabled={!canImportMore}
                    className="border-border/50 hover:bg-muted/50"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    New Brand
                  </Button>
                  <Button 
                    onClick={() => setGenerateOpen(true)} 
                    disabled={!hasSelectedBrand}
                    className="transition-colors"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Create Asset
                  </Button>
                </div>
              </div>

              <div>
                {!assets ? (
                  <Card className="border-border/50">
                    <CardContent className="p-12 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Loading assets...</span>
                      </div>
                    </CardContent>
                  </Card>
                ) : assets.length === 0 ? (
                  <Card className="border-dashed border-2 border-border/50 bg-gradient-to-br from-muted/20 to-background">
                    <CardContent className="p-12 text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-border/50 bg-gradient-to-br from-primary/10 to-primary/5">
                        <Sparkles className="h-8 w-8 text-primary" />
                      </div>
                      <div className="mt-6 text-base font-semibold">No assets yet</div>
                      <div className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                        Generate your first hero, banner, or social asset to build your visual library.
                      </div>
                      <div className="mt-8 flex flex-wrap justify-center gap-3">
                        <Button
                          variant={assetType === "hero" ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setAssetType("hero");
                            setGenerateOpen(true);
                          }}
                          className="min-w-[110px] transition-colors"
                        >
                          Hero
                        </Button>
                        <Button
                          variant={assetType === "banner" ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setAssetType("banner");
                            setGenerateOpen(true);
                          }}
                          className="min-w-[110px] transition-colors"
                        >
                          Banner
                        </Button>
                        <Button
                          variant={assetType === "social_post" ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setAssetType("social_post");
                            setGenerateOpen(true);
                          }}
                          className="min-w-[110px] transition-colors"
                        >
                          Social Post
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="columns-1 gap-5 sm:columns-2 xl:columns-3">
                    {assets.map((a: any) => {
                      // Prefer imageUrl from query (Convex storage), fallback to legacy resultJson parsing
                      const imageUrl = a.imageUrl || getFirstImageUrlFromResultJson(a.resultJson);
                      const isBusy = a.status === "queued" || a.status === "running";
                      const isFailed = a.status === "failed";
                      return (
                        <div key={a._id} className="mb-5 break-inside-avoid">
                          <Card 
                            className="overflow-hidden border-border/50 hover:border-border transition-all duration-300 group cursor-pointer"
                            onClick={() => setSelectedAsset(a)}
                          >
                            <div className="relative">
                              <div className="absolute left-3 top-3 z-10 rounded-lg bg-black/70 backdrop-blur-sm px-3 py-1.5 text-[11px] font-semibold text-white ">
                                {a.type.replace(/_/g, " ")}
                              </div>
                              <button
                                type="button"
                                className="absolute right-3 top-3 z-10 rounded-lg bg-black/60 backdrop-blur-sm p-2 text-white hover:bg-black/80 transition-all  opacity-0 group-hover:opacity-100"
                                title="Remove asset"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (!confirm("Remove this asset?")) return;
                                  await removeAsset({ id: a._id });
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>

                              <div className="bg-gradient-to-br from-muted/40 to-muted/20">
                                {imageUrl ? (
                                  <div className="relative overflow-hidden">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img 
                                      src={imageUrl} 
                                      alt={a.type} 
                                      className="w-full h-auto transition-transform duration-500 group-hover:scale-[1.02]" 
                                      style={{ display: "block" }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
                                  </div>
                                ) : (
                                  <div className="flex h-64 items-center justify-center">
                                    <span className="text-sm text-muted-foreground">No preview</span>
                                  </div>
                                )}
                              </div>

                              {isBusy && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                                  <div className="flex items-center gap-2 rounded-xl bg-black/80 px-4 py-2 text-sm font-medium text-white ">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Generating…
                                  </div>
                                </div>
                              )}
                            </div>

                            <CardContent className="p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <div className={`text-xs font-medium ${isFailed ? "text-destructive" : "text-muted-foreground"}`}>
                                  {a.status}
                                </div>
                              </div>

                              {imageUrl && (
                                <a
                                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline transition-colors"
                                  href={imageUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Open / Download <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              )}

                              {a.error && (
                                <TruncatedText
                                  text={a.error}
                                  maxLines={3}
                                  textClassName="text-sm text-destructive"
                                />
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Uploaded Product Images Section */}
              {hasSelectedBrand && (
                <div className="mt-12 pt-8 border-t">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-semibold">Product Images</span>
                      <span className="text-xs text-muted-foreground">
                        ({uploadedImages?.length ?? 0} uploaded)
                      </span>
                    </div>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                      <Button variant="outline" size="sm" asChild disabled={uploading}>
                        <span>
                          {uploading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="mr-2 h-4 w-4" />
                          )}
                          {uploading ? "Uploading..." : "Upload"}
                        </span>
                      </Button>
                    </label>
                  </div>

                  {uploadError && (
                    <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                      {uploadError}
                    </div>
                  )}

                  {uploadedImages && uploadedImages.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                      {uploadedImages.map((img: any) => (
                        <div
                          key={img._id}
                          className="group relative aspect-square rounded-lg overflow-hidden border border-border/50 bg-muted/30 hover:border-border transition-colors"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img.url}
                            alt={img.name}
                            className="w-full h-full object-cover"
                          />
                          {/* Overlay with actions */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-white hover:bg-white/20"
                              onClick={() => {
                                navigator.clipboard.writeText(img.url || "");
                                setCopiedKey(img._id);
                                setTimeout(() => setCopiedKey(null), 2000);
                              }}
                            >
                              {copiedKey === img._id ? (
                                <Check className="h-3 w-3 mr-1" />
                              ) : (
                                <Copy className="h-3 w-3 mr-1" />
                              )}
                              Copy URL
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-red-300 hover:bg-red-500/20 hover:text-red-200"
                              onClick={() => removeUploadedImage({ id: img._id })}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                          {/* Name tooltip */}
                          <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/70 to-transparent">
                            <p className="text-[10px] text-white/80 truncate">{img.name}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border border-dashed border-border/50 rounded-lg p-6 text-center">
                      <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground/50" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        No product images uploaded yet
                      </p>
                      <p className="text-xs text-muted-foreground/70">
                        Upload images to use them in e-commerce asset generation
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function buildStoryboardOverrides(args: {
  theme: string;
  modelDesc: string;
  lighting: string;
  gridText: string;
}): string {
  const gridLines = args.gridText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const rows = gridLines
    .map((line) => {
      const afterColon = line.includes(":") ? line.split(":").slice(1).join(":").trim() : line;
      return afterColon
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    })
    .filter((r) => r.length > 0);

  const normalizedRows = rows.slice(0, 3).map((r) => r.slice(0, 3));
  const fallback = [
    ["ELS (Extreme Long Shot)", "LS (Long Shot)", "MLS (Medium Long Shot)"],
    ["MS (Medium Shot)", "MCU (Medium Close-Up)", "CU (Close-Up)"],
    ["ECU (Extreme Close-Up, details)", "Low Angle Shot", "High Angle Shot"],
  ];

  const finalRows =
    normalizedRows.length === 3 && normalizedRows.every((r) => r.length === 3) ? normalizedRows : fallback;

  const gridText = finalRows.map((r, i) => `Row${i + 1}: ${r.join(" | ")}`).join("\n");

  return `Generate a 3x3 cinematic storyboard grid.

Theme: ${args.theme}
Subject: ${args.modelDesc}
Lighting: ${args.lighting}

Camera shot sequence (3x3):
${gridText}

Rules:
- Same model identity across all 9 panels (no face drift)
- Same outfit across all panels (consistent materials and details)
- Same lighting and color grading across all panels
- Clean, premium fashion editorial tone; luxury e-commerce style
- Clear panel boundaries/gutters; consistent grid alignment
- Add minimal shot labels per panel (readable, clean, no extra text)

Quality:
- Ultra-detailed face and natural skin texture
- Clear pupil highlights
- Sharp focus where appropriate, realistic depth of field

Negative:
- multiple people, identity drift, different face, different outfit
- broken grid, uneven borders, misaligned panels
- watermark, logos, messy/unreadable text, artifacts, low quality`;
}



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
} from "@react-email-builder/ui";
import {
  ExternalLink,
  Plus,
  Trash2,
  Loader2,
  Info,
  Sparkles,
  Copy,
} from "lucide-react";
import { UserMenu } from "@/components/auth/UserMenu";
import { getGoogleFaviconUrl } from "@/lib/social-icons";

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
  const [promptOverrides, setPromptOverrides] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [defaultPreviewFallback, setDefaultPreviewFallback] = useState<Record<number, boolean>>({});

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
      <div className="sticky top-0 z-50 h-12 border-b bg-background flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link href="/builder" className="text-sm font-semibold hover:underline">
            Builder
          </Link>
          <span className="text-sm font-semibold text-muted-foreground">Assets</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Brand switcher (desktop) */}
          <div className="hidden sm:block w-[220px]">
            <Select
              value={selectedBrandId ?? undefined}
              onValueChange={(v) => setSelectedBrandId(v)}
              disabled={!brands || brands.length === 0}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder={brands && brands.length === 0 ? "No brands" : "Select brand"} />
              </SelectTrigger>
              <SelectContent>
                {(brands ?? []).map((b: any) => (
                  <SelectItem key={b._id} value={b._id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="hidden sm:flex items-center rounded-full border bg-muted/30 px-3 py-1 text-xs text-muted-foreground">
            Brands <span className="ml-1 font-medium text-foreground">{brandCount}/{limit}</span>
          </div>

          <Button size="sm" onClick={() => setImportOpen(true)} disabled={!isAuthenticated || !canImportMore}>
            <Plus className="mr-2 h-4 w-4" />
            New Brand
          </Button>

          <UserMenu />
        </div>
      </div>

      <div className="mx-auto max-w-6xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Brand assets</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Visual identity + generated marketing images for each brand.
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
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={brands && brands.length === 0 ? "No brands" : "Brand"} />
                </SelectTrigger>
                <SelectContent>
                  {(brands ?? []).map((b: any) => (
                    <SelectItem key={b._id} value={b._id}>
                      {b.name}
                    </SelectItem>
                  ))}
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
          <DialogContent className="sm:max-w-md">
                <DialogHeader className="space-y-2">
                  <DialogTitle>Import a brand</DialogTitle>
                  <DialogDescription>
                    Paste a public website URL. We’ll fetch brand colors, fonts and logos using Firecrawl.
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

                  <div className="rounded-md border bg-muted/30 p-3">
                    <div className="flex items-start gap-2">
                      <Info className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <div className="space-y-1">
                        <div className="text-sm font-medium">What gets imported</div>
                        <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                          <li>Brand colors + typography</li>
                          <li>Logo / favicon / OG image URLs (when available)</li>
                          <li>A short brand summary (when available)</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {importError && <p className="text-sm text-destructive">{importError}</p>}
                  {!canImportMore && (
                    <p className="text-sm text-muted-foreground">
                      You reached the brand limit for your plan. Upgrade to import more.
                    </p>
                  )}
                </div>

                <DialogFooter className="mt-6 gap-2">
                  <Button variant="outline" onClick={() => setImportOpen(false)} disabled={importing}>
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
                  >
                    {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {importing ? "Importing..." : "Import"}
                  </Button>
                </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Generate dialog */}
        <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader className="space-y-2">
              <DialogTitle>Create marketing asset</DialogTitle>
              <DialogDescription>
                Generate on-brand visuals from your brand kit.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-4">
              {/* Brand context indicator */}
              {selectedBrand && (
                <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                  <div className="h-10 w-10 rounded-lg border bg-background overflow-hidden flex items-center justify-center">
                    {selectedFaviconUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={selectedFaviconUrl} alt="favicon" className="h-8 w-8 object-contain" />
                    ) : (
                      <span className="text-xs text-muted-foreground">Favicon</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{selectedBrand.name}</div>
                    <div className="text-xs text-muted-foreground">Brand context will be applied</div>
                  </div>
                  <div className="flex gap-1">
                    {branding?.colors && Object.entries(branding.colors).slice(0, 4).map(([k, hex]) => (
                      <div
                        key={k}
                        className="h-5 w-5 rounded-full border border-border"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </div>
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
                  </SelectContent>
                </Select>
              </div>

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

              {generateError && <p className="text-sm text-destructive">{generateError}</p>}
            </div>

            <DialogFooter className="mt-6 gap-2">
              <Button variant="outline" onClick={() => setGenerateOpen(false)} disabled={generating}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!selectedBrandId) return;
                  setGenerateError(null);
                  setGenerating(true);
                  try {
                    await generateAsset({
                      brandId: selectedBrandId as any,
                      type: assetType,
                      stylePreset,
                      promptOverrides: promptOverrides.trim() || undefined,
                    });
                    setPromptOverrides("");
                    setGenerateOpen(false);
                  } catch (e: any) {
                    setGenerateError(e?.message ?? "Failed to generate asset");
                  } finally {
                    setGenerating(false);
                  }
                }}
                disabled={generating || !selectedBrandId}
              >
                {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {generating ? "Generating..." : "Generate"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Empty state (visual onboarding) */}
        {!isLoading && isAuthenticated && !hasBrands && (
          <Card className="mt-6 overflow-hidden">
            <CardContent className="p-8">
              <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">Create your first brand library</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Import a brand once, then generate consistent hero images, banners, and social posts.
                  </p>
                  <div className="mt-6 space-y-3">
                    <Button onClick={() => setImportOpen(true)} disabled={!canImportMore} className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Import a brand
                    </Button>
                    <div className="rounded-lg border bg-muted/30 p-4">
                      <div className="text-sm font-medium">What you’ll get</div>
                      <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                        <li>Brand summary, colors, fonts, logos</li>
                        <li>A visual gallery of generated marketing assets</li>
                        <li>Reusable context for AI email generation</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border bg-gradient-to-b from-muted/15 to-background p-4 sm:p-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="text-sm font-medium">Gallery preview</div>
                    <div className="text-xs text-muted-foreground">Generated from your brand</div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                    {defaultPreviewTiles.map((tile, idx) => (
                      <div
                        key={tile.url}
                        className={[
                          "group relative overflow-hidden rounded-2xl border bg-muted/20 shadow-sm transition",
                          "hover:-translate-y-0.5 hover:shadow-md",
                          tile.aspect,
                          tile.colSpan ?? "",
                        ].join(" ")}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-muted/40 via-muted/10 to-background" />
                        <div className="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.14),transparent_55%)]" />

                        {!defaultPreviewFallback[idx] ? (
                          // Website screenshot
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={tile.screenshotSrc}
                            alt={`${tile.label} website preview`}
                            className="absolute inset-0 h-full w-full object-cover opacity-95 transition duration-300 group-hover:opacity-100 group-hover:scale-[1.02]"
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
                            <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/20 to-background" />
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={tile.logoSrc}
                              alt={`${tile.label} logo`}
                              className="absolute inset-0 h-full w-full object-contain p-7 opacity-95 transition duration-300 group-hover:opacity-100"
                              loading="lazy"
                              decoding="async"
                              referrerPolicy="no-referrer"
                            />
                          </>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-background/10 to-transparent" />
                        <div className="absolute -inset-12 translate-x-[-70%] rotate-12 bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-[70%]" />

                        {tile.label && (
                          <div className="absolute left-3 bottom-3">
                            <span className="inline-flex items-center rounded-full border bg-background/70 px-2.5 py-1 text-[11px] font-medium text-foreground shadow-sm backdrop-blur">
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
          <Card className="mt-6">
            <CardContent className="p-6">
              {!isAuthenticated ? (
                <p className="text-sm text-muted-foreground">
                  Please sign in to import brands and generate assets.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Loading...</p>
              )}
            </CardContent>
          </Card>
        )}

        {isAuthenticated && hasBrands && (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
            {/* Left: Brand identity sidebar */}
            <aside className="lg:sticky lg:top-6 self-start">
              <Card className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-14 w-14 rounded-xl border bg-muted/30 overflow-hidden flex items-center justify-center">
                      {selectedFaviconUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={selectedFaviconUrl} alt="favicon" className="h-12 w-12 object-contain" />
                      ) : (
                        <span className="text-xs text-muted-foreground">Favicon</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold truncate">{selectedBrand?.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{selectedBrand?.domain}</div>
                      {selectedBrand?.summary && (
                        <p className="mt-2 text-xs text-muted-foreground line-clamp-3">{selectedBrand.summary}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 flex items-center gap-2 border-t pt-4">
                    <Button 
                      size="sm" 
                      onClick={() => setGenerateOpen(true)} 
                      disabled={!hasSelectedBrand}
                      className="flex-1 sm:flex-none"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Create
                    </Button>
                    {selectedBrand?.url && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        asChild
                        className="flex-1 sm:flex-none"
                      >
                        <a href={selectedBrand.url} target="_blank" rel="noreferrer" className="inline-flex items-center">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          <span className="hidden sm:inline">Open site</span>
                          <span className="sm:hidden">Open</span>
                        </a>
                      </Button>
                    )}
                  </div>

                  <div className="mt-5 space-y-5">
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Colors
                      </div>
                      {branding?.colors ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {Object.entries(branding.colors)
                            .slice(0, 18)
                            .map(([k, hex]) => (
                              <div
                                key={k}
                                className="h-6 w-6 rounded-md border border-border"
                                style={{ backgroundColor: hex }}
                                title={`${k}: ${hex}`}
                              />
                            ))}
                        </div>
                      ) : (
                        <div className="mt-2 text-xs text-muted-foreground">No colors detected.</div>
                      )}
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Fonts
                      </div>
                      {branding?.fonts?.length ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {branding.fonts
                            .map((f, idx) => f.family ?? `Font ${idx + 1}`)
                            .slice(0, 10)
                            .map((name) => (
                              <span key={name} className="text-xs rounded-full border bg-muted/30 px-3 py-1">
                                {name}
                              </span>
                            ))}
                        </div>
                      ) : (
                        <div className="mt-2 text-xs text-muted-foreground">No fonts detected.</div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Branding output
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2"
                          onClick={() => copyToClipboard("branding", brandingPretty)}
                          disabled={!brandingPretty}
                          title="Copy branding JSON"
                        >
                          <Copy className="mr-2 h-3.5 w-3.5" />
                          {copiedKey === "branding" ? "Copied" : "Copy"}
                        </Button>
                      </div>

                      <Tabs defaultValue="preview" className="mt-2">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="preview" className="text-xs">
                            Preview
                          </TabsTrigger>
                          <TabsTrigger value="branding" className="text-xs">
                            Branding
                          </TabsTrigger>
                          <TabsTrigger value="metadata" className="text-xs">
                            Metadata
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="preview" className="mt-3">
                          <div className="rounded-lg border bg-muted/20 p-4">
                            <div className="text-xs font-medium text-muted-foreground mb-3">Favicon</div>
                            <div className="h-24 w-full rounded-md border bg-background overflow-hidden flex items-center justify-center">
                              {selectedFaviconUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={selectedFaviconUrl}
                                  alt="favicon"
                                  className="h-20 w-20 object-contain"
                                  loading="lazy"
                                />
                              ) : (
                                <span className="text-xs text-muted-foreground">No favicon available</span>
                              )}
                            </div>
                            {selectedFaviconUrl && (
                              <a
                                className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                href={selectedFaviconUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Open in new tab <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                        </TabsContent>

                        <TabsContent value="branding">
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-[11px] text-muted-foreground">
                              Raw Firecrawl branding payload (stored in <span className="font-mono">brands.brandingJson</span>)
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2"
                              onClick={() => copyToClipboard("branding-raw", brandingPretty)}
                              disabled={!brandingPretty}
                            >
                              <Copy className="mr-2 h-3.5 w-3.5" />
                              {copiedKey === "branding-raw" ? "Copied" : "Copy"}
                            </Button>
                          </div>
                          <ScrollArea className="mt-2 max-h-64 rounded-md border bg-muted/20 p-2">
                            <pre className="text-[11px] leading-4 whitespace-pre-wrap break-words font-mono">
                              {brandingPretty || "No branding JSON found for this brand."}
                            </pre>
                          </ScrollArea>
                        </TabsContent>

                        <TabsContent value="metadata">
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-[11px] text-muted-foreground">
                              Firecrawl metadata payload (stored in <span className="font-mono">brands.metadataJson</span>)
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2"
                              onClick={() => copyToClipboard("metadata-raw", metadataPretty)}
                              disabled={!metadataPretty}
                            >
                              <Copy className="mr-2 h-3.5 w-3.5" />
                              {copiedKey === "metadata-raw" ? "Copied" : "Copy"}
                            </Button>
                          </div>
                          <ScrollArea className="mt-2 max-h-64 rounded-md border bg-muted/20 p-2">
                            <pre className="text-[11px] leading-4 whitespace-pre-wrap break-words font-mono">
                              {metadataPretty || "No metadata JSON found for this brand."}
                            </pre>
                          </ScrollArea>
                        </TabsContent>
                      </Tabs>
                    </div>

                    <div className="pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
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
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">Assets</div>
                  <div className="text-xs text-muted-foreground">
                    {assets ? `${assets.length} item${assets.length === 1 ? "" : "s"}` : "Loading…"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setImportOpen(true)} disabled={!canImportMore}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Brand
                  </Button>
                  <Button onClick={() => setGenerateOpen(true)} disabled={!hasSelectedBrand}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Create
                  </Button>
                </div>
              </div>

              <div className="mt-4">
                {!assets ? (
                  <div className="text-sm text-muted-foreground">Loading...</div>
                ) : assets.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="p-10 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border bg-muted/30">
                        <Sparkles className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="mt-4 text-sm font-medium">No assets yet</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        Generate your first hero/banner/social asset to build your visual library.
                      </div>
                      <div className="mt-6 flex flex-wrap justify-center gap-2">
                        <Button
                          variant={assetType === "hero" ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setAssetType("hero");
                            setGenerateOpen(true);
                          }}
                          className="min-w-[100px]"
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
                          className="min-w-[100px]"
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
                          className="min-w-[100px]"
                        >
                          Social Post
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="columns-1 gap-4 sm:columns-2 xl:columns-3">
                    {assets.map((a: any) => {
                      // Prefer imageUrl from query (Convex storage), fallback to legacy resultJson parsing
                      const imageUrl = a.imageUrl || getFirstImageUrlFromResultJson(a.resultJson);
                      const isBusy = a.status === "queued" || a.status === "running";
                      const isFailed = a.status === "failed";
                      return (
                        <div key={a._id} className="mb-4 break-inside-avoid">
                          <Card className="overflow-hidden">
                            <div className="relative">
                              <div className="absolute left-3 top-3 z-10 rounded-full bg-black/50 px-2.5 py-1 text-[11px] text-white">
                                {a.type}
                              </div>
                              <button
                                type="button"
                                className="absolute right-2 top-2 z-10 rounded-full bg-black/40 p-2 text-white hover:bg-black/60"
                                title="Remove asset"
                                onClick={async () => {
                                  if (!confirm("Remove this asset?")) return;
                                  await removeAsset({ id: a._id });
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>

                              <div className="bg-muted/30">
                                {imageUrl ? (
                                  <div className={getAssetAspectClass(a.type)}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={imageUrl} alt={a.type} className="h-full w-full object-cover" />
                                  </div>
                                ) : (
                                  <div className="flex h-64 items-center justify-center">
                                    <span className="text-xs text-muted-foreground">No preview</span>
                                  </div>
                                )}
                              </div>

                              {isBusy && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
                                  <div className="flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Generating…
                                  </div>
                                </div>
                              )}
                            </div>

                            <CardContent className="p-3 space-y-2">
                              <div className="flex items-center justify-end gap-2">
                                <div className={`text-xs ${isFailed ? "text-destructive" : "text-muted-foreground"}`}>
                                  {a.status}
                                </div>
                              </div>

                              {imageUrl && (
                                <a
                                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                  href={imageUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Open / Download <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              )}

                              {a.error && <p className="text-xs text-destructive line-clamp-3">{a.error}</p>}
                            </CardContent>
                          </Card>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



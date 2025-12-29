"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAction, useMutation, useQuery, useConvexAuth } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import Image from "next/image";
import {
  Globe,
  Loader2,
  Check,
  Image as ImageIcon,
  Mail,
  Sparkles,
  ArrowRight,
  Download,
  Wand2,
  ExternalLink,
} from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@react-email-builder/ui";

type GenerationStep = "idle" | "importing" | "assets" | "email" | "done";

interface GeneratedAsset {
  id: string;
  type: string;
  imageUrl?: string;
  status: string;
}

function DemoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();

  const urlParam = searchParams.get("url");

  const [step, setStep] = useState<GenerationStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [brandId, setBrandId] = useState<string | null>(null);
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedAsset[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Convex actions and mutations
  const importBrand = useAction(api.brands.importFromUrl);
  const generateAsset = useAction(api.marketingAssets.generate);
  const brands = useQuery(api.brands.list);
  const assets = useQuery(
    api.marketingAssets.listByBrand,
    brandId ? { brandId: brandId as any } : "skip"
  );

  // Auto-start generation when authenticated and URL is provided
  const startGeneration = useCallback(async () => {
    if (!urlParam || isGenerating) return;
    
    setIsGenerating(true);
    setError(null);
    setStep("importing");

    try {
      // Step 1: Import brand
      const brandResult = await importBrand({ url: urlParam });
      setBrandId(brandResult.brandId);
      setStep("assets");

      // Step 2: Generate 2 assets in parallel
      const assetPromises = [
        generateAsset({
          brandId: brandResult.brandId as any,
          type: "hero",
          stylePreset: "brand_strict",
        }),
        generateAsset({
          brandId: brandResult.brandId as any,
          type: "banner",
          stylePreset: "cinematic_3d",
        }),
      ];

      const assetResults = await Promise.all(assetPromises);
      
      setGeneratedAssets(
        assetResults.map((r, i) => ({
          id: r.assetId,
          type: i === 0 ? "hero" : "banner",
          imageUrl: r.imageUrl,
          status: "succeeded",
        }))
      );

      setStep("done");
    } catch (err: any) {
      console.error("Generation error:", err);
      setError(err.message || "Generation failed. Please try again.");
      setStep("idle");
    } finally {
      setIsGenerating(false);
    }
  }, [urlParam, isGenerating, importBrand, generateAsset]);

  // Auto-start when authenticated
  useEffect(() => {
    if (isAuthenticated && urlParam && step === "idle" && !isGenerating) {
      startGeneration();
    }
  }, [isAuthenticated, urlParam, step, isGenerating, startGeneration]);

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-violet-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show login prompt
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-violet-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Sign up to generate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-gray-600">
              Create a free account to generate marketing assets and emails for your brand.
            </p>

            {urlParam && (
              <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-3">
                <Globe className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-700 truncate">{urlParam}</span>
              </div>
            )}

            <div className="space-y-2">
              <Link href={`/signup?redirect=/demo?url=${encodeURIComponent(urlParam || "")}`}>
                <Button className="w-full" size="lg">
                  Sign Up Free
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link href={`/login?redirect=/demo?url=${encodeURIComponent(urlParam || "")}`}>
                <Button variant="outline" className="w-full">
                  Log In
                </Button>
              </Link>
            </div>

            <p className="text-center text-xs text-gray-500">
              Free plan includes 20 AI generations per day
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No URL provided
  if (!urlParam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-violet-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Enter your website URL</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const url = formData.get("url") as string;
                if (url) {
                  router.push(`/demo?url=${encodeURIComponent(url)}`);
                }
              }}
              className="space-y-4"
            >
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="url"
                  placeholder="https://your-website.com"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <Button type="submit" className="w-full">
                <Wand2 className="h-4 w-4 mr-2" />
                Generate Assets
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Generation in progress or complete
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-violet-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {step === "done" ? "Your Assets Are Ready! 🎉" : "Generating Your Assets..."}
          </h1>
          <p className="text-gray-600">
            {step === "done" 
              ? "We've created marketing assets based on your brand" 
              : "Please wait while we analyze your brand and create custom assets"}
          </p>
        </div>

        {/* URL Display */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-8 flex items-center gap-3">
          <Globe className="h-5 w-5 text-gray-400" />
          <span className="text-gray-700 truncate flex-1">{urlParam}</span>
          <a
            href={urlParam}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        {/* Progress Steps */}
        {step !== "done" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
            <div className="space-y-4">
              {[
                { id: "importing", label: "Analyzing your brand...", icon: Globe },
                { id: "assets", label: "Generating marketing assets...", icon: ImageIcon },
              ].map((s) => {
                const stepOrder = ["importing", "assets", "done"];
                const currentIndex = stepOrder.indexOf(step);
                const stepIndex = stepOrder.indexOf(s.id);
                const isActive = step === s.id;
                const isComplete = currentIndex > stepIndex;
                const StepIcon = s.icon;

                return (
                  <div key={s.id} className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        isComplete
                          ? "bg-green-100"
                          : isActive
                          ? "bg-primary/10"
                          : "bg-gray-100"
                      }`}
                    >
                      {isComplete ? (
                        <Check className="h-5 w-5 text-green-600" />
                      ) : isActive ? (
                        <Loader2 className="h-5 w-5 text-primary animate-spin" />
                      ) : (
                        <StepIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <span
                      className={`text-base font-medium ${
                        isActive ? "text-primary" : isComplete ? "text-gray-900" : "text-gray-400"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8 text-center">
            <p className="text-red-600 mb-2">{error}</p>
            <Button variant="outline" onClick={startGeneration}>
              Try Again
            </Button>
          </div>
        )}

        {/* Generated Assets */}
        {step === "done" && (
          <>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {generatedAssets.map((asset) => (
                <Card key={asset.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <ImageIcon className="h-4 w-4 text-primary" />
                        </div>
                        <CardTitle className="text-base capitalize">{asset.type} Image</CardTitle>
                      </div>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        Generated
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {asset.imageUrl ? (
                      <div className={`relative ${asset.type === "hero" ? "aspect-video" : "aspect-[3/1]"}`}>
                        <Image
                          src={asset.imageUrl}
                          alt={`Generated ${asset.type}`}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="aspect-video bg-gray-100 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/builder">
                <Button size="lg" className="gap-2">
                  <Mail className="h-5 w-5" />
                  Create Email with These Assets
                </Button>
              </Link>
              <Link href="/assets">
                <Button variant="outline" size="lg" className="gap-2">
                  <Download className="h-5 w-5" />
                  View All Assets
                </Button>
              </Link>
            </div>

            <p className="text-center text-sm text-gray-500 mt-4">
              Your assets have been saved to your account
            </p>
          </>
        )}

        {/* Live assets from Convex (in case generation is still processing) */}
        {assets && assets.length > 0 && step === "done" && (
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recently Generated Assets</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {assets.slice(0, 4).map((asset: any) => (
                <div key={asset._id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  {asset.imageUrl ? (
                    <div className="aspect-square relative">
                      <Image
                        src={asset.imageUrl}
                        alt={asset.type}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="aspect-square bg-gray-100 flex items-center justify-center">
                      {asset.status === "running" || asset.status === "queued" ? (
                        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                      ) : (
                        <ImageIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  )}
                  <div className="p-2">
                    <p className="text-xs font-medium text-gray-700 capitalize">{asset.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DemoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-violet-50 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <DemoContent />
    </Suspense>
  );
}


"use client";

import { useState } from "react";
import type { EmailComponent, TailwindConfig, EmailGlobalStyles } from "@/types";
import { Button, ScrollArea } from "@react-email-builder/ui";
import { Trash2, Upload, Mail, Calendar, Layers, Sparkles, Shield, ShoppingCart, Megaphone, Bell, Wand2, Cloud, Loader2 } from "lucide-react";
import { defaultTemplates, getTemplatesByCategory } from "@/lib/default-templates";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useConvexAuth } from "convex/react";

interface TemplateManagerProps {
  components: EmailComponent[];
  onLoadTemplate: (components: EmailComponent[], tailwindConfig?: TailwindConfig, globalStyles?: EmailGlobalStyles) => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  verification: <Shield className="h-3.5 w-3.5" />,
  marketing: <Megaphone className="h-3.5 w-3.5" />,
  transactional: <ShoppingCart className="h-3.5 w-3.5" />,
  notification: <Bell className="h-3.5 w-3.5" />,
};

const categoryLabels: Record<string, string> = {
  verification: "Verification",
  marketing: "Marketing",
  transactional: "Transactional",
  notification: "Notification",
};

// Template ID to domain mapping for logo.dev
const templateDomains: Record<string, string> = {
  "aws-verify": "aws.com",
  "linear-login": "linear.app",
  "notion-magic-link": "notion.so",
  "twitch-password-reset": "twitch.tv",
  "airbnb-review": "airbnb.com",
};

// Default background colors for templates (can be enhanced with logo.dev describe API)
const templateBgColors: Record<string, string> = {
  "aws-verify": "#252f3d",
  "linear-login": "#ffffff",
  "notion-magic-link": "#ffffff",
  "twitch-password-reset": "#9147ff",
  "airbnb-review": "#ffffff",
};

// Generate logo.dev URL for a template
const getLogoUrl = (templateId: string): string | null => {
  const domain = templateDomains[templateId];
  if (!domain) return null;
  
  // logo.dev API URL format: https://img.logo.dev/{domain}?size={size}&format={format}
  // Size 96px (24 * 4) for better quality in the 40x40 container
  return `https://img.logo.dev/${domain}?size=96&format=png`;
};

// Company logos for templates (using logo.dev API)
const templateLogos: Record<string, { src: string; bg: string }> = {
  "aws-verify": {
    src: getLogoUrl("aws-verify") || "",
    bg: templateBgColors["aws-verify"],
  },
  "linear-login": {
    src: getLogoUrl("linear-login") || "",
    bg: templateBgColors["linear-login"],
  },
  "notion-magic-link": {
    src: getLogoUrl("notion-magic-link") || "",
    bg: templateBgColors["notion-magic-link"],
  },
  "twitch-password-reset": {
    src: getLogoUrl("twitch-password-reset") || "",
    bg: templateBgColors["twitch-password-reset"],
  },
  "airbnb-review": {
    src: getLogoUrl("airbnb-review") || "",
    bg: templateBgColors["airbnb-review"],
  },
};

export function TemplateManager({ components, onLoadTemplate }: TemplateManagerProps) {
  const [activeTab, setActiveTab] = useState<"starter" | "cloud">("starter");
  const [logoErrors, setLogoErrors] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Convex auth and data
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const cloudTemplates = useQuery(api.templates.list);
  const createTemplate = useMutation(api.templates.create);
  const deleteCloudTemplate = useMutation(api.templates.remove);

  const templatesByCategory = getTemplatesByCategory();

  // Save to cloud
  const saveToCloud = async () => {
    if (components.length === 0) {
      alert("Add some components before saving a template!");
      return;
    }
    
    if (!isAuthenticated) {
      alert("Please sign in to save templates to the cloud.");
      return;
    }
    
    const name = prompt("Enter template name:");
    if (!name) return;

    setIsSaving(true);
    try {
      await createTemplate({
        name,
        components: JSON.stringify(components),
        isPublic: false,
      });
    } catch (err) {
      console.error("Failed to save template:", err);
      alert("Failed to save template. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete from cloud
  const handleDeleteCloud = async (id: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this template?")) return;
    
    try {
      await deleteCloudTemplate({ id });
    } catch (err) {
      console.error("Failed to delete template:", err);
      alert("Failed to delete template. Please try again.");
    }
  };

  // Generate new unique IDs for components and their children recursively
  const generateNewIds = (comps: EmailComponent[]): EmailComponent[] => {
    return comps.map((comp) => ({
      ...comp,
      id: `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      children: comp.children ? generateNewIds(comp.children) : undefined,
    }));
  };

  // Count all components including nested children
  const countComponents = (comps: EmailComponent[]): number => {
    let count = 0;
    for (const comp of comps) {
      count += 1;
      if (comp.children) {
        count += countComponents(comp.children);
      }
    }
    return count;
  };

  const loadTemplate = (templateComponents: EmailComponent[], tailwindConfig?: TailwindConfig, globalStyles?: EmailGlobalStyles) => {
    // Deep clone to avoid reference issues
    const cloned = JSON.parse(JSON.stringify(templateComponents));
    // Generate new IDs for each component and children
    const withNewIds = generateNewIds(cloned);
    onLoadTemplate(withNewIds, tailwindConfig, globalStyles);
  };

  return (
    <div className="w-full h-full bg-background flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("starter")}
          className={`flex-1 px-2 py-2.5 text-xs font-medium transition-colors ${
            activeTab === "starter"
              ? "text-foreground border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5 inline-block mr-1 -mt-0.5" />
          Starter
        </button>
        <button
          onClick={() => setActiveTab("cloud")}
          className={`flex-1 px-2 py-2.5 text-xs font-medium transition-colors ${
            activeTab === "cloud"
              ? "text-foreground border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Cloud className="h-3.5 w-3.5 inline-block mr-1 -mt-0.5" />
          Cloud
        </button>
      </div>

      <ScrollArea className="flex-1">
        {activeTab === "starter" ? (
          /* Starter Templates */
          <div className="p-3 space-y-4">
            {Object.entries(templatesByCategory).map(([category, templates]) => (
              templates.length > 0 && (
                <div key={category}>
                  <div className="flex items-center gap-2 px-1 mb-2">
                    <span className="text-muted-foreground">{categoryIcons[category]}</span>
                    <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                      {categoryLabels[category]}
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {templates.map((template) => {
                      const logo = templateLogos[template.id];
                      const hasLogoError = logoErrors[template.id];
                      return (
                      <button
                        key={template.id}
                          onClick={() => loadTemplate(template.components, template.tailwindConfig, template.globalStyles)}
                        className="w-full group relative bg-muted/40 hover:bg-muted border border-border hover:border-primary rounded-lg p-3 text-left transition-all"
                      >
                        <div className="flex items-start gap-3">
                            <div 
                              className="w-10 h-10 rounded-md border border-border flex items-center justify-center flex-shrink-0 overflow-hidden"
                              style={{ backgroundColor: logo?.bg || "#ffffff" }}
                            >
                              {logo && logo.src && !hasLogoError ? (
                                <img 
                                  src={logo.src} 
                                  alt={template.name}
                                  className="w-6 h-6 object-contain"
                                  onError={() => setLogoErrors(prev => ({ ...prev, [template.id]: true }))}
                                />
                              ) : (
                            <Mail className="h-4 w-4 text-muted-foreground" />
                              )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-foreground truncate">
                              {template.name}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              {template.description}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Layers className="h-3 w-3" />
                                  {countComponents(template.components)} components
                                </span>
                                {template.usesTailwind && (
                                  <span className="text-[10px] text-primary flex items-center gap-1">
                                    <Wand2 className="h-3 w-3" />
                                    Tailwind
                              </span>
                                )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Use indicator */}
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-xs text-primary font-medium">Use →</span>
                        </div>
                      </button>
                      );
                    })}
                  </div>
                </div>
              )
            ))}
          </div>
        ) : activeTab === "cloud" ? (
          /* Cloud Templates */
          <div className="p-3">
            {/* Save to Cloud Button */}
            <Button
              onClick={saveToCloud}
              className="w-full mb-3 gap-2"
              variant="outline"
              disabled={components.length === 0 || !isAuthenticated || isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Cloud className="h-4 w-4" />
              )}
              {isSaving ? "Saving..." : "Save to Cloud"}
            </Button>

            {!isAuthenticated ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                  <Cloud className="h-5 w-5 text-blue-500" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">Sign in to use cloud storage</p>
                <p className="text-xs text-muted-foreground max-w-[180px] mb-3">
                  Save and sync your templates across devices
                </p>
                <a
                  href="/login"
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Sign in →
                </a>
              </div>
            ) : cloudTemplates === undefined ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : cloudTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Cloud className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">No cloud templates</p>
                <p className="text-xs text-muted-foreground max-w-[180px]">
                  Save your designs to access them anywhere
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {cloudTemplates.map((template) => {
                  const templateComponents = JSON.parse(template.components);
                  return (
                    <div
                      key={template._id}
                      onClick={() => loadTemplate(templateComponents)}
                      className="group relative bg-muted/40 hover:bg-muted border border-border hover:border-primary rounded-lg p-3 cursor-pointer transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-md bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <Cloud className="h-4 w-4 text-blue-500" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-foreground truncate pr-8">
                            {template.name}
                          </h4>
                          
                          <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Layers className="h-3 w-3" />
                              {templateComponents.length}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(template.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            loadTemplate(templateComponents);
                          }}
                          className="w-6 h-6 flex items-center justify-center rounded bg-background border border-border hover:bg-muted"
                          title="Load"
                        >
                          <Upload className="h-3 w-3 text-muted-foreground" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteCloud(template._id, e)}
                          className="w-6 h-6 flex items-center justify-center rounded bg-background border border-border hover:bg-red-50 hover:border-red-200"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}
      </ScrollArea>
    </div>
  );
}

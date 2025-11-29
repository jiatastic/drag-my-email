"use client";

import { useState } from "react";
import type { EmailComponent, TailwindConfig, EmailGlobalStyles } from "@/types";
import { Button, ScrollArea } from "@react-email-builder/ui";
import { Plus, FileText, Trash2, Upload, Mail, Calendar, Layers, Sparkles, Shield, ShoppingCart, Megaphone, Bell, Wand2 } from "lucide-react";
import { defaultTemplates, getTemplatesByCategory } from "@/lib/default-templates";

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

// Company logos for templates (using stable CDN URLs)
const templateLogos: Record<string, { src: string; bg: string }> = {
  "aws-verify": {
    src: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Amazon_Web_Services_Logo.svg/300px-Amazon_Web_Services_Logo.svg.png",
    bg: "#252f3d",
  },
  "linear-login": {
    src: "https://asset.brandfetch.io/iduDa181eM/idYYbqOlKi.png",
    bg: "#ffffff",
  },
  "notion-magic-link": {
    src: "https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png",
    bg: "#ffffff",
  },
  "twitch-password-reset": {
    src: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Twitch_logo.svg/200px-Twitch_logo.svg.png",
    bg: "#9147ff",
  },
};

export function TemplateManager({ components, onLoadTemplate }: TemplateManagerProps) {
  const [activeTab, setActiveTab] = useState<"starter" | "saved">("starter");
  const [localTemplates, setLocalTemplates] = useState<Array<{
    id: string;
    name: string;
    description?: string;
    components: EmailComponent[];
    created_at: string;
  }>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("email_templates");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const templatesByCategory = getTemplatesByCategory();

  const saveTemplate = () => {
    if (components.length === 0) {
      alert("Add some components before saving a template!");
      return;
    }
    
    const name = prompt("Enter template name:");
    if (!name) return;

    const newTemplate = {
      id: `local-${Date.now()}`,
      name,
      description: "",
      components,
      created_at: new Date().toISOString(),
    };

    const updated = [newTemplate, ...localTemplates];
    setLocalTemplates(updated);
    localStorage.setItem("email_templates", JSON.stringify(updated));
  };

  const deleteTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this template?")) return;
    const updated = localTemplates.filter((t) => t.id !== id);
    setLocalTemplates(updated);
    localStorage.setItem("email_templates", JSON.stringify(updated));
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
    <div className="w-full h-full bg-white flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("starter")}
          className={`flex-1 px-4 py-2.5 text-xs font-medium transition-colors ${
            activeTab === "starter"
              ? "text-gray-900 border-b-2 border-primary"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5 inline-block mr-1.5 -mt-0.5" />
          Starter
        </button>
        <button
          onClick={() => setActiveTab("saved")}
          className={`flex-1 px-4 py-2.5 text-xs font-medium transition-colors ${
            activeTab === "saved"
              ? "text-gray-900 border-b-2 border-primary"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <FileText className="h-3.5 w-3.5 inline-block mr-1.5 -mt-0.5" />
          Saved ({localTemplates.length})
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
                    <span className="text-gray-400">{categoryIcons[category]}</span>
                    <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                      {categoryLabels[category]}
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {templates.map((template) => {
                      const logo = templateLogos[template.id];
                      return (
                      <button
                        key={template.id}
                          onClick={() => loadTemplate(template.components, template.tailwindConfig, template.globalStyles)}
                        className="w-full group relative bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-lg p-3 text-left transition-all"
                      >
                        <div className="flex items-start gap-3">
                            <div 
                              className="w-10 h-10 rounded-md border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden"
                              style={{ backgroundColor: logo?.bg || "#ffffff" }}
                            >
                              {logo ? (
                                <img 
                                  src={logo.src} 
                                  alt={template.name}
                                  className="w-6 h-6 object-contain"
                                />
                              ) : (
                            <Mail className="h-4 w-4 text-gray-400" />
                              )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {template.name}
                            </h4>
                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                              {template.description}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[10px] text-gray-400 flex items-center gap-1">
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
        ) : (
          /* Saved Templates */
          <div className="p-3">
            {/* Save Button */}
            <Button
              onClick={saveTemplate}
              className="w-full mb-3 gap-2"
              variant="outline"
              disabled={components.length === 0}
            >
              <Plus className="h-4 w-4" />
              Save Current Design
            </Button>
            
            {localTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">No saved templates</p>
                <p className="text-xs text-gray-400 max-w-[180px]">
                  Save your designs to reuse them later
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {localTemplates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => loadTemplate(template.components)}
                    className="group relative bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-lg p-3 cursor-pointer transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate pr-8">
                          {template.name}
                        </h4>
                        
                        <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
                          <span className="flex items-center gap-1">
                            <Layers className="h-3 w-3" />
                            {template.components.length}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(template.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          loadTemplate(template.components);
                        }}
                        className="w-6 h-6 flex items-center justify-center rounded bg-white border border-gray-200 hover:bg-gray-50"
                        title="Load"
                      >
                        <Upload className="h-3 w-3 text-gray-500" />
                      </button>
                      <button
                        onClick={(e) => deleteTemplate(template.id, e)}
                        className="w-6 h-6 flex items-center justify-center rounded bg-white border border-gray-200 hover:bg-red-50 hover:border-red-200"
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3 text-gray-500 hover:text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

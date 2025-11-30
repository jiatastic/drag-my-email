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

// Company logos for templates (using embedded SVG data URIs for reliability)
const templateLogos: Record<string, { src: string; bg: string }> = {
  "aws-verify": {
    src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 304 182'%3E%3Cpath fill='%23F90' d='M86.4 66.4c0 3.7.4 6.7 1.1 8.9.8 2.2 1.8 4.6 3.2 7.2.5.8.7 1.6.7 2.3 0 1-.6 2-1.9 3l-6.3 4.2c-.9.6-1.8.9-2.6.9-1 0-2-.5-3-1.4-1.4-1.5-2.6-3.1-3.6-4.7-1-1.7-2-3.6-3.1-5.9-7.8 9.2-17.6 13.8-29.4 13.8-8.4 0-15.1-2.4-20-7.2-4.9-4.8-7.4-11.2-7.4-19.2 0-8.5 3-15.4 9.1-20.6 6.1-5.2 14.2-7.8 24.5-7.8 3.4 0 6.9.3 10.6.8 3.7.5 7.5 1.3 11.5 2.2v-7.3c0-7.6-1.6-12.9-4.7-16-3.2-3.1-8.6-4.6-16.3-4.6-3.5 0-7.1.4-10.8 1.3-3.7.9-7.3 2-10.8 3.4-1.6.7-2.8 1.1-3.5 1.3-.7.2-1.2.3-1.6.3-1.4 0-2.1-1-2.1-3.1v-4.9c0-1.6.2-2.8.7-3.5.5-.7 1.4-1.4 2.8-2.1 3.5-1.8 7.7-3.3 12.6-4.5 4.9-1.3 10.1-1.9 15.6-1.9 11.9 0 20.6 2.7 26.2 8.1 5.5 5.4 8.3 13.6 8.3 24.6v32.4zM45.8 81.6c3.3 0 6.7-.6 10.3-1.8 3.6-1.2 6.8-3.4 9.5-6.4 1.6-1.9 2.8-4 3.4-6.4.6-2.4 1-5.3 1-8.7v-4.2c-2.9-.7-6-1.3-9.2-1.7-3.2-.4-6.3-.6-9.4-.6-6.7 0-11.6 1.3-14.9 4-3.3 2.7-4.9 6.5-4.9 11.5 0 4.7 1.2 8.2 3.7 10.6 2.4 2.5 5.9 3.7 10.5 3.7zm80.3 10.8c-1.8 0-3-.3-3.8-1-.8-.6-1.5-2-2.1-3.9L96.7 10.2c-.6-2-.9-3.3-.9-4 0-1.6.8-2.5 2.4-2.5h9.8c1.9 0 3.2.3 3.9 1 .8.6 1.4 2 2 3.9l16.8 66.2 15.6-66.2c.5-2 1.1-3.3 1.9-3.9.8-.6 2.2-1 4-1h8c1.9 0 3.2.3 4 1 .8.6 1.5 2 1.9 3.9l15.8 67 17.3-67c.6-2 1.3-3.3 2-3.9.8-.6 2.1-1 3.9-1h9.3c1.6 0 2.5.8 2.5 2.5 0 .5-.1 1-.2 1.6-.1.6-.3 1.4-.7 2.5l-24.1 77.3c-.6 2-1.3 3.3-2.1 3.9-.8.6-2.1 1-3.8 1h-8.6c-1.9 0-3.2-.3-4-1-.8-.7-1.5-2-1.9-4l-15.5-64.5-15.4 64.4c-.5 2-1.1 3.3-1.9 4-.8.7-2.2 1-4 1h-8.6zm128.5 2.7c-5.2 0-10.4-.6-15.4-1.8-5-1.2-8.9-2.5-11.5-4-1.6-.9-2.7-1.9-3.1-2.8-.4-.9-.6-1.9-.6-2.8v-5.1c0-2.1.8-3.1 2.3-3.1.6 0 1.2.1 1.8.3.6.2 1.5.6 2.5 1 3.4 1.5 7.1 2.7 11 3.5 4 .8 7.9 1.2 11.9 1.2 6.3 0 11.2-1.1 14.6-3.3 3.4-2.2 5.2-5.4 5.2-9.5 0-2.8-.9-5.1-2.7-7-1.8-1.9-5.2-3.6-10.1-5.2l-14.5-4.5c-7.3-2.3-12.7-5.7-16-10.2-3.3-4.4-5-9.3-5-14.5 0-4.2.9-7.9 2.7-11.1 1.8-3.2 4.2-6 7.2-8.2 3-2.3 6.4-4 10.4-5.2 4-1.2 8.2-1.7 12.6-1.7 2.2 0 4.5.1 6.7.4 2.3.3 4.4.7 6.5 1.1 2 .5 3.9 1 5.7 1.6 1.8.6 3.2 1.2 4.2 1.8 1.4.8 2.4 1.6 3 2.5.6.8.9 1.9.9 3.3v4.7c0 2.1-.8 3.2-2.3 3.2-.8 0-2.1-.4-3.8-1.2-5.7-2.6-12.1-3.9-19.2-3.9-5.7 0-10.2.9-13.3 2.8-3.1 1.9-4.7 4.8-4.7 8.9 0 2.8 1 5.2 3 7.1 2 1.9 5.7 3.8 11 5.5l14.2 4.5c7.2 2.3 12.4 5.5 15.5 9.6 3.1 4.1 4.6 8.8 4.6 14 0 4.3-.9 8.2-2.6 11.6-1.8 3.4-4.2 6.4-7.3 8.8-3.1 2.5-6.8 4.3-11.1 5.6-4.5 1.4-9.2 2.1-14.3 2.1z'/%3E%3Cpath fill='%23F90' d='M273.5 143.7c-32.9 24.3-80.7 37.2-121.8 37.2-57.6 0-109.5-21.3-148.7-56.7-3.1-2.8-.3-6.6 3.4-4.4 42.4 24.6 94.7 39.5 148.8 39.5 36.5 0 76.6-7.6 113.5-23.2 5.5-2.5 10.2 3.6 4.8 7.6z'/%3E%3Cpath fill='%23F90' d='M287.2 128.1c-4.2-5.4-27.8-2.6-38.5-1.3-3.2.4-3.7-2.4-.8-4.5 18.8-13.2 49.7-9.4 53.3-5 3.6 4.5-1 35.4-18.6 50.2-2.7 2.3-5.3 1.1-4.1-1.9 4-9.9 12.9-32.2 8.7-37.5z'/%3E%3C/svg%3E",
    bg: "#252f3d",
  },
  "linear-login": {
    src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3ClinearGradient id='a' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%235E6AD2'/%3E%3Cstop offset='100%25' stop-color='%234B5BCC'/%3E%3C/linearGradient%3E%3Cpath fill='url(%23a)' d='M1.22 61.293a48.9 48.9 0 0 1-1.22-11.1C0 22.45 22.45 0 50.193 0c20.076 0 37.42 11.818 45.413 28.877L1.22 61.293zM3.269 67.45 71.02 96.878a49.95 49.95 0 0 1-20.826 4.538c-23.716 0-43.48-16.406-48.695-38.496a50.213 50.213 0 0 1 1.77-4.47zM75.28 95.35l-72.6-29.42a49.918 49.918 0 0 1-.9-2.372l82.96-33.616c2.08 6.3 3.2 13.04 3.2 20.05 0 18.44-5.04 35.76-13.85 50.58a50.048 50.048 0 0 1-1.187-.778L75.28 95.35z'/%3E%3C/svg%3E",
    bg: "#ffffff",
  },
  "notion-magic-link": {
    src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M6.017 4.313l55.333-4.087c6.797-.583 8.543-.19 12.817 2.917l17.663 12.443c2.913 2.14 3.883 2.723 3.883 5.053v68.243c0 4.277-1.553 6.807-6.99 7.193L24.467 99.967c-4.08.193-6.023-.39-8.16-3.113L3.3 79.94c-2.333-3.113-3.3-5.443-3.3-8.167V11.113c0-3.497 1.553-6.413 6.017-6.8z' fill='%23fff'/%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M61.35.227l-55.333 4.087C1.553 4.7 0 7.617 0 11.113v60.66c0 2.723.967 5.053 3.3 8.167l13.007 16.913c2.137 2.723 4.08 3.307 8.16 3.113l64.257-3.89c5.437-.387 6.99-2.917 6.99-7.193V20.64c0-2.21-.873-2.847-3.443-4.733L75.83 3.297c-4.273-3.107-6.02-3.5-12.817-2.917l.337-.153zM25.723 19.137c-5.437.387-6.667.464-9.77-1.943L8.33 11.303c-.97-.78-.58-1.753.97-1.943l53.193-3.887c4.467-.387 6.8.973 8.543 2.333l8.35 6.033c.39.193.97 1.167.193 1.167l-54.633 3.937.777.193zM19.803 88.3V30.367c0-2.53.777-3.697 3.103-3.893L86 22.78c2.14-.193 3.107 1.167 3.107 3.693v57.547c0 2.53-.39 4.67-3.883 4.863l-60.377 3.5c-3.493.193-5.043-.973-5.043-4.083zm59.6-54.827c.387 1.75 0 3.5-1.75 3.7l-2.91.577v42.773c-2.527 1.36-4.853 2.137-6.797 2.137-3.107 0-3.883-.973-6.21-3.887l-19.03-29.94v28.967l6.02 1.363s0 3.5-4.857 3.5l-13.39.777c-.39-.78 0-2.723 1.357-3.11l3.497-.97v-38.3L30.48 40.667c-.39-1.75.58-4.277 3.3-4.473l14.357-.967 19.8 30.327v-26.83l-5.047-.58c-.39-2.143 1.163-3.7 3.103-3.89l13.41-.777z' fill='%23000'/%3E%3C/svg%3E",
    bg: "#ffffff",
  },
  "twitch-password-reset": {
    src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z'/%3E%3C/svg%3E",
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

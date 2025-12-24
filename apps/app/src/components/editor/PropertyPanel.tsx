"use client";

import type { EmailComponent, EmailGlobalStyles } from "@/types";
import { componentRegistry } from "@/lib/component-registry";
import { Label, Input, Textarea, ScrollArea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@react-email-builder/ui";
import { 
  Settings2, Type, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  ChevronDown, Minus, Plus, Link2, Image as ImageIcon, ExternalLink,
  Globe, Palette, Box, Type as TypeIcon, Share2
} from "lucide-react";
import { useState } from "react";

interface PropertyPanelProps {
  component: EmailComponent | null;
  onUpdate: (updates: Partial<EmailComponent>) => void;
  globalStyles?: EmailGlobalStyles;
  onUpdateGlobalStyles?: (updates: Partial<EmailGlobalStyles>) => void;
}

// Collapsible Section Component
function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-muted transition-colors"
      >
        <span className="text-xs font-semibold text-foreground uppercase tracking-wide">{title}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${isOpen ? "" : "-rotate-90"}`}
        />
      </button>
      {isOpen && (
        <div className="px-4 pb-4 space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}

// Row for side-by-side inputs
function InputRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-2">{children}</div>;
}

type NumberInputMode = "css-length" | "number";

// Number input with stepper and unit
// - mode="css-length": stores values like "16px" (unit auto appended), but the input shows only "16"
// - mode="number": stores plain numbers (as string), while still showing an optional unit badge (e.g. "px")
function NumberInput({
  value,
  onChange,
  unit = "px",
  min,
  max,
  step = 1,
  placeholder = "Auto",
  mode = "css-length",
}: {
  value: string | number;
  onChange: (value: string) => void;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  mode?: NumberInputMode;
}) {
  const raw = value ?? "";
  const rawStr = typeof raw === "number" ? String(raw) : String(raw);

  // Compound CSS values (e.g. "14px 28px", "0 auto") should be treated as free text.
  const isCompound = rawStr.trim().includes(" ");

  const displayValue = (() => {
    if (isCompound) return rawStr;
    if (!rawStr) return "";
    if (unit && rawStr.toLowerCase().endsWith(unit.toLowerCase())) {
      return rawStr.slice(0, -unit.length);
    }
    return rawStr;
  })();

  const parseNumber = (s: string) => {
    const cleaned = s.replace(/[^0-9.+-]/g, "");
    const n = Number.parseFloat(cleaned);
    return Number.isFinite(n) ? n : null;
  };

  const currentNumber = isCompound ? null : parseNumber(rawStr);

  const clamp = (n: number) => {
    let next = n;
    if (typeof min === "number") next = Math.max(min, next);
    if (typeof max === "number") next = Math.min(max, next);
    return next;
  };

  const commitNumber = (n: number) => {
    const next = clamp(n);
    if (mode === "number") {
      onChange(String(next));
      return;
    }
    // css-length
    if (unit) onChange(`${next}${unit}`);
    else onChange(String(next));
  };

  const increment = () => commitNumber((currentNumber ?? 0) + step);
  const decrement = () => commitNumber((currentNumber ?? 0) - step);

  const showUnitBadge = !!unit && !isCompound;

  return (
    <div className="flex items-center border border-border rounded-md overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20">
      <button
        type="button"
        onClick={decrement}
        disabled={isCompound}
        className="px-1.5 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border-r border-border"
        aria-label="Decrease"
      >
        <Minus className="h-3 w-3" />
      </button>
      <input
        type="text"
        inputMode="decimal"
        value={displayValue || ""}
        onChange={(e) => {
          const nextRaw = e.target.value;
          if (isCompound) {
            // If the user typed only numbers separated by spaces, auto-append unit for css-length.
            const tokens = nextRaw.trim().split(/\s+/).filter(Boolean);
            const allNumeric = tokens.length > 0 && tokens.every((t) => /^[+-]?\d+(\.\d+)?$/.test(t));
            if (mode === "css-length" && unit && allNumeric) {
              onChange(tokens.map((t) => `${t}${unit}`).join(" "));
              return;
            }
            onChange(nextRaw);
            return;
          }
          const trimmed = nextRaw.trim();
          if (trimmed === "") {
            onChange("");
            return;
          }
          // Only auto-commit when the user typed a complete number.
          if (/^[+-]?\d+(\.\d+)?$/.test(trimmed)) {
            const n = Number.parseFloat(trimmed);
            if (Number.isFinite(n)) {
              commitNumber(n);
              return;
            }
          }
          // Otherwise keep raw text (lets the user type naturally).
          onChange(nextRaw);
        }}
        placeholder={placeholder}
        className="flex-1 px-2 py-1.5 text-sm text-center w-full min-w-0 bg-transparent focus:outline-none"
      />
      {showUnitBadge && (
        <span className="px-1.5 text-xs text-muted-foreground border-l border-border bg-muted">{unit}</span>
      )}
      <button
        type="button"
        onClick={increment}
        disabled={isCompound}
        className="px-1.5 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border-l border-border"
        aria-label="Increase"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}

// Color input with picker
function ColorInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative shrink-0">
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded-md border border-border cursor-pointer appearance-none bg-transparent"
          style={{ backgroundColor: value || "#ffffff" }}
        />
        <div 
          className="absolute inset-0 rounded-md border border-border pointer-events-none"
          style={{ backgroundColor: value || "#ffffff" }}
        />
      </div>
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#000000"
        className="flex-1 px-2 py-1.5 text-sm font-mono border border-border rounded-md bg-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
      />
    </div>
  );
}

// Select dropdown wrapper for shadcn/ui Select
function SelectDropdown({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: { label: string; value: string }[] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full h-9 text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
      {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
      ))}
      </SelectContent>
    </Select>
  );
}

// Toggle button group
function ToggleGroup({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: { icon?: React.ReactNode; label?: string; value: string }[] }) {
  return (
    <div className="flex bg-muted border border-border rounded-md p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-all ${
            value === opt.value
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {opt.icon || opt.label}
        </button>
      ))}
    </div>
  );
}

// Visual spacing control (like box model)
function SpacingControl({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <NumberInput value={value} onChange={onChange} />
    </div>
  );
}

export function PropertyPanel({ component, onUpdate, globalStyles, onUpdateGlobalStyles }: PropertyPanelProps) {
  // Show Global Email Settings when no component is selected
  if (!component) {
    return (
      <div className="w-full h-full bg-background flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Globe className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-foreground truncate">Email Settings</h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Global Styles</p>
          </div>
        </div>
        
        {/* Global Settings */}
        <ScrollArea className="flex-1">
          <div className="divide-y divide-border">
            {/* COLORS */}
            <Section title="Colors">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Body Background</Label>
                <ColorInput 
                  value={globalStyles?.bodyBackgroundColor || "#f4f4f5"} 
                  onChange={(v) => onUpdateGlobalStyles?.({ bodyBackgroundColor: v })} 
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Container Background</Label>
                <ColorInput 
                  value={globalStyles?.containerBackgroundColor || "#ffffff"} 
                  onChange={(v) => onUpdateGlobalStyles?.({ containerBackgroundColor: v })} 
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Default Text Color</Label>
                <ColorInput 
                  value={globalStyles?.textColor || "#1a1a1a"} 
                  onChange={(v) => onUpdateGlobalStyles?.({ textColor: v })} 
                />
              </div>
            </Section>
            
            {/* LAYOUT */}
            <Section title="Layout">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Max Width</Label>
                <NumberInput 
                  value={globalStyles?.maxWidth || "600px"} 
                  onChange={(v) => onUpdateGlobalStyles?.({ maxWidth: v })} 
                  unit="px"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Container Padding</Label>
                <NumberInput 
                  value={globalStyles?.containerPadding || "20px"} 
                  onChange={(v) => onUpdateGlobalStyles?.({ containerPadding: v })} 
                  unit="px"
                />
              </div>
            </Section>
            
            {/* TYPOGRAPHY */}
            <Section title="Typography">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Font Family</Label>
                <SelectDropdown 
                  value={globalStyles?.fontFamily || "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"}
                  onChange={(v) => onUpdateGlobalStyles?.({ fontFamily: v })}
                  options={[
                    { label: 'System (Default)', value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
                    { label: 'Arial', value: "Arial, Helvetica, sans-serif" },
                    { label: 'Georgia', value: "Georgia, 'Times New Roman', serif" },
                    { label: 'Verdana', value: "Verdana, Geneva, sans-serif" },
                    { label: 'Trebuchet MS', value: "'Trebuchet MS', Helvetica, sans-serif" },
                    { label: 'Times New Roman', value: "'Times New Roman', Times, serif" },
                  ]}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Base Font Size</Label>
                <NumberInput 
                  value={globalStyles?.fontSize || "16px"} 
                  onChange={(v) => onUpdateGlobalStyles?.({ fontSize: v })} 
                  unit="px"
                />
              </div>
            </Section>
            
            {/* INFO */}
            <div className="p-4">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                <p className="text-xs text-blue-700">
                  <strong>Tip:</strong> Select a component on the canvas to edit its specific properties, or use these settings to style the entire email.
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  }

  const metadata = componentRegistry[component.type];
  if (!metadata) {
    return (
      <div className="w-full h-full bg-background p-4">
        <p className="text-sm text-muted-foreground">Unknown component</p>
      </div>
    );
  }

  const updateProp = (path: string, value: any) => {
    const keys = path.split(".");
    const updates: any = { ...component.props };

    if (keys.length === 1) {
      const key = keys[0];
      if (key) updates[key] = value;
    } else {
      let current = updates;
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (key) {
          current[key] = current[key] ? { ...current[key] } : {};
          current = current[key];
        }
      }
      const lastKey = keys[keys.length - 1];
      if (lastKey) current[lastKey] = value;
    }

    onUpdate({ props: updates });
  };

  const getPropValue = (path: string): any => {
    const keys = path.split(".");
    let current: any = component.props;
    for (const key of keys) {
      if (current && typeof current === "object") {
        current = current[key];
      } else {
        return "";
      }
    }
    return current ?? "";
  };

  const props = component.props || {};
  const style = props.style || {};
  const className = component.className || "";

  // Email layouts are typically designed for a 600px content width.
  // We use this constant when auto-fitting images for reliable rendering across email clients.
  const EMAIL_CANVAS_WIDTH = 600;

  // Helper to extract values from Tailwind classes
  const getTailwindValue = (property: string): string | undefined => {
    // Background color: bg-[#xxx] or bg-background etc.
    if (property === "backgroundColor") {
      const hexMatch = className.match(/bg-\[#([a-fA-F0-9]{3,6})\]/);
      if (hexMatch) return `#${hexMatch[1]}`;
      if (className.includes("bg-background")) return "#ffffff";
      if (className.includes("bg-black")) return "#000000";
    }
    // Text color: text-[#xxx] or text-white etc.
    if (property === "color") {
      const hexMatch = className.match(/text-\[#([a-fA-F0-9]{3,6})\]/);
      if (hexMatch) return `#${hexMatch[1]}`;
      if (className.includes("text-white")) return "#ffffff";
      if (className.includes("text-black")) return "#000000";
    }
    // Padding: p-X, py-X, px-X, pt-X, etc.
    if (property === "padding") {
      const pMatch = className.match(/(?:^|\s)p-(\d+|(?:\[.+?\]))/);
      if (pMatch && pMatch[1]) {
        const val = pMatch[1];
        if (val.startsWith("[")) return val.slice(1, -1);
        return `${parseInt(val) * 4}px`;
      }
      // Check py and px separately
      const pyMatch = className.match(/py-(\d+|(?:\[.+?\]))/);
      const pxMatch = className.match(/px-(\d+|(?:\[.+?\]))/);
      if (pyMatch || pxMatch) {
        const pyVal = pyMatch?.[1];
        const pxVal = pxMatch?.[1];
        const py = pyVal ? (pyVal.startsWith("[") ? pyVal.slice(1, -1) : `${parseInt(pyVal) * 4}px`) : "0";
        const px = pxVal ? (pxVal.startsWith("[") ? pxVal.slice(1, -1) : `${parseInt(pxVal) * 4}px`) : "0";
        return `${py} ${px}`;
      }
    }
    // Margin: m-X, my-X, mx-X
    if (property === "margin") {
      const mMatch = className.match(/(?:^|\s)m-(\d+|(?:\[.+?\]))/);
      if (mMatch && mMatch[1]) {
        const val = mMatch[1];
        if (val.startsWith("[")) return val.slice(1, -1);
        return `${parseInt(val) * 4}px`;
      }
      if (className.includes("mx-auto")) return "0 auto";
    }
    // Max width: max-w-[Xpx]
    if (property === "maxWidth") {
      const match = className.match(/max-w-\[(.+?)\]/);
      if (match) return match[1];
    }
    // Text alignment
    if (property === "textAlign") {
      if (className.includes("text-center")) return "center";
      if (className.includes("text-left")) return "left";
      if (className.includes("text-right")) return "right";
    }
    // Font size: text-[Xpx]
    if (property === "fontSize") {
      const match = className.match(/text-\[(\d+px)\]/);
      if (match) return match[1];
    }
    // Font weight
    if (property === "fontWeight") {
      if (className.includes("font-bold")) return "700";
      if (className.includes("font-semibold")) return "600";
      if (className.includes("font-medium")) return "500";
    }
    return undefined;
  };

  // Get style value: first from inline style, then from Tailwind, then fallback
  const getStyleValue = (property: string, fallback: string): string => {
    // Check inline style first
    const inlineValue = style[property as keyof typeof style];
    if (inlineValue !== undefined && inlineValue !== null && inlineValue !== "") {
      return String(inlineValue);
    }
    // Then check Tailwind classes
    const tailwindValue = getTailwindValue(property);
    if (tailwindValue) return tailwindValue;
    // Fallback
    return fallback;
  };

  // Determine what sections to show based on component type
  const isText = component.type === "Text" || component.type === "Heading";
  const isButton = component.type === "Button";
  const isLink = component.type === "Link";
  const isImage = component.type === "Image";
  const isContainer = component.type === "Container" || component.type === "Section" || component.type === "Row" || component.type === "Column";
  const isDivider = component.type === "Divider" || component.type === "Hr";
  const isPreview = component.type === "Preview";
  const isSocialIcons = component.type === "SocialIcons";
  const isCodeBlock = component.type === "CodeBlock";
  const isCodeInline = component.type === "CodeInline";
  const isMarkdown = component.type === "Markdown";
  const isStats = component.type === "Stats";
  const isNumberedList = component.type === "NumberedList";
  const isGallery = component.type === "Gallery";
  const isMarketing = component.type === "Marketing";
  const isTestimonial = component.type === "Testimonial";
  const hasLink = isButton || isLink;
  // Check if this is the Columns component (Row with columnCount prop)
  const isColumns = component.type === "Row" && component.props?.columnCount !== undefined;
  
  // Social platforms for SocialIcons component
  const allSocialPlatforms = [
    { key: "facebook", name: "Facebook" },
    { key: "twitter", name: "Twitter / X" },
    { key: "instagram", name: "Instagram" },
    { key: "linkedin", name: "LinkedIn" },
    { key: "youtube", name: "YouTube" },
    { key: "tiktok", name: "TikTok" },
    { key: "github", name: "GitHub" },
    { key: "discord", name: "Discord" },
    { key: "twitch", name: "Twitch" },
    { key: "reddit", name: "Reddit" },
    { key: "pinterest", name: "Pinterest" },
    { key: "whatsapp", name: "WhatsApp" },
    { key: "telegram", name: "Telegram" },
    { key: "threads", name: "Threads" },
    { key: "mastodon", name: "Mastodon" },
    { key: "bluesky", name: "Bluesky" },
    { key: "spotify", name: "Spotify" },
    { key: "dribbble", name: "Dribbble" },
    { key: "behance", name: "Behance" },
    { key: "medium", name: "Medium" },
    { key: "slack", name: "Slack" },
  ];

  return (
    <div className="w-full h-full bg-background flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Type className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-foreground truncate">{metadata.name}</h2>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{component.type}</p>
        </div>
      </div>
      
      {/* Properties */}
      <ScrollArea className="flex-1">
        <div className="divide-y divide-border">
          
          {/* CONTENT SECTION */}
          {(isText || isButton || isLink || isPreview || isCodeInline || isMarkdown) && (
            <Section title="Content">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{isMarkdown ? "Markdown" : "Text"}</Label>
                <Textarea
                  value={getPropValue("children")}
                  onChange={(e) => updateProp("children", e.target.value)}
                  placeholder={isMarkdown ? "# Heading\n\nYour markdown content..." : "Enter text..."}
                  className={`text-sm resize-none border-border ${isMarkdown ? "min-h-[150px] font-mono text-xs" : "min-h-[70px]"}`}
                />
              </div>
              
              {component.type === "Heading" && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Level</Label>
                  <SelectDropdown 
                    value={getPropValue("as") || "h1"}
                    onChange={(v) => updateProp("as", v)}
                    options={[
                      { label: 'H1 - Largest', value: 'h1' },
                      { label: 'H2', value: 'h2' },
                      { label: 'H3', value: 'h3' },
                      { label: 'H4', value: 'h4' },
                      { label: 'H5', value: 'h5' },
                      { label: 'H6 - Smallest', value: 'h6' },
                    ]}
                  />
                </div>
              )}
            </Section>
          )}

          {/* CODE BLOCK SECTION */}
          {isCodeBlock && (
            <Section title="Code">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Code</Label>
                <Textarea
                  value={getPropValue("code")}
                  onChange={(e) => updateProp("code", e.target.value)}
                  placeholder="// Your code here..."
                  className="min-h-[120px] text-xs font-mono resize-none border-border bg-muted"
                />
              </div>
              
              <InputRow>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Language</Label>
                  <SelectDropdown 
                    value={getPropValue("language") || "javascript"}
                    onChange={(v) => updateProp("language", v)}
                    options={[
                      { label: 'JavaScript', value: 'javascript' },
                      { label: 'TypeScript', value: 'typescript' },
                      { label: 'Python', value: 'python' },
                      { label: 'HTML', value: 'html' },
                      { label: 'CSS', value: 'css' },
                      { label: 'JSON', value: 'json' },
                      { label: 'Bash', value: 'bash' },
                      { label: 'SQL', value: 'sql' },
                    ]}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Theme</Label>
                  <SelectDropdown 
                    value={getPropValue("theme") || "dracula"}
                    onChange={(v) => updateProp("theme", v)}
                    options={[
                      { label: 'Dracula', value: 'dracula' },
                      { label: 'GitHub', value: 'github' },
                      { label: 'Monokai', value: 'monokai' },
                      { label: 'Nord', value: 'nord' },
                    ]}
                  />
                </div>
              </InputRow>

              <div className="flex items-center justify-between py-1">
                <Label className="text-xs text-muted-foreground">Show Line Numbers</Label>
                <button
                  onClick={() => updateProp("showLineNumbers", !getPropValue("showLineNumbers"))}
                  className={`w-9 h-5 rounded-full transition-colors ${
                    getPropValue("showLineNumbers") !== false ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <div className={`w-4 h-4 bg-background rounded-full shadow transition-transform ${
                    getPropValue("showLineNumbers") !== false ? "translate-x-4" : "translate-x-0.5"
                  }`} />
                </button>
              </div>
            </Section>
          )}

          {/* CODE INLINE STYLE SECTION */}
          {isCodeInline && (
            <Section title="Style">
              <InputRow>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Background</Label>
                  <ColorInput 
                    value={getStyleValue("backgroundColor", "#f4f4f5")} 
                    onChange={(v) => updateProp("style.backgroundColor", v)} 
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Text Color</Label>
                  <ColorInput 
                    value={getStyleValue("color", "#18181b")} 
                    onChange={(v) => updateProp("style.color", v)} 
                  />
                </div>
              </InputRow>
              <InputRow>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Font Size</Label>
                  <NumberInput 
                    value={getStyleValue("fontSize", "14px")} 
                    onChange={(v) => updateProp("style.fontSize", v)} 
                    unit="px"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Border Radius</Label>
                  <NumberInput 
                    value={getStyleValue("borderRadius", "4px")} 
                    onChange={(v) => updateProp("style.borderRadius", v)} 
                    unit="px"
                  />
                </div>
              </InputRow>
            </Section>
          )}

          {/* LINK SECTION */}
          {hasLink && (
            <Section title="Link">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">URL</Label>
                <div className="relative">
                  <Link2 className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={getPropValue("href")}
                    onChange={(e) => updateProp("href", e.target.value)}
                    placeholder="https://..."
                    className="pl-8 text-sm border-border"
                  />
                </div>
              </div>
            </Section>
          )}

          {/* IMAGE SECTION */}
          {isImage && (
            <Section title="Image">
              {(() => {
                const src = String(getPropValue("src") || "");
                const width = String(getPropValue("width") || "");
                const height = String(getPropValue("height") || "");
                const [autoFitEnabled, setAutoFitEnabled] = useState(true);
                const [autoFitStatus, setAutoFitStatus] = useState<string | null>(null);
                const [lastAutoFitSrc, setLastAutoFitSrc] = useState<string | null>(null);

                const isConvexStorageUrl =
                  src.includes(".convex.cloud") || src.includes("/_storage/") || src.includes("convex.site");

                const canAutoFit = typeof window !== "undefined" && !!src && src.startsWith("http");

                const setImageProps = (next: Partial<Record<string, any>>) => {
                  const nextStyle = next.style ? { ...(style || {}), ...(next.style || {}) } : style;
                  const merged = {
                    ...props,
                    ...next,
                    ...(next.style ? { style: nextStyle } : {}),
                  };
                  onUpdate({ props: merged });
                };

                const autoFitToEmailWidth = async (reason: "manual" | "auto") => {
                  if (!canAutoFit) return;
                  setAutoFitStatus(reason === "manual" ? "Fitting..." : "Auto-fitting...");

                  try {
                    const img = new Image();
                    img.decoding = "async";
                    img.loading = "eager";

                    img.onload = () => {
                      try {
                        const naturalW = img.naturalWidth || 0;
                        const naturalH = img.naturalHeight || 0;
                        if (!naturalW || !naturalH) {
                          setAutoFitStatus("Could not read image dimensions.");
                          return;
                        }
                        const nextW = EMAIL_CANVAS_WIDTH;
                        const nextH = Math.max(1, Math.round((EMAIL_CANVAS_WIDTH * naturalH) / naturalW));

                        setImageProps({
                          width: String(nextW),
                          height: String(nextH),
                          style: {
                            maxWidth: "100%",
                            height: "auto",
                          },
                        });

                        setLastAutoFitSrc(src);
                        setAutoFitStatus(`Fitted to ${nextW}×${nextH}.`);
                        window.setTimeout(() => setAutoFitStatus(null), 1500);
                      } catch {
                        setAutoFitStatus("Failed to fit image.");
                      }
                    };

                    img.onerror = () => {
                      setAutoFitStatus("Failed to load image for sizing.");
                    };

                    img.src = src;
                  } catch {
                    setAutoFitStatus("Failed to fit image.");
                  }
                };

                // Auto-fit when the user pastes a Convex-hosted marketing asset URL.
                // Only auto-run when width/height are missing OR were last set by auto-fit,
                // to avoid surprising the user after they manually tuned values.
                if (
                  autoFitEnabled &&
                  isConvexStorageUrl &&
                  src &&
                  src !== lastAutoFitSrc &&
                  (width.trim() === "" || height.trim() === "")
                ) {
                  // Fire-and-forget. This runs during render, so we defer to the next tick.
                  queueMicrotask(() => {
                    void autoFitToEmailWidth("auto");
                  });
                }

                return (
                  <>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Source URL</Label>
                      <div className="relative">
                        <ImageIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          value={getPropValue("src")}
                          onChange={(e) => updateProp("src", e.target.value)}
                          placeholder="https://..."
                          className="pl-8 text-sm border-border"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => void autoFitToEmailWidth("manual")}
                        disabled={!canAutoFit}
                        className="text-xs font-medium text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
                        title="Set width/height to match the image aspect ratio at 600px email width"
                      >
                        Auto-fit to 600px
                      </button>

                      <label className="flex items-center gap-2 text-xs text-muted-foreground select-none">
                        <input
                          type="checkbox"
                          checked={autoFitEnabled}
                          onChange={(e) => setAutoFitEnabled(e.target.checked)}
                        />
                        Auto-fit Convex assets
                      </label>
                    </div>

                    {autoFitStatus && (
                      <div className="text-[11px] text-muted-foreground">{autoFitStatus}</div>
                    )}

                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Alt Text</Label>
                      <Input
                        value={getPropValue("alt")}
                        onChange={(e) => updateProp("alt", e.target.value)}
                        placeholder="Describe the image..."
                        className="text-sm border-border"
                      />
                    </div>

                    <InputRow>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Width</Label>
                        <NumberInput 
                          value={getPropValue("width")} 
                          onChange={(v) => updateProp("width", v)} 
                          unit="px"
                          mode="number"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Height</Label>
                        <NumberInput 
                          value={getPropValue("height")} 
                          onChange={(v) => updateProp("height", v)} 
                          unit="px"
                          mode="number"
                        />
                      </div>
                    </InputRow>

                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Alignment</Label>
                      <ToggleGroup
                        value={getStyleValue("textAlign", "center")}
                        onChange={(v) => updateProp("style.textAlign", v)}
                        options={[
                          { icon: <AlignLeft className="h-3.5 w-3.5 mx-auto" />, value: 'left' },
                          { icon: <AlignCenter className="h-3.5 w-3.5 mx-auto" />, value: 'center' },
                          { icon: <AlignRight className="h-3.5 w-3.5 mx-auto" />, value: 'right' },
                        ]}
                      />
                    </div>
                  </>
                );
              })()}
            </Section>
          )}

          {/* COLUMNS LAYOUT SECTION */}
          {isColumns && (
            <Section title="Layout">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Number of Columns</Label>
                <Select
                  value={String(props.columnCount || 2)}
                  onChange={(v) => {
                    const newCount = parseInt(v);
                    const currentCount = component.children?.length || 0;
                    const gap = props.columnGap || 20;
                    const halfGap = gap / 2;
                    
                    // Rebuild children array based on new column count
                    let newChildren = [...(component.children || [])];
                    
                    if (newCount > currentCount) {
                      // Add more columns
                      for (let i = currentCount; i < newCount; i++) {
                        newChildren.push({
                          id: `column-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
                          type: "Column",
                          props: {
                            style: {
                              verticalAlign: "top",
                              paddingLeft: i === 0 ? "0" : `${halfGap}px`,
                              paddingRight: i === newCount - 1 ? "0" : `${halfGap}px`,
                            },
                          },
                          children: [],
                        });
                      }
                    } else if (newCount < currentCount) {
                      // Remove columns (keep the first N)
                      newChildren = newChildren.slice(0, newCount);
                    }
                    
                    // Update all column padding for gaps
                    newChildren = newChildren.map((col, i) => ({
                      ...col,
                      props: {
                        ...col.props,
                        style: {
                          ...col.props?.style,
                          paddingLeft: i === 0 ? "0" : `${halfGap}px`,
                          paddingRight: i === newCount - 1 ? "0" : `${halfGap}px`,
                        },
                      },
                    }));
                    
                    onUpdate({
                      props: { ...props, columnCount: newCount },
                      children: newChildren,
                    });
                  }}
                  options={[
                    { label: '2 Columns', value: '2' },
                    { label: '3 Columns', value: '3' },
                    { label: '4 Columns', value: '4' },
                  ]}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Gap Between Columns</Label>
                <NumberInput
                  value={props.columnGap || 20}
                  onChange={(v) => {
                    const gap = parseInt(v) || 20;
                    const halfGap = gap / 2;
                    const columnCount = props.columnCount || 2;
                    
                    // Update padding on all columns for gap
                    const newChildren = (component.children || []).map((col: any, i: number) => ({
                      ...col,
                      props: {
                        ...col.props,
                        style: {
                          ...col.props?.style,
                          paddingLeft: i === 0 ? "0" : `${halfGap}px`,
                          paddingRight: i === columnCount - 1 ? "0" : `${halfGap}px`,
                        },
                      },
                    }));
                    
                    onUpdate({
                      props: { ...props, columnGap: gap },
                      children: newChildren,
                    });
                  }}
                  unit="px"
                  mode="number"
                  min={0}
                  max={60}
                  step={4}
                />
              </div>
            </Section>
          )}

          {/* SOCIAL ICONS SECTION */}
          {isSocialIcons && (
            <>
              <Section title="Platforms">
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  {(props.platforms || []).map((p: { platform: string; url: string }, idx: number) => (
                    <div key={idx} className="flex gap-2 items-start p-2 bg-muted rounded-lg">
                      <div className="flex-1 space-y-1.5">
                        <Select
                          value={p.platform}
                          onChange={(v) => {
                            const newPlatforms = [...(props.platforms || [])];
                            newPlatforms[idx] = { ...newPlatforms[idx], platform: v };
                            updateProp("platforms", newPlatforms);
                          }}
                          options={allSocialPlatforms.map(sp => ({ label: sp.name, value: sp.key }))}
                        />
                        <Input
                          value={p.url}
                          onChange={(e) => {
                            const newPlatforms = [...(props.platforms || [])];
                            newPlatforms[idx] = { ...newPlatforms[idx], url: e.target.value };
                            updateProp("platforms", newPlatforms);
                          }}
                          placeholder="URL..."
                          className="text-xs"
                        />
                      </div>
                      <button
                        onClick={() => {
                          const newPlatforms = (props.platforms || []).filter((_: any, i: number) => i !== idx);
                          updateProp("platforms", newPlatforms);
                        }}
                        className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    const currentPlatforms = props.platforms || [];
                    const usedPlatforms = currentPlatforms.map((p: { platform: string }) => p.platform);
                    const availablePlatform = allSocialPlatforms.find(sp => !usedPlatforms.includes(sp.key));
                    if (availablePlatform) {
                      updateProp("platforms", [...currentPlatforms, { platform: availablePlatform.key, url: "" }]);
                    }
                  }}
                  className="w-full mt-2 py-2 px-3 text-xs font-medium text-primary border border-dashed border-primary/30 rounded-lg hover:bg-primary/5 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Platform
                </button>
              </Section>

              <Section title="Style">
                <InputRow>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Icon Size</Label>
                    <NumberInput 
                      value={props.iconSize || 32} 
                      onChange={(v) => updateProp("iconSize", parseInt(v) || 32)} 
                      unit="px"
                      mode="number"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Spacing</Label>
                    <NumberInput 
                      value={props.spacing || 12} 
                      onChange={(v) => updateProp("spacing", parseInt(v) || 12)} 
                      unit="px"
                      mode="number"
                    />
                  </div>
                </InputRow>
                
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Icon Shape</Label>
                  <SelectDropdown 
                    value={props.iconShape || "circle"}
                    onChange={(v) => updateProp("iconShape", v)}
                    options={[
                      { label: 'Circle', value: 'circle' },
                      { label: 'Rounded', value: 'rounded' },
                      { label: 'Square', value: 'square' },
                    ]}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Icon Style</Label>
                  <SelectDropdown 
                    value={props.iconStyle || "colored"}
                    onChange={(v) => updateProp("iconStyle", v)}
                    options={[
                      { label: 'Colored (Brand)', value: 'colored' },
                      { label: 'Official (Favicon/Touch Icon)', value: 'official' },
                      { label: 'Dark', value: 'dark' },
                      { label: 'Light', value: 'light' },
                    ]}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Alignment</Label>
                  <ToggleGroup
                    value={style.textAlign || "center"}
                    onChange={(v) => updateProp("style.textAlign", v)}
                    options={[
                      { icon: <AlignLeft className="h-3.5 w-3.5 mx-auto" />, value: 'left' },
                      { icon: <AlignCenter className="h-3.5 w-3.5 mx-auto" />, value: 'center' },
                      { icon: <AlignRight className="h-3.5 w-3.5 mx-auto" />, value: 'right' },
                    ]}
                  />
                </div>
              </Section>
            </>
          )}

          {/* STATS COMPONENT SECTION */}
          {isStats && (
            <Section title={`Stats (${(props.stats || []).length})`}>
              <div className="space-y-2">
                {(props.stats || []).map((stat: { value: string; title: string; description?: string }, idx: number) => (
                  <div key={idx} className="p-2 bg-muted rounded-lg border border-border">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 space-y-1.5">
                        <div className="flex gap-2">
                          <Input
                            value={stat.value}
                            onChange={(e) => {
                              const newStats = [...(props.stats || [])];
                              newStats[idx] = { ...newStats[idx], value: e.target.value };
                              updateProp("stats", newStats);
                            }}
                            placeholder="42"
                            className="text-sm font-bold h-8 w-20"
                          />
                          <Input
                            value={stat.title}
                            onChange={(e) => {
                              const newStats = [...(props.stats || [])];
                              newStats[idx] = { ...newStats[idx], title: e.target.value };
                              updateProp("stats", newStats);
                            }}
                            placeholder="Title..."
                            className="text-sm h-8 flex-1"
                          />
                        </div>
                        <Input
                          value={stat.description || ""}
                          onChange={(e) => {
                            const newStats = [...(props.stats || [])];
                            newStats[idx] = { ...newStats[idx], description: e.target.value };
                            updateProp("stats", newStats);
                          }}
                          placeholder="Description (optional)..."
                          className="text-xs h-7"
                        />
                      </div>
                      <button
                        onClick={() => {
                          const newStats = (props.stats || []).filter((_: any, i: number) => i !== idx);
                          updateProp("stats", newStats);
                        }}
                        className="p-1 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded transition-colors shrink-0"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  const currentStats = props.stats || [];
                  updateProp("stats", [...currentStats, { value: "0", title: "New Stat", description: "" }]);
                }}
                className="w-full mt-2 py-2 px-3 text-xs font-medium text-primary border border-dashed border-primary/30 rounded-lg hover:bg-primary/5 transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Stat
              </button>
            </Section>
          )}

          {/* NUMBERED LIST COMPONENT SECTION */}
          {isNumberedList && (
            <>
              <Section title={`List Items (${(props.items || []).length})`}>
                <div className="space-y-2">
                  {(props.items || []).map((item: { title: string; description: string }, idx: number) => (
                    <div key={idx} className="p-2 bg-muted rounded-lg border border-border">
                      <div className="flex items-start gap-2">
                        <div 
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold text-white shrink-0 mt-1"
                          style={{ backgroundColor: props.numberBgColor || "#4f46e5" }}
                        >
                          {idx + 1}
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <Input
                            value={item.title}
                            onChange={(e) => {
                              const newItems = [...(props.items || [])];
                              newItems[idx] = { ...newItems[idx], title: e.target.value };
                              updateProp("items", newItems);
                            }}
                            placeholder="Title..."
                            className="text-sm font-medium h-8"
                          />
                          <Textarea
                            value={item.description}
                            onChange={(e) => {
                              const newItems = [...(props.items || [])];
                              newItems[idx] = { ...newItems[idx], description: e.target.value };
                              updateProp("items", newItems);
                            }}
                            placeholder="Description..."
                            className="text-xs min-h-[40px] resize-none"
                          />
                        </div>
                        <button
                          onClick={() => {
                            const newItems = (props.items || []).filter((_: any, i: number) => i !== idx);
                            updateProp("items", newItems);
                          }}
                          className="p-1 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded transition-colors shrink-0"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    const currentItems = props.items || [];
                    updateProp("items", [...currentItems, { title: "New Item", description: "Description here..." }]);
                  }}
                  className="w-full mt-2 py-2 px-3 text-xs font-medium text-primary border border-dashed border-primary/30 rounded-lg hover:bg-primary/5 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Item
                </button>
              </Section>

              <Section title="Style">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Number Circle Color</Label>
                  <ColorInput 
                    value={props.numberBgColor || "#4f46e5"} 
                    onChange={(v) => updateProp("numberBgColor", v)} 
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Padding</Label>
                  <NumberInput 
                    value={style.padding || "0"} 
                    onChange={(v) => updateProp("style.padding", v)} 
                    unit="px"
                  />
                </div>
              </Section>
            </>
          )}

          {/* GALLERY COMPONENT SECTION */}
          {isGallery && (
            <>
              <Section title="Content">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Section Title</Label>
                  <Input
                    value={props.sectionTitle || "Our products"}
                    onChange={(e) => updateProp("sectionTitle", e.target.value)}
                    placeholder="Our products"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Headline</Label>
                  <Input
                    value={props.headline || "Elegant Style"}
                    onChange={(e) => updateProp("headline", e.target.value)}
                    placeholder="Elegant Style"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <Textarea
                    value={props.description || ""}
                    onChange={(e) => updateProp("description", e.target.value)}
                    placeholder="Description..."
                    className="text-sm min-h-[60px] resize-none"
                  />
                </div>
              </Section>

              <Section title="Colors">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Title Color</Label>
                  <ColorInput 
                    value={props.titleColor || "#4f46e5"} 
                    onChange={(v) => updateProp("titleColor", v)} 
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Headline Color</Label>
                  <ColorInput 
                    value={props.headlineColor || "#111827"} 
                    onChange={(v) => updateProp("headlineColor", v)} 
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Description Color</Label>
                  <ColorInput 
                    value={props.descriptionColor || "#6b7280"} 
                    onChange={(v) => updateProp("descriptionColor", v)} 
                  />
                </div>
              </Section>

              <Section title={`Images (${(props.images || []).length})`}>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  {(props.images || []).map((img: { src: string; alt: string; href: string }, idx: number) => (
                    <div key={idx} className="p-2 bg-muted rounded-lg border border-border">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 space-y-1.5">
                          <Input
                            value={img.src}
                            onChange={(e) => {
                              const newImages = [...(props.images || [])];
                              newImages[idx] = { ...newImages[idx], src: e.target.value };
                              updateProp("images", newImages);
                            }}
                            placeholder="Image URL..."
                            className="text-xs h-7"
                          />
                          <Input
                            value={img.alt}
                            onChange={(e) => {
                              const newImages = [...(props.images || [])];
                              newImages[idx] = { ...newImages[idx], alt: e.target.value };
                              updateProp("images", newImages);
                            }}
                            placeholder="Alt text..."
                            className="text-xs h-7"
                          />
                          <Input
                            value={img.href}
                            onChange={(e) => {
                              const newImages = [...(props.images || [])];
                              newImages[idx] = { ...newImages[idx], href: e.target.value };
                              updateProp("images", newImages);
                            }}
                            placeholder="Link URL..."
                            className="text-xs h-7"
                          />
                        </div>
                        <button
                          onClick={() => {
                            const newImages = (props.images || []).filter((_: any, i: number) => i !== idx);
                            updateProp("images", newImages);
                          }}
                          className="p-1 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded transition-colors shrink-0"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    const currentImages = props.images || [];
                    updateProp("images", [...currentImages, { src: "", alt: "New Image", href: "#" }]);
                  }}
                  className="w-full mt-2 py-2 px-3 text-xs font-medium text-primary border border-dashed border-primary/30 rounded-lg hover:bg-primary/5 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Image
                </button>
              </Section>

              <Section title="Layout">
                <InputRow>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Columns</Label>
                    <SelectDropdown 
                      value={String(props.columns || 2)}
                      onChange={(v) => updateProp("columns", parseInt(v))}
                      options={[
                        { label: '2 Columns', value: '2' },
                        { label: '3 Columns', value: '3' },
                        { label: '4 Columns', value: '4' },
                      ]}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Image Height</Label>
                    <NumberInput 
                      value={props.imageHeight || 288} 
                      onChange={(v) => updateProp("imageHeight", parseInt(v) || 288)} 
                      unit="px"
                      mode="number"
                    />
                  </div>
                </InputRow>
                <InputRow>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Border Radius</Label>
                    <NumberInput 
                      value={props.borderRadius || "12px"} 
                      onChange={(v) => updateProp("borderRadius", v)} 
                      unit="px"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Gap</Label>
                    <NumberInput 
                      value={props.gap || "16px"} 
                      onChange={(v) => updateProp("gap", v)} 
                      unit="px"
                    />
                  </div>
                </InputRow>
              </Section>
            </>
          )}

          {/* MARKETING COMPONENT SECTION */}
          {isMarketing && (
            <>
              <Section title="Header">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Title</Label>
                  <Input
                    value={props.headerTitle || "Coffee Storage"}
                    onChange={(e) => updateProp("headerTitle", e.target.value)}
                    placeholder="Title..."
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <Textarea
                    value={props.headerDescription || ""}
                    onChange={(e) => updateProp("headerDescription", e.target.value)}
                    placeholder="Description..."
                    className="text-sm min-h-[50px] resize-none"
                  />
                </div>
                <InputRow>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Link Text</Label>
                    <Input
                      value={props.headerLinkText || "Shop now →"}
                      onChange={(e) => updateProp("headerLinkText", e.target.value)}
                      placeholder="Shop now →"
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Link URL</Label>
                    <Input
                      value={props.headerLinkUrl || "#"}
                      onChange={(e) => updateProp("headerLinkUrl", e.target.value)}
                      placeholder="URL..."
                      className="text-xs"
                    />
                  </div>
                </InputRow>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Header Image</Label>
                  <Input
                    value={props.headerImage || ""}
                    onChange={(e) => updateProp("headerImage", e.target.value)}
                    placeholder="Image URL..."
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Image Alt Text</Label>
                  <Input
                    value={props.headerImageAlt || ""}
                    onChange={(e) => updateProp("headerImageAlt", e.target.value)}
                    placeholder="Alt text..."
                    className="text-xs"
                  />
                </div>
              </Section>

              <Section title="Colors">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Header Background</Label>
                  <ColorInput 
                    value={props.headerBgColor || "#292524"} 
                    onChange={(v) => updateProp("headerBgColor", v)} 
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Container Background</Label>
                  <ColorInput 
                    value={props.containerBgColor || "#ffffff"} 
                    onChange={(v) => updateProp("containerBgColor", v)} 
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Border Radius</Label>
                  <NumberInput 
                    value={props.borderRadius || "8px"} 
                    onChange={(v) => updateProp("borderRadius", v)} 
                    unit="px"
                  />
                </div>
              </Section>

              <Section title={`Products (${(props.products || []).length})`}>
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  {(props.products || []).map((product: { imageUrl: string; altText: string; title: string; description: string; linkUrl: string }, idx: number) => (
                    <div key={idx} className="p-2 bg-muted rounded-lg border border-border">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 space-y-1.5">
                          <Input
                            value={product.title}
                            onChange={(e) => {
                              const newProducts = [...(props.products || [])];
                              newProducts[idx] = { ...newProducts[idx], title: e.target.value };
                              updateProp("products", newProducts);
                            }}
                            placeholder="Title..."
                            className="text-xs h-7 font-medium"
                          />
                          <Textarea
                            value={product.description}
                            onChange={(e) => {
                              const newProducts = [...(props.products || [])];
                              newProducts[idx] = { ...newProducts[idx], description: e.target.value };
                              updateProp("products", newProducts);
                            }}
                            placeholder="Description..."
                            className="text-xs min-h-[40px] resize-none"
                          />
                          <Input
                            value={product.imageUrl}
                            onChange={(e) => {
                              const newProducts = [...(props.products || [])];
                              newProducts[idx] = { ...newProducts[idx], imageUrl: e.target.value };
                              updateProp("products", newProducts);
                            }}
                            placeholder="Image URL..."
                            className="text-xs h-7"
                          />
                          <Input
                            value={product.linkUrl}
                            onChange={(e) => {
                              const newProducts = [...(props.products || [])];
                              newProducts[idx] = { ...newProducts[idx], linkUrl: e.target.value };
                              updateProp("products", newProducts);
                            }}
                            placeholder="Link URL..."
                            className="text-xs h-7"
                          />
                        </div>
                        <button
                          onClick={() => {
                            const newProducts = (props.products || []).filter((_: any, i: number) => i !== idx);
                            updateProp("products", newProducts);
                          }}
                          className="p-1 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded transition-colors shrink-0"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    const currentProducts = props.products || [];
                    updateProp("products", [...currentProducts, { 
                      imageUrl: "", 
                      altText: "New Product", 
                      title: "New Product", 
                      description: "Product description...",
                      linkUrl: "#" 
                    }]);
                  }}
                  className="w-full mt-2 py-2 px-3 text-xs font-medium text-primary border border-dashed border-primary/30 rounded-lg hover:bg-primary/5 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Product
                </button>
              </Section>
            </>
          )}

          {/* TESTIMONIAL COMPONENT SECTION */}
          {isTestimonial && (
            <>
              <Section title="Content">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Quote</Label>
                  <Textarea
                    value={getPropValue("quote")}
                    onChange={(e) => updateProp("quote", e.target.value)}
                    placeholder="Write a testimonial quote..."
                    className="text-sm min-h-[90px] resize-none border-border"
                  />
                </div>
                <InputRow>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Author</Label>
                    <Input
                      value={getPropValue("authorName")}
                      onChange={(e) => updateProp("authorName", e.target.value)}
                      placeholder="Jane Doe"
                      className="text-sm border-border"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Title</Label>
                    <Input
                      value={getPropValue("authorTitle")}
                      onChange={(e) => updateProp("authorTitle", e.target.value)}
                      placeholder="CEO"
                      className="text-sm border-border"
                    />
                  </div>
                </InputRow>
              </Section>

              <Section title="Image">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Source URL</Label>
                  <Input
                    value={getPropValue("imageSrc")}
                    onChange={(e) => updateProp("imageSrc", e.target.value)}
                    placeholder="https://..."
                    className="text-sm border-border"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Alt Text</Label>
                  <Input
                    value={getPropValue("imageAlt")}
                    onChange={(e) => updateProp("imageAlt", e.target.value)}
                    placeholder="Person name"
                    className="text-sm border-border"
                  />
                </div>
                <InputRow>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Width</Label>
                    <NumberInput
                      value={getPropValue("imageWidth") || 320}
                      onChange={(v) => updateProp("imageWidth", parseInt(v) || 320)}
                      unit="px"
                      mode="number"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Height</Label>
                    <NumberInput
                      value={getPropValue("imageHeight") || 320}
                      onChange={(v) => updateProp("imageHeight", parseInt(v) || 320)}
                      unit="px"
                      mode="number"
                    />
                  </div>
                </InputRow>
              </Section>

              <Section title="Colors">
                <InputRow>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Quote</Label>
                    <ColorInput
                      value={getPropValue("quoteColor") || "#374151"}
                      onChange={(v) => updateProp("quoteColor", v)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Author</Label>
                    <ColorInput
                      value={getPropValue("authorNameColor") || "#1f2937"}
                      onChange={(v) => updateProp("authorNameColor", v)}
                    />
                  </div>
                </InputRow>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Title</Label>
                  <ColorInput
                    value={getPropValue("authorTitleColor") || "#4b5563"}
                    onChange={(v) => updateProp("authorTitleColor", v)}
                  />
                </div>
              </Section>

              <Section title="Spacing">
                <InputRow>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Margin</Label>
                    <NumberInput
                      value={getStyleValue("margin", "12px")}
                      onChange={(v) => updateProp("style.margin", v)}
                      unit="px"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Padding</Label>
                    <NumberInput
                      value={getStyleValue("padding", "16px 0")}
                      onChange={(v) => updateProp("style.padding", v)}
                      unit="px"
                    />
                  </div>
                </InputRow>
              </Section>
            </>
          )}

          {/* TYPOGRAPHY SECTION */}
          {(isText || isButton || isLink) && (
            <Section title="Typography">
              <InputRow>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Size</Label>
                  <NumberInput 
                    value={getStyleValue("fontSize", "16px")} 
                    onChange={(v) => updateProp("style.fontSize", v)} 
                    unit="px"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Weight</Label>
                  <SelectDropdown 
                    value={getStyleValue("fontWeight", "400")}
                    onChange={(v) => updateProp("style.fontWeight", v)}
                    options={[
                      { label: 'Light', value: '300' },
                      { label: 'Regular', value: '400' },
                      { label: 'Medium', value: '500' },
                      { label: 'Semibold', value: '600' },
                      { label: 'Bold', value: '700' },
                    ]}
                  />
                </div>
              </InputRow>
              
              <InputRow>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Line Height</Label>
                  <NumberInput 
                    value={getStyleValue("lineHeight", "1.5")} 
                    onChange={(v) => updateProp("style.lineHeight", v)} 
                    unit=""
                    mode="number"
                    step={0.1}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Decoration</Label>
                  <SelectDropdown 
                    value={getStyleValue("textDecoration", "none")}
                    onChange={(v) => updateProp("style.textDecoration", v)}
                    options={[
                      { label: 'None', value: 'none' },
                      { label: 'Underline', value: 'underline' },
                      { label: 'Strikethrough', value: 'line-through' },
                    ]}
                  />
                </div>
              </InputRow>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Alignment</Label>
                <ToggleGroup
                  value={getStyleValue("textAlign", "left")}
                  onChange={(v) => updateProp("style.textAlign", v)}
                  options={[
                    { icon: <AlignLeft className="h-3.5 w-3.5 mx-auto" />, value: 'left' },
                    { icon: <AlignCenter className="h-3.5 w-3.5 mx-auto" />, value: 'center' },
                    { icon: <AlignRight className="h-3.5 w-3.5 mx-auto" />, value: 'right' },
                    { icon: <AlignJustify className="h-3.5 w-3.5 mx-auto" />, value: 'justify' },
                  ]}
                />
              </div>
            </Section>
          )}

          {/* COLORS SECTION */}
          {(isText || isButton || isLink || isContainer) && (
            <Section title="Colors">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Text Color</Label>
                <ColorInput 
                  value={getStyleValue("color", "#000000")} 
                  onChange={(v) => updateProp("style.color", v)} 
                />
              </div>
              
              {(isButton || isContainer) && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Background</Label>
                  <ColorInput 
                    value={getStyleValue("backgroundColor", "#ffffff")} 
                    onChange={(v) => updateProp("style.backgroundColor", v)} 
                  />
                </div>
              )}
            </Section>
          )}

          {/* SPACING SECTION */}
          {(isButton || isContainer || isImage) && (
            <Section title="Spacing">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Padding</Label>
                <NumberInput 
                  value={getStyleValue("padding", "0")} 
                  onChange={(v) => updateProp("style.padding", v)} 
                  unit="px"
                />
              </div>
              
              {isContainer && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Margin</Label>
                  <NumberInput 
                    value={getStyleValue("margin", "0")} 
                    onChange={(v) => updateProp("style.margin", v)} 
                    unit="px"
                  />
                </div>
              )}
            </Section>
          )}

          {/* SIZE SECTION */}
          {isContainer && (
            <Section title="Size">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Max Width</Label>
                <NumberInput 
                  value={getStyleValue("maxWidth", "600px")} 
                  onChange={(v) => updateProp("style.maxWidth", v)} 
                  unit="px"
                />
              </div>
            </Section>
          )}

          {/* BORDER SECTION */}
          {(isButton || isImage || isContainer) && (
            <Section title="Border">
              <InputRow>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Radius</Label>
                  <NumberInput 
                    value={getStyleValue("borderRadius", "0")} 
                    onChange={(v) => updateProp("style.borderRadius", v)} 
                    unit="px"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Width</Label>
                  <NumberInput 
                    value={getStyleValue("borderWidth", "0")} 
                    onChange={(v) => updateProp("style.borderWidth", v)} 
                    unit="px"
                  />
                </div>
              </InputRow>
              
              {/* Containers often use borderTop (e.g. Footer top separator). Provide structured controls. */}
              {isContainer && (
                <>
                  <InputRow>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Top Border Color</Label>
                      <ColorInput
                        value={(() => {
                          const borderTop = style.borderTop || "1px solid #e1e8ed";
                          const match = String(borderTop).match(/#[a-fA-F0-9]{3,6}/);
                          return match ? match[0] : "#e1e8ed";
                        })()}
                        onChange={(v) => {
                          const borderTop = style.borderTop || "1px solid #e1e8ed";
                          const hasColor = String(borderTop).match(/#[a-fA-F0-9]{3,6}/);
                          const next = hasColor
                            ? String(borderTop).replace(/#[a-fA-F0-9]{3,6}/, v)
                            : `${borderTop} ${v}`;
                          updateProp("style.borderTop", next);
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Top Border Thickness</Label>
                      <Select
                        value={(() => {
                          const borderTop = style.borderTop || "1px solid #e1e8ed";
                          const match = String(borderTop).match(/^(\d+)px/);
                          return match ? match[1] : "1";
                        })()}
                        onChange={(v) => {
                          const borderTop = style.borderTop || "1px solid #e1e8ed";
                          const next = String(borderTop).match(/^\d+px/)
                            ? String(borderTop).replace(/^\d+px/, `${v}px`)
                            : `${v}px ${borderTop}`;
                          updateProp("style.borderTop", next);
                        }}
                        options={[
                          { label: "0px", value: "0" },
                          { label: "1px", value: "1" },
                          { label: "2px", value: "2" },
                          { label: "3px", value: "3" },
                          { label: "4px", value: "4" },
                        ]}
                      />
                    </div>
                  </InputRow>
                </>
              )}
            </Section>
          )}

          {/* DIVIDER SPECIFIC */}
          {isDivider && (
            <Section title="Divider Style">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Color</Label>
                <ColorInput 
                  value={(() => {
                    // Extract color from borderTop (e.g., "1px solid #e1e8ed")
                    const borderTop = style.borderTop || "1px solid #e1e8ed";
                    const match = borderTop.match(/#[a-fA-F0-9]{3,6}/);
                    return match ? match[0] : "#e1e8ed";
                  })()}
                  onChange={(v) => {
                    // Update just the color in borderTop
                    const borderTop = style.borderTop || "1px solid #e1e8ed";
                    const newBorder = borderTop.replace(/#[a-fA-F0-9]{3,6}/, v);
                    updateProp("style.borderTop", newBorder);
                  }} 
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Thickness</Label>
                <SelectDropdown 
                  value={(() => {
                    const borderTop = style.borderTop || "1px solid #e1e8ed";
                    const match = borderTop.match(/^(\d+)px/);
                    return match ? match[1] : "1";
                  })()}
                  onChange={(v) => {
                    const borderTop = style.borderTop || "1px solid #e1e8ed";
                    const newBorder = borderTop.replace(/^\d+px/, `${v}px`);
                    updateProp("style.borderTop", newBorder);
                  }}
                  options={[
                    { label: 'Thin (1px)', value: '1' },
                    { label: 'Medium (2px)', value: '2' },
                    { label: 'Thick (3px)', value: '3' },
                    { label: 'Extra Thick (4px)', value: '4' },
                  ]}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Margin</Label>
                <NumberInput 
                  value={style.margin || "24px 0"} 
                  onChange={(v) => updateProp("style.margin", v)} 
                  unit=""
                  placeholder="24px 0"
                />
              </div>
            </Section>
          )}

        </div>
      </ScrollArea>
    </div>
  );
}

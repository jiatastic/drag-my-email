"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { EmailComponent, TailwindConfig, EmailGlobalStyles } from "@/types";
import { renderEmailTemplate } from "@/lib/email-renderer";
import { cn, ScrollArea } from "@react-email-builder/ui";
import { Mail, GripVertical, Trash2, Layers, Eye, Plus, Send } from "lucide-react";
import type { DeviceType } from "../EmailBuilder";
import { useEffect, useState, useRef, Fragment } from "react";

interface EmailCanvasProps {
  components: EmailComponent[];
  selectedComponentId: string | null;
  onSelectComponent: (id: string | null) => void;
  onDeleteComponent: (id: string) => void;
  onUpdateComponent?: (id: string, updates: Partial<EmailComponent>) => void;
  onAddToContainer?: (containerId: string, componentType: string) => void;
  deviceType: DeviceType;
  tailwindConfig?: TailwindConfig;
  globalStyles?: EmailGlobalStyles;
}

// Layout types that can contain children
const LAYOUT_TYPES = ["Container", "Section", "Row", "Column", "Footer", "SocialLinks"];

// Droppable zone between components
function DroppableBetween({ id }: { id: string }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`transition-all ${isOver ? "h-8 bg-primary/10 border-2 border-dashed border-primary rounded my-2" : "h-2"}`}
    />
  );
}

// Viewport widths for different devices
const deviceWidths = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
};

// Visual styles for different component types in edit mode
const editModeStyles: Record<string, React.CSSProperties> = {
  Container: { 
    maxWidth: "600px", 
    margin: "0 auto", 
    padding: "20px",
    backgroundColor: "#eeeeee",
  },
  Section: { 
    backgroundColor: "#ffffff",
    marginBottom: "0",
  },
  Row: { 
    display: "flex", 
    flexWrap: "wrap" as const,
  },
  Column: { 
    flex: 1,
    padding: "10px",
  },
  Heading: { 
    fontSize: "20px", 
    fontWeight: "bold",
    margin: "0 0 15px 0",
    color: "#333333",
  },
  Text: { 
    fontSize: "14px", 
    lineHeight: "1.6",
    margin: "0 0 14px 0",
    color: "#333333",
  },
  Button: { 
    display: "inline-block",
    padding: "12px 24px",
    backgroundColor: "#000000",
    color: "#ffffff",
    textDecoration: "none",
    borderRadius: "4px",
    fontSize: "14px",
    fontWeight: "500",
  },
  Link: { 
    color: "#2754C5",
    textDecoration: "underline",
  },
  Image: {
    maxWidth: "100%",
    height: "auto",
  },
  Hr: { 
    border: "none",
    borderTop: "1px solid #e1e8ed",
    margin: "24px 0",
  },
  Divider: { 
    border: "none",
    borderTop: "1px solid #e1e8ed",
    margin: "24px 0",
  },
  Preview: {
    display: "none",
  },
  // Footer components
  Footer: {
    backgroundColor: "#f6f9fc",
    padding: "32px 24px",
    textAlign: "center" as const,
    borderTop: "1px solid #e6ebf1",
  },
  FooterText: {
    fontSize: "12px",
    lineHeight: "1.5",
    color: "#8898aa",
    margin: "0",
    textAlign: "center" as const,
  },
  FooterLinks: {
    fontSize: "12px",
    lineHeight: "1.5",
    color: "#8898aa",
    margin: "0 0 16px 0",
    textAlign: "center" as const,
  },
  SocialLinks: {
    textAlign: "center" as const,
    margin: "16px 0",
  },
  Address: {
    fontSize: "12px",
    lineHeight: "1.6",
    color: "#8898aa",
    margin: "16px 0 0 0",
    textAlign: "center" as const,
    whiteSpace: "pre-line" as const,
  },
};

// Droppable container for layout components
function DroppableContainer({ 
  id, 
  children,
  isEmpty,
}: { 
  id: string; 
  children: React.ReactNode;
  isEmpty: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `container-${id}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "layout-drop-zone",
        isEmpty && "min-h-[60px]",
        isOver && "is-over"
      )}
    >
      {children}
      {isEmpty && (
        <div className="layout-empty">
          <Plus className="h-3 w-3 mr-1" />
          Drop components here
        </div>
      )}
    </div>
  );
}

// Parse Tailwind classes to inline styles
function parseTailwindClasses(className: string, baseStyle: React.CSSProperties = {}): React.CSSProperties {
  const style: React.CSSProperties = { ...baseStyle };
  
  // Background colors
  if (className.includes("bg-[#252f3d]")) style.backgroundColor = "#252f3d";
  if (className.includes("bg-white")) style.backgroundColor = "#ffffff";
  if (className.includes("bg-[#eee]")) style.backgroundColor = "#eeeeee";
  
  // Text alignment
  if (className.includes("text-center")) style.textAlign = "center";
  
  // Text colors
  if (className.includes("text-[#333]")) style.color = "#333333";
  if (className.includes("text-[#2754C5]")) style.color = "#2754C5";
  
  // Font sizes
  if (className.includes("text-[12px]")) style.fontSize = "12px";
  if (className.includes("text-[14px]")) style.fontSize = "14px";
  if (className.includes("text-[20px]")) style.fontSize = "20px";
  if (className.includes("text-[36px]")) style.fontSize = "36px";
  
  // Font weight
  if (className.includes("font-bold")) style.fontWeight = "bold";
  
  // Padding
  if (className.includes("py-5") || className.includes("py-[25px]")) {
    style.paddingTop = "25px";
    style.paddingBottom = "25px";
  }
  if (className.includes("px-5") || className.includes("px-[35px]")) {
    style.paddingLeft = "35px";
    style.paddingRight = "35px";
  }
  if (className.includes("p-5")) style.padding = "20px";
  
  // Margins
  if (className.includes("mx-auto")) {
    style.marginLeft = "auto";
    style.marginRight = "auto";
  }
  if (className.includes("my-[24px]")) {
    style.marginTop = "24px";
    style.marginBottom = "24px";
  }
  if (className.includes("my-[10px]")) {
    style.marginTop = "10px";
    style.marginBottom = "10px";
  }
  if (className.includes("mt-6")) style.marginTop = "24px";
  if (className.includes("mb-[14px]")) style.marginBottom = "14px";
  if (className.includes("mb-[15px]")) style.marginBottom = "15px";
  if (className.includes("m-0")) style.margin = "0";
  
  // Line height
  if (className.includes("leading-[24px]")) style.lineHeight = "24px";
  
  // Text decoration
  if (className.includes("underline")) style.textDecoration = "underline";
  
  return style;
}

// Text types that support inline editing
const TEXT_EDITABLE_TYPES = ["Text", "Heading", "Button", "Link"];

// Draggable email component for Edit mode
function DraggableEmailItem({
  component,
  isSelected,
  selectedComponentId,
  onSelect,
  onDelete,
  onSelectChild,
  onDeleteChild,
  onUpdateComponent,
  depth = 0,
}: {
  component: EmailComponent;
  isSelected: boolean;
  selectedComponentId?: string | null;
  onSelect: () => void;
  onDelete: () => void;
  onSelectChild?: (id: string) => void;
  onDeleteChild?: (id: string) => void;
  onUpdateComponent?: (id: string, updates: Partial<EmailComponent>) => void;
  depth?: number;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(component.props?.children || "");
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
  
  // Check if this component supports inline editing
  const isTextEditable = TEXT_EDITABLE_TYPES.includes(component.type);
  
  // Start editing on double-click or click when already selected
  const handleTextClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSelected && isTextEditable && !isEditing) {
      setEditText(component.props?.children || "");
      setIsEditing(true);
    } else {
      onSelect();
    }
  };
  
  // Save text changes
  const saveText = () => {
    if (editText !== component.props?.children) {
      onUpdateComponent?.(component.id, {
        props: { ...component.props, children: editText },
      });
    }
    setIsEditing(false);
  };
  
  // Handle keyboard events in edit mode
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setEditText(component.props?.children || "");
      setIsEditing(false);
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      saveText();
    }
  };
  
  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Select all text
      if ('select' in inputRef.current) {
        inputRef.current.select();
      }
    }
  }, [isEditing]);
  
  // Exit edit mode if deselected
  useEffect(() => {
    if (!isSelected && isEditing) {
      saveText();
    }
  }, [isSelected]);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: component.id });

  const dragStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Compute styles fresh from component props (not memoized to ensure real-time updates)
  const propsStyle = component.props?.style || {};
  const baseStyle = editModeStyles[component.type] || {};
  // Order: base defaults < Tailwind classes < inline props (inline props ALWAYS win)
  const componentStyle: React.CSSProperties = {
    ...baseStyle,
    ...parseTailwindClasses(component.className || "", {}),
    ...propsStyle, // Inline props have highest priority - MUST come last
  };

  const isLayoutType = LAYOUT_TYPES.includes(component.type);
  const hasChildren = component.children && component.children.length > 0;

  // Get content to display
  const getContent = () => {
    if (component.type === "Image") {
      return (
        <img
          src={component.props?.src || ""}
          alt={component.props?.alt || ""}
          width={component.props?.width}
          height={component.props?.height}
          style={{ ...componentStyle, display: "block" }}
        />
      );
    }
    if (component.type === "Hr" || component.type === "Divider") {
      return <hr style={componentStyle} />;
    }
    if (component.type === "CodeBlock") {
      const code = component.props?.code || "// Your code here";
      const theme = component.props?.theme || "dracula";
      const showLineNumbers = component.props?.showLineNumbers ?? true;
      
      // Theme colors
      const themes: Record<string, { bg: string; text: string; keyword: string; string: string; comment: string; lineNum: string }> = {
        dracula: { bg: "#282a36", text: "#f8f8f2", keyword: "#ff79c6", string: "#50fa7b", comment: "#6272a4", lineNum: "#6272a4" },
        github: { bg: "#f6f8fa", text: "#24292e", keyword: "#d73a49", string: "#032f62", comment: "#6a737d", lineNum: "#959da5" },
        monokai: { bg: "#272822", text: "#f8f8f2", keyword: "#f92672", string: "#a6e22e", comment: "#75715e", lineNum: "#75715e" },
        nord: { bg: "#2e3440", text: "#d8dee9", keyword: "#81a1c1", string: "#a3be8c", comment: "#616e88", lineNum: "#4c566a" },
      };
      const t = themes[theme] ?? themes.dracula!;
      
      const lines = code.split("\n");
      return (
        <div style={{ ...componentStyle, backgroundColor: t.bg, borderRadius: "8px", padding: "16px", overflow: "auto" }}>
          <pre style={{ margin: 0, fontFamily: "'Fira Code', 'Monaco', monospace", fontSize: "13px", lineHeight: "1.5" }}>
            {lines.map((line: string, i: number) => (
              <div key={i} style={{ display: "flex" }}>
                {showLineNumbers && (
                  <span style={{ color: t.lineNum, width: "30px", textAlign: "right", paddingRight: "16px", userSelect: "none" }}>
                    {i + 1}
                  </span>
                )}
                <code style={{ color: t.text }}>{line || " "}</code>
              </div>
            ))}
          </pre>
        </div>
      );
    }
    if (component.type === "CodeInline") {
      return (
        <code style={componentStyle}>
          {component.props?.children || "code"}
        </code>
      );
    }
    if (component.type === "Markdown") {
      // Simple markdown preview (basic rendering)
      const content = component.props?.children || "";
      const containerStyles = component.props?.markdownContainerStyles || {};
      
      // Very basic markdown parsing for preview
      const parseMarkdown = (text: string) => {
        const lines = text.split("\n");
        return lines.map((line, i) => {
          // Headers
          if (line.startsWith("# ")) return <h1 key={i} style={{ fontSize: "24px", fontWeight: "bold", margin: "16px 0 8px" }}>{line.slice(2)}</h1>;
          if (line.startsWith("## ")) return <h2 key={i} style={{ fontSize: "20px", fontWeight: "bold", margin: "14px 0 6px" }}>{line.slice(3)}</h2>;
          if (line.startsWith("### ")) return <h3 key={i} style={{ fontSize: "16px", fontWeight: "bold", margin: "12px 0 4px" }}>{line.slice(4)}</h3>;
          // List items
          if (line.startsWith("- ") || line.startsWith("* ")) {
            return <li key={i} style={{ marginLeft: "20px", listStyle: "disc" }}>{line.slice(2)}</li>;
          }
          // Empty lines
          if (!line.trim()) return <br key={i} />;
          // Regular paragraphs with bold/italic
          let parsed: React.ReactNode = line;
          // Bold
          if (line.includes("**")) {
            const parts = line.split(/\*\*(.+?)\*\*/g);
            parsed = parts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part);
          }
          // Italic
          if (line.includes("*") && !line.includes("**")) {
            const parts = line.split(/\*(.+?)\*/g);
            parsed = parts.map((part, j) => j % 2 === 1 ? <em key={j}>{part}</em> : part);
          }
          return <p key={i} style={{ margin: "8px 0" }}>{parsed}</p>;
        });
      };
      
      return (
        <div style={{ ...componentStyle, ...containerStyles }}>
          {parseMarkdown(content)}
        </div>
      );
    }
    if (component.type === "SocialIcons") {
      const platforms = component.props?.platforms || [];
      const iconSize = component.props?.iconSize || 32;
      const iconShape = component.props?.iconShape || "circle";
      const iconStyle = component.props?.iconStyle || "colored";
      const spacing = component.props?.spacing || 12;
      
      // Import SOCIAL_PLATFORMS at the top of the file
      const SOCIAL_PLATFORMS_MAP: Record<string, { name: string; color: string; icon: string }> = {
        facebook: { name: "Facebook", color: "#1877F2", icon: "https://cdn.simpleicons.org/facebook/white" },
        twitter: { name: "Twitter / X", color: "#000000", icon: "https://cdn.simpleicons.org/x/white" },
        instagram: { name: "Instagram", color: "#E4405F", icon: "https://cdn.simpleicons.org/instagram/white" },
        linkedin: { name: "LinkedIn", color: "#0A66C2", icon: "https://cdn.simpleicons.org/linkedin/white" },
        youtube: { name: "YouTube", color: "#FF0000", icon: "https://cdn.simpleicons.org/youtube/white" },
        tiktok: { name: "TikTok", color: "#000000", icon: "https://cdn.simpleicons.org/tiktok/white" },
        github: { name: "GitHub", color: "#181717", icon: "https://cdn.simpleicons.org/github/white" },
        discord: { name: "Discord", color: "#5865F2", icon: "https://cdn.simpleicons.org/discord/white" },
        twitch: { name: "Twitch", color: "#9146FF", icon: "https://cdn.simpleicons.org/twitch/white" },
        reddit: { name: "Reddit", color: "#FF4500", icon: "https://cdn.simpleicons.org/reddit/white" },
        pinterest: { name: "Pinterest", color: "#BD081C", icon: "https://cdn.simpleicons.org/pinterest/white" },
        whatsapp: { name: "WhatsApp", color: "#25D366", icon: "https://cdn.simpleicons.org/whatsapp/white" },
        telegram: { name: "Telegram", color: "#26A5E4", icon: "https://cdn.simpleicons.org/telegram/white" },
        threads: { name: "Threads", color: "#000000", icon: "https://cdn.simpleicons.org/threads/white" },
        mastodon: { name: "Mastodon", color: "#6364FF", icon: "https://cdn.simpleicons.org/mastodon/white" },
        bluesky: { name: "Bluesky", color: "#0085FF", icon: "https://cdn.simpleicons.org/bluesky/white" },
      };
      
      const getBorderRadius = () => {
        if (iconShape === "circle") return "50%";
        if (iconShape === "rounded") return "6px";
        return "0";
      };
      
      const getIconBg = (platformKey: string) => {
        const platform = SOCIAL_PLATFORMS_MAP[platformKey];
        if (!platform) return "#888";
        if (iconStyle === "colored") return platform.color;
        if (iconStyle === "dark") return "#1a1a1a";
        return "#f0f0f0";
      };
      
      return (
        <div style={{ ...componentStyle, display: "flex", justifyContent: componentStyle.textAlign === "center" ? "center" : componentStyle.textAlign === "right" ? "flex-end" : "flex-start", gap: `${spacing}px`, flexWrap: "wrap" }}>
          {platforms.map((p: { platform: string; url: string }, i: number) => {
            const platformData = SOCIAL_PLATFORMS_MAP[p.platform];
            if (!platformData) return null;
            return (
              <a
                key={i}
                href={p.url || "#"}
                onClick={(e) => e.preventDefault()}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: iconSize,
                  height: iconSize,
                  backgroundColor: getIconBg(p.platform),
                  borderRadius: getBorderRadius(),
                  textDecoration: "none",
                }}
                title={platformData.name}
              >
                <img
                  src={platformData.icon}
                  alt={platformData.name}
                  width={iconSize * 0.55}
                  height={iconSize * 0.55}
                  style={{ display: "block" }}
                />
              </a>
            );
          })}
        </div>
      );
    }
    if (component.type === "Button") {
      const buttonText = component.props?.children || "Button";
      if (isEditing) {
        return (
          <div style={{ ...componentStyle, display: "inline-block" }}>
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={saveText}
              onKeyDown={handleKeyDown}
              className="bg-transparent border-none outline-none text-center"
              style={{
                fontFamily: "inherit",
                fontSize: "inherit",
                fontWeight: "inherit",
                color: "inherit",
                width: `${Math.max(editText.length, 5)}ch`,
              }}
            />
          </div>
        );
      }
      return (
        <a 
          href="#" 
          onClick={(e) => e.preventDefault()} 
          style={{ ...componentStyle, cursor: isSelected ? "text" : "pointer" }}
        >
          {buttonText}
        </a>
      );
    }
    if (component.type === "Link") {
      const linkText = component.props?.children || "Link";
      if (isEditing) {
        return (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={saveText}
            onKeyDown={handleKeyDown}
            className="bg-transparent border-none outline-none"
            style={{
              ...componentStyle,
              cursor: "text",
              width: `${Math.max(editText.length, 5)}ch`,
            }}
          />
        );
      }
      return (
        <a 
          href="#" 
          onClick={(e) => e.preventDefault()} 
          style={{ ...componentStyle, cursor: isSelected ? "text" : "pointer" }}
        >
          {linkText}
        </a>
      );
    }
    if (component.type === "Preview") {
      return null;
    }
    
    // For layout types, render as droppable container with children
    if (isLayoutType) {
      const childIds = hasChildren ? component.children!.map(c => c.id) : [];
      return (
        <div style={componentStyle}>
          <DroppableContainer id={component.id} isEmpty={!hasChildren}>
            {hasChildren && (
              <SortableContext items={childIds} strategy={verticalListSortingStrategy}>
                {component.children!.map((child) => (
                  <DraggableEmailItem
                    key={child.id}
                    component={child}
                    isSelected={selectedComponentId === child.id}
                    selectedComponentId={selectedComponentId}
                    onSelect={() => onSelectChild?.(child.id)}
                    onDelete={() => onDeleteChild?.(child.id)}
                    onSelectChild={onSelectChild}
                    onDeleteChild={onDeleteChild}
                    onUpdateComponent={onUpdateComponent}
                    depth={depth + 1}
                  />
                ))}
              </SortableContext>
            )}
          </DroppableContainer>
        </div>
      );
    }

    // Text content with inline editing
    if (component.props?.children || isTextEditable) {
      const textContent = component.props?.children || "Enter text...";
      
      // Show editable textarea when in edit mode
      if (isEditing && isTextEditable) {
        return (
          <div style={{ ...componentStyle, position: "relative" }}>
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={saveText}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent border-none outline-none resize-none"
              style={{
                ...componentStyle,
                minHeight: component.type === "Heading" ? "40px" : "24px",
                padding: 0,
                margin: 0,
                fontFamily: "inherit",
                fontSize: "inherit",
                fontWeight: "inherit",
                lineHeight: "inherit",
                color: "inherit",
                textAlign: componentStyle.textAlign as any || "left",
              }}
              rows={Math.max(1, (editText || "").split("\n").length)}
            />
          </div>
        );
      }
      
      // Regular display with edit cursor hint when selected
      if (component.type === "Heading") {
        return (
          <h1 
            style={{ 
              ...componentStyle, 
              cursor: isSelected ? "text" : "pointer",
            }}
          >
            {textContent}
          </h1>
        );
      }
      return (
        <p 
          style={{ 
            ...componentStyle, 
            cursor: isSelected ? "text" : "pointer",
          }}
        >
          {textContent}
        </p>
      );
    }

    return <div style={componentStyle}>{component.type}</div>;
  };

  // Skip rendering Preview component visually
  if (component.type === "Preview") {
    return null;
  }

  // Show toolbar only when this specific component is hovered or selected
  const showToolbar = isSelected || isHovered;

  return (
    <div
      ref={setNodeRef}
      style={dragStyle}
      className={cn(
        "relative email-component",
        isDragging && "opacity-50 z-50",
        isSelected && "selected"
      )}
      onMouseEnter={(e) => {
        e.stopPropagation();
        setIsHovered(true);
      }}
      onMouseLeave={(e) => {
        e.stopPropagation();
        setIsHovered(false);
      }}
    >
      {/* Selection/hover overlay */}
      <div
        onClick={handleTextClick}
        className={cn(
          "relative cursor-pointer transition-all",
          isSelected && "ring-2 ring-blue-500 ring-offset-1",
          isHovered && !isSelected && "ring-2 ring-blue-300 ring-offset-1",
          isEditing && "ring-2 ring-primary ring-offset-1"
        )}
      >
        {/* Content */}
        {getContent()}

        {/* Floating toolbar on hover/select */}
        <div
          className={cn(
            "absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-blue-500 text-white rounded px-2 py-1 text-xs font-medium transition-opacity z-20 whitespace-nowrap shadow-lg pointer-events-auto",
            showToolbar ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        >
          {/* Drag handle */}
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-0.5 hover:bg-blue-600 rounded drag-handle"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-3 w-3" />
          </button>
          <span>{component.type}</span>
          {/* Delete button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-0.5 hover:bg-red-500 rounded ml-1"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}


export function EmailCanvas({
  components,
  selectedComponentId,
  onSelectComponent,
  onDeleteComponent,
  onUpdateComponent,
  onAddToContainer,
  deviceType,
  tailwindConfig,
  globalStyles,
}: EmailCanvasProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: "canvas",
  });

  const [html, setHtml] = useState<string>("");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerWidth = deviceWidths[deviceType];
  const [activeTab, setActiveTab] = useState<"preview" | "edit">("edit");

  // Render email template for Preview mode
  useEffect(() => {
    async function render() {
      if (components.length === 0) {
        setHtml("");
        return;
      }
      
      try {
        const rendered = await renderEmailTemplate(components, {
          useTailwind: true,
          tailwindConfig,
          globalStyles,
        });
        setHtml(rendered);
      } catch (error) {
        console.error("Error rendering preview:", error);
        setHtml("<p>Error rendering preview</p>");
      }
    }
    
    render();
  }, [components, tailwindConfig, globalStyles]);

  // Update iframe height to match content
  useEffect(() => {
    if (iframeRef.current && html) {
      const iframe = iframeRef.current;
      const updateHeight = () => {
        try {
          const doc = iframe.contentDocument || iframe.contentWindow?.document;
          if (doc?.body) {
            const height = doc.body.scrollHeight;
            iframe.style.height = `${Math.max(height, 400)}px`;
          }
        } catch (e) {
          // Cross-origin restrictions may prevent this
        }
      };
      
      iframe.onload = updateHeight;
      setTimeout(updateHeight, 100);
    }
  }, [html]);

  // Empty state component
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full text-gray-400 px-8 py-16">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
        <Mail className="h-7 w-7 text-gray-300" />
      </div>
      <p className="text-sm font-medium text-gray-600 mb-1">Start building your email</p>
      <p className="text-xs text-center max-w-xs text-gray-400">
        Select a template from the right panel or drag components here
      </p>
      {isOver && (
        <div className="mt-4 px-3 py-1.5 bg-primary/10 text-primary rounded-md text-xs font-medium">
          Drop here
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Tab Header */}
      <div className="border-b border-gray-200 bg-white px-4 flex-shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab("edit")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors",
              activeTab === "edit"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            <Layers className="h-4 w-4" />
            Edit
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors",
              activeTab === "preview"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            <Eye className="h-4 w-4" />
            Preview
          </button>
          
          {/* Send Button */}
          <button
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            <Send className="h-4 w-4" />
            Send
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <ScrollArea className="flex-1">
        <div
          ref={setNodeRef}
          className={cn(
            "h-full py-6 px-4 transition-colors duration-200 flex items-start justify-center drop-zone",
            isOver && "drop-zone-active"
          )}
          onClick={() => onSelectComponent(null)}
        >
          {/* Email Container Mockup */}
          <div 
            className="w-full transition-all duration-300 flex flex-col"
            style={{ maxWidth: containerWidth }}
          >
            {/* Email Header Bar */}
            <div className="bg-gray-100 rounded-t-lg border border-b-0 border-gray-200 p-2.5 flex items-center gap-2.5 flex-shrink-0">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="flex items-center gap-2 px-3 py-0.5 bg-white rounded-md border border-gray-200">
                  {activeTab === "edit" ? (
                    <Layers className="h-3 w-3 text-blue-500" />
                  ) : (
                    <Eye className="h-3 w-3 text-gray-400" />
                  )}
                  <span className="text-xs text-gray-500 truncate">
                    {activeTab === "edit" ? "Click to select • Drag to reorder" : deviceType === "desktop" ? "Desktop" : deviceType === "tablet" ? "768px" : "375px"}
                  </span>
                </div>
              </div>
              <div className="w-16" />
            </div>

            {/* Email Body */}
            <div 
              className={cn(
                "border border-t-0 border-gray-200 rounded-b-lg shadow-sm flex-1 overflow-hidden",
                isOver && "ring-2 ring-primary/50 ring-inset"
              )}
              style={{ 
                minHeight: "calc(100vh - 220px)",
                backgroundColor: globalStyles?.bodyBackgroundColor || "#f4f4f5",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {components.length === 0 ? (
                <EmptyState />
              ) : activeTab === "preview" ? (
                // Preview mode: iframe with perfect Tailwind rendering
                <iframe
                  ref={iframeRef}
                  srcDoc={html}
                  className="w-full border-0 min-h-[400px]"
                  style={{ margin: "0 auto", display: "block" }}
                  title="Email Preview"
                  sandbox="allow-same-origin"
                />
              ) : (
                // Edit mode: Direct React rendering with drag-and-drop
                // Apply global styles as a wrapper
                <div 
                  style={{ 
                    backgroundColor: globalStyles?.bodyBackgroundColor || "#f4f4f5",
                    fontFamily: globalStyles?.fontFamily || "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                    fontSize: globalStyles?.fontSize || "16px",
                    color: globalStyles?.textColor || "#1a1a1a",
                    minHeight: "100%",
                  }}
                >
                  <div 
                    style={{ 
                      maxWidth: globalStyles?.maxWidth || "600px",
                      margin: "0 auto",
                      backgroundColor: globalStyles?.containerBackgroundColor || "#ffffff",
                      padding: globalStyles?.containerPadding || "20px",
                    }}
                  >
                    <SortableContext items={components.map(c => c.id)} strategy={verticalListSortingStrategy}>
                      {components.length === 0 ? null : (
                        <>
                          {components.map((component, index) => (
                            <Fragment key={component.id}>
                              <DroppableBetween id={`between-${index}`} />
                              <DraggableEmailItem
                                component={component}
                                isSelected={selectedComponentId === component.id}
                                selectedComponentId={selectedComponentId}
                                onSelect={() => onSelectComponent(component.id)}
                                onDelete={() => onDeleteComponent(component.id)}
                                onSelectChild={onSelectComponent}
                                onDeleteChild={onDeleteComponent}
                                onUpdateComponent={onUpdateComponent}
                              />
                            </Fragment>
                          ))}
                          <DroppableBetween id={`between-${components.length}`} />
                        </>
                      )}
                    </SortableContext>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

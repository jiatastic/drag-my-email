"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { EmailComponent, TailwindConfig, EmailGlobalStyles } from "@/types";
import { renderEmailTemplate } from "@/lib/email-renderer";
import { getLogoUrl } from "@/lib/utils";
import { SOCIAL_ICON_ASSETS, getGoogleFaviconUrl } from "@/lib/social-icons";
import {
  cn,
  ScrollArea,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Input,
  Button,
  Label,
} from "@react-email-builder/ui";
import { Mail, GripVertical, Trash2, Layers, Eye, Plus, Send, Loader2, CheckCircle2, AlertCircle, LogIn } from "lucide-react";
import { LayersPanel } from "./LayersPanel";
import type { DeviceType } from "../EmailBuilder";
import { useEffect, useState, useRef, Fragment, useMemo, useCallback } from "react";
import { useConvexAuth, useQuery, useMutation } from "convex/react";
import { LoginDialog } from "../auth/LoginDialog";
import { api } from "../../../convex/_generated/api";

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
  mobile: "375px",
};

// Visual styles for different component types in edit mode
const editModeStyles: Record<string, React.CSSProperties> = {
  Container: { 
    maxWidth: "600px", 
    margin: "0 auto", 
    padding: "20px",
    backgroundColor: "transparent",
  },
  Section: { 
    backgroundColor: "transparent",
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
    color: "inherit",
  },
  Text: { 
    fontSize: "14px", 
    lineHeight: "1.6",
    margin: "0 0 14px 0",
    color: "inherit",
  },
  Button: { 
    display: "inline-block",
    padding: "12px 24px",
    backgroundColor: "#2563eb",
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
    borderTop: "1px solid rgba(148, 163, 184, 0.35)",
    margin: "24px 0",
  },
  Divider: { 
    border: "none",
    borderTop: "1px solid rgba(148, 163, 184, 0.35)",
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
  componentType,
}: { 
  id: string; 
  children: React.ReactNode;
  isEmpty: boolean;
  componentType?: string;
}) {
  const { setNodeRef, isOver, active } = useDroppable({
    id: `container-${id}`,
  });

  // Check if something is being dragged
  const isDragging = !!active;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "layout-drop-zone relative",
        isEmpty && "min-h-[120px]",
        isOver && "is-over ring-2 ring-blue-400 ring-inset",
        isDragging && "border-2 border-dashed border-blue-300 bg-blue-50/30"
      )}
      style={{ 
        // Ensure the drop zone is always interactive and fills container
        pointerEvents: "auto",
        width: "100%",
        minHeight: isEmpty ? "120px" : "60px",
        transition: "all 0.15s ease",
      }}
    >
      {children}
      {/* Empty state - large drop zone */}
      {isEmpty && (
        <div 
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center text-xs transition-all rounded-lg m-1",
            isOver ? "text-blue-600 bg-blue-100 border-2 border-blue-400" : "text-muted-foreground border-2 border-dashed border-border",
            isDragging && "text-blue-500 bg-blue-50 border-blue-300"
          )}
        >
          <Plus className={cn("h-6 w-6 mb-1.5", isOver && "text-blue-600 scale-110")} />
          <span className="font-medium text-sm">
            {isOver ? "Release to drop here" : `Drop components into ${componentType || "container"}`}
          </span>
          <span className="text-[10px] mt-1 text-muted-foreground">
            Drag from the left panel
          </span>
        </div>
      )}
      {/* Non-empty state - show add more zone at bottom when dragging */}
      {!isEmpty && isDragging && (
        <div 
          className={cn(
            "mt-2 py-3 flex items-center justify-center text-xs transition-all rounded-lg border-2 border-dashed",
            isOver ? "text-blue-600 bg-blue-100 border-blue-400" : "text-muted-foreground border-border bg-muted"
          )}
        >
          <Plus className={cn("h-4 w-4 mr-1.5", isOver && "text-blue-600")} />
          <span className="font-medium">
            {isOver ? "Drop here" : "Add more components"}
          </span>
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
  if (className.includes("text-left")) style.textAlign = "left";
  if (className.includes("text-right")) style.textAlign = "right";
  if (className.includes("text-justify")) style.textAlign = "justify";
  
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

// Default Gallery content to mirror react.email template
const DEFAULT_GALLERY_CONTENT = {
  sectionTitle: "Our products",
  headline: "Elegant Style",
  description:
    "We spent two years in development to bring you the next generation of our award-winning home brew grinder. From the finest pour-overs to the coarsest cold brews, your coffee will never be the same again.",
  titleColor: "#4f46e5",
  headlineColor: "#111827",
  descriptionColor: "#6b7280",
  images: [
    {
      src: "https://react.email/static/stagg-eletric-kettle.jpg",
      alt: "Stagg Electric Kettle",
      href: "#",
    },
    {
      src: "https://react.email/static/ode-grinder.jpg",
      alt: "Ode Grinder",
      href: "#",
    },
    {
      src: "https://react.email/static/atmos-vacuum-canister.jpg",
      alt: "Atmos Vacuum Canister",
      href: "#",
    },
    {
      src: "https://react.email/static/clyde-electric-kettle.jpg",
      alt: "Clyde Electric Kettle",
      href: "#",
    },
  ],
  columns: 2,
  imageHeight: 288,
  borderRadius: "12px",
  gap: "16px",
  style: {
    padding: "16px 0",
  },
};

// Default Marketing content to mirror react.email template
const DEFAULT_MARKETING_CONTENT = {
  headerBgColor: "#292524",
  headerTitle: "Coffee Storage",
  headerDescription: "Keep your coffee fresher for longer with innovative technology.",
  headerLinkText: "Shop now →",
  headerLinkUrl: "#",
  headerImage: "https://react.email/static/coffee-bean-storage.jpg",
  headerImageAlt: "Coffee Bean Storage",
  products: [
    {
      imageUrl: "https://react.email/static/atmos-vacuum-canister.jpg",
      altText: "Auto-Sealing Vacuum Canister",
      title: "Auto-Sealing Vacuum Canister",
      description: "A container that automatically creates an airtight seal with a button press.",
      linkUrl: "#",
    },
    {
      imageUrl: "https://react.email/static/vacuum-canister-clear-glass-bundle.jpg",
      altText: "3-Pack Vacuum Containers",
      title: "3-Pack Vacuum Containers",
      description: "Keep your coffee fresher for longer with this set of high-performance vacuum containers.",
      linkUrl: "#",
    },
  ],
  containerBgColor: "#ffffff",
  borderRadius: "8px",
};

// Default Testimonial content to mirror react.email template
const DEFAULT_TESTIMONIAL_CONTENT = {
  imageSrc: "https://react.email/static/steve-jobs.jpg",
  imageAlt: "Steve Jobs",
  imageWidth: 320,
  imageHeight: 320,
  quote:
    "Design is not just what it looks like and feels like. Design is how it works. The people who are crazy enough to think they can change the world are the ones who do. Innovation distinguishes between a leader and a follower.",
  authorName: "Steve Jobs",
  authorTitle: "Co-founder of Apple",
  quoteColor: "#374151",
  authorNameColor: "#1f2937",
  authorTitleColor: "#4b5563",
};

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
  isInRow = false,
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
  isInRow?: boolean;
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

  // When in a Row, columns should be flex items that fill their allocated space
  const columnInRowStyle: React.CSSProperties = isInRow && component.type === "Column" ? {
    flex: 1, // Equal flex for all columns
    minWidth: 0, // Allow flex items to shrink below content size
    boxSizing: "border-box" as const,
  } : {};

  const dragStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...columnInRowStyle,
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
      const imageStyle = { ...componentStyle, display: "block" };
      const textAlign = componentStyle.textAlign || "center";
      
      // Apply alignment by wrapping in a container with text-align
      return (
        <div style={{ textAlign: textAlign as any, width: "100%" }}>
          <img
            src={component.props?.src || ""}
            alt={component.props?.alt || ""}
            width={component.props?.width}
            height={component.props?.height}
            style={imageStyle}
          />
        </div>
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
      
      // Social platforms with embedded SVG icons (base64 encoded for reliability)
      const SOCIAL_PLATFORMS_MAP: Record<string, { name: string; color: string; icon: string }> = {
        facebook: { name: "Facebook", color: "#1877F2", icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z'/%3E%3C/svg%3E" },
        twitter: { name: "Twitter / X", color: "#000000", icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z'/%3E%3C/svg%3E" },
        instagram: { name: "Instagram", color: "#E4405F", icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077'/%3E%3C/svg%3E" },
        linkedin: { name: "LinkedIn", color: "#0A66C2", icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z'/%3E%3C/svg%3E" },
        youtube: { name: "YouTube", color: "#FF0000", icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z'/%3E%3C/svg%3E" },
        tiktok: { name: "TikTok", color: "#000000", icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z'/%3E%3C/svg%3E" },
        github: { name: "GitHub", color: "#181717", icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12'/%3E%3C/svg%3E" },
        discord: { name: "Discord", color: "#5865F2", icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z'/%3E%3C/svg%3E" },
        twitch: { name: "Twitch", color: "#9146FF", icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z'/%3E%3C/svg%3E" },
        reddit: { name: "Reddit", color: "#FF4500", icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M12 0C5.373 0 0 5.373 0 12c0 6.628 5.373 12 12 12s12-5.372 12-12c0-6.627-5.373-12-12-12zm6.066 13.066c.132.323.198.676.198 1.035 0 2.708-3.138 4.899-7.007 4.899-3.869 0-7.007-2.191-7.007-4.899 0-.359.066-.712.198-1.035A1.783 1.783 0 0 1 3.5 11.5a1.775 1.775 0 0 1 2.98-1.31 8.676 8.676 0 0 1 4.68-1.476l.888-4.168a.38.38 0 0 1 .153-.222.39.39 0 0 1 .268-.055l2.961.62a1.214 1.214 0 1 1-.125.598l-2.651-.555-.792 3.732a8.63 8.63 0 0 1 4.598 1.476 1.773 1.773 0 0 1 2.98 1.31 1.783 1.783 0 0 1-.948 1.566zm-9.463.732a1.203 1.203 0 1 0 0-2.406 1.203 1.203 0 0 0 0 2.406zm5.398 3.158c-.155.154-.646.456-1.973.456-1.328 0-1.818-.302-1.973-.456a.269.269 0 0 0-.38.381c.21.209.878.582 2.353.582s2.144-.373 2.353-.582a.269.269 0 0 0-.38-.381zm-.486-1.949a1.203 1.203 0 1 0 0-2.406 1.203 1.203 0 0 0 0 2.406z'/%3E%3C/svg%3E" },
        pinterest: { name: "Pinterest", color: "#BD081C", icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z'/%3E%3C/svg%3E" },
        whatsapp: { name: "WhatsApp", color: "#25D366", icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z'/%3E%3C/svg%3E" },
        telegram: { name: "Telegram", color: "#26A5E4", icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z'/%3E%3C/svg%3E" },
        threads: { name: "Threads", color: "#000000", icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.182.408-2.256 1.332-3.023.869-.72 2.082-1.137 3.514-1.208 1.075-.053 2.083.03 3.006.249-.055-.988-.396-1.756-.987-2.221-.645-.507-1.6-.771-2.84-.785h-.033c-.995.007-1.862.205-2.573.59-.558.3-.975.685-1.242 1.138l-1.72-1.065c.396-.67.959-1.231 1.673-1.668 1.012-.62 2.236-.946 3.64-.97h.04c1.694.02 3.076.456 4.105 1.295 1.003.818 1.586 1.996 1.735 3.502.464.108.91.243 1.337.408 1.373.53 2.48 1.396 3.199 2.503.863 1.332 1.123 2.964.732 4.59-.533 2.22-1.958 3.986-4.121 5.106C17.123 23.467 14.835 24 12.186 24zM10.075 13.9c-1.048.053-1.862.333-2.362.81-.427.408-.623.893-.584 1.442.055.757.445 1.333 1.16 1.713.613.327 1.4.464 2.22.422 1.139-.062 2.05-.473 2.633-1.2.458-.57.752-1.363.858-2.322-.776-.18-1.626-.26-2.526-.212-.474.023-.936.073-1.399.147z'/%3E%3C/svg%3E" },
        mastodon: { name: "Mastodon", color: "#6364FF", icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M23.268 5.313c-.35-2.578-2.617-4.61-5.304-5.004C17.51.242 15.792 0 11.813 0h-.03c-3.98 0-4.835.242-5.288.309C3.882.692 1.496 2.518.917 5.127.64 6.412.61 7.837.661 9.143c.074 1.874.088 3.745.26 5.611.118 1.24.325 2.47.62 3.68.55 2.237 2.777 4.098 4.96 4.857 2.336.792 4.849.923 7.256.38.265-.061.527-.132.786-.213.585-.184 1.27-.39 1.774-.753a.057.057 0 0 0 .023-.043v-1.809a.052.052 0 0 0-.02-.041.053.053 0 0 0-.046-.01 20.282 20.282 0 0 1-4.709.545c-2.73 0-3.463-1.284-3.674-1.818a5.593 5.593 0 0 1-.319-1.433.053.053 0 0 1 .066-.054c1.517.363 3.072.546 4.632.546.376 0 .75 0 1.125-.01 1.57-.044 3.224-.124 4.768-.422.038-.008.077-.015.11-.024 2.435-.464 4.753-1.92 4.989-5.604.008-.145.03-1.52.03-1.67.002-.512.167-3.63-.024-5.545zm-3.748 9.195h-2.561V8.29c0-1.309-.55-1.976-1.67-1.976-1.23 0-1.846.79-1.846 2.35v3.403h-2.546V8.663c0-1.56-.617-2.35-1.848-2.35-1.112 0-1.668.668-1.67 1.977v6.218H4.822V8.102c0-1.31.337-2.35 1.011-3.12.696-.77 1.608-1.164 2.74-1.164 1.311 0 2.302.5 2.962 1.498l.638 1.06.638-1.06c.66-.999 1.65-1.498 2.96-1.498 1.13 0 2.043.395 2.74 1.164.675.77 1.012 1.81 1.012 3.12z'/%3E%3C/svg%3E" },
        bluesky: { name: "Bluesky", color: "#0085FF", icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8Z'/%3E%3C/svg%3E" },
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
        if (iconStyle === "light") return "#f0f0f0";
        // official mode: don't paint a brand background (the icon itself is branded)
        return "transparent";
      };
      
      return (
        <div style={{ ...componentStyle, display: "flex", justifyContent: componentStyle.textAlign === "center" ? "center" : componentStyle.textAlign === "right" ? "flex-end" : "flex-start", gap: `${spacing}px`, flexWrap: "wrap" }}>
          {platforms.map((p: { platform: string; url: string }, i: number) => {
            const platformData = SOCIAL_PLATFORMS_MAP[p.platform];
            if (!platformData) return null;

            const glyphBlack = platformData.icon.replace("fill='white'", "fill='black'");
            const glyphSrc = iconStyle === "light" ? glyphBlack : platformData.icon;
            // Use Google Favicon API for official icons - most reliable way to get brand favicons
            const officialDomain = SOCIAL_ICON_ASSETS[p.platform as keyof typeof SOCIAL_ICON_ASSETS]?.officialDomain;
            const officialSrc = officialDomain ? getGoogleFaviconUrl(officialDomain, iconSize) : null;
            const src = iconStyle === "official" ? (officialSrc || glyphSrc) : glyphSrc;
            const innerSize = iconStyle === "official" ? iconSize : iconSize * 0.55;

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
                  border: iconStyle === "official" ? "1px solid #e5e7eb" : undefined,
                }}
                title={platformData.name}
              >
                <img
                  src={src}
                  alt={platformData.name}
                  width={innerSize}
                  height={innerSize}
                  onError={(e) => {
                    // Fallback to embedded glyph if the official URL fails.
                    (e.currentTarget as HTMLImageElement).src = glyphSrc;
                  }}
                  style={{
                    display: "block",
                    borderRadius: iconStyle === "official" ? getBorderRadius() : undefined,
                    objectFit: iconStyle === "official" ? ("contain" as any) : undefined,
                  }}
                />
              </a>
            );
          })}
        </div>
      );
    }
    if (component.type === "Marketing") {
      const props = component.props || {};
      const marketing = {
        ...DEFAULT_MARKETING_CONTENT,
        ...props,
        products:
          props.products && props.products.length > 0
            ? props.products.map((p: any, idx: number) =>
                p?.imageUrl ? p : DEFAULT_MARKETING_CONTENT.products[idx % DEFAULT_MARKETING_CONTENT.products.length]
              )
            : DEFAULT_MARKETING_CONTENT.products,
      };

      return (
        <div
          style={{
            ...componentStyle,
            backgroundColor: marketing.containerBgColor,
            borderRadius: marketing.borderRadius,
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              padding: "24px",
              backgroundColor: marketing.headerBgColor,
            }}
          >
            <div style={{ flex: 1, paddingLeft: "12px" }}>
              <h1
                style={{
                  margin: 0,
                  color: "#fff",
                  fontSize: "28px",
                  fontWeight: 700,
                  marginBottom: "10px",
                }}
              >
                {marketing.headerTitle}
              </h1>
              <p
                style={{
                  margin: 0,
                  color: "rgba(255,255,255,0.6)",
                  fontSize: "14px",
                  lineHeight: "20px",
                }}
              >
                {marketing.headerDescription}
              </p>
              <a
                href={marketing.headerLinkUrl}
                onClick={(e) => e.preventDefault()}
                style={{
                  color: "rgba(255,255,255,0.8)",
                  fontSize: "14px",
                  fontWeight: 600,
                  marginTop: "12px",
                  display: "block",
                  textDecoration: "none",
                  lineHeight: "20px",
                }}
              >
                {marketing.headerLinkText}
              </a>
            </div>
            <div style={{ width: "42%", height: "250px" }}>
              <img
                src={marketing.headerImage}
                alt={marketing.headerImageAlt}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center",
                  borderRadius: "4px",
                  marginRight: "-6px",
                }}
              />
            </div>
          </div>

          {/* Products */}
          <div
            style={{
              display: "flex",
              gap: "24px",
              padding: "12px",
              marginBottom: "24px",
              flexWrap: "wrap",
            }}
          >
            {marketing.products.map((product: any) => (
              <div
                key={product.title}
                style={{
                  flex: 1,
                  minWidth: "180px",
                  maxWidth: "180px",
                  margin: "0 auto",
                }}
              >
                <img
                  src={product.imageUrl}
                  alt={product.altText}
                  style={{
                    width: "100%",
                    borderRadius: "4px",
                    marginBottom: "18px",
                  }}
                />
                <h2
                  style={{
                    margin: 0,
                    marginBottom: "8px",
                    fontSize: "14px",
                    lineHeight: "20px",
                    fontWeight: 700,
                  }}
                >
                  {product.title}
                </h2>
                <p
                  style={{
                    margin: 0,
                    fontSize: "12px",
                    lineHeight: "20px",
                    color: "#6b7280",
                    paddingRight: "12px",
                  }}
                >
                  {product.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      );
    }
    if (component.type === "Testimonial") {
      const props = component.props || {};
      const testimonial = {
        ...DEFAULT_TESTIMONIAL_CONTENT,
        ...props,
      };

      return (
        <div
          style={{
            ...componentStyle,
            display: "flex",
            flexWrap: "wrap",
            gap: "24px",
            padding: (componentStyle.padding as any) ?? "16px 0",
            margin: (componentStyle.margin as any) ?? "12px",
          }}
        >
          <div
            style={{
              marginRight: "24px",
              marginBottom: "24px",
              width: "256px",
              maxWidth: "100%",
              borderRadius: "24px",
              overflow: "hidden",
            }}
          >
            <img
              src={testimonial.imageSrc}
              alt={testimonial.imageAlt}
              style={{
                width: "100%",
                height: `${testimonial.imageHeight || 320}px`,
                objectFit: "cover",
                objectPosition: "center",
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: "260px", paddingRight: "24px" }}>
            <p
              style={{
                margin: 0,
                marginBottom: "24px",
                fontSize: "16px",
                lineHeight: 1.625,
                fontWeight: 300,
                color: testimonial.quoteColor || "#374151",
                textAlign: "left",
              }}
            >
              {testimonial.quote}
            </p>
            <p
              style={{
                margin: 0,
                marginBottom: "4px",
                fontSize: "16px",
                fontWeight: 600,
                color: testimonial.authorNameColor || "#1f2937",
                textAlign: "left",
              }}
            >
              {testimonial.authorName}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                color: testimonial.authorTitleColor || "#4b5563",
                textAlign: "left",
              }}
            >
              {testimonial.authorTitle}
            </p>
          </div>
        </div>
      );
    }
    if (component.type === "Gallery") {
      const props = component.props || {};
      const gallery = {
        ...DEFAULT_GALLERY_CONTENT,
        ...props,
        images:
          props.images && props.images.length > 0
            ? props.images
            : DEFAULT_GALLERY_CONTENT.images,
        style: {
          ...DEFAULT_GALLERY_CONTENT.style,
          ...(props.style || {}),
        },
      };

      const columns = Math.min(
        4,
        Math.max(1, Number(gallery.columns) || DEFAULT_GALLERY_CONTENT.columns)
      );
      const gap = gallery.gap || DEFAULT_GALLERY_CONTENT.gap;
      const padding = gallery.style?.padding || DEFAULT_GALLERY_CONTENT.style.padding;
      const borderRadius = gallery.borderRadius || DEFAULT_GALLERY_CONTENT.borderRadius;
      const imageHeight =
        typeof gallery.imageHeight === "number"
          ? gallery.imageHeight
          : parseInt(String(gallery.imageHeight || DEFAULT_GALLERY_CONTENT.imageHeight), 10) ||
            DEFAULT_GALLERY_CONTENT.imageHeight;
      const columnWidth = `${Math.floor(100 / columns)}%`;
      const numericGap = parseInt(String(gap), 10);
      const halfGap = `${(Number.isFinite(numericGap) ? numericGap : 16) / 2}px`;
      const resolvedImages = (gallery.images || [])
        .map((img: { src?: string; alt?: string; href?: string }, idx: number) => {
          if (img?.src && img.src.trim() !== "") return img;
          // Fallback to default images to avoid empty src warnings
          return DEFAULT_GALLERY_CONTENT.images[idx % DEFAULT_GALLERY_CONTENT.images.length];
        })
        .filter((img: { src?: string } | undefined) => img && img.src);

      const rows: typeof resolvedImages[] = [];
      for (let i = 0; i < resolvedImages.length; i += columns) {
        rows.push(resolvedImages.slice(i, i + columns));
      }

      return (
        <div
          style={{
            ...componentStyle,
            padding,
          }}
        >
          <div style={{ marginTop: "42px" }}>
            <p
              style={{
                margin: 0,
                fontWeight: 600,
                fontSize: "16px",
                lineHeight: "24px",
                color: gallery.titleColor,
              }}
            >
              {gallery.sectionTitle}
            </p>
            <p
              style={{
                margin: "8px 0 0 0",
                fontWeight: 600,
                fontSize: "24px",
                lineHeight: "32px",
                color: gallery.headlineColor,
              }}
            >
              {gallery.headline}
            </p>
            <p
              style={{
                marginTop: "8px",
                fontSize: "16px",
                lineHeight: "24px",
                color: gallery.descriptionColor,
              }}
            >
              {gallery.description}
            </p>
          </div>

          <div
            style={{ marginTop: "16px" }}
          >
            {rows.map((row, rowIdx) => (
              <div key={rowIdx} style={{ display: "flex", marginTop: rowIdx === 0 ? "0" : "16px" }}>
                {row.map((img: { src: string; alt: string; href?: string }, colIdx: number) => (
                  <div
                    key={colIdx}
                    style={{
                      width: columnWidth,
                      paddingLeft: colIdx === 0 ? "0" : halfGap,
                      paddingRight: colIdx === row.length - 1 ? "0" : halfGap,
                    }}
                  >
                    <a
                      href={img.href || "#"}
                      onClick={(e) => e.preventDefault()}
                      style={{ display: "block" }}
                    >
                      <img
                        src={img.src}
                        alt={img.alt || ""}
                        style={{
                          width: "100%",
                          height: `${imageHeight}px`,
                          objectFit: "cover",
                          borderRadius,
                          display: "block",
                        }}
                      />
                    </a>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      );
    }
    if (component.type === "Button") {
      const buttonText = component.props?.children || "Button";
      const wrapperAlign = (componentStyle.textAlign as any) || "left";
      const innerStyle: React.CSSProperties = { ...componentStyle };
      // Alignment must be applied on a wrapper (email-style), not on the button itself.
      delete (innerStyle as any).textAlign;
      if (!innerStyle.display) innerStyle.display = "inline-block";
      if (isEditing) {
        return (
          <div style={{ width: "100%", textAlign: wrapperAlign }}>
            <div style={innerStyle}>
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
          </div>
        );
      }
      return (
        <div style={{ width: "100%", textAlign: wrapperAlign }}>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            style={{ ...innerStyle, cursor: isSelected ? "text" : "pointer" }}
          >
            {buttonText}
          </a>
        </div>
      );
    }
    if (component.type === "Link") {
      const linkText = component.props?.children || "Link";
      const wrapperAlign = (componentStyle.textAlign as any) || "left";
      const innerStyle: React.CSSProperties = { ...componentStyle };
      delete (innerStyle as any).textAlign;
      if (isEditing) {
        return (
          <div style={{ width: "100%", textAlign: wrapperAlign }}>
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={saveText}
              onKeyDown={handleKeyDown}
              className="bg-transparent border-none outline-none"
              style={{
                ...innerStyle,
                cursor: "text",
                width: `${Math.max(editText.length, 5)}ch`,
              }}
            />
          </div>
        );
      }
      return (
        <div style={{ width: "100%", textAlign: wrapperAlign }}>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            style={{ ...innerStyle, cursor: isSelected ? "text" : "pointer" }}
          >
            {linkText}
          </a>
        </div>
      );
    }
    if (component.type === "Preview") {
      return null;
    }
    if (component.type === "Stats") {
      const stats = component.props?.stats || [];
      
      const handleStatUpdate = (index: number, field: 'value' | 'title' | 'description', value: string) => {
        const newStats = [...stats];
        newStats[index] = { ...newStats[index], [field]: value };
        onUpdateComponent?.(component.id, { props: { ...component.props, stats: newStats } });
      };
      
      return (
        <div style={{ ...componentStyle, display: "flex", gap: "24px", padding: componentStyle.padding || "24px 0" }}>
          {stats.map((stat: { value: string; title: string; description?: string }, i: number) => (
            <div key={i} style={{ flex: 1 }}>
              <div 
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleStatUpdate(i, 'value', e.currentTarget.textContent || '')}
                onClick={(e) => e.stopPropagation()}
                style={{ 
                  fontSize: "18px", 
                  fontWeight: "bold", 
                  color: "#111827", 
                  marginBottom: "4px",
                  outline: "none",
                  cursor: "text",
                  minHeight: "24px",
                  borderRadius: "4px",
                  padding: "2px 4px",
                  margin: "-2px -4px",
                }}
                className="hover:bg-blue-50 focus:bg-blue-50 focus:ring-2 focus:ring-blue-200"
              >
                {stat.value}
              </div>
              <div 
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleStatUpdate(i, 'title', e.currentTarget.textContent || '')}
                onClick={(e) => e.stopPropagation()}
                style={{ 
                  fontSize: "12px", 
                  color: "#6b7280",
                  outline: "none",
                  cursor: "text",
                  minHeight: "18px",
                  borderRadius: "4px",
                  padding: "2px 4px",
                  margin: "-2px -4px",
                }}
                className="hover:bg-blue-50 focus:bg-blue-50 focus:ring-2 focus:ring-blue-200"
              >
                {stat.title}
              </div>
              <div 
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleStatUpdate(i, 'description', e.currentTarget.textContent || '')}
                onClick={(e) => e.stopPropagation()}
                style={{ 
                  fontSize: "12px", 
                  color: "#9ca3af", 
                  marginTop: "4px",
                  outline: "none",
                  cursor: "text",
                  minHeight: "18px",
                  borderRadius: "4px",
                  padding: "2px 4px",
                  margin: "-2px -4px",
                }}
                className="hover:bg-blue-50 focus:bg-blue-50 focus:ring-2 focus:ring-blue-200"
              >
                {stat.description || "Add description..."}
              </div>
            </div>
          ))}
        </div>
      );
    }
    if (component.type === "NumberedList") {
      // Default items to ensure content is always present
      const DEFAULT_NUMBERED_LIST_ITEMS = [
        { title: "Lightning Fast Performance", description: "Experience blazing fast speeds with our optimized infrastructure. Your workflows will be 10x more efficient." },
        { title: "Enterprise-Grade Security", description: "Bank-level encryption and SOC 2 compliance keep your data safe. We take security seriously." },
        { title: "24/7 Priority Support", description: "Our dedicated support team is available around the clock to help you succeed. Average response time under 2 hours." },
      ];
      
      // Use provided items or fallback to defaults, ensure each item has title/description
      const rawItems = component.props?.items || [];
      const items = (rawItems.length > 0 ? rawItems : DEFAULT_NUMBERED_LIST_ITEMS).map(
        (item: { title?: string; description?: string }, idx: number) => ({
          title: item?.title && item.title.trim() !== "" ? item.title : DEFAULT_NUMBERED_LIST_ITEMS[idx % DEFAULT_NUMBERED_LIST_ITEMS.length]?.title || "Feature",
          description: item?.description && item.description.trim() !== "" ? item.description : DEFAULT_NUMBERED_LIST_ITEMS[idx % DEFAULT_NUMBERED_LIST_ITEMS.length]?.description || "Description of this feature.",
        })
      );
      
      const numberBgColor = component.props?.numberBgColor || "#4f46e5";
      
      const handleItemUpdate = (index: number, field: 'title' | 'description', value: string) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        onUpdateComponent?.(component.id, { props: { ...component.props, items: newItems } });
      };
      
      return (
        <div style={{ ...componentStyle }}>
          {items.map((item: { title: string; description: string }, i: number) => (
            <div key={i} style={{ display: "flex", gap: "16px", marginBottom: "24px", alignItems: "flex-start" }}>
              <div 
                style={{ 
                  width: "24px", 
                  height: "24px", 
                  borderRadius: "50%", 
                  backgroundColor: numberBgColor, 
                  color: "white", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  fontSize: "12px", 
                  fontWeight: "600",
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div 
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => handleItemUpdate(i, 'title', e.currentTarget.textContent || '')}
                  onClick={(e) => e.stopPropagation()}
                  style={{ 
                    fontSize: "18px", 
                    fontWeight: "600", 
                    color: "#111827", 
                    marginBottom: "8px",
                    outline: "none",
                    cursor: "text",
                    minHeight: "24px",
                    borderRadius: "4px",
                    padding: "2px 4px",
                    margin: "-2px -4px",
                  }}
                  className="hover:bg-blue-50 focus:bg-blue-50 focus:ring-2 focus:ring-blue-200"
                >
                  {item.title}
                </div>
                <div 
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => handleItemUpdate(i, 'description', e.currentTarget.textContent || '')}
                  onClick={(e) => e.stopPropagation()}
                  style={{ 
                    fontSize: "14px", 
                    color: "#6b7280", 
                    lineHeight: "1.5",
                    outline: "none",
                    cursor: "text",
                    minHeight: "20px",
                    borderRadius: "4px",
                    padding: "2px 4px",
                    margin: "-2px -4px",
                  }}
                  className="hover:bg-blue-50 focus:bg-blue-50 focus:ring-2 focus:ring-blue-200"
                >
                  {item.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    // For layout types, render as droppable container with children
    if (isLayoutType) {
      const childIds = hasChildren ? component.children!.map(c => c.id) : [];
      
      // Row component should render columns side by side
      const isRow = component.type === "Row";
      const isColumn = component.type === "Column";
      
      const rowStyle: React.CSSProperties = isRow ? {
        display: "flex",
        flexDirection: "row",
        width: "100%",
        alignItems: "stretch", // Make columns stretch to same height
      } : {};
      
      // Column should take full width of its container and apply padding
      const columnContainerStyle: React.CSSProperties = isColumn ? {
        ...componentStyle,
        width: "100%",
        height: "100%",
        boxSizing: "border-box" as const,
      } : componentStyle;
      
      return (
        <div style={columnContainerStyle}>
          <DroppableContainer id={component.id} isEmpty={!hasChildren} componentType={component.type}>
            {hasChildren && (
              <SortableContext 
                items={childIds} 
                strategy={isRow ? horizontalListSortingStrategy : verticalListSortingStrategy}
              >
                <div style={rowStyle}>
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
                      isInRow={isRow}
                    />
                  ))}
                </div>
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

  // Check if this is a column inside a row
  const isColumnInRow = isInRow && component.type === "Column";
  
  // Wrapper style - columns in rows need special handling
  const wrapperStyle: React.CSSProperties = {
    ...dragStyle,
    ...(isColumnInRow ? { 
      height: "100%",
      display: "flex",
      flexDirection: "column",
    } : {}),
  };

  return (
    <div
      ref={setNodeRef}
      style={wrapperStyle}
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
          isColumnInRow && "flex-1 w-full",
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
  
  // Auth state for send email feature
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();

  const [html, setHtml] = useState<string>("");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerWidth = deviceWidths[deviceType];
  const [activeTab, setActiveTab] = useState<"preview" | "edit" | "layers">("edit");
  const isPreview = activeTab === "preview";
  const deviceMaxWidth = deviceType === "desktop" ? (globalStyles?.maxWidth || "600px") : deviceWidths[deviceType];
  
  // Send email dialog state
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [emailSubject, setEmailSubject] = useState("Your Email from drag.email");
  const [sendStatus, setSendStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [sendError, setSendError] = useState<string>("");
  const currentUser = useQuery(api.users.current);
  const consumeRateLimit = useMutation(api.rateLimits.consume);
  
  // Login dialog state (for unauthenticated users)
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  // Always send test emails to the signed-in user's email to prevent abuse
  useEffect(() => {
    if (isAuthenticated && currentUser?.email) {
      setRecipientEmail(currentUser.email);
      return;
    }
    if (!isAuthenticated) {
      setRecipientEmail("");
    }
  }, [isAuthenticated, currentUser?.email]);

  // Helper function to normalize and absolutize image URLs for preview/render
  const normalizeImageSrc = (src: string) => {
    if (!src) return src;
    // Skip data/blob/cid
    const lower = src.toLowerCase();
    if (lower.startsWith("data:") || lower.startsWith("blob:") || lower.startsWith("cid:")) {
      return src;
    }
    // Common case: "/logo" without extension -> prefer svg if exists
    if (src === "/logo") {
      return getLogoUrl("/logo.svg");
    }
    // Already absolute http(s)
    if (lower.startsWith("http://") || lower.startsWith("https://")) {
      return src;
    }
    // Fallback: convert relative to absolute using app origin
    return getLogoUrl(src);
  };

  const convertImageUrlsToAbsolute = (comps: EmailComponent[]): EmailComponent[] => {
    return comps.map(comp => {
      const updatedComp = { ...comp };
      
      // Convert Image component src URLs
      if (comp.type === "Image" && comp.props?.src) {
        updatedComp.props = {
          ...comp.props,
          src: normalizeImageSrc(comp.props.src),
        };
      }
      
      // Recursively process children
      if (comp.children && comp.children.length > 0) {
        updatedComp.children = convertImageUrlsToAbsolute(comp.children);
      }
      
      return updatedComp;
    });
  };

  // Send email function
  const handleSendEmail = async () => {
    if (!recipientEmail || !recipientEmail.includes("@")) {
      setSendError("Please enter a valid email address");
      return;
    }

    setSendStatus("sending");
    setSendError("");

    try {
      // Check rate limit before sending
      await consumeRateLimit({ action: "email_send" });

      // Convert relative image URLs to absolute URLs for email sending
      const componentsWithAbsoluteUrls = convertImageUrlsToAbsolute(components);
      
      // Render the email HTML
      const emailHtml = await renderEmailTemplate(componentsWithAbsoluteUrls, {
        useTailwind: true,
        tailwindConfig,
        globalStyles,
      });

      // Send email via API
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: recipientEmail,
          from: "mail@drag.email",
          subject: emailSubject,
          html: emailHtml,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send email");
      }

      setSendStatus("success");
      // Reset after 2 seconds
      setTimeout(() => {
        setSendDialogOpen(false);
        setSendStatus("idle");
        setRecipientEmail("");
      }, 2000);
    } catch (error) {
      setSendStatus("error");
      setSendError(error instanceof Error ? error.message : "Failed to send email");
    }
  };

  // Memoize serialized values for stable comparison to prevent infinite loops
  const configStr = useMemo(() => JSON.stringify(tailwindConfig), [tailwindConfig]);
  const globalStylesStr = useMemo(() => JSON.stringify(globalStyles), [globalStyles]);
  const componentsStr = useMemo(() => JSON.stringify(components), [components]);
  
  // Memoize component IDs array for SortableContext to prevent infinite loops
  const componentIds = useMemo(() => components.map(c => c.id), [componentsStr]);
  
  // Stable callback functions to prevent infinite loops
  const handleSelectComponent = useCallback((id: string) => {
    onSelectComponent(id);
  }, [onSelectComponent]);
  
  const handleDeleteComponent = useCallback((id: string) => {
    onDeleteComponent(id);
  }, [onDeleteComponent]);

  // Render email template for Preview mode
  useEffect(() => {
    let cancelled = false;

    async function render() {
      // Parse back from strings to get actual values
      const currentComponents = JSON.parse(componentsStr) as EmailComponent[];
      // Ensure image src are absolute so iframe preview can load them
      const componentsWithAbsoluteUrls = convertImageUrlsToAbsolute(currentComponents);
      const currentTailwindConfig = configStr ? (JSON.parse(configStr) as TailwindConfig) : undefined;
      const currentGlobalStyles = globalStylesStr ? (JSON.parse(globalStylesStr) as EmailGlobalStyles) : undefined;
      // For preview, shrink the container to the selected device width so mobile
      // previews actually render at the expected viewport size.
      const previewGlobalStyles =
        deviceType === "desktop"
          ? currentGlobalStyles
          : {
              ...(currentGlobalStyles || {}),
              maxWidth: deviceWidths[deviceType],
            };

      if (componentsWithAbsoluteUrls.length === 0) {
        if (!cancelled) setHtml("");
        return;
      }
      
      try {
        const rendered = await renderEmailTemplate(componentsWithAbsoluteUrls, {
          useTailwind: true,
          tailwindConfig: currentTailwindConfig,
          globalStyles: previewGlobalStyles,
        });
        if (!cancelled) {
          setHtml(rendered);
        }
      } catch (error) {
        console.error("Error rendering preview:", error);
        if (!cancelled) {
          setHtml("<p>Error rendering preview</p>");
        }
      }
    }
    
    render();

    return () => {
      cancelled = true;
    };
  }, [componentsStr, configStr, globalStylesStr, deviceType]);

  // Update iframe height to match content
  useEffect(() => {
    if (iframeRef.current && html) {
      const iframe = iframeRef.current;
      const updateHeight = () => {
        try {
          const doc = iframe.contentDocument || iframe.contentWindow?.document;
          if (doc?.body) {
            const bodyHeight = doc.body.scrollHeight || 0;
            const htmlHeight = doc.documentElement?.scrollHeight || 0;
            const measuredHeights = [bodyHeight, htmlHeight].filter(
              (value) => Number.isFinite(value) && value > 0
            );
            const height = measuredHeights.length > 0 ? Math.max(...measuredHeights) : 400;
            iframe.style.height = `${height}px`;
          }
        } catch (e) {
          // Cross-origin restrictions may prevent this
        }
      };
      
      iframe.onload = updateHeight;
      setTimeout(updateHeight, 120);

      // Keep iframe height in sync if content changes after load (images/fonts)
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      let resizeObserver: ResizeObserver | null = null;
      if (doc?.body && "ResizeObserver" in window) {
        resizeObserver = new ResizeObserver(() => updateHeight());
        resizeObserver.observe(doc.body);
      }

      return () => {
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
      };
    }
  }, [html]);

  // When switching to preview after edit-first, ensure iframe height recalculates
  useEffect(() => {
    if (activeTab !== "preview" || !iframeRef.current || !html) return;

    const iframe = iframeRef.current;
    const updateHeight = () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc?.body) {
          const bodyHeight = doc.body.scrollHeight || 0;
          const htmlHeight = doc.documentElement?.scrollHeight || 0;
          const measuredHeights = [bodyHeight, htmlHeight].filter(
            (value) => Number.isFinite(value) && value > 0
          );
          const height = measuredHeights.length > 0 ? Math.max(...measuredHeights) : 400;
          iframe.style.height = `${height}px`;
        }
      } catch (e) {
        // ignore cross-origin issues
      }
    };

    updateHeight();
    iframe.onload = updateHeight;
    const timer = setTimeout(updateHeight, 120);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    let resizeObserver: ResizeObserver | null = null;
    if (doc?.body && "ResizeObserver" in window) {
      resizeObserver = new ResizeObserver(() => updateHeight());
      resizeObserver.observe(doc.body);
    }

    return () => {
      clearTimeout(timer);
      if (resizeObserver) resizeObserver.disconnect();
      iframe.onload = null;
    };
  }, [activeTab, html]);

  // Empty state component
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center text-muted-foreground px-8 py-16 gap-3">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
        <Mail className="h-7 w-7 text-muted-foreground/70" />
      </div>
      <p className="text-sm font-medium text-foreground mb-1">Start building your email</p>
      <p className="text-xs text-center max-w-xs text-muted-foreground">
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
    <div className="flex flex-col bg-muted/20 h-full">
      {/* Tab Header */}
      <div className="border-b border-border bg-background px-4 flex-shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab("edit")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors",
              activeTab === "edit"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
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
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Eye className="h-4 w-4" />
            Preview
          </button>
          <button
            onClick={() => setActiveTab("layers")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors",
              activeTab === "layers"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Layers className="h-4 w-4" />
            Layers
          </button>
          
          {/* Send Button */}
          <button
            onClick={() => setSendDialogOpen(true)}
            disabled={components.length === 0}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
            Send
          </button>
        </div>
      </div>

      {/* Send Email Dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Send Test Email
            </DialogTitle>
            <DialogDescription>
              Send a test email to preview how your email will look in a real inbox.
            </DialogDescription>
          </DialogHeader>
          
          {/* Show sign-in prompt if not authenticated */}
          {!isAuthenticated && !authLoading ? (
            <div className="py-6">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <LogIn className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Sign in required</h3>
                  <p className="text-sm text-muted-foreground max-w-[280px]">
                    Please sign in to send test emails. This helps us prevent spam and abuse.
                  </p>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setSendDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => {
                    setSendDialogOpen(false);
                    setLoginDialogOpen(true);
                  }}>
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                </div>
              </div>
            </div>
          ) : authLoading ? (
            <div className="py-8 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="recipient-email">Recipient Email</Label>
              <Input
                id="recipient-email"
                type="email"
                placeholder="you@example.com"
                value={recipientEmail}
                readOnly
                disabled={
                  sendStatus === "sending" ||
                  sendStatus === "success" ||
                  !currentUser?.email
                }
              />
              <p className="text-xs text-muted-foreground">
                Test emails are sent to your account email ({currentUser?.email || "loading..."}).
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email-subject">Subject</Label>
              <Input
                id="email-subject"
                type="text"
                placeholder="Email subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                disabled={sendStatus === "sending" || sendStatus === "success"}
              />
            </div>
            
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">From:</span> mail@drag.email
            </div>
            
            {sendError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {sendError}
              </div>
            )}
            
            {sendStatus === "success" && (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-md">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                Email sent successfully!
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSendDialogOpen(false);
                setSendStatus("idle");
                setSendError("");
              }}
              disabled={sendStatus === "sending"}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendEmail}
              disabled={sendStatus === "sending" || sendStatus === "success" || !recipientEmail}
            >
              {sendStatus === "sending" ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : sendStatus === "success" ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Sent!
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Login Dialog for unauthenticated users */}
      <LoginDialog 
        open={loginDialogOpen} 
        onOpenChange={setLoginDialogOpen}
        onSuccess={() => {
          // After successful login, re-open the send dialog
          setSendDialogOpen(true);
        }}
      />

      {/* Canvas Area */}
      <div className="flex-1">
        <div
          ref={setNodeRef}
          className={cn(
            "py-6 px-4 transition-colors duration-200 flex items-start justify-center drop-zone h-full",
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
            <div className="bg-muted rounded-t-lg border border-b-0 border-border p-2.5 flex items-center gap-2.5 flex-shrink-0">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="flex items-center gap-2 px-3 py-0.5 bg-background rounded-md border border-border">
                  {activeTab === "edit" ? (
                    <Layers className="h-3 w-3 text-blue-500" />
                  ) : activeTab === "layers" ? (
                    <Layers className="h-3 w-3 text-blue-500" />
                  ) : (
                    <Eye className="h-3 w-3 text-muted-foreground" />
                  )}
                  <span className="text-xs text-muted-foreground truncate">
                    {activeTab === "edit" ? "Click to select • Drag to reorder" : activeTab === "layers" ? "Component Layers" : deviceType === "desktop" ? "Desktop" : "375px"}
                  </span>
                </div>
              </div>
              <div className="w-16" />
            </div>

            {/* Email Body */}
            <div
              className={cn(
                "border border-t-0 border-border rounded-b-lg shadow-sm overflow-hidden",
                "flex-1",
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
              ) : activeTab === "layers" ? (
                // Layers mode: Show layers panel
                <div className="h-full bg-background">
                  <LayersPanel
                    components={components}
                    selectedComponentId={selectedComponentId}
                    onSelectComponent={onSelectComponent}
                    onDeleteComponent={onDeleteComponent}
                  />
                </div>
              ) : activeTab === "preview" ? (
                // Preview mode: iframe with perfect Tailwind rendering
                <div className="h-full overflow-auto flex justify-center">
                  <iframe
                    ref={iframeRef}
                    srcDoc={html}
                    className="border-0"
                    scrolling="auto"
                    style={{ 
                      margin: "0 auto", 
                      display: "block", 
                      overflow: "hidden",
                      width: containerWidth,
                      maxWidth: "100%",
                    }}
                    title="Email Preview"
                    // Allow users to test link behavior in preview.
                    sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
                  />
                </div>
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
                      maxWidth: deviceMaxWidth,
                      width: "100%",
                      margin: "0 auto",
                      backgroundColor: globalStyles?.containerBackgroundColor || "#ffffff",
                      padding: globalStyles?.containerPadding || "20px",
                    }}
                  >
                    <SortableContext items={componentIds} strategy={verticalListSortingStrategy}>
                      {components.length === 0 ? null : (
                        <>
                          {components.map((component, index) => (
                            <Fragment key={component.id}>
                              <DroppableBetween id={`between-${index}`} />
                              <DraggableEmailItem
                                component={component}
                                isSelected={selectedComponentId === component.id}
                                selectedComponentId={selectedComponentId}
                                onSelect={() => handleSelectComponent(component.id)}
                                onDelete={() => handleDeleteComponent(component.id)}
                                onSelectChild={handleSelectComponent}
                                onDeleteChild={handleDeleteComponent}
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
      </div>
    </div>
  );
}

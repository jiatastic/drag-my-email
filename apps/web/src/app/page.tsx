"use client";

import { useState, type ElementType, Fragment, useRef, useEffect } from "react";
import { motion } from "motion/react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowRight,
  GripVertical,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  MousePointerClick,
  Link2,
  Image,
  Minus,
  Square,
  Code,
  Share2,
  AlignJustify,
  Trash2,
  Mail,
  Twitter,
  Github,
  Linkedin,
  ChevronDown,
  Plus,
  Settings2,
  X,
  Sparkles,
} from "lucide-react";

interface EmailComponent {
  id: string;
  type: string;
  props: Record<string, any>;
}

interface TemplateConfig {
  id: string;
  name: string;
  emoji: string;
  components: EmailComponent[];
}

const templates: TemplateConfig[] = [
  {
    id: "aws",
    name: "AWS Verification",
    emoji: "☁️",
    components: [
      { id: "aws1", type: "image", props: { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Amazon_Web_Services_Logo.svg/300px-Amazon_Web_Services_Logo.svg.png", alt: "AWS Logo", width: 75, height: 45, margin: "0 auto", backgroundColor: "#252f3d", padding: "20px", borderRadius: "0" } },
      { id: "aws2", type: "heading", props: { text: "Verify your email address", fontSize: "20px", fontWeight: "700", color: "#333333", marginBottom: "15px", marginTop: "25px" } },
      { id: "aws3", type: "text", props: { text: "Thanks for starting the new AWS account creation process. We want to make sure it's really you. Please enter the following verification code when prompted. If you don't want to create an account, you can ignore this message.", fontSize: "14px", lineHeight: "24px", color: "#333333", marginBottom: "14px", marginTop: "24px" } },
      { id: "aws4", type: "text", props: { text: "Verification code", fontSize: "14px", fontWeight: "700", color: "#333333", marginBottom: "0", textAlign: "center" } },
      { id: "aws5", type: "text", props: { text: "596853", fontSize: "36px", fontWeight: "700", color: "#333333", marginBottom: "10px", marginTop: "10px", textAlign: "center" } },
      { id: "aws6", type: "text", props: { text: "(This code is valid for 10 minutes)", fontSize: "14px", color: "#333333", marginBottom: "0", textAlign: "center" } },
      { id: "aws7", type: "divider", props: { borderColor: "#e1e8ed", margin: "25px 0" } },
      { id: "aws8", type: "text", props: { text: "Amazon Web Services will never email you and ask you to disclose or verify your password, credit card, or banking account number.", fontSize: "14px", color: "#333333", marginBottom: "0", marginTop: "0" } },
      { id: "aws9", type: "text", props: { text: "This message was produced and distributed by Amazon Web Services, Inc., 410 Terry Ave. North, Seattle, WA 98109. © 2024, Amazon Web Services, Inc. All rights reserved. AWS is a registered trademark of Amazon.com, Inc.", fontSize: "12px", color: "#333333", marginBottom: "24px", marginTop: "24px", padding: "0 20px" } },
    ],
  },
  {
    id: "welcome",
    name: "Welcome flow",
    emoji: "👋",
    components: [
      { id: "w1", type: "heading", props: { text: "Welcome aboard!" } },
      { id: "w2", type: "text", props: { text: "We're excited to have you. Here are the first steps to get value fast." } },
      { id: "w3", type: "button", props: { text: "Open dashboard", color: "#1e9df1" } },
      { id: "w4", type: "divider", props: {} },
      { id: "w5", type: "text", props: { text: "Need help? Reply to this email and we'll jump in." } },
      { id: "w6", type: "social", props: {} },
      { id: "w7", type: "footer", props: { company: "drag.email" } },
    ],
  },
];

const palette: { id: string; label: string; icon: ElementType }[] = [
  { id: "heading", label: "Heading", icon: Type },
  { id: "text", label: "Text", icon: AlignLeft },
  { id: "button", label: "Button", icon: MousePointerClick },
  { id: "link", label: "Link", icon: Link2 },
  { id: "image", label: "Image", icon: Image },
  { id: "divider", label: "Divider", icon: Minus },
  { id: "code", label: "Code", icon: Square },
  { id: "code-inline", label: "Code inline", icon: Code },
  { id: "social", label: "Social icons", icon: Share2 },
  { id: "footer", label: "Footer", icon: AlignJustify },
];

function PaletteItem({ type, label, icon: Icon }: { type: string; label: string; icon: ElementType }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { type, fromPalette: true },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`group relative bg-white rounded-lg overflow-hidden border border-gray-200 cursor-grab active:cursor-grabbing transition-all ${
        isDragging ? "opacity-50" : "hover:border-primary hover:shadow-md hover:-translate-y-0.5"
      }`}
    >
      <div className="h-14 flex items-center justify-center bg-gray-50">
        <Icon className="h-5 w-5 text-gray-400 group-hover:text-primary transition-colors" />
      </div>
      <div className="px-2 py-1.5 border-t border-gray-100 bg-gray-50/50">
        <span className="text-[10px] font-semibold text-gray-500 group-hover:text-primary block text-center transition-colors">
          {label}
        </span>
      </div>
    </div>
  );
}

// Droppable canvas wrapper
function DroppableCanvas({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={isOver ? "ring-2 ring-primary/50 ring-inset rounded-lg" : ""}>
      {children}
    </div>
  );
}

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

const TEXT_EDITABLE_TYPES = ["text", "heading", "button", "link"];

function SortableEmailComponent({
  component,
  isSelected,
  onSelect,
  onDelete,
  onUpdate,
}: {
  component: EmailComponent;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onUpdate?: (updates: Partial<EmailComponent>) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: component.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(component.props?.text || "");
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
  
  // Check if this component supports inline editing
  const isTextEditable = TEXT_EDITABLE_TYPES.includes(component.type);
  
  // Start editing on click when already selected
  const handleTextClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSelected && isTextEditable && !isEditing) {
      setEditText(component.props?.text || "");
      setIsEditing(true);
    } else {
      onSelect();
    }
  };
  
  // Save text changes
  const saveText = () => {
    if (editText !== component.props?.text && onUpdate) {
      onUpdate({
        props: { ...component.props, text: editText },
      });
    }
    setIsEditing(false);
  };
  
  // Handle keyboard events in edit mode
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setEditText(component.props?.text || "");
      setIsEditing(false);
    } else if (e.key === "Enter" && !e.shiftKey && component.type !== "text") {
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

  const renderContent = () => {
    const props = component.props;
    
    // Helper to add px unit if value is numeric (shared by all components)
    const formatSize = (value: any, fallback: string) => {
      if (!value && value !== 0) return fallback;
      // If it's a number or a string that's purely numeric, add px
      if (typeof value === "number" || /^\d+$/.test(String(value))) {
        return `${value}px`;
      }
      return value;
    };
    const componentStyle = {
      fontSize: props.fontSize || (component.type === "heading" ? "24px" : "14px"),
      fontWeight: props.fontWeight ? parseInt(props.fontWeight) : (component.type === "heading" ? 600 : component.type === "button" ? 600 : 400),
      color: props.color || (component.type === "heading" ? "#14171a" : component.type === "link" ? "#1e9df1" : "#333"),
      margin: component.type === "heading" ? "0 0 16px" : component.type === "link" || component.type === "button" ? "0 0 12px" : "0 0 12px",
      lineHeight: props.lineHeight || (component.type === "heading" ? "1.2" : "1.6"),
      textAlign: props.textAlign || (component.type === "button" ? "center" : "left"),
    };
    
    // Show editable textarea when in edit mode
    if (isEditing && isTextEditable) {
      const textareaStyle = {
        ...componentStyle,
        minHeight: component.type === "heading" ? "40px" : "24px",
        padding: component.type === "button" ? "12px 20px" : 0,
        margin: componentStyle.margin,
        fontFamily: "inherit",
        backgroundColor: component.type === "button" ? props.color || "#14171a" : "transparent",
        color: component.type === "button" ? props.textColor || "#fff" : componentStyle.color,
        border: "none",
        outline: "none",
        resize: "none" as const,
        borderRadius: 0,
        display: component.type === "button" || component.type === "link" ? "inline-block" : "block",
        textDecoration: component.type === "link" ? "underline" : "none",
        width: component.type === "button" || component.type === "link" ? "auto" : "100%",
      };
      
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={saveText}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent border-none outline-none resize-none"
          style={textareaStyle}
          rows={Math.max(1, (editText || "").split("\n").length)}
        />
      );
    }
    
    switch (component.type) {
      case "heading":
        return (
          <h1 
            onClick={handleTextClick}
            style={{ 
              ...componentStyle,
              cursor: isSelected ? "text" : "pointer",
              marginBottom: props.marginBottom !== undefined ? props.marginBottom : componentStyle.margin.split(" ")[2] || "16px",
            }}
          >
            {props.text || "Heading"}
          </h1>
        );
      case "text":
        const textMargin = componentStyle.margin.split(" ")[2] || "12px";
        return (
          <p 
            onClick={handleTextClick}
            style={{ 
              ...componentStyle,
              cursor: isSelected ? "text" : "pointer",
              backgroundColor: props.backgroundColor || "transparent",
              padding: props.padding || undefined,
              borderRadius: props.borderRadius || undefined,
              marginBottom: props.marginBottom !== undefined ? props.marginBottom : textMargin,
              marginTop: props.marginTop !== undefined ? props.marginTop : undefined,
              paddingBottom: props.paddingBottom || undefined,
              textAlign: props.textAlign || undefined,
            }}
          >
            {props.text || "Paragraph copy goes here."}
          </p>
        );
      case "link":
        return (
          <a 
            href={props.href || "#"} 
            onClick={(e) => {
              e.preventDefault();
              handleTextClick(e);
            }}
            style={{ 
              ...componentStyle,
              textDecoration: props.textDecoration || "underline", 
              display: props.display || "inline-block",
              cursor: isSelected ? "text" : "pointer",
              marginBottom: props.marginBottom !== undefined ? props.marginBottom : componentStyle.margin.split(" ")[2] || "12px",
            }}
          >
            {props.text || "Visit link"}
          </a>
        );
      case "button":
        return (
          <a
            href={props.href || "#"}
            onClick={(e) => {
              e.preventDefault();
              handleTextClick(e);
            }}
            style={{
              ...componentStyle,
              display: "inline-block",
              padding: props.padding || "12px 20px",
              borderRadius: props.borderRadius || "999px",
              backgroundColor: props.color || "#14171a",
              color: props.textColor || "#fff",
              textDecoration: "none",
              cursor: isSelected ? "text" : "pointer",
              marginBottom: props.marginBottom !== undefined ? props.marginBottom : componentStyle.margin.split(" ")[2] || "12px",
            }}
          >
            {props.text || "Call To Action"}
          </a>
        );
      case "image":
        const imageAlign = props.align || "center";
        const imageStyle: React.CSSProperties = {
          width: formatSize(props.width, "100%"),
          height: formatSize(props.height, "auto"),
          borderRadius: formatSize(props.borderRadius, props.width === "96" && props.height === "96" ? "50%" : "12px"),
          marginBottom: formatSize(props.marginBottom, "12px"),
          display: "block",
          marginLeft: imageAlign === "center" ? "auto" : imageAlign === "right" ? "auto" : "0",
          marginRight: imageAlign === "center" ? "auto" : imageAlign === "left" ? "auto" : "0",
        };
        // Handle background color wrapper for images (like AWS logo in dark header)
        if (props.backgroundColor) {
          return (
            <div style={{ 
              backgroundColor: props.backgroundColor, 
              padding: props.padding || "0", 
              borderRadius: formatSize(props.borderRadius, "0"), 
              textAlign: imageAlign as "left" | "center" | "right",
              marginBottom: formatSize(props.marginBottom, "12px"),
            }}>
              <img 
                src={props.src || "https://placehold.co/480x200/e8f4fd/1d9bf0?text=Your+Image"} 
                alt={props.alt || "Image"} 
                style={{...imageStyle, marginBottom: 0}}
              />
            </div>
          );
        }
        return (
          <img 
            src={props.src || "https://placehold.co/480x200/e8f4fd/1d9bf0?text=Your+Image"} 
            alt={props.alt || "Image"} 
            style={imageStyle}
          />
        );
      case "divider":
        return <hr style={{ 
          border: "none", 
          borderTop: `${formatSize(props.borderWidth, "1px")} ${props.borderStyle || "solid"} ${props.borderColor || "#e1e8ed"}`, 
          margin: props.margin || "24px 0" 
        }} />;
      case "code":
        return (
          <pre
            style={{
              backgroundColor: props.backgroundColor || "#1e1e1e",
              color: props.color || "#d4d4d4",
              borderRadius: props.borderRadius || "8px",
              padding: props.padding || "16px",
              fontSize: props.fontSize || "13px",
              fontFamily: "JetBrains Mono, Menlo, Monaco, monospace",
              marginBottom: "16px",
              overflowX: "auto",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {props.text || "const hello = 'world';"}
          </pre>
        );
      case "code-inline":
        return (
          <p style={{ fontSize: props.fontSize || "14px", color: props.color || "#333", marginBottom: "12px" }}>
            Run <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px" }}>{props.code || "bun run dev"}</code> to try it.
          </p>
        );
      case "social":
        return (
          <div style={{ display: "flex", gap: "12px", margin: "12px 0" }}>
            {["twitter", "github", "linkedin"].map((net) => (
              <span
                key={net}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: net === "twitter" ? "#1DA1F2" : net === "github" ? "#333" : "#0A66C2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {net === "twitter" && <Twitter className="h-4 w-4 text-white" />}
                {net === "github" && <Github className="h-4 w-4 text-white" />}
                {net === "linkedin" && <Linkedin className="h-4 w-4 text-white" />}
              </span>
            ))}
          </div>
        );
      case "footer":
        return (
          <div style={{ 
            marginTop: "32px",
            paddingTop: "24px",
            borderTop: `1px solid ${props.borderColor || "#e5e5e5"}`,
            textAlign: "center",
          }}>
            {/* Company name */}
            <p style={{ 
              fontSize: props.fontSize || "14px", 
              fontWeight: 600,
              color: props.color || "#1d1d1f", 
              margin: "0 0 8px 0",
            }}>
              {props.company || "Acme Inc."}
            </p>
            
            {/* Address */}
            <p style={{ 
              fontSize: "12px", 
              color: props.addressColor || "#8899a6", 
              margin: "0 0 16px 0",
              lineHeight: "1.5",
            }}>
              {props.address || "123 Main Street, San Francisco, CA 94102"}
            </p>
            
            {/* Links */}
            <div style={{ 
              display: "flex", 
              justifyContent: "center", 
              gap: "16px",
              flexWrap: "wrap",
            }}>
              <a href={props.unsubscribeUrl || "#"} style={{ 
                fontSize: "12px", 
                color: props.linkColor || "#1e9df1", 
                textDecoration: "none",
              }}>
                Unsubscribe
              </a>
              <span style={{ color: "#d1d1d6" }}>•</span>
              <a href={props.preferencesUrl || "#"} style={{ 
                fontSize: "12px", 
                color: props.linkColor || "#1e9df1", 
                textDecoration: "none",
              }}>
                Preferences
              </a>
              <span style={{ color: "#d1d1d6" }}>•</span>
              <a href={props.privacyUrl || "#"} style={{ 
                fontSize: "12px", 
                color: props.linkColor || "#1e9df1", 
                textDecoration: "none",
              }}>
                Privacy Policy
              </a>
            </div>
            
            {/* Copyright */}
            <p style={{ 
              fontSize: "11px", 
              color: props.copyrightColor || "#adb5bd", 
              margin: "16px 0 0 0",
            }}>
              © {new Date().getFullYear()} {props.company || "Acme Inc."}. All rights reserved.
            </p>
          </div>
        );
      default:
        return <div>{component.type}</div>;
    }
  };

  const showToolbar = isSelected || isHovered;

  // Handle click for all components - select if not selected
  const handleComponentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Always select the component if it's not already selected
    if (!isSelected) {
      onSelect();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative email-component ${isDragging ? "opacity-50 z-50" : ""} ${isSelected ? "selected" : ""} cursor-pointer`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleComponentClick}
    >
      <div className={`relative transition-all ${
        isSelected ? "ring-2 ring-primary ring-offset-1 rounded-lg" : ""
      } ${isHovered && !isSelected ? "ring-2 ring-primary/30 ring-offset-1 rounded-lg" : ""} ${
        isEditing ? "ring-2 ring-primary ring-offset-1 rounded-lg" : ""
      }`}>
        {renderContent()}
        
        {/* Floating toolbar */}
        <div className={`absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-primary text-primary-foreground rounded-lg px-2.5 py-1.5 text-xs font-medium transition-opacity z-20 whitespace-nowrap shadow-[0_4px_12px_rgba(0,0,0,0.15)] pointer-events-auto ${
          showToolbar ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}>
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-0.5 hover:bg-white/10 rounded transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-3 w-3" />
          </button>
          <span className="capitalize px-1">{component.type.replace("-", " ")}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-0.5 hover:bg-red-500 rounded transition-colors ml-1"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

function getDefaultProps(type: string) {
  switch (type) {
    case "heading":
      return { text: "New heading" };
    case "text":
      return { text: "Write something thoughtful." };
    case "button":
      return { text: "Button", color: "#14171a" };
    case "link":
      return { text: "Read more", href: "https://example.com" };
    case "image":
      return { src: "https://placehold.co/480x200/e8f4fd/1d9bf0?text=Your+Image", alt: "Image" };
    case "divider":
      return { borderColor: "#e1e8ed", borderWidth: "1px", borderStyle: "solid", margin: "24px 0" };
    case "code":
      return { 
        text: "const hello = 'world';",
        language: "javascript",
        backgroundColor: "#1e1e1e",
        color: "#d4d4d4",
        fontSize: "13px",
        borderRadius: "8px",
        padding: "16px",
      };
    case "code-inline":
      return { code: "npm install" };
    case "social":
      return {};
    case "footer":
      return { 
        company: "Acme Inc.", 
        address: "123 Main Street, San Francisco, CA 94102",
        unsubscribeUrl: "#",
        preferencesUrl: "#",
        privacyUrl: "#",
      };
    default:
      return {};
  }
}

// Property Panel Component
function PropertyPanel({ 
  component, 
  onUpdate 
}: { 
  component: EmailComponent | null; 
  onUpdate: (updates: Partial<EmailComponent>) => void;
}) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    content: true,
    link: true,
    typography: true,
    colors: true,
    spacing: true,
    style: true,
    border: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (!component) {
    return (
      <div className="text-xs text-[#86868b] text-center py-6">
        Select a component to edit its properties
      </div>
    );
  }

  const updateProp = (key: string, value: any) => {
    onUpdate({
      props: {
        ...component.props,
        [key]: value,
      },
    });
  };

  const getProp = (key: string, defaultValue: any = "") => {
    return component.props[key] ?? defaultValue;
  };

  const isText = component.type === "text" || component.type === "heading";
  const isButton = component.type === "button";
  const isLink = component.type === "link";
  const isImage = component.type === "image";
  const isCodeInline = component.type === "code-inline";
  const isDivider = component.type === "divider";
  const isSocial = component.type === "social";

  return (
    <div className="space-y-0">
      {/* Content Section */}
      {(component.type === "heading" || component.type === "text" || component.type === "link" || component.type === "button" || component.type === "code" || component.type === "code-inline") && (
        <div className="border-b border-[#e5e5e7]">
          <button
            onClick={() => toggleSection("content")}
            className="w-full flex items-center justify-between py-2 px-0 hover:bg-[#f5f5f7] transition-colors rounded-sm"
          >
            <span className="text-[11px] font-medium text-[#1d1d1f]">Content</span>
            <ChevronDown className={`h-3 w-3 text-[#86868b] transition-transform ${openSections.content ? '' : '-rotate-90'}`} />
          </button>
          {openSections.content && (
            <div className="space-y-2 pb-2.5 pt-1 px-0">
              {(component.type === "heading" || component.type === "text" || component.type === "link" || component.type === "button" || component.type === "code") && (
                <div>
                  <label className="block text-[10px] text-[#86868b] mb-1 font-medium">
                    {component.type === "code" ? "Code" : component.type === "footer" ? "Company" : "Text"}
                  </label>
                  {component.type === "code" ? (
                    <textarea
                      value={getProp("text", "")}
                      onChange={(e) => updateProp("text", e.target.value)}
                      className="w-full px-2 py-1.5 text-xs font-mono border border-[#d1d1d6] rounded-md bg-white resize-none min-h-[80px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                      placeholder="Enter code..."
                    />
                  ) : (
                    <input
                      type="text"
                      value={getProp("text", "")}
                      onChange={(e) => updateProp("text", e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-[#d1d1d6] rounded-md bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                      placeholder="Enter text..."
                    />
                  )}
                </div>
              )}
              {component.type === "code-inline" && (
                <div>
                  <label className="block text-[10px] text-[#86868b] mb-1 font-medium">Code</label>
                  <input
                    type="text"
                    value={getProp("code", "")}
                    onChange={(e) => updateProp("code", e.target.value)}
                    className="w-full px-2 py-1.5 text-xs font-mono border border-[#d1d1d6] rounded-md bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    placeholder="npm install"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Link Section */}
      {(isLink || isButton) && (
        <div className="border-b border-[#e5e5e7]">
          <button
            onClick={() => toggleSection("link")}
            className="w-full flex items-center justify-between py-2 px-0 hover:bg-[#f5f5f7] transition-colors rounded-sm"
          >
            <span className="text-[11px] font-medium text-[#1d1d1f]">Link</span>
            <ChevronDown className={`h-3 w-3 text-[#86868b] transition-transform ${openSections.link ? '' : '-rotate-90'}`} />
          </button>
          {openSections.link && (
            <div className="space-y-2 pb-2.5 pt-1 px-0">
              {isLink && (
                <div>
                  <label className="block text-[10px] text-[#86868b] mb-1 font-medium">Text</label>
                  <input
                    type="text"
                    value={getProp("text", "")}
                    onChange={(e) => updateProp("text", e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-[#d1d1d6] rounded-md bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    placeholder="Link text..."
                  />
                </div>
              )}
              <div>
                <label className="block text-[10px] text-[#86868b] mb-1 font-medium">URL</label>
                <div className="relative">
                  <Link2 className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-[#86868b]" />
                  <input
                    type="text"
                    value={getProp("href", "")}
                    onChange={(e) => updateProp("href", e.target.value)}
                    className="w-full pl-7 pr-2 py-1.5 text-xs border border-[#d1d1d6] rounded-md bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Image Section */}
      {isImage && (
        <div className="border-b border-[#e5e5e7]">
          <button
            onClick={() => toggleSection("content")}
            className="w-full flex items-center justify-between py-2 px-0 hover:bg-[#f5f5f7] transition-colors rounded-sm"
          >
            <span className="text-[11px] font-medium text-[#1d1d1f]">Image</span>
            <ChevronDown className={`h-3 w-3 text-[#86868b] transition-transform ${openSections.content ? '' : '-rotate-90'}`} />
          </button>
          {openSections.content && (
            <div className="space-y-2 pb-2.5 pt-1 px-0">
              <div>
                <label className="block text-[10px] text-[#86868b] mb-1 font-medium">Source URL</label>
                <input
                  type="text"
                  value={getProp("src", "")}
                  onChange={(e) => updateProp("src", e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-[#d1d1d6] rounded-md bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#86868b] mb-1 font-medium">Alt Text</label>
                <input
                  type="text"
                  value={getProp("alt", "")}
                  onChange={(e) => updateProp("alt", e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-[#d1d1d6] rounded-md bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  placeholder="Describe the image..."
                />
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className="block text-[10px] text-[#86868b] mb-1 font-medium">Width</label>
                  <input
                    type="text"
                    value={getProp("width", "")}
                    onChange={(e) => updateProp("width", e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-[#d1d1d6] rounded-md bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    placeholder="200 or 100%"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#86868b] mb-1 font-medium">Height</label>
                  <input
                    type="text"
                    value={getProp("height", "")}
                    onChange={(e) => updateProp("height", e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-[#d1d1d6] rounded-md bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    placeholder="150 or auto"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-[#86868b] mb-1 font-medium">Alignment</label>
                <div className="flex bg-[#f5f5f7] rounded-md p-0.5">
                  {(() => {
                    const currentAlign = getProp("align", "center");
                    return (
                      <>
                        <button
                          onClick={() => updateProp("align", "left")}
                          className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-all ${
                            currentAlign === "left"
                              ? 'bg-white shadow-sm text-[#1d1d1f]'
                              : 'text-[#86868b] hover:text-[#1d1d1f]'
                          }`}
                        >
                          <AlignLeft className="h-3.5 w-3.5 mx-auto" />
                        </button>
                        <button
                          onClick={() => updateProp("align", "center")}
                          className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-all ${
                            currentAlign === "center"
                              ? 'bg-white shadow-sm text-[#1d1d1f]'
                              : 'text-[#86868b] hover:text-[#1d1d1f]'
                          }`}
                        >
                          <AlignCenter className="h-3.5 w-3.5 mx-auto" />
                        </button>
                        <button
                          onClick={() => updateProp("align", "right")}
                          className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-all ${
                            currentAlign === "right"
                              ? 'bg-white shadow-sm text-[#1d1d1f]'
                              : 'text-[#86868b] hover:text-[#1d1d1f]'
                          }`}
                        >
                          <AlignRight className="h-3.5 w-3.5 mx-auto" />
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-[#86868b] mb-1 font-medium">Background Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={getProp("backgroundColor", "#ffffff")}
                    onChange={(e) => updateProp("backgroundColor", e.target.value)}
                    className="w-7 h-7 rounded border border-[#d1d1d6] cursor-pointer"
                  />
                  <input
                    type="text"
                    value={getProp("backgroundColor", "")}
                    onChange={(e) => updateProp("backgroundColor", e.target.value)}
                    className="flex-1 px-2 py-1.5 text-xs font-mono border border-[#d1d1d6] rounded-md bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    placeholder="transparent"
                  />
                  {getProp("backgroundColor", "") && (
                    <button
                      onClick={() => updateProp("backgroundColor", "")}
                      className="text-[10px] text-[#86868b] hover:text-[#1d1d1f]"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Typography Section */}
      {(isText || isButton || isLink) && (
        <div className="border-b border-[#e5e5e7]">
          <button
            onClick={() => toggleSection("typography")}
            className="w-full flex items-center justify-between py-2 px-0 hover:bg-[#f5f5f7] transition-colors rounded-sm"
          >
            <span className="text-[11px] font-medium text-[#1d1d1f]">Typography</span>
            <ChevronDown className={`h-3 w-3 text-[#86868b] transition-transform ${openSections.typography ? '' : '-rotate-90'}`} />
          </button>
          {openSections.typography && (
            <div className="space-y-2 pb-2.5 pt-1 px-0">
              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className="block text-[10px] text-[#86868b] mb-1 font-medium">Size</label>
                  <input
                    type="text"
                    value={getProp("fontSize", "")}
                    onChange={(e) => updateProp("fontSize", e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-[#d1d1d6] rounded-md bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    placeholder="16px"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#86868b] mb-1 font-medium">Weight</label>
                  <select
                    value={getProp("fontWeight", "400")}
                    onChange={(e) => updateProp("fontWeight", e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-[#d1d1d6] rounded-md bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  >
                    <option value="300">Light</option>
                    <option value="400">Regular</option>
                    <option value="500">Medium</option>
                    <option value="600">Semibold</option>
                    <option value="700">Bold</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-[#86868b] mb-1 font-medium">Line Height</label>
                <input
                  type="text"
                  value={getProp("lineHeight", "")}
                  onChange={(e) => updateProp("lineHeight", e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-[#d1d1d6] rounded-md bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  placeholder="1.5"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#86868b] mb-1 font-medium">Alignment</label>
                <div className="flex bg-[#f5f5f7] rounded-md p-0.5">
                  {(() => {
                    const currentAlign = getProp("textAlign", "left");
                    return (
                      <>
                        <button
                          onClick={() => updateProp("textAlign", "left")}
                          className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-all ${
                            currentAlign === "left"
                              ? 'bg-white shadow-sm text-[#1d1d1f]'
                              : 'text-[#86868b] hover:text-[#1d1d1f]'
                          }`}
                        >
                          <AlignLeft className="h-3.5 w-3.5 mx-auto" />
                        </button>
                        <button
                          onClick={() => updateProp("textAlign", "center")}
                          className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-all ${
                            currentAlign === "center"
                              ? 'bg-white shadow-sm text-[#1d1d1f]'
                              : 'text-[#86868b] hover:text-[#1d1d1f]'
                          }`}
                        >
                          <AlignCenter className="h-3.5 w-3.5 mx-auto" />
                        </button>
                        <button
                          onClick={() => updateProp("textAlign", "right")}
                          className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-all ${
                            currentAlign === "right"
                              ? 'bg-white shadow-sm text-[#1d1d1f]'
                              : 'text-[#86868b] hover:text-[#1d1d1f]'
                          }`}
                        >
                          <AlignRight className="h-3.5 w-3.5 mx-auto" />
                        </button>
                        <button
                          onClick={() => updateProp("textAlign", "justify")}
                          className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-all ${
                            currentAlign === "justify"
                              ? 'bg-white shadow-sm text-[#1d1d1f]'
                              : 'text-[#86868b] hover:text-[#1d1d1f]'
                          }`}
                        >
                          <AlignJustify className="h-3.5 w-3.5 mx-auto" />
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Colors Section */}
      {(isText || isButton || isLink || isCodeInline) && (
        <div className="border-b border-[#e5e5e7]">
          <button
            onClick={() => toggleSection("colors")}
            className="w-full flex items-center justify-between py-2.5 px-0 hover:bg-[#f5f5f7] transition-colors rounded-sm"
          >
            <span className="text-xs font-medium text-[#1d1d1f]">Colors</span>
            <ChevronDown className={`h-3.5 w-3.5 text-[#86868b] transition-transform ${openSections.colors ? '' : '-rotate-90'}`} />
          </button>
          {openSections.colors && (
            <div className="space-y-3 pb-3 pt-1 px-0">
              {(isText || isLink || isCodeInline) && (
                <div>
                  <label className="block text-[11px] text-[#86868b] mb-1.5 font-medium">Text Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={getProp("color", "#333")}
                      onChange={(e) => updateProp("color", e.target.value)}
                      className="w-8 h-8 rounded border border-[#d1d1d6] cursor-pointer"
                    />
                    <input
                      type="text"
                      value={getProp("color", "#333")}
                      onChange={(e) => updateProp("color", e.target.value)}
                      className="flex-1 px-2.5 py-1.5 text-sm font-mono border border-[#d1d1d6] rounded-md bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                      placeholder="#333"
                    />
                  </div>
                </div>
              )}
              {isButton && (
                <>
                  <div>
                    <label className="block text-[11px] text-[#86868b] mb-1.5 font-medium">Background Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={getProp("color", "#14171a")}
                        onChange={(e) => updateProp("color", e.target.value)}
                        className="w-8 h-8 rounded border border-[#d1d1d6] cursor-pointer"
                      />
                      <input
                        type="text"
                        value={getProp("color", "#14171a")}
                        onChange={(e) => updateProp("color", e.target.value)}
                        className="flex-1 px-2.5 py-1.5 text-sm font-mono border border-[#d1d1d6] rounded-md bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                        placeholder="#14171a"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#86868b] mb-1.5 font-medium">Text Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={getProp("textColor", "#fff")}
                        onChange={(e) => updateProp("textColor", e.target.value)}
                        className="w-8 h-8 rounded border border-[#d1d1d6] cursor-pointer"
                      />
                      <input
                        type="text"
                        value={getProp("textColor", "#fff")}
                        onChange={(e) => updateProp("textColor", e.target.value)}
                        className="flex-1 px-2.5 py-1.5 text-sm font-mono border border-[#d1d1d6] rounded-md bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                        placeholder="#fff"
                      />
                    </div>
                  </div>
                </>
              )}
              {isCodeInline && (
                <div>
                  <label className="block text-[11px] text-[#86868b] mb-1.5 font-medium">Background Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={getProp("backgroundColor", "#f1f5f9")}
                      onChange={(e) => updateProp("backgroundColor", e.target.value)}
                      className="w-8 h-8 rounded border border-[#d1d1d6] cursor-pointer"
                    />
                    <input
                      type="text"
                      value={getProp("backgroundColor", "#f1f5f9")}
                      onChange={(e) => updateProp("backgroundColor", e.target.value)}
                      className="flex-1 px-2.5 py-1.5 text-sm font-mono border border-[#d1d1d6] rounded-md bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                      placeholder="#f1f5f9"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Spacing Section */}
      {(isButton || isImage) && (
        <div className="border-b border-[#e5e5e7]">
          <button
            onClick={() => toggleSection("spacing")}
            className="w-full flex items-center justify-between py-2.5 px-0 hover:bg-[#f5f5f7] transition-colors rounded-sm"
          >
            <span className="text-xs font-medium text-[#1d1d1f]">Spacing</span>
            <ChevronDown className={`h-3.5 w-3.5 text-[#86868b] transition-transform ${openSections.spacing ? '' : '-rotate-90'}`} />
          </button>
          {openSections.spacing && (
            <div className="space-y-3 pb-3 pt-1 px-0">
              {isButton && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-[#86868b] mb-1.5 font-medium">Padding X</label>
                    <input
                      type="text"
                      value={getProp("paddingX", "")}
                      onChange={(e) => updateProp("paddingX", e.target.value)}
                      className="w-full px-2.5 py-1.5 text-sm border border-[#d1d1d6] rounded-md bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                      placeholder="20px"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#86868b] mb-1.5 font-medium">Padding Y</label>
                    <input
                      type="text"
                      value={getProp("paddingY", "")}
                      onChange={(e) => updateProp("paddingY", e.target.value)}
                      className="w-full px-2.5 py-1.5 text-sm border border-[#d1d1d6] rounded-md bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                      placeholder="12px"
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-[11px] text-[#86868b] mb-1.5 font-medium">Margin Bottom</label>
                <input
                  type="text"
                  value={getProp("marginBottom", "")}
                  onChange={(e) => updateProp("marginBottom", e.target.value)}
                  className="w-full px-2.5 py-1.5 text-sm border border-[#d1d1d6] rounded-md bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  placeholder="12px"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Border Section */}
      {(isButton || isImage || isCodeInline) && (
        <div className="border-b border-[#e5e5e7]">
          <button
            onClick={() => toggleSection("border")}
            className="w-full flex items-center justify-between py-2.5 px-0 hover:bg-[#f5f5f7] transition-colors rounded-sm"
          >
            <span className="text-xs font-medium text-[#1d1d1f]">Border</span>
            <ChevronDown className={`h-3.5 w-3.5 text-[#86868b] transition-transform ${openSections.border ? '' : '-rotate-90'}`} />
          </button>
          {openSections.border && (
            <div className="space-y-3 pb-3 pt-1 px-0">
              <div>
                <label className="block text-[11px] text-[#86868b] mb-1.5 font-medium">Border Radius</label>
                <input
                  type="text"
                  value={getProp("borderRadius", "")}
                  onChange={(e) => updateProp("borderRadius", e.target.value)}
                  className="w-full px-2.5 py-1.5 text-sm border border-[#d1d1d6] rounded-md bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  placeholder="8px"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer Section */}
      {component.type === "footer" && (
        <div className="border-b border-[#e5e5e7]">
          <button
            onClick={() => toggleSection("content")}
            className="w-full flex items-center justify-between py-2 px-0 hover:bg-[#f5f5f7] transition-colors rounded-sm"
          >
            <span className="text-[11px] font-medium text-[#1d1d1f]">Footer Content</span>
            <ChevronDown className={`h-3 w-3 text-[#86868b] transition-transform ${openSections.content ? '' : '-rotate-90'}`} />
          </button>
          {openSections.content && (
            <div className="space-y-2 pb-2.5 pt-1 px-0">
              <div>
                <label className="block text-[10px] text-[#86868b] mb-1 font-medium">Company Name</label>
                <input
                  type="text"
                  value={getProp("company", "")}
                  onChange={(e) => updateProp("company", e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-[#d1d1d6] rounded-md bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  placeholder="Your Company"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#86868b] mb-1 font-medium">Address</label>
                <input
                  type="text"
                  value={getProp("address", "")}
                  onChange={(e) => updateProp("address", e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-[#d1d1d6] rounded-md bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  placeholder="123 Street, City"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#86868b] mb-1 font-medium">Unsubscribe Text</label>
                <input
                  type="text"
                  value={getProp("unsubscribeText", "Unsubscribe")}
                  onChange={(e) => updateProp("unsubscribeText", e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-[#d1d1d6] rounded-md bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  placeholder="Unsubscribe"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#86868b] mb-1 font-medium">Unsubscribe URL</label>
                <input
                  type="text"
                  value={getProp("unsubscribeUrl", "")}
                  onChange={(e) => updateProp("unsubscribeUrl", e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-[#d1d1d6] rounded-md bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#86868b] mb-1 font-medium">Text Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={getProp("color", "#666666")}
                    onChange={(e) => updateProp("color", e.target.value)}
                    className="w-7 h-7 rounded border border-[#d1d1d6] cursor-pointer"
                  />
                  <input
                    type="text"
                    value={getProp("color", "#666666")}
                    onChange={(e) => updateProp("color", e.target.value)}
                    className="flex-1 px-2 py-1.5 text-xs font-mono border border-[#d1d1d6] rounded-md bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    placeholder="#666666"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-[#86868b] mb-1 font-medium">Alignment</label>
                <div className="flex bg-[#f5f5f7] rounded-md p-0.5">
                  {["left", "center", "right"].map((align) => (
                    <button
                      key={align}
                      onClick={() => updateProp("textAlign", align)}
                      className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-all ${
                        getProp("textAlign", "center") === align
                          ? 'bg-white shadow-sm text-[#1d1d1f]'
                          : 'text-[#86868b] hover:text-[#1d1d1f]'
                      }`}
                    >
                      {align.charAt(0).toUpperCase() + align.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Code Block Style */}
      {component.type === "code" && (
        <div className="border-b border-[#e5e5e7]">
          <button
            onClick={() => toggleSection("style")}
            className="w-full flex items-center justify-between py-2 px-0 hover:bg-[#f5f5f7] transition-colors rounded-sm"
          >
            <span className="text-[11px] font-medium text-[#1d1d1f]">Code Style</span>
            <ChevronDown className={`h-3 w-3 text-[#86868b] transition-transform ${openSections.style ? '' : '-rotate-90'}`} />
          </button>
          {openSections.style && (
            <div className="space-y-2 pb-2.5 pt-1 px-0">
              <div>
                <label className="block text-[10px] text-[#86868b] mb-1 font-medium">Language</label>
                <select
                  value={getProp("language", "javascript")}
                  onChange={(e) => updateProp("language", e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-[#d1d1d6] rounded-md bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="python">Python</option>
                  <option value="bash">Bash</option>
                  <option value="json">JSON</option>
                  <option value="html">HTML</option>
                  <option value="css">CSS</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-[#86868b] mb-1 font-medium">Background Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={getProp("backgroundColor", "#1e1e1e")}
                    onChange={(e) => updateProp("backgroundColor", e.target.value)}
                    className="w-7 h-7 rounded border border-[#d1d1d6] cursor-pointer"
                  />
                  <input
                    type="text"
                    value={getProp("backgroundColor", "#1e1e1e")}
                    onChange={(e) => updateProp("backgroundColor", e.target.value)}
                    className="flex-1 px-2 py-1.5 text-xs font-mono border border-[#d1d1d6] rounded-md bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    placeholder="#1e1e1e"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-[#86868b] mb-1 font-medium">Text Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={getProp("color", "#d4d4d4")}
                    onChange={(e) => updateProp("color", e.target.value)}
                    className="w-7 h-7 rounded border border-[#d1d1d6] cursor-pointer"
                  />
                  <input
                    type="text"
                    value={getProp("color", "#d4d4d4")}
                    onChange={(e) => updateProp("color", e.target.value)}
                    className="flex-1 px-2 py-1.5 text-xs font-mono border border-[#d1d1d6] rounded-md bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    placeholder="#d4d4d4"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-[#86868b] mb-1 font-medium">Border Radius</label>
                <input
                  type="text"
                  value={getProp("borderRadius", "8px")}
                  onChange={(e) => updateProp("borderRadius", e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-[#d1d1d6] rounded-md bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  placeholder="8px"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#86868b] mb-1 font-medium">Padding</label>
                <input
                  type="text"
                  value={getProp("padding", "16px")}
                  onChange={(e) => updateProp("padding", e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-[#d1d1d6] rounded-md bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  placeholder="16px"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#86868b] mb-1 font-medium">Font Size</label>
                <input
                  type="text"
                  value={getProp("fontSize", "13px")}
                  onChange={(e) => updateProp("fontSize", e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-[#d1d1d6] rounded-md bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  placeholder="13px"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Divider Section */}
      {isDivider && (
        <div className="border-b border-[#e5e5e7]">
          <button
            onClick={() => toggleSection("style")}
            className="w-full flex items-center justify-between py-2 px-0 hover:bg-[#f5f5f7] transition-colors rounded-sm"
          >
            <span className="text-[11px] font-medium text-[#1d1d1f]">Divider Style</span>
            <ChevronDown className={`h-3 w-3 text-[#86868b] transition-transform ${openSections.style ? '' : '-rotate-90'}`} />
          </button>
          {openSections.style && (
            <div className="space-y-2 pb-2.5 pt-1 px-0">
              <div>
                <label className="block text-[10px] text-[#86868b] mb-1 font-medium">Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={getProp("borderColor", "#e5e5e5")}
                    onChange={(e) => updateProp("borderColor", e.target.value)}
                    className="w-7 h-7 rounded border border-[#d1d1d6] cursor-pointer"
                  />
                  <input
                    type="text"
                    value={getProp("borderColor", "#e5e5e5")}
                    onChange={(e) => updateProp("borderColor", e.target.value)}
                    className="flex-1 px-2 py-1.5 text-xs font-mono border border-[#d1d1d6] rounded-md bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    placeholder="#e5e5e5"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className="block text-[10px] text-[#86868b] mb-1 font-medium">Width</label>
                  <input
                    type="text"
                    value={getProp("borderWidth", "1px")}
                    onChange={(e) => updateProp("borderWidth", e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-[#d1d1d6] rounded-md bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    placeholder="1px"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#86868b] mb-1 font-medium">Style</label>
                  <select
                    value={getProp("borderStyle", "solid")}
                    onChange={(e) => updateProp("borderStyle", e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-[#d1d1d6] rounded-md bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  >
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-[#86868b] mb-1 font-medium">Margin (Top/Bottom)</label>
                <input
                  type="text"
                  value={getProp("margin", "24px 0")}
                  onChange={(e) => updateProp("margin", e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-[#d1d1d6] rounded-md bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  placeholder="24px 0"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Social Icons Section */}
      {isSocial && (
        <div className="border-b border-[#e5e5e7]">
          <button
            onClick={() => toggleSection("content")}
            className="w-full flex items-center justify-between py-2 px-0 hover:bg-[#f5f5f7] transition-colors rounded-sm"
          >
            <span className="text-[11px] font-medium text-[#1d1d1f]">Social Links</span>
            <ChevronDown className={`h-3 w-3 text-[#86868b] transition-transform ${openSections.content ? '' : '-rotate-90'}`} />
          </button>
          {openSections.content && (
            <div className="space-y-2 pb-2.5 pt-1 px-0">
              <div>
                <label className="block text-[10px] text-[#86868b] mb-1 font-medium">Twitter/X URL</label>
                <input
                  type="text"
                  value={getProp("twitterUrl", "")}
                  onChange={(e) => updateProp("twitterUrl", e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-[#d1d1d6] rounded-md bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  placeholder="https://twitter.com/..."
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#86868b] mb-1 font-medium">GitHub URL</label>
                <input
                  type="text"
                  value={getProp("githubUrl", "")}
                  onChange={(e) => updateProp("githubUrl", e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-[#d1d1d6] rounded-md bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  placeholder="https://github.com/..."
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#86868b] mb-1 font-medium">LinkedIn URL</label>
                <input
                  type="text"
                  value={getProp("linkedinUrl", "")}
                  onChange={(e) => updateProp("linkedinUrl", e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-[#d1d1d6] rounded-md bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  placeholder="https://linkedin.com/..."
                />
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className="block text-[10px] text-[#86868b] mb-1 font-medium">Icon Size</label>
                  <input
                    type="text"
                    value={getProp("iconSize", "20px")}
                    onChange={(e) => updateProp("iconSize", e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-[#d1d1d6] rounded-md bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    placeholder="20px"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#86868b] mb-1 font-medium">Spacing</label>
                  <input
                    type="text"
                    value={getProp("gap", "12px")}
                    onChange={(e) => updateProp("gap", e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-[#d1d1d6] rounded-md bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    placeholder="12px"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-[#86868b] mb-1 font-medium">Icon Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={getProp("iconColor", "#333333")}
                    onChange={(e) => updateProp("iconColor", e.target.value)}
                    className="w-7 h-7 rounded border border-[#d1d1d6] cursor-pointer"
                  />
                  <input
                    type="text"
                    value={getProp("iconColor", "#333333")}
                    onChange={(e) => updateProp("iconColor", e.target.value)}
                    className="flex-1 px-2 py-1.5 text-xs font-mono border border-[#d1d1d6] rounded-md bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    placeholder="#333333"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportEmail, setExportEmail] = useState("");
  const [exportSubmitted, setExportSubmitted] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [components, setComponents] = useState<EmailComponent[]>(templates[0]!.components);
  const [activeTemplate, setActiveTemplate] = useState("aws");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedType, setDraggedType] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const { setNodeRef, isOver } = useDroppable({ id: "canvas" });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || isLoading) return;
    
    setIsLoading(true);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      if (res.ok) {
        setSubmitted(true);
      }
    } catch (error) {
      console.error('Failed to join waitlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!exportEmail || exportLoading) return;
    
    setExportLoading(true);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: exportEmail }),
      });
      
      if (res.ok) {
        setExportSubmitted(true);
      }
    } catch (error) {
      console.error('Failed to join waitlist:', error);
    } finally {
      setExportLoading(false);
    }
  };

  const loadTemplate = (id: string) => {
    const template = templates.find((t) => t.id === id);
    if (!template) return;
    setActiveTemplate(id);
    setComponents(template.components.map((comp, idx) => ({ ...comp, id: `${id}-${idx}-${Date.now()}` })));
    setSelectedId(null);
  };

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
    if (event.active.data.current?.fromPalette) {
      setDraggedType(event.active.data.current.type);
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    setActiveId(null);
    setDraggedType(null);
    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    // Handle dropping from palette
    if (active.data.current?.fromPalette) {
      const type = active.data.current.type;
      const newComponent = { id: `${Date.now()}`, type, props: getDefaultProps(type) };
      
      // Check if dropping between components
      if (overId.startsWith("between-")) {
        const index = parseInt(overId.replace("between-", ""));
        setComponents((prev) => {
          const newComponents = [...prev];
          newComponents.splice(index, 0, newComponent);
          return newComponents;
        });
      } else if (overId === "canvas") {
        // Drop at the end
        setComponents((prev) => [...prev, newComponent]);
      } else {
        // Drop after a component
        const index = components.findIndex((c) => c.id === overId);
        if (index !== -1) {
          setComponents((prev) => {
            const newComponents = [...prev];
            newComponents.splice(index + 1, 0, newComponent);
            return newComponents;
          });
        } else {
          setComponents((prev) => [...prev, newComponent]);
        }
      }
      return;
    }

    // Handle reordering existing components
    if (overId.startsWith("between-")) {
      const newIndex = parseInt(overId.replace("between-", ""));
      setComponents((items) => {
        const oldIndex = items.findIndex((i) => i.id === activeId);
        if (oldIndex === -1) return items;
        const newItems = [...items];
        const [removed] = newItems.splice(oldIndex, 1);
        // Adjust index if removing before the target
        const adjustedIndex = oldIndex < newIndex ? newIndex - 1 : newIndex;
        newItems.splice(adjustedIndex, 0, removed);
        return newItems;
      });
    } else if (activeId !== overId) {
      setComponents((items) => {
        const oldIndex = items.findIndex((i) => i.id === activeId);
        const newIndex = items.findIndex((i) => i.id === overId);
        if (oldIndex !== -1 && newIndex !== -1) {
          return arrayMove(items, oldIndex, newIndex);
        }
        return items;
      });
    }
  };

  const deleteComponent = (id: string) => {
    setComponents((prev) => prev.filter((c) => c.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="bg-white">
        {/* Floating pill navbar */}
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-3xl px-4">
          <motion.header 
            className="flex items-center justify-between px-4 py-2.5 bg-white/90 backdrop-blur-xl rounded-full border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.08)]"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            {/* Logo */}
            <div className="flex items-center gap-2.5 text-[#14171a] font-semibold text-base">
              <MousePointerClick className="h-8 w-8 text-primary" />
              drag.email
            </div>
            
            {/* Coming soon bubble */}
            <motion.div
              className="px-4 py-1.5 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-full border border-primary/20"
              whileHover={{ scale: 1.05 }}
            >
              <span className="text-sm font-medium text-primary">✨ Coming soon</span>
            </motion.div>
          </motion.header>
        </div>
        
        {/* Spacer for fixed navbar */}
        <div className="h-20"></div>

        <main className="px-6 md:px-12">
          <section className="py-12 max-w-2xl relative overflow-visible">
            {/* Heading with cursor dragging words into place */}
            <div className="relative">
              {/* Animated drag cursor - synced with word movements */}
              <motion.div
                className="absolute pointer-events-none z-50"
                animate={{ 
                  x: [
                    // Build: flex=0, transform=200 → visual: 200 → 0
                    200, 200, 0,
                    // emails: flex=92 (100-8), transform=-150 → visual: -58 → 92
                    -58, -58, 92,
                    // like: flex=204 (220-16), transform=250 → visual: 454 → 204
                    454, 454, 204,
                    // you're: flex=286 (310-24), transform=-120 → visual: 166 → 286
                    166, 166, 286,
                    // playing: flex=408 (440-32), transform=300 → visual: 708 → 408
                    708, 708, 408,
                    // with: flex=550 (590-40), transform=-100 → visual: 450 → 550
                    450, 450, 550,
                    // LEGO: flex=652 (700-48), transform=350 → visual: 1002 → 652
                    1002, 1002, 652,
                    // blocks: flex=764 (820-56), transform=100 → visual: 864 → 764
                    864, 864, 764,
                    // Exit
                    840
                  ],
                  y: [
                    -80, -80, 8,
                    100, 100, 8,
                    -60, -60, 8,
                    120, 120, 8,
                    80, 80, 8,
                    -50, -50, 8,
                    -100, -100, 8,
                    150, 150, 8,
                    -50
                  ],
                  opacity: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
                }}
                transition={{ 
                  duration: 6,
                  times: [
                    0, 0.02, 0.10,        // Build: arrive, wait, drag
                    0.12, 0.14, 0.22,     // emails
                    0.24, 0.26, 0.34,     // like
                    0.36, 0.38, 0.46,     // you're
                    0.48, 0.50, 0.58,     // playing
                    0.60, 0.62, 0.70,     // with
                    0.72, 0.74, 0.82,     // LEGO
                    0.84, 0.86, 0.94,     // blocks
                    1                      // exit
                  ],
                  ease: "easeInOut"
                }}
              >
                <MousePointerClick className="h-8 w-8 text-primary drop-shadow-xl" />
              </motion.div>

              <h1 className="text-3xl md:text-4xl font-semibold text-[#14171a] flex flex-nowrap gap-x-2 whitespace-nowrap">
              {/* Build - cursor drags from (200,-80) to position 0 */}
              <motion.span
                initial={{ x: 200, y: -80, opacity: 0.3, scale: 0.85 }}
                animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                transition={{ duration: 0.48, delay: 0.12, ease: "easeOut" }}
              >
                Build
              </motion.span>

              {/* emails - cursor drags from (-150,100) to position ~100 */}
              <motion.span
                initial={{ x: -150, y: 100, opacity: 0.3, scale: 0.85 }}
                animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                transition={{ duration: 0.48, delay: 0.84, ease: "easeOut" }}
              >
                emails
              </motion.span>

              {/* like - cursor drags from (250,-60) to position ~220 */}
              <motion.span
                initial={{ x: 250, y: -60, opacity: 0.3, scale: 0.85 }}
                animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                transition={{ duration: 0.48, delay: 1.56, ease: "easeOut" }}
              >
                like
              </motion.span>

              {/* you're - cursor drags from (-120,120) to position ~310 */}
              <motion.span
                initial={{ x: -120, y: 120, opacity: 0.3, scale: 0.85 }}
                animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                transition={{ duration: 0.48, delay: 2.28, ease: "easeOut" }}
              >
                you're
              </motion.span>

              {/* playing - cursor drags from (300,80) to position ~440 */}
              <motion.span
                initial={{ x: 300, y: 80, opacity: 0.3, scale: 0.85 }}
                animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                transition={{ duration: 0.48, delay: 3.0, ease: "easeOut" }}
              >
                playing
              </motion.span>

              {/* with - cursor drags from (-100,-50) to position ~590 */}
              <motion.span
                initial={{ x: -100, y: -50, opacity: 0.3, scale: 0.85 }}
                animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                transition={{ duration: 0.48, delay: 3.72, ease: "easeOut" }}
              >
                with
              </motion.span>

              {/* LEGO - cursor drags from (350,-100) to position ~700 */}
              <motion.span
                className="text-primary font-bold"
                initial={{ x: 350, y: -100, opacity: 0.3, scale: 0.85, rotate: -12 }}
                animate={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.48, delay: 4.44, ease: "easeOut" }}
              >
                LEGO
              </motion.span>

              {/* blocks - cursor drags from (100,150) to position ~820 */}
              <motion.span
                className="text-primary font-bold"
                initial={{ x: 100, y: 150, opacity: 0.3, scale: 0.85, rotate: 12 }}
                animate={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.48, delay: 5.16, ease: "easeOut" }}
              >
                blocks
              </motion.span>
            </h1>
            </div>
            
            <motion.p 
              className="text-[#657786] mt-4 text-base"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 5.5, duration: 0.5 }}
            >
              Drag, drop, and export production-ready emails with a live playground.
            </motion.p>
            {!submitted ? (
              <form onSubmit={handleSubmit} className="mt-4 flex flex-col sm:flex-row gap-2.5 max-w-md">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  required
                  className="flex-1 rounded-lg border border-[#e1e8ed] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Joining...
                    </>
                  ) : (
                    <>
                      Join waitlist
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#e8f5fd] px-5 py-3 text-sm font-medium text-primary">
                ✓ You're on the list — we'll share early access soon.
              </div>
            )}
          </section>

          <section className="pt-8 pb-12 px-6 md:px-12 builder-section-bg relative landscape-bg">
            {/* Subtle overlay to ensure readability */}
            <div className="absolute inset-0 bg-white/20 pointer-events-none z-0"></div>
            {/* Fun "Play with" Header */}
            <div className="mb-4 flex items-center justify-center gap-2 relative z-10">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-md rounded-full border border-white/30 shadow-lg animate-pulse-glow hover:scale-105 transition-transform duration-300">
                <span className="text-lg animate-bounce-delayed-1">🎨</span>
                <span className="text-sm font-semibold text-[#1a237e]">
                  Try it out! Drag & drop below
                </span>
                <span className="text-lg animate-bounce-delayed-2">✨</span>
              </div>
              <ChevronDown className="h-4 w-4 text-white/80 animate-bounce drop-shadow-lg" />
            </div>
            
            <div className="h-[calc(100vh-200px)] min-h-[600px] bg-[#f5f5f7]/80 backdrop-blur-sm border border-[#e5e5e7] rounded-xl overflow-hidden shadow-sm relative z-10">
              <div className="h-full flex">
                {/* Left Sidebar - Component Palette */}
                <div className="w-[18%] min-w-[200px] border-r border-[#e5e5e7] bg-white flex flex-col">
                  <div className="p-4 border-b border-[#e5e5e7] bg-[#fafafa]">
                    <h2 className="text-sm font-semibold text-[#1d1d1f]">Components</h2>
                    <p className="text-[11px] text-[#86868b] mt-0.5">
                      Drag to build
                    </p>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-5 bg-white">
                    <div>
                      <div className="flex items-center gap-2 mb-2.5 px-0.5">
                        <h3 className="text-[10px] font-semibold text-[#86868b] uppercase tracking-wider">
                          Content
                        </h3>
                        <div className="flex-1 h-px bg-[#e5e5e7]" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {palette.map((item) => (
                          <PaletteItem key={item.id} type={item.id} label={item.label} icon={item.icon} />
                        ))}
                      </div>
                    </div>
                    {/* More components coming soon */}
                    <div className="pt-4 mt-4 border-t border-[#e5e5e7]">
                      <motion.div 
                        className="relative overflow-hidden rounded-lg bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20 p-3 cursor-pointer group hover:from-primary/15 hover:via-primary/10 hover:to-primary/15 transition-all"
                        whileHover={{ scale: 1.02 }}
                        animate={{ 
                          backgroundPosition: ["0%", "100%", "0%"],
                        }}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex items-center gap-2">
                            <motion.div
                              animate={{ 
                                scale: [1, 1.2, 1],
                                rotate: [0, 90, 0]
                              }}
                              transition={{ 
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                            >
                              <Plus className="h-5 w-5 text-primary" />
                            </motion.div>
                            <motion.span 
                              className="text-xs font-bold text-primary"
                              animate={{
                                opacity: [0.7, 1, 0.7]
                              }}
                              transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                            >
                              Many More!
                            </motion.span>
                          </div>
                          <p className="text-[9px] text-[#86868b] text-center leading-tight group-hover:text-primary/80 transition-colors">
                            <span className="font-semibold">50+</span> components coming soon
                          </p>
                          <div className="flex items-center gap-1 mt-0.5">
                            {[...Array(3)].map((_, i) => (
                              <motion.div
                                key={i}
                                className="w-1.5 h-1.5 rounded-full bg-primary/40"
                                animate={{
                                  scale: [1, 1.3, 1],
                                  opacity: [0.4, 1, 0.4]
                                }}
                                transition={{
                                  duration: 1.5,
                                  repeat: Infinity,
                                  delay: i * 0.2,
                                  ease: "easeInOut"
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col bg-[#f5f5f7]">
                  {/* Header */}
                  <div className="border-b border-[#e5e5e7] bg-white">
                    <div className="p-4 flex items-center justify-between">
                      <div>
                        <h2 className="text-sm font-semibold text-[#1d1d1f]">Email Preview</h2>
                        <p className="text-xs text-[#86868b] mt-0.5">
                          {components.length} component{components.length !== 1 ? "s" : ""} added
                        </p>
                      </div>
                      <button
                        onClick={() => setShowExportDialog(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        <Code className="h-4 w-4" />
                        Export Code
                      </button>
                    </div>
                  </div>
                  
                  {/* CTA Banner */}
                  {components.length === 0 && (
                    <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/20 px-6 py-4">
                      <div className="flex items-center gap-3 max-w-[600px] mx-auto">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Plus className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-[#1d1d1f]">
                            Start building your LEGO email!
                          </p>
                          <p className="text-xs text-[#86868b] mt-0.5">
                            Drag components from the left to start creating
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Canvas Area */}
                  <div className="flex-1 overflow-y-auto">
                    <div
                      ref={setNodeRef}
                      className={`h-full py-4 sm:py-6 md:py-8 px-2 sm:px-4 md:px-6 transition-colors duration-200 flex items-start justify-center relative ${
                        isOver ? "bg-[#e8f2ff]/30" : ""
                      }`}
                      onClick={() => setSelectedId(null)}
                    >
                      <div className="w-full max-w-full sm:max-w-[580px] lg:max-w-[720px] xl:max-w-[840px] 2xl:max-w-[920px] relative z-10">
                        {/* Email Preview Container */}
                        <div className="bg-white rounded-lg border border-[#d1d1d6] shadow-[0_4px_16px_rgba(0,0,0,0.1)] overflow-hidden min-h-[400px]">
                          {/* Traffic Light Buttons */}
                          <div className="bg-[#f5f5f7] border-b border-[#d1d1d6] px-4 py-2">
                            <div className="flex items-center gap-1.5">
                              <div className="w-3 h-3 rounded-full bg-[#ff5f57] border border-[#e0443e]"></div>
                              <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]"></div>
                              <div className="w-3 h-3 rounded-full bg-[#28ca42] border border-[#1aab29]"></div>
                            </div>
                          </div>
                          {/* Content Area - Matching React Email Container: py-5 pb-12 */}
                          <div className="pt-5 pb-12 px-0 bg-[#f5f5f7] relative">
                            <div className="relative z-10">
                              <DroppableCanvas id="canvas">
                              <SortableContext items={components.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                                {components.length === 0 ? (
                                  <div className="flex flex-col items-center justify-center py-16 text-[#86868b]">
                                    <Mail className="h-8 w-8 mb-2" />
                                    <p className="text-sm font-medium text-[#1d1d1f] mb-1">Start building your email</p>
                                    <p className="text-xs text-center max-w-xs text-[#86868b]">
                                      Drag components here
                                    </p>
                                  </div>
                                ) : (
                                  <div className="max-w-full sm:max-w-[600px] lg:max-w-[680px] xl:max-w-[720px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 py-6 sm:py-8 md:py-10 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                                    {components.map((component, index) => (
                                      <Fragment key={component.id}>
                                        <DroppableBetween id={`between-${index}`} />
                                        <SortableEmailComponent
                                          component={component}
                                          isSelected={selectedId === component.id}
                                          onSelect={() => setSelectedId(component.id)}
                                          onDelete={() => deleteComponent(component.id)}
                                          onUpdate={(updates) => {
                                            setComponents(prev => prev.map(c => 
                                              c.id === component.id ? { ...c, ...updates } : c
                                            ));
                                          }}
                                        />
                                      </Fragment>
                                    ))}
                                    <DroppableBetween id={`between-${components.length}`} />
                                  </div>
                                )}
                              </SortableContext>
                            </DroppableCanvas>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Sidebar - Properties */}
                <div className="w-[22%] min-w-[240px] border-l border-[#e5e5e7] bg-white flex flex-col">
                  <div className="p-3 border-b border-[#e5e5e7] bg-[#fafafa]">
                    <div className="flex items-center gap-2">
                      <Settings2 className="h-3.5 w-3.5 text-[#86868b]" />
                      <div>
                        <h2 className="text-xs font-semibold text-[#1d1d1f]">Properties</h2>
                        <p className="text-[10px] text-[#86868b] mt-0.5">
                          {selectedId ? "Edit component" : "Select a component"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 bg-white">
                    <PropertyPanel
                      component={selectedId ? components.find(c => c.id === selectedId) || null : null}
                      onUpdate={(updates) => {
                        if (selectedId) {
                          const component = components.find(c => c.id === selectedId);
                          if (component) {
                            setComponents(prev => prev.map(c => 
                              c.id === selectedId 
                                ? { ...c, ...updates }
                                : c
                            ));
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-[#e1e8ed] bg-white/50 backdrop-blur-sm mt-16">
          <div className="max-w-7xl mx-auto px-6 md:px-12 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Left - Branding */}
              <div className="flex items-center gap-2 text-[#14171a]">
                <MousePointerClick className="h-5 w-5 text-primary" />
                <span className="font-semibold">drag.email</span>
              </div>

              {/* Center - Main message */}
              <div className="text-[#657786] text-sm text-center flex flex-wrap items-center justify-center gap-1">
                <span>A chaotic side project by</span>
                <a 
                  href="https://twitter.com/jiatastic520" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  @jiatastic520
                </a>
                <span>fueled by</span>
                <motion.span 
                  className="inline-flex items-center gap-0.5"
                  animate={{ rotate: [0, -10, 10, -5, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
                >
                  🥤
                </motion.span>
                <span>diet cokes</span>
                <span className="text-[#86868b]">•</span>
                <span>a follow would make his day</span>
                <motion.span
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
                >
                  ❤️
                </motion.span>
              </div>

              {/* Right - Social */}
              <a 
                href="https://twitter.com/jiatastic520" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#657786] hover:text-primary transition-colors"
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            </div>

          </div>
        </footer>

        <DragOverlay>
          {activeId && draggedType ? (
            <div className="rounded-full bg-[#1e9df1] px-4 py-2 text-sm font-medium text-white shadow-lg">
              {draggedType.replace("-", " ")}
            </div>
          ) : null}
        </DragOverlay>
      </div>

      {/* Export Dialog */}
      {showExportDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowExportDialog(false);
              setExportSubmitted(false);
              setExportEmail("");
            }}
          />
          
          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={() => {
                setShowExportDialog(false);
                setExportSubmitted(false);
                setExportEmail("");
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#f5f5f7] transition-colors z-10"
            >
              <X className="h-5 w-5 text-[#86868b]" />
            </button>

            {!exportSubmitted ? (
              <div className="p-8">
                {/* Logo */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center mb-6 mx-auto">
                  <MousePointerClick className="h-8 w-8 text-primary" />
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-[#1d1d1f] text-center mb-2">
                  Export is coming soon!
                </h3>
                <p className="text-[#86868b] text-center mb-6">
                  Join the waitlist to get early access to code export, React Email integration, and more.
                </p>

                {/* Form */}
                <form onSubmit={handleExportSubmit} className="space-y-4">
                  <div>
                    <input
                      type="email"
                      value={exportEmail}
                      onChange={(e) => setExportEmail(e.target.value)}
                      placeholder="you@email.com"
                      required
                      className="w-full px-4 py-3 text-sm border border-[#d1d1d6] rounded-xl bg-[#f5f5f7] focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={exportLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {exportLoading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Joining...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4" />
                        Join Waitlist
                      </>
                    )}
                  </button>
                </form>

                {/* Features preview */}
                <div className="mt-6 pt-6 border-t border-[#e5e5e7]">
                  <p className="text-xs text-[#86868b] text-center mb-3">What you'll get:</p>
                  <div className="flex justify-center gap-4">
                    <div className="flex items-center gap-1.5 text-xs text-[#1d1d1f]">
                      <Code className="h-3.5 w-3.5 text-primary" />
                      <span>React Email</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#1d1d1f]">
                      <Mail className="h-3.5 w-3.5 text-primary" />
                      <span>HTML Export</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#1d1d1f]">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      <span>Templates</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                {/* Success state */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-6 mx-auto"
                >
                  <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
                <h3 className="text-2xl font-bold text-[#1d1d1f] mb-2">
                  You're on the list! 🎉
                </h3>
                <p className="text-[#86868b] mb-6">
                  We'll email you when export is ready. Thanks for your interest!
                </p>
                <button
                  onClick={() => {
                    setShowExportDialog(false);
                    setExportSubmitted(false);
                    setExportEmail("");
                  }}
                  className="px-6 py-2.5 bg-[#f5f5f7] text-[#1d1d1f] text-sm font-medium rounded-xl hover:bg-[#e5e5e7] transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </DndContext>
  );
}

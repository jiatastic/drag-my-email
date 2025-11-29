"use client";

import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { componentRegistry } from "@/lib/component-registry";
import { cn } from "@react-email-builder/ui";
import { ScrollArea } from "@react-email-builder/ui";
import { motion } from "motion/react";

// Clean, minimal preview components with subtle animations
function ContainerPreview() {
  return (
    <div className="w-full h-14 flex items-center justify-center">
      <motion.div 
        className="w-12 h-9 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50/50"
        whileHover={{ borderColor: "var(--primary)", scale: 1.02 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <div className="flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <motion.div 
              key={i}
              className="w-1 h-1 rounded-full bg-gray-300"
              whileHover={{ scale: 1.3, backgroundColor: "var(--primary)" }}
              transition={{ delay: i * 0.03 }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function SectionPreview() {
  return (
    <div className="w-full h-14 flex items-center justify-center">
      <motion.div 
        className="w-12 h-9 bg-gray-50 rounded-md border border-gray-200 p-1.5 flex flex-col justify-center gap-1"
        whileHover={{ borderColor: "var(--primary)", y: -1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <motion.div 
          className="h-0.5 bg-gray-300 rounded-full"
          initial={{ width: "70%" }}
          whileHover={{ width: "85%", backgroundColor: "var(--primary)" }}
        />
        <motion.div 
          className="h-0.5 bg-gray-200 rounded-full"
          initial={{ width: "50%" }}
          whileHover={{ width: "65%" }}
        />
      </motion.div>
    </div>
  );
}

function RowPreview() {
  return (
    <div className="w-full h-14 flex items-center justify-center">
      <div className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-3.5 h-7 bg-gray-100 rounded border border-gray-200"
            whileHover={{ 
              y: -2, 
              borderColor: "var(--primary)",
              backgroundColor: "rgba(30, 157, 241, 0.08)"
            }}
            transition={{ 
              type: "spring", 
              stiffness: 400, 
              damping: 20,
              delay: i * 0.02
            }}
          />
        ))}
      </div>
    </div>
  );
}

function ColumnPreview() {
  return (
    <div className="w-full h-14 flex items-center justify-center">
      <div className="flex gap-1">
        {[0, 1].map((i) => (
          <motion.div
            key={i}
            className="w-5 h-8 bg-gray-50 rounded border border-gray-200 flex flex-col p-1 gap-0.5 justify-center"
            whileHover={{ y: -2, borderColor: "var(--primary)" }}
            transition={{ type: "spring", stiffness: 400, damping: 20, delay: i * 0.03 }}
          >
            <div className="h-0.5 bg-gray-300 rounded-full" />
            <div className="h-0.5 bg-gray-200 rounded-full w-2/3" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function HeadingPreview() {
  return (
    <div className="w-full h-14 flex items-center justify-center">
      <motion.div 
        className="flex flex-col items-center gap-1"
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <motion.span 
          className="text-base font-bold text-gray-700 leading-none"
          whileHover={{ color: "var(--primary)" }}
        >
          Aa
        </motion.span>
        <motion.div 
          className="h-0.5 bg-gray-300 rounded-full"
          initial={{ width: 14 }}
          whileHover={{ width: 20, backgroundColor: "var(--primary)" }}
        />
      </motion.div>
    </div>
  );
}

function TextPreview() {
  return (
    <div className="w-full h-14 flex items-center justify-center">
      <motion.div 
        className="space-y-1 w-12"
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {[100, 80, 65].map((width, i) => (
          <motion.div
            key={i}
            className="h-[2px] bg-gray-300 rounded-full"
            style={{ width: `${width}%` }}
            whileHover={{ 
              backgroundColor: i === 0 ? "var(--primary)" : undefined 
            }}
            transition={{ delay: i * 0.02 }}
          />
        ))}
      </motion.div>
    </div>
  );
}


function DividerPreview() {
  return (
    <div className="w-full h-14 flex items-center justify-center">
      <motion.div 
        className="flex items-center gap-1"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <motion.div 
          className="h-[1.5px] bg-gray-300 rounded-full"
          initial={{ width: 16 }}
          whileHover={{ width: 20, backgroundColor: "var(--primary)" }}
        />
        <motion.div 
          className="w-1 h-1 rounded-full bg-gray-300"
          whileHover={{ backgroundColor: "var(--primary)" }}
        />
        <motion.div 
          className="h-[1.5px] bg-gray-300 rounded-full"
          initial={{ width: 16 }}
          whileHover={{ width: 20, backgroundColor: "var(--primary)" }}
        />
      </motion.div>
    </div>
  );
}

function ButtonPreview() {
  return (
    <div className="w-full h-14 flex items-center justify-center">
      <motion.div 
        className="px-2.5 py-1.5 bg-gray-800 rounded-md"
        whileHover={{ 
          backgroundColor: "var(--primary)",
          y: -2,
          boxShadow: "0 4px 12px rgba(30, 157, 241, 0.3)"
        }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
      >
        <div className="w-5 h-1 bg-white rounded-sm" />
      </motion.div>
    </div>
  );
}

function LinkPreview() {
  return (
    <div className="w-full h-14 flex items-center justify-center">
      <motion.div 
        className="flex items-center gap-0.5"
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <motion.div 
          className="w-7 h-[2px] bg-primary rounded-full"
          whileHover={{ width: 10 }}
        />
        <motion.span 
          className="text-primary text-xs font-medium"
          initial={{ x: 0 }}
          whileHover={{ x: 2 }}
        >
          →
        </motion.span>
      </motion.div>
    </div>
  );
}

function ImagePreview() {
  return (
    <div className="w-full h-14 flex items-center justify-center">
      <motion.div 
        className="w-12 h-9 bg-gray-100 rounded-md border border-gray-200 overflow-hidden"
        whileHover={{ borderColor: "var(--primary)", y: -1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <svg className="w-full h-full" viewBox="0 0 48 36" fill="none">
          <rect width="48" height="36" fill="#f9fafb"/>
          <motion.path 
            d="M0 36 L12 16 L24 36 Z" 
            fill="#e5e7eb"
            initial={{ y: 0 }}
            whileHover={{ y: -1 }}
          />
          <motion.path 
            d="M16 36 L28 10 L40 36 Z" 
            fill="#d1d5db"
            initial={{ y: 0 }}
            whileHover={{ y: -2 }}
          />
          <motion.circle 
            cx="38" cy="8" r="4" 
            fill="#d1d5db"
            whileHover={{ fill: "var(--primary)", scale: 1.1 }}
          />
        </svg>
      </motion.div>
    </div>
  );
}

function FooterPreview() {
  return (
    <div className="w-full h-14 flex items-center justify-center">
      <motion.div 
        className="w-12 h-9 bg-gray-100 rounded-md border border-gray-200 p-1.5 flex flex-col justify-end"
        whileHover={{ borderColor: "var(--primary)", y: -1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <div className="border-t border-gray-300 pt-1">
          <motion.div 
            className="h-0.5 bg-gray-300 rounded-full mx-auto"
            style={{ width: "60%" }}
            whileHover={{ backgroundColor: "var(--primary)" }}
          />
          <motion.div 
            className="h-0.5 bg-gray-200 rounded-full mx-auto mt-0.5"
            style={{ width: "40%" }}
          />
        </div>
      </motion.div>
    </div>
  );
}

function FooterTextPreview() {
  return (
    <div className="w-full h-14 flex items-center justify-center">
      <motion.div 
        className="text-center"
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <motion.span 
          className="text-[8px] text-gray-400"
          whileHover={{ color: "var(--primary)" }}
        >
          © 2024
        </motion.span>
      </motion.div>
    </div>
  );
}

function FooterLinksPreview() {
  return (
    <div className="w-full h-14 flex items-center justify-center">
      <motion.div 
        className="flex items-center gap-1"
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {[0, 1, 2].map((i) => (
          <React.Fragment key={i}>
            <motion.div 
              className="w-4 h-0.5 bg-gray-300 rounded-full"
              whileHover={{ backgroundColor: "var(--primary)" }}
            />
            {i < 2 && <span className="text-[6px] text-gray-300">•</span>}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
}

function AddressPreview() {
  return (
    <div className="w-full h-14 flex items-center justify-center">
      <motion.div 
        className="space-y-0.5 text-center"
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <motion.div 
          className="w-8 h-0.5 bg-gray-300 rounded-full mx-auto"
          whileHover={{ backgroundColor: "var(--primary)" }}
        />
        <div className="w-6 h-0.5 bg-gray-200 rounded-full mx-auto" />
      </motion.div>
    </div>
  );
}

function FooterTwoColumnPreview() {
  return (
    <div className="w-full h-14 flex items-center justify-center">
      <motion.div 
        className="w-12 h-9 bg-gray-100 rounded-md border border-gray-200 p-1 flex gap-1"
        whileHover={{ borderColor: "var(--primary)", y: -1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <div className="flex-1 border-r border-gray-200 pr-1">
          <div className="w-2 h-2 bg-gray-300 rounded-sm mb-0.5" />
          <div className="w-full h-0.5 bg-gray-300 rounded-full" />
        </div>
        <div className="flex-1 pl-1 flex flex-col justify-center">
          <div className="flex gap-0.5 mb-1">
            <div className="w-1 h-1 bg-gray-300 rounded-full" />
            <div className="w-1 h-1 bg-gray-300 rounded-full" />
          </div>
          <div className="w-full h-0.5 bg-gray-200 rounded-full" />
        </div>
      </motion.div>
    </div>
  );
}

function SocialIconsPreview() {
  const socialColors = ["#1877F2", "#000000", "#E4405F", "#0A66C2"];
  return (
    <div className="w-full h-14 flex items-center justify-center">
      <motion.div 
        className="flex gap-1.5"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {socialColors.map((color, i) => (
          <motion.div
            key={i}
            className="w-5 h-5 rounded-full flex items-center justify-center"
            style={{ backgroundColor: color }}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: i * 0.05, type: "spring", stiffness: 400, damping: 20 }}
            whileHover={{ scale: 1.2, y: -2 }}
          >
            <div className="w-2.5 h-2.5 bg-white/30 rounded-full" />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

function CodeBlockPreview() {
  return (
    <div className="w-full h-14 flex items-center justify-center">
      <motion.div 
        className="w-14 h-10 bg-[#282a36] rounded-md p-1.5 font-mono text-[6px] leading-tight overflow-hidden"
        whileHover={{ scale: 1.05, y: -1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <div className="text-[#ff79c6]">function</div>
        <div className="text-[#50fa7b]">  greet()</div>
        <div className="text-[#f8f8f2]">{"}"}</div>
      </motion.div>
    </div>
  );
}

function CodeInlinePreview() {
  return (
    <div className="w-full h-14 flex items-center justify-center">
      <motion.div 
        className="flex items-center gap-1"
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <div className="w-4 h-0.5 bg-gray-300 rounded-full" />
        <motion.span 
          className="px-1.5 py-0.5 bg-gray-100 rounded text-[8px] font-mono text-gray-700 border border-gray-200"
          whileHover={{ backgroundColor: "#e5e7eb" }}
        >
          code
        </motion.span>
        <div className="w-3 h-0.5 bg-gray-300 rounded-full" />
      </motion.div>
    </div>
  );
}

function MarkdownPreview() {
  return (
    <div className="w-full h-14 flex items-center justify-center">
      <motion.div 
        className="w-12 h-9 bg-white rounded border border-gray-200 p-1.5 space-y-1"
        whileHover={{ borderColor: "var(--primary)", y: -1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <div className="flex items-center gap-1">
          <span className="text-[8px] font-bold text-gray-600">#</span>
          <div className="w-5 h-0.5 bg-gray-400 rounded-full" />
        </div>
        <div className="flex items-center gap-0.5">
          <div className="w-3 h-0.5 bg-gray-300 rounded-full" />
          <div className="w-2 h-0.5 bg-primary/50 rounded-full" />
          <div className="w-4 h-0.5 bg-gray-300 rounded-full" />
        </div>
        <div className="flex items-center gap-0.5">
          <span className="text-[6px] text-gray-400">•</span>
          <div className="w-6 h-0.5 bg-gray-200 rounded-full" />
        </div>
      </motion.div>
    </div>
  );
}

const componentPreviews: Record<string, React.FC> = {
  Container: ContainerPreview,
  Section: SectionPreview,
  Row: RowPreview,
  Column: ColumnPreview,
  Heading: HeadingPreview,
  Text: TextPreview,
  CodeBlock: CodeBlockPreview,
  CodeInline: CodeInlinePreview,
  Markdown: MarkdownPreview,
  Divider: DividerPreview,
  Button: ButtonPreview,
  Link: LinkPreview,
  Image: ImagePreview,
  SocialIcons: SocialIconsPreview,
  Footer: FooterPreview,
  FooterSimple: FooterTextPreview,
  FooterTwoColumn: FooterTwoColumnPreview,
};

interface DraggableComponentProps {
  component: {
    name: string;
    type: string;
    icon?: string;
    category: string;
  };
  registryKey: string; // The key in componentRegistry (e.g., "Footer", "FooterSimple")
  index: number;
}

function DraggableComponent({ component, registryKey, index }: DraggableComponentProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${registryKey}`,
    data: {
      type: registryKey, // Use the registry key, not the internal type
    },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 1000,
      }
    : undefined;

  const PreviewComponent = componentPreviews[registryKey] || TextPreview;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.25, 
        delay: index * 0.03,
        ease: [0.23, 1, 0.32, 1]
      }}
      className={cn(
        "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50"
      )}
    >
      <motion.div 
        className="group relative bg-white rounded-lg overflow-hidden border border-gray-200"
        whileHover={{ 
          y: -3,
          boxShadow: "0 8px 20px -6px rgba(0,0,0,0.1)",
          borderColor: "var(--primary)"
        }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {/* Visual Preview */}
        <PreviewComponent />
        
        {/* Label */}
        <div className="px-2 py-1.5 border-t border-gray-100 bg-gray-50/50">
          <span className="text-[10px] font-semibold text-gray-500 group-hover:text-primary block text-center transition-colors">
            {component.name}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CategorySection({ 
  title, 
  components, 
  startIndex 
}: { 
  title: string; 
  components: Array<{ key: string; metadata: typeof componentRegistry[keyof typeof componentRegistry] }>; 
  startIndex: number;
}) {
  if (components.length === 0) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-2 mb-2.5 px-0.5">
        <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
          {title}
        </h3>
        <div className="flex-1 h-px bg-gray-100" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {components.map(({ key, metadata }, i) => (
          <DraggableComponent 
            key={key} 
            component={metadata} 
            registryKey={key}
            index={startIndex + i}
          />
        ))}
      </div>
    </motion.div>
  );
}

export function ComponentPalette() {
  // Use Object.entries to get both key and value
  const componentsWithKeys = Object.entries(componentRegistry).map(([key, metadata]) => ({
    key,
    metadata,
  }));
  
  // Group by category - now with keys preserved
  const layoutComponents = componentsWithKeys.filter(c => c.metadata.category === "layout");
  const contentComponents = componentsWithKeys.filter(c => c.metadata.category === "content");
  const actionComponents = componentsWithKeys.filter(c => c.metadata.category === "action");
  const mediaComponents = componentsWithKeys.filter(c => c.metadata.category === "media");
  const footerComponents = componentsWithKeys.filter(c => c.metadata.category === "footer");

  return (
    <div className="h-full border-r border-gray-200 bg-white flex flex-col">
      {/* Header */}
      <motion.div 
        className="p-4 border-b border-gray-100"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-sm font-semibold text-gray-900">Components</h2>
        <p className="text-[11px] text-gray-400 mt-0.5">
          Drag to build
        </p>
      </motion.div>
      
      {/* Components Grid */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-5">
          <CategorySection 
            title="Layout" 
            components={layoutComponents}
            startIndex={0}
          />
          
          <CategorySection 
            title="Content" 
            components={contentComponents}
            startIndex={layoutComponents.length}
          />
          
          <CategorySection 
            title="Actions" 
            components={actionComponents}
            startIndex={layoutComponents.length + contentComponents.length}
          />
          
          <CategorySection 
            title="Media" 
            components={mediaComponents}
            startIndex={layoutComponents.length + contentComponents.length + actionComponents.length}
          />
          
          <CategorySection 
            title="Footer" 
            components={footerComponents}
            startIndex={layoutComponents.length + contentComponents.length + actionComponents.length + mediaComponents.length}
          />
        </div>
      </ScrollArea>
    </div>
  );
}

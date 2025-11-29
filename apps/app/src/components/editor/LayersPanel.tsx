"use client";

import type { EmailComponent } from "@/types";
import { componentRegistry } from "@/lib/component-registry";
import { ScrollArea } from "@react-email-builder/ui";
import { 
  ChevronRight, 
  ChevronDown, 
  Trash2, 
  Eye, 
  EyeOff,
  GripVertical,
  Box,
  Type,
  Image as ImageIcon,
  Link as LinkIcon,
  Minus,
  MousePointer,
  Square,
  Rows,
  Columns,
  PanelBottom,
  Share2,
  Code,
  FileCode,
  FileType,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface LayersPanelProps {
  components: EmailComponent[];
  selectedComponentId: string | null;
  onSelectComponent: (id: string | null) => void;
  onDeleteComponent: (id: string) => void;
}

// Icon mapping for component types
const typeIcons: Record<string, React.ReactNode> = {
  Container: <Box className="h-3.5 w-3.5" />,
  Section: <Square className="h-3.5 w-3.5" />,
  Row: <Rows className="h-3.5 w-3.5" />,
  Column: <Columns className="h-3.5 w-3.5" />,
  Heading: <Type className="h-3.5 w-3.5" />,
  Text: <Type className="h-3.5 w-3.5" />,
  Button: <MousePointer className="h-3.5 w-3.5" />,
  Link: <LinkIcon className="h-3.5 w-3.5" />,
  Image: <ImageIcon className="h-3.5 w-3.5" />,
  Hr: <Minus className="h-3.5 w-3.5" />,
  Divider: <Minus className="h-3.5 w-3.5" />,
  Footer: <PanelBottom className="h-3.5 w-3.5" />,
  SocialIcons: <Share2 className="h-3.5 w-3.5" />,
  CodeBlock: <FileCode className="h-3.5 w-3.5" />,
  CodeInline: <Code className="h-3.5 w-3.5" />,
  Markdown: <FileType className="h-3.5 w-3.5" />,
};

interface LayerItemProps {
  component: EmailComponent;
  depth: number;
  selectedComponentId: string | null;
  onSelectComponent: (id: string | null) => void;
  onDeleteComponent: (id: string) => void;
  expandedIds: Set<string>;
  toggleExpanded: (id: string) => void;
}

function LayerItem({ 
  component, 
  depth, 
  selectedComponentId, 
  onSelectComponent, 
  onDeleteComponent,
  expandedIds,
  toggleExpanded,
}: LayerItemProps) {
  const hasChildren = component.children && component.children.length > 0;
  const isExpanded = expandedIds.has(component.id);
  const isSelected = selectedComponentId === component.id;
  
  // Get component display name
  const metadata = componentRegistry[component.type];
  const displayName = metadata?.name || component.type;
  
  // Get a preview of the content if it's text-based
  const getContentPreview = () => {
    if (component.props?.children && typeof component.props.children === "string") {
      const text = component.props.children;
      return text.length > 20 ? text.substring(0, 20) + "..." : text;
    }
    return null;
  };
  
  const contentPreview = getContentPreview();
  const icon = typeIcons[component.type] || <Box className="h-3.5 w-3.5" />;

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className={`
          group flex items-center gap-1 py-1.5 px-2 cursor-pointer transition-colors
          ${isSelected 
            ? "bg-primary/10 text-primary border-l-2 border-primary" 
            : "hover:bg-gray-50 border-l-2 border-transparent"
          }
        `}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onSelectComponent(component.id)}
      >
        {/* Expand/collapse toggle */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleExpanded(component.id);
            }}
            className="p-0.5 hover:bg-gray-200 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3 text-gray-500" />
            ) : (
              <ChevronRight className="h-3 w-3 text-gray-500" />
            )}
          </button>
        ) : (
          <div className="w-4" />
        )}
        
        {/* Icon */}
        <span className={`flex-shrink-0 ${isSelected ? "text-primary" : "text-gray-400"}`}>
          {icon}
        </span>
        
        {/* Name */}
        <span className={`text-xs font-medium truncate flex-1 ${isSelected ? "text-primary" : "text-gray-700"}`}>
          {displayName}
        </span>
        
        {/* Content preview */}
        {contentPreview && (
          <span className="text-[10px] text-gray-400 truncate max-w-[60px]">
            {contentPreview}
          </span>
        )}
        
        {/* Delete button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteComponent(component.id);
          }}
          className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-500 rounded transition-all"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </motion.div>
      
      {/* Children */}
      <AnimatePresence>
        {hasChildren && isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            {component.children!.map((child) => (
              <LayerItem
                key={child.id}
                component={child}
                depth={depth + 1}
                selectedComponentId={selectedComponentId}
                onSelectComponent={onSelectComponent}
                onDeleteComponent={onDeleteComponent}
                expandedIds={expandedIds}
                toggleExpanded={toggleExpanded}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function LayersPanel({ 
  components, 
  selectedComponentId, 
  onSelectComponent,
  onDeleteComponent,
}: LayersPanelProps) {
  // Track expanded layer IDs
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  
  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };
  
  // Expand all layers that contain the selected component
  const expandAll = () => {
    const getAllIds = (comps: EmailComponent[]): string[] => {
      return comps.flatMap((c) => [c.id, ...(c.children ? getAllIds(c.children) : [])]);
    };
    setExpandedIds(new Set(getAllIds(components)));
  };
  
  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Layers</h3>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {components.length} top-level component{components.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={expandAll}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Expand all"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={collapseAll}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Collapse all"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      
      {/* Layers list */}
      <ScrollArea className="flex-1">
        <div className="py-2">
          {components.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Box className="h-5 w-5 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">No components yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Drag components from the palette to get started
              </p>
            </div>
          ) : (
            components.map((component) => (
              <LayerItem
                key={component.id}
                component={component}
                depth={0}
                selectedComponentId={selectedComponentId}
                onSelectComponent={onSelectComponent}
                onDeleteComponent={onDeleteComponent}
                expandedIds={expandedIds}
                toggleExpanded={toggleExpanded}
              />
            ))
          )}
        </div>
      </ScrollArea>
      
      {/* Click to deselect hint */}
      {selectedComponentId && (
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
          <button
            onClick={() => onSelectComponent(null)}
            className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
          >
            Click to deselect • Edit global styles
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import Link from "next/link";
import { ComponentPalette } from "./editor/ComponentPalette";
import { EmailCanvas } from "./editor/EmailCanvas";
import { PropertyPanel } from "./editor/PropertyPanel";
import { CodePreview } from "./editor/CodePreview";
import { TemplateManager } from "./templates/TemplateManager";
import { AIAssistantPanel } from "./ai/AIAssistantPanel";
import { UserMenu } from "./auth/UserMenu";
import { ThemeToggle } from "./theme/ThemeToggle";
import { useTheme } from "./theme/ThemeProvider";
import { useEmailTemplate } from "@/hooks/useEmailTemplate";
import { DEFAULT_DARK_GLOBAL_STYLES, DEFAULT_LIGHT_GLOBAL_STYLES } from "@/hooks/useEmailTemplate";
import type { EmailComponent, TailwindConfig, DefaultChildComponent, EmailGlobalStyles } from "@/types";
import { componentRegistry } from "@/lib/component-registry";
import { useEffect, useId, useMemo, useState, useCallback } from "react";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger,
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@react-email-builder/ui";
import { Settings2, FolderOpen, GripVertical, Eye, Code2, Monitor, Smartphone, Layers, LayoutGrid, Sparkles } from "lucide-react";

export type DeviceType = "desktop" | "mobile";

export function EmailBuilder() {
  const { resolvedTheme } = useTheme();
  const {
    components,
    selectedComponentId,
    setSelectedComponentId,
    addComponent,
    updateComponent,
    deleteComponent,
    moveComponent,
    moveComponentById,
    setComponents,
    getComponentById,
    globalStyles,
    setGlobalStyles,
    updateGlobalStyles,
  } = useEmailTemplate();

  // Keep the email canvas defaults in sync with the app theme, but never overwrite user-customized styles.
  const themeDefaultStyles = useMemo(
    () => (resolvedTheme === "dark" ? DEFAULT_DARK_GLOBAL_STYLES : DEFAULT_LIGHT_GLOBAL_STYLES),
    [resolvedTheme]
  );
  const lightDefaultsStr = useMemo(() => JSON.stringify(DEFAULT_LIGHT_GLOBAL_STYLES), []);
  const darkDefaultsStr = useMemo(() => JSON.stringify(DEFAULT_DARK_GLOBAL_STYLES), []);
  const globalStylesStr = useMemo(() => JSON.stringify(globalStyles), [globalStyles]);
  useEffect(() => {
    const isStillDefault = globalStylesStr === lightDefaultsStr || globalStylesStr === darkDefaultsStr;
    if (!isStillDefault) return;
    // Only swap when it actually changes, to avoid re-renders.
    const nextStr = JSON.stringify(themeDefaultStyles);
    if (globalStylesStr !== nextStr) {
      setGlobalStyles(themeDefaultStyles);
    }
  }, [darkDefaultsStr, globalStylesStr, lightDefaultsStr, setGlobalStyles, themeDefaultStyles]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedType, setDraggedType] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<"preview" | "code">("preview");
  const [deviceType, setDeviceType] = useState<DeviceType>("desktop");
  const [tailwindConfig, setTailwindConfig] = useState<TailwindConfig | undefined>(undefined);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );
  const reactId = useId();
  const dndContextId = `dnd-describedby-${reactId.replace(/:/g, "")}`;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    // Get component type for palette items
    if (event.active.id.toString().startsWith("palette-")) {
      setDraggedType(event.active.data.current?.type || null);
    }
  };

  // Helper to generate unique IDs
  let idCounter = 0;
  const generateUniqueId = () => {
    idCounter++;
    return `component-${Date.now()}-${idCounter}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Helper to convert defaultChildren to EmailComponent with IDs
  const createChildComponents = (defaultChildren?: DefaultChildComponent[]): EmailComponent[] | undefined => {
    if (!defaultChildren || defaultChildren.length === 0) return undefined;
    
    return defaultChildren.map(child => {
      const childComponent: EmailComponent = {
        id: generateUniqueId(),
        type: child.type,
        props: { ...child.props },
      };
      
      // Recursively create nested children
      if (child.children && child.children.length > 0) {
        childComponent.children = createChildComponents(child.children);
      }
      
      return childComponent;
    });
  };

  // Helper to create a new component from registry
  const createComponentFromRegistry = (componentType: string): EmailComponent | null => {
    const metadata = componentRegistry[componentType];
    if (!metadata) return null;

    return {
      id: `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: metadata.type, // Use the actual type (e.g., "Section" for "Footer")
      props: { ...metadata.defaultProps },
      children: createChildComponents(metadata.defaultChildren),
    };
  };

  // Helper to add component to a container's children
  const addToContainer = (containerId: string, componentType: string) => {
    const newComponent = createComponentFromRegistry(componentType);
    if (!newComponent) return;

    // Find and update the container
    const updateChildren = (comps: EmailComponent[]): EmailComponent[] => {
      return comps.map(comp => {
        if (comp.id === containerId) {
          return {
            ...comp,
            children: [...(comp.children || []), newComponent],
          };
        }
        if (comp.children) {
          return {
            ...comp,
            children: updateChildren(comp.children),
          };
        }
        return comp;
      });
    };

    setComponents(updateChildren(components));
  };

  // Helper to find all component IDs in a flat list (including nested)
  const getAllComponentIds = (comps: EmailComponent[]): string[] => {
    const ids: string[] = [];
    const traverse = (items: EmailComponent[]) => {
      for (const item of items) {
        ids.push(item.id);
        if (item.children) traverse(item.children);
      }
    };
    traverse(comps);
    return ids;
  };

  // Helper to find the index of a component within its siblings
  const findIndexInSiblings = (componentId: string, siblings: EmailComponent[]): number => {
    return siblings.findIndex(c => c.id === componentId);
  };

  // Helper to find siblings of a component
  const findSiblings = (componentId: string, comps: EmailComponent[]): EmailComponent[] | null => {
    // Check root level
    if (comps.some(c => c.id === componentId)) {
      return comps;
    }
    // Check nested
    for (const comp of comps) {
      if (comp.children) {
        if (comp.children.some(c => c.id === componentId)) {
          return comp.children;
        }
        const found = findSiblings(componentId, comp.children);
        if (found) return found;
      }
    }
    return null;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setDraggedType(null);

    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    // Handle dropping from palette
    if (activeId.startsWith("palette-")) {
      const componentType = active.data.current?.type;
      if (!componentType) return;

      // Dropping into a container
      if (overId.startsWith("container-")) {
        const containerId = overId.replace("container-", "");
        addToContainer(containerId, componentType);
        return;
      }

      // Check if dropping between components
      if (overId.startsWith("between-")) {
        const index = parseInt(overId.replace("between-", ""));
        const newComponent = createComponentFromRegistry(componentType);
        if (newComponent) {
          setComponents((prev) => {
            const newComponents = [...prev];
            newComponents.splice(index, 0, newComponent);
            return newComponents;
          });
        }
        return;
      }

      // Dropping on canvas
      if (overId === "canvas") {
        const newComponent = createComponentFromRegistry(componentType);
        if (newComponent) {
          addComponent(newComponent);
        }
      }
      return;
    }

    // Handle reordering (including nested)
    if (overId === "canvas") {
      return;
    }

    // Don't do anything if dropping on container
    if (overId.startsWith("container-")) {
      return;
    }

    // Handle dropping between components
    if (overId.startsWith("between-")) {
      const newIndex = parseInt(overId.replace("between-", ""));
      const oldIndex = components.findIndex((c) => c.id === activeId);
      if (oldIndex !== -1) {
        setComponents((prev) => {
          const newComponents = [...prev];
          const [moved] = newComponents.splice(oldIndex, 1);
          if (!moved) return prev;
          // Adjust index if removing before the target
          const adjustedIndex = oldIndex < newIndex ? newIndex - 1 : newIndex;
          newComponents.splice(adjustedIndex, 0, moved);
          return newComponents;
        });
      }
      return;
    }

    // Find siblings of the active component
    const activeSiblings = findSiblings(activeId, components);
    const overSiblings = findSiblings(overId, components);

    // Only allow reordering within the same parent
    if (activeSiblings && overSiblings && activeSiblings === overSiblings) {
      const oldIndex = findIndexInSiblings(activeId, activeSiblings);
      const newIndex = findIndexInSiblings(overId, overSiblings);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        // Use moveComponentById for nested components
        moveComponentById(activeId, newIndex);
      }
    }
  };

  return (
    <DndContext
      id={dndContextId}
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-screen bg-background flex flex-col">
        {/* Top Header Bar */}
        <div className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 flex-shrink-0">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-12 items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-foreground">Builder</span>
                <div className="h-4 w-px bg-border" />
                <Link 
                  href="/assets" 
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Assets
                </Link>
              </div>
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <UserMenu />
              </div>
            </div>
          </div>
        </div>
        
        <ResizablePanelGroup direction="horizontal" className="flex-1" autoSaveId="email-builder-layout">
          {/* Left Sidebar - Component Palette & Layers */}
          <ResizablePanel 
            id="left-sidebar"
            defaultSize={18} 
            minSize={15} 
            maxSize={30}
            className="bg-background"
          >
            <div className="h-full flex flex-col border-r overflow-hidden">
              <Tabs defaultValue="components" className="flex-1 flex flex-col h-full overflow-hidden">
                <TabsList className="w-full rounded-none border-b bg-transparent h-10 p-0 flex-shrink-0">
                  <TabsTrigger 
                    value="components" 
                    className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent gap-1.5 text-xs"
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    Components
                  </TabsTrigger>
                  <TabsTrigger 
                    value="ai" 
                    className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent gap-1.5 text-xs"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    AI
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="components" className="flex-1 m-0 overflow-hidden h-[calc(100%-40px)]">
                  <ComponentPalette />
                </TabsContent>
                
                <TabsContent value="ai" className="flex-1 m-0 overflow-hidden h-[calc(100%-40px)]">
                  <AIAssistantPanel
                    components={components}
                    globalStyles={globalStyles}
                    onApplyTemplate={useCallback((nextComponents: EmailComponent[]) => {
                      setComponents(nextComponents);
                      setSelectedComponentId(null);
                    }, [])}
                    onUpdateGlobalStyles={useCallback((styles: Partial<EmailGlobalStyles>) => {
                      setGlobalStyles((prev) => ({ ...prev, ...styles }));
                    }, [])}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          {/* Main Content Area - Preview or Code */}
          <ResizablePanel id="main-content" defaultSize={57} minSize={40}>
            <div className="h-full flex flex-col bg-muted/20">
              {/* Header with Device Selector and View Toggle */}
              <div className="border-b bg-background">
                <div className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Email Preview</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {components.length} component{components.length !== 1 ? "s" : ""} added
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                  {/* Device selector */}
                  <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-1">
                    <button
                      onClick={() => setDeviceType("desktop")}
                      className={`p-2 rounded-md transition-colors ${
                        deviceType === "desktop" 
                          ? "bg-background text-foreground" 
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      title="Desktop (full width)"
                    >
                      <Monitor className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeviceType("mobile")}
                      className={`p-2 rounded-md transition-colors ${
                        deviceType === "mobile" 
                          ? "bg-background text-foreground" 
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      title="Mobile (375px)"
                    >
                      <Smartphone className="h-4 w-4" />
                    </button>
                </div>
                
                    {/* View toggle (Preview / Code) */}
                    <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-1">
                      <button
                        onClick={() => setPreviewTab("preview")}
                        className={`p-2 rounded-md transition-colors ${
                          previewTab === "preview" 
                            ? "bg-background text-foreground" 
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                        title="Preview"
                    >
                      <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setPreviewTab("code")}
                        className={`p-2 rounded-md transition-colors ${
                          previewTab === "code" 
                            ? "bg-background text-foreground" 
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                        title="View Code"
                    >
                      <Code2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-auto min-h-0">
                {previewTab === "preview" ? (
                  <EmailCanvas
                    components={components}
                    selectedComponentId={selectedComponentId}
                    onSelectComponent={setSelectedComponentId}
                    onDeleteComponent={deleteComponent}
                    onUpdateComponent={updateComponent}
                    deviceType={deviceType}
                    tailwindConfig={tailwindConfig}
                    globalStyles={globalStyles}
                  />
                ) : (
                  <CodePreview 
                    components={components} 
                    tailwindConfig={tailwindConfig} 
                    globalStyles={globalStyles}
                    onApplyCode={setComponents}
                  />
                )}
              </div>
            </div>
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          {/* Right Sidebar - Properties & Templates */}
          <ResizablePanel 
            id="right-sidebar"
            defaultSize={25} 
            minSize={18} 
            maxSize={35}
            className="bg-background"
          >
            <div className="h-full flex flex-col border-l overflow-hidden">
              <Tabs defaultValue="properties" className="flex-1 flex flex-col h-full overflow-hidden">
                <TabsList className="w-full rounded-none border-b bg-transparent h-10 p-0 flex-shrink-0">
                  <TabsTrigger 
                    value="properties" 
                    className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent gap-2"
                  >
                    <Settings2 className="h-4 w-4" />
                    Properties
                  </TabsTrigger>
                  <TabsTrigger 
                    value="templates" 
                    className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent gap-2"
                  >
                    <FolderOpen className="h-4 w-4" />
                    Templates
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="properties" className="flex-1 m-0 overflow-hidden h-[calc(100%-40px)]">
                  <PropertyPanel
                    component={selectedComponentId ? getComponentById(selectedComponentId) : null}
                    onUpdate={(updates) => {
                      if (selectedComponentId) {
                        updateComponent(selectedComponentId, updates);
                      }
                    }}
                    globalStyles={globalStyles}
                    onUpdateGlobalStyles={updateGlobalStyles}
                  />
                </TabsContent>
                
                <TabsContent value="templates" className="flex-1 m-0 overflow-hidden h-[calc(100%-40px)]">
                  <TemplateManager
                    components={components}
                    onLoadTemplate={(loadedComponents, config, templateGlobalStyles) => {
                      setComponents(loadedComponents);
                      setTailwindConfig(config);
                      if (templateGlobalStyles) {
                        setGlobalStyles(templateGlobalStyles);
                      }
                      setSelectedComponentId(null);
                    }}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      
      {/* Drag Overlay */}
      <DragOverlay dropAnimation={null}>
        {activeId ? (
          <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
            <GripVertical className="h-4 w-4" />
            {activeId.toString().startsWith("palette-") ? (
              <span>{draggedType || "Component"}</span>
            ) : (
              <span>Moving component</span>
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

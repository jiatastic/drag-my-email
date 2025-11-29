"use client";

import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { ComponentPalette } from "./editor/ComponentPalette";
import { EmailCanvas } from "./editor/EmailCanvas";
import { PropertyPanel } from "./editor/PropertyPanel";
import { CodePreview } from "./editor/CodePreview";
import { TemplateManager } from "./templates/TemplateManager";
import { LayersPanel } from "./editor/LayersPanel";
import { useEmailTemplate } from "@/hooks/useEmailTemplate";
import type { EmailComponent, TailwindConfig, DefaultChildComponent, EmailGlobalStyles } from "@/types";
import { componentRegistry } from "@/lib/component-registry";
import { useId, useState } from "react";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger,
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@react-email-builder/ui";
import { Settings2, FolderOpen, GripVertical, Eye, Code2, Monitor, Laptop, Smartphone, Layers, LayoutGrid } from "lucide-react";

export type DeviceType = "desktop" | "tablet" | "mobile";

export function EmailBuilder() {
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
      <div className="h-screen bg-background">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Left Sidebar - Component Palette & Layers */}
          <ResizablePanel 
            defaultSize={18} 
            minSize={15} 
            maxSize={30}
            className="bg-background"
          >
            <div className="h-full flex flex-col border-r overflow-hidden">
              <Tabs defaultValue="components" className="flex-1 flex flex-col h-full overflow-hidden">
                <TabsList className="w-full rounded-none border-b bg-transparent h-11 p-0 flex-shrink-0">
                  <TabsTrigger 
                    value="components" 
                    className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent gap-1.5 text-xs"
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    Components
                  </TabsTrigger>
                  <TabsTrigger 
                    value="layers" 
                    className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent gap-1.5 text-xs"
                  >
                    <Layers className="h-3.5 w-3.5" />
                    Layers
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="components" className="flex-1 m-0 overflow-hidden h-[calc(100%-44px)]">
                  <ComponentPalette />
                </TabsContent>
                
                <TabsContent value="layers" className="flex-1 m-0 overflow-hidden h-[calc(100%-44px)]">
                  <LayersPanel
                    components={components}
                    selectedComponentId={selectedComponentId}
                    onSelectComponent={setSelectedComponentId}
                    onDeleteComponent={deleteComponent}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          {/* Main Content Area - Preview or Code */}
          <ResizablePanel defaultSize={57} minSize={40}>
            <div className="h-full flex flex-col bg-muted/20">
              {/* Header with Device Selector and View Toggle */}
              <div className="border-b bg-background">
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">Email Preview</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {components.length} component{components.length !== 1 ? "s" : ""} added
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                  {/* Device selector */}
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setDeviceType("desktop")}
                      className={`p-2 rounded-md transition-colors ${
                        deviceType === "desktop" 
                          ? "bg-white shadow-sm text-gray-900" 
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                      title="Desktop (full width)"
                    >
                      <Monitor className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeviceType("tablet")}
                      className={`p-2 rounded-md transition-colors ${
                        deviceType === "tablet" 
                          ? "bg-white shadow-sm text-gray-900" 
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                      title="Tablet (768px)"
                    >
                      <Laptop className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeviceType("mobile")}
                      className={`p-2 rounded-md transition-colors ${
                        deviceType === "mobile" 
                          ? "bg-white shadow-sm text-gray-900" 
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                      title="Mobile (375px)"
                    >
                      <Smartphone className="h-4 w-4" />
                    </button>
                </div>
                
                    {/* View toggle (Preview / Code) */}
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setPreviewTab("preview")}
                        className={`p-2 rounded-md transition-colors ${
                          previewTab === "preview" 
                            ? "bg-white shadow-sm text-gray-900" 
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                        title="Preview"
                    >
                      <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setPreviewTab("code")}
                        className={`p-2 rounded-md transition-colors ${
                          previewTab === "code" 
                            ? "bg-white shadow-sm text-gray-900" 
                            : "text-gray-500 hover:text-gray-700"
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
              <div className="flex-1 overflow-hidden">
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
                  <CodePreview components={components} tailwindConfig={tailwindConfig} globalStyles={globalStyles} />
                )}
              </div>
            </div>
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          {/* Right Sidebar - Properties & Templates */}
          <ResizablePanel 
            defaultSize={25} 
            minSize={18} 
            maxSize={35}
            className="bg-background"
          >
            <div className="h-full flex flex-col border-l overflow-hidden">
              <Tabs defaultValue="properties" className="flex-1 flex flex-col h-full overflow-hidden">
                <TabsList className="w-full rounded-none border-b bg-transparent h-12 p-0 flex-shrink-0">
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
                
                <TabsContent value="properties" className="flex-1 m-0 overflow-hidden h-[calc(100%-48px)]">
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
                
                <TabsContent value="templates" className="flex-1 m-0 overflow-hidden h-[calc(100%-48px)]">
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
          <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-2xl flex items-center gap-2 text-sm font-medium">
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

import { useState, useCallback } from "react";
import { EmailComponent, EmailGlobalStyles } from "@/types";
import { supabase } from "@/lib/supabase";

// Default global styles for emails
const defaultGlobalStyles: EmailGlobalStyles = {
  bodyBackgroundColor: "#f4f4f5",
  containerBackgroundColor: "#ffffff",
  maxWidth: "600px",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  textColor: "#1a1a1a",
  fontSize: "16px",
  containerPadding: "20px",
};

// Helper to recursively update a component by ID
function updateComponentRecursive(
  components: EmailComponent[],
  id: string,
  updates: Partial<EmailComponent>
): EmailComponent[] {
  return components.map((comp) => {
    if (comp.id === id) {
      return { ...comp, ...updates };
    }
    if (comp.children && comp.children.length > 0) {
      return {
        ...comp,
        children: updateComponentRecursive(comp.children, id, updates),
      };
    }
    return comp;
  });
}

// Helper to recursively delete a component by ID
function deleteComponentRecursive(
  components: EmailComponent[],
  id: string
): EmailComponent[] {
  return components
    .filter((comp) => comp.id !== id)
    .map((comp) => {
      if (comp.children && comp.children.length > 0) {
        return {
          ...comp,
          children: deleteComponentRecursive(comp.children, id),
        };
      }
      return comp;
    });
}

// Helper to find a component by ID (including nested)
function findComponentById(
  components: EmailComponent[],
  id: string
): EmailComponent | null {
  for (const comp of components) {
    if (comp.id === id) return comp;
    if (comp.children && comp.children.length > 0) {
      const found = findComponentById(comp.children, id);
      if (found) return found;
    }
  }
  return null;
}

// Helper to find parent of a component by ID
function findParentOfComponent(
  components: EmailComponent[],
  id: string,
  parent: EmailComponent | null = null
): { parent: EmailComponent | null; index: number } | null {
  for (let i = 0; i < components.length; i++) {
    const comp = components[i];
    if (comp.id === id) {
      return { parent, index: i };
    }
    if (comp.children && comp.children.length > 0) {
      const found = findParentOfComponent(comp.children, id, comp);
      if (found) return found;
    }
  }
  return null;
}

// Helper to move a component within its parent's children array
function moveComponentInTree(
  components: EmailComponent[],
  componentId: string,
  newIndex: number
): EmailComponent[] {
  // Check if it's at the root level
  const rootIndex = components.findIndex(c => c.id === componentId);
  if (rootIndex !== -1) {
    const newComponents = [...components];
    const [moved] = newComponents.splice(rootIndex, 1);
    if (!moved) return components;
    newComponents.splice(newIndex, 0, moved);
    return newComponents;
  }

  // Otherwise, find in nested children
  return components.map(comp => {
    if (comp.children && comp.children.length > 0) {
      const childIndex = comp.children.findIndex(c => c.id === componentId);
      if (childIndex !== -1) {
        const newChildren = [...comp.children];
        const [moved] = newChildren.splice(childIndex, 1);
        if (!moved) return comp;
        newChildren.splice(newIndex, 0, moved);
        return { ...comp, children: newChildren };
      }
      return {
        ...comp,
        children: moveComponentInTree(comp.children, componentId, newIndex),
      };
    }
    return comp;
  });
}

export function useEmailTemplate() {
  const [components, setComponents] = useState<EmailComponent[]>([]);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [globalStyles, setGlobalStyles] = useState<EmailGlobalStyles>(defaultGlobalStyles);

  const addComponent = useCallback((component: EmailComponent) => {
    setComponents((prev) => [...prev, component]);
  }, []);

  const updateGlobalStyles = useCallback((updates: Partial<EmailGlobalStyles>) => {
    setGlobalStyles((prev) => ({ ...prev, ...updates }));
  }, []);

  const updateComponent = useCallback((id: string, updates: Partial<EmailComponent>) => {
    setComponents((prev) => updateComponentRecursive(prev, id, updates));
  }, []);

  const deleteComponent = useCallback((id: string) => {
    setComponents((prev) => deleteComponentRecursive(prev, id));
    if (selectedComponentId === id) {
      setSelectedComponentId(null);
    }
  }, [selectedComponentId]);

  const moveComponent = useCallback((fromIndex: number, toIndex: number) => {
    setComponents((prev) => {
      const newComponents = [...prev];
      const [moved] = newComponents.splice(fromIndex, 1);
      if (!moved) return prev;
      newComponents.splice(toIndex, 0, moved);
      return newComponents;
    });
  }, []);

  // Move component by ID to a new index (works for nested components)
  const moveComponentById = useCallback((componentId: string, newIndex: number) => {
    setComponents((prev) => moveComponentInTree(prev, componentId, newIndex));
  }, []);

  const clearTemplate = useCallback(() => {
    setComponents([]);
    setSelectedComponentId(null);
  }, []);

  // Expose findComponentById
  const getComponentById = useCallback((id: string) => {
    return findComponentById(components, id);
  }, [components]);

  return {
    components,
    selectedComponentId,
    setSelectedComponentId,
    addComponent,
    updateComponent,
    deleteComponent,
    moveComponent,
    moveComponentById,
    clearTemplate,
    setComponents,
    getComponentById,
    globalStyles,
    setGlobalStyles,
    updateGlobalStyles,
  };
}


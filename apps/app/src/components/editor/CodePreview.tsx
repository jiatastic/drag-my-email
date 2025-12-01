"use client";

import type { EmailComponent, TailwindConfig, EmailGlobalStyles } from "@/types";
import { generateFullEmailJSX } from "@/lib/email-renderer";
import { ScrollArea, Button } from "@react-email-builder/ui";
import { Copy, Check, FileCode2, FileText, Circle, Pencil, Eye, Download, Save } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import prettier from "prettier/standalone";
import htmlParser from "prettier/plugins/html";

// Custom VS Code-like dark theme
const editorTheme: { [key: string]: React.CSSProperties } = {
  'code[class*="language-"]': {
    color: "#d4d4d4",
    background: "none",
    fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', Menlo, Monaco, Consolas, monospace",
    fontSize: "13px",
    textAlign: "left",
    whiteSpace: "pre",
    wordSpacing: "normal",
    wordBreak: "normal",
    wordWrap: "normal",
    lineHeight: "1.6",
    tabSize: 2,
    hyphens: "none",
  },
  'pre[class*="language-"]': {
    color: "#d4d4d4",
    background: "#1e1e1e",
    fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', Menlo, Monaco, Consolas, monospace",
    fontSize: "13px",
    textAlign: "left",
    whiteSpace: "pre",
    wordSpacing: "normal",
    wordBreak: "normal",
    wordWrap: "normal",
    lineHeight: "1.6",
    tabSize: 2,
    hyphens: "none",
    padding: "1em",
    margin: "0",
    overflow: "auto",
  },
  comment: { color: "#6a9955" },
  prolog: { color: "#6a9955" },
  doctype: { color: "#6a9955" },
  cdata: { color: "#6a9955" },
  punctuation: { color: "#d4d4d4" },
  namespace: { opacity: 0.7 },
  property: { color: "#9cdcfe" },
  tag: { color: "#569cd6" },
  boolean: { color: "#569cd6" },
  number: { color: "#b5cea8" },
  constant: { color: "#4fc1ff" },
  symbol: { color: "#b5cea8" },
  deleted: { color: "#ce9178" },
  selector: { color: "#d7ba7d" },
  "attr-name": { color: "#9cdcfe" },
  string: { color: "#ce9178" },
  char: { color: "#ce9178" },
  builtin: { color: "#4ec9b0" },
  inserted: { color: "#b5cea8" },
  operator: { color: "#d4d4d4" },
  entity: { color: "#569cd6", cursor: "help" },
  url: { color: "#4fc1ff" },
  ".language-css .token.string": { color: "#ce9178" },
  ".style .token.string": { color: "#ce9178" },
  variable: { color: "#9cdcfe" },
  atrule: { color: "#c586c0" },
  "attr-value": { color: "#ce9178" },
  function: { color: "#dcdcaa" },
  "class-name": { color: "#4ec9b0" },
  keyword: { color: "#c586c0" },
  regex: { color: "#d16969" },
  important: { color: "#569cd6", fontWeight: "bold" },
  bold: { fontWeight: "bold" },
  italic: { fontStyle: "italic" },
};

interface CodePreviewProps {
  components: EmailComponent[];
  tailwindConfig?: TailwindConfig;
  globalStyles?: EmailGlobalStyles;
  onApplyCode?: (components: EmailComponent[]) => void;
}

export function CodePreview({ components, tailwindConfig, globalStyles, onApplyCode }: CodePreviewProps) {
  const [copied, setCopied] = useState<"jsx" | "html" | null>(null);
  const [activeTab, setActiveTab] = useState<"jsx" | "html">("jsx");
  const [htmlCode, setHtmlCode] = useState<string>("<!-- Loading... -->");
  const [isEditing, setIsEditing] = useState(false);
  const [editedJsxCode, setEditedJsxCode] = useState<string>("");
  const [editedHtmlCode, setEditedHtmlCode] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Generate full JSX code with Tailwind wrapper
  const generatedJsxCode = generateFullEmailJSX(components, {
    useTailwind: true,
    tailwindConfig,
    globalStyles,
  });

  // Sync generated code to edited code when not editing
  useEffect(() => {
    if (!isEditing) {
      setEditedJsxCode(generatedJsxCode);
    }
  }, [generatedJsxCode, isEditing]);

  // Generate HTML code asynchronously
  useEffect(() => {
    const generateHtml = async () => {
      try {
        const { renderEmailTemplate } = await import("@/lib/email-renderer");
        const html = await renderEmailTemplate(components, {
          useTailwind: true,
          tailwindConfig,
          globalStyles,
        });
        
        // Format HTML with Prettier for better readability
        const formattedHtml = await prettier.format(html, {
          parser: "html",
          plugins: [htmlParser],
          printWidth: 100,
          tabWidth: 2,
          htmlWhitespaceSensitivity: "ignore",
        });
        
        setHtmlCode(formattedHtml);
        if (!isEditing) {
          setEditedHtmlCode(formattedHtml);
        }
      } catch (error) {
        console.error("Error rendering email:", error);
        const errorHtml = "<!-- Error rendering email template -->";
        setHtmlCode(errorHtml);
        if (!isEditing) {
          setEditedHtmlCode(errorHtml);
        }
      }
    };
    
    generateHtml();
  }, [components, tailwindConfig, globalStyles, isEditing]);

  const copyToClipboard = async (text: string, type: "jsx" | "html") => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadCode = (text: string, type: "jsx" | "html") => {
    const filename = type === "jsx" ? "email.tsx" : "email.html";
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Parse HTML code and convert to EmailComponent structure
  const parseHtmlToComponents = (html: string): EmailComponent[] => {
    try {
      // Create a temporary DOM parser
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      
      // Find the Container element (main content wrapper inside body)
      // react-email renders content inside body > div (Container)
      const container = doc.querySelector("body > div[style*='max-width'], body > div > div") || 
                       doc.querySelector("body > div") || 
                       doc.body;
      
      // Get direct children of container (skip nested wrappers)
      let containerChildren: Element[] = [];
      if (container && container.children.length > 0) {
        containerChildren = Array.from(container.children) as Element[];
      } else if (container && container.tagName.toLowerCase() === "div") {
        // If container itself is a div with content, use it
        containerChildren = [container];
      }
      
      // Component type mapping from HTML tags to component types
      const tagToComponentType: Record<string, string> = {
        "div": "Section",
        "h1": "Heading",
        "h2": "Heading",
        "h3": "Heading",
        "h4": "Heading",
        "h5": "Heading",
        "h6": "Heading",
        "p": "Text",
        "a": "Link",
        "button": "Button",
        "img": "Image",
        "hr": "Hr",
        "table": "Row", // ResponsiveRow renders as table
        "tr": "Row",
        "td": "Column", // ResponsiveColumn renders as td
      };

      let idCounter = 0;
      const generateId = () => `component-${Date.now()}-${idCounter++}-${Math.random().toString(36).substr(2, 9)}`;

      const parseElement = (element: Element, depth: number = 0): EmailComponent | null => {
        const tagName = element.tagName.toLowerCase();
        
        // Skip script, style, and other non-content tags
        if (["script", "style", "head", "meta", "title", "body", "html"].includes(tagName)) {
          return null;
        }

        // Check if this is a ResponsiveRow (table with specific classes)
        const className = element.className?.toString() || "";
        const isResponsiveRow = tagName === "table" && (
          className.includes("mx-[12px]") || 
          className.includes("my-[16px]") ||
          element.getAttribute("role") === "presentation"
        );
        
        // Check if this is a ResponsiveColumn (td with specific structure)
        const isResponsiveColumn = tagName === "td" && (
          className.includes("pr-[24px]") ||
          className.includes("w-64") ||
          element.parentElement?.tagName.toLowerCase() === "tr"
        );

        // Map tag to component type
        let componentType = tagToComponentType[tagName] || "Section";
        
        // Override for responsive components
        if (isResponsiveRow) {
          componentType = "Row";
        } else if (isResponsiveColumn) {
          componentType = "Column";
        }
        
        // Special handling for headings
        if (tagName.startsWith("h") && tagName.length === 2 && !isResponsiveRow) {
          componentType = "Heading";
        }

        // Extract props
        const props: Record<string, any> = {};
        const style: Record<string, string> = {};
        
        // Extract className
        const classNameAttr = element.getAttribute("class");
        if (classNameAttr) {
          props.className = classNameAttr;
        }

        // Extract style attributes
        const styleAttr = element.getAttribute("style");
        if (styleAttr) {
          styleAttr.split(";").forEach(rule => {
            const trimmed = rule.trim();
            if (!trimmed) return;
            const [key, ...valueParts] = trimmed.split(":");
            const value = valueParts.join(":").trim();
            if (key && value) {
              const camelKey = key.trim().replace(/-([a-z])/g, (g) => g[1].toUpperCase());
              style[camelKey] = value;
            }
          });
          if (Object.keys(style).length > 0) {
            props.style = style;
          }
        }

        // Extract specific attributes based on component type
        if (tagName === "img") {
          props.src = element.getAttribute("src") || "";
          props.alt = element.getAttribute("alt") || "";
          const width = element.getAttribute("width");
          const height = element.getAttribute("height");
          if (width) props.width = width;
          if (height) props.height = height;
          componentType = "Image";
        } else if (tagName === "a") {
          props.href = element.getAttribute("href") || "#";
          componentType = "Link";
        } else if (componentType === "Heading" && tagName.match(/^h[1-6]$/)) {
          props.as = tagName;
        } else if (tagName === "button") {
          componentType = "Button";
          const href = element.getAttribute("href");
          if (href) props.href = href;
        }

        // Extract text content (only if no element children)
        const hasElementChildren = Array.from(element.children).length > 0;
        if (!hasElementChildren) {
          const textNodes = Array.from(element.childNodes)
            .filter(node => node.nodeType === Node.TEXT_NODE)
            .map(node => node.textContent?.trim())
            .filter(Boolean);
          
          if (textNodes.length > 0) {
            props.children = textNodes.join(" ");
          }
        }

        // Parse children (but skip text nodes, we already handled them)
        const children: EmailComponent[] = [];
        Array.from(element.children).forEach(child => {
          const childComponent = parseElement(child as Element, depth + 1);
          if (childComponent) {
            children.push(childComponent);
          }
        });

        const component: EmailComponent = {
          id: generateId(),
          type: componentType,
          props,
        };

        if (children.length > 0) {
          component.children = children;
        }

        return component;
      };

      const parsedComponents: EmailComponent[] = [];
      containerChildren.forEach(child => {
        const component = parseElement(child as Element);
        if (component) {
          parsedComponents.push(component);
        }
      });

      return parsedComponents.length > 0 ? parsedComponents : components;
    } catch (error) {
      console.error("Error parsing HTML:", error);
      alert("Failed to parse code. Please check the syntax.");
      return components;
    }
  };

  // Parse JSX code and convert to EmailComponent structure
  const parseJsxToComponents = (jsxCode: string): EmailComponent[] => {
    try {
      // Extract the JSX content inside Container
      // Look for content between <Container> and </Container>
      const containerMatch = jsxCode.match(/<Container[^>]*>([\s\S]*?)<\/Container>/);
      if (!containerMatch) {
        // Try to find content without Container wrapper
        const bodyMatch = jsxCode.match(/<Body[^>]*>([\s\S]*?)<\/Body>/);
        if (bodyMatch) {
          return parseJsxContent(bodyMatch[1]);
        }
        // If no Container or Body, try to parse the entire code
        return parseJsxContent(jsxCode);
      }
      
      return parseJsxContent(containerMatch[1]);
    } catch (error) {
      console.error("Error parsing JSX:", error);
      throw error;
    }
  };

  // Parse JSX content string with better nested structure handling
  const parseJsxContent = (content: string): EmailComponent[] => {
    let idCounter = 0;
    const generateId = () => `component-${Date.now()}-${idCounter++}-${Math.random().toString(36).substr(2, 9)}`;

    // Component type mapping from JSX tags to component types
    const jsxTagToComponentType: Record<string, string> = {
      "Container": "Container",
      "Section": "Section",
      "ResponsiveRow": "Row",
      "Row": "Row",
      "ResponsiveColumn": "Column",
      "Column": "Column",
      "Heading": "Heading",
      "Text": "Text",
      "Button": "Button",
      "Link": "Link",
      "Img": "Image",
      "Image": "Image",
      "Hr": "Hr",
      "Divider": "Hr",
    };

    const parseElement = (elementStr: string, depth: number = 0): EmailComponent | null => {
      // Find the opening tag
      const openTagMatch = elementStr.match(/^<(\w+)([^>]*?)(\/>|>)/);
      if (!openTagMatch) return null;
      
      const [openTag, tagName, attributesStr, isSelfClosing] = openTagMatch;
      
      // Skip wrapper tags
      if (["Tailwind", "Html", "Head", "Body", "Container"].includes(tagName) && depth === 0) {
        // Extract content inside and parse recursively
        const contentMatch = elementStr.match(/^<[^>]+>([\s\S]*?)<\/\w+>/);
        if (contentMatch) {
          return parseJsxContent(contentMatch[1])[0] || null;
        }
        return null;
      }
      
      const componentType = jsxTagToComponentType[tagName] || "Section";
      
      // Parse attributes
      const props: Record<string, any> = {};
      const style: Record<string, string> = {};
      
      // Parse className
      const classNameMatch = attributesStr.match(/className=["']([^"']+)["']/);
      if (classNameMatch) {
        props.className = classNameMatch[1];
      }
      
      // Parse style object (handle nested objects)
      const styleMatch = attributesStr.match(/style=\{\{([^}]+(?:\{[^}]*\}[^}]*)*)\}\}/);
      if (styleMatch) {
        const styleContent = styleMatch[1];
        styleContent.split(",").forEach(rule => {
          const trimmed = rule.trim();
          if (!trimmed) return;
          const colonIndex = trimmed.indexOf(":");
          if (colonIndex > 0) {
            const key = trimmed.substring(0, colonIndex).trim();
            const value = trimmed.substring(colonIndex + 1).trim().replace(/["']/g, "");
            if (key && value) {
              const camelKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
              style[camelKey] = value;
            }
          }
        });
        if (Object.keys(style).length > 0) {
          props.style = style;
        }
      }
      
      // Parse string props
      const stringPropRegex = /(\w+)=["']([^"']+)["']/g;
      let propMatch;
      while ((propMatch = stringPropRegex.exec(attributesStr)) !== null) {
        const [, propName, propValue] = propMatch;
        if (propName !== "className" && propName !== "style") {
          props[propName] = propValue;
        }
      }
      
      // Parse numeric/boolean/expression props
      const exprPropRegex = /(\w+)=\{([^}]+)\}/g;
      while ((propMatch = exprPropRegex.exec(attributesStr)) !== null) {
        const [, propName, propValue] = propMatch;
        if (propName !== "style" && propName !== "className") {
          const trimmed = propValue.trim();
          if (trimmed === "true") props[propName] = true;
          else if (trimmed === "false") props[propName] = false;
          else if (!isNaN(Number(trimmed)) && trimmed !== "") {
            props[propName] = Number(trimmed);
          } else {
            props[propName] = trimmed.replace(/["']/g, "");
          }
        }
      }
      
      // Handle self-closing tags
      if (isSelfClosing === "/>") {
        const component: EmailComponent = {
          id: generateId(),
          type: componentType,
          props,
        };
        return component;
      }
      
      // Find matching closing tag and extract content
      const remaining = elementStr.substring(openTag.length);
      let depthCount = 0;
      let pos = 0;
      let contentStart = 0;
      let contentEnd = 0;
      
      while (pos < remaining.length) {
        const openMatch = remaining.substring(pos).match(/<(\w+)([^>]*?)(\/>|>)/);
        const closeMatch = remaining.substring(pos).match(/<\/(\w+)>/);
        
        if (!openMatch && !closeMatch) break;
        
        const openPos = openMatch ? pos + openMatch.index! : Infinity;
        const closePos = closeMatch ? pos + closeMatch.index! : Infinity;
        
        if (openPos < closePos) {
          // Found opening tag
          if (openMatch![1] === tagName) {
            depthCount++;
            if (depthCount === 1) contentStart = pos + openMatch![0].length;
          }
          pos = openPos + openMatch![0].length;
        } else {
          // Found closing tag
          if (closeMatch![1] === tagName) {
            depthCount--;
            if (depthCount === 0) {
              contentEnd = pos;
              break;
            }
          }
          pos = closePos + closeMatch![0].length;
        }
      }
      
      const innerContent = remaining.substring(contentStart, contentEnd).trim();
      
      // Extract text content if no JSX elements
      if (innerContent && !/<[^>]+>/.test(innerContent)) {
        props.children = innerContent;
      }
      
      // Handle specific component types
      if (componentType === "Image" && tagName === "Img") {
        // Image props already parsed
      } else if (componentType === "Heading") {
        props.as = props.as || "h1";
      }
      
      const component: EmailComponent = {
        id: generateId(),
        type: componentType,
        props,
      };
      
      // Parse nested children
      if (innerContent && /<[^>]+>/.test(innerContent)) {
        const childComponents = parseJsxContent(innerContent);
        if (childComponents.length > 0) {
          component.children = childComponents;
        }
      }
      
      return component;
    };
    
    // Find all top-level JSX elements
    const components: EmailComponent[] = [];
    let remaining = content.trim();
    
    while (remaining.length > 0) {
      // Skip whitespace
      remaining = remaining.replace(/^\s+/, "");
      if (!remaining.length) break;
      
      // Find next element
      const elementMatch = remaining.match(/<(\w+)/);
      if (!elementMatch) break;
      
      const startPos = elementMatch.index!;
      const tagName = elementMatch[1];
      
      // Skip wrapper tags at top level
      if (["Tailwind", "Html", "Head", "Body", "Container"].includes(tagName)) {
        // Find matching closing tag
        let depth = 0;
        let pos = startPos;
        while (pos < remaining.length) {
          const openMatch = remaining.substring(pos).match(/<(\w+)([^>]*?)(\/>|>)/);
          const closeMatch = remaining.substring(pos).match(/<\/(\w+)>/);
          
          if (!openMatch && !closeMatch) break;
          
          const openPos = openMatch ? pos + openMatch.index! : Infinity;
          const closePos = closeMatch ? pos + closeMatch.index! : Infinity;
          
          if (openPos < closePos && openMatch![1] === tagName) {
            depth++;
            pos = openPos + openMatch![0].length;
          } else if (closePos < openPos && closeMatch![1] === tagName) {
            depth--;
            if (depth === 0) {
              remaining = remaining.substring(closePos + closeMatch![0].length);
              break;
            }
            pos = closePos + closeMatch![0].length;
          } else {
            pos = Math.min(openPos, closePos) + (openPos < closePos ? openMatch![0].length : closeMatch![0].length);
          }
        }
        continue;
      }
      
      // Parse the element
      const element = parseElement(remaining.substring(startPos));
      if (element) {
        components.push(element);
        // Move past this element
        const elementEnd = remaining.indexOf(`</${tagName}>`, startPos);
        if (elementEnd > -1) {
          remaining = remaining.substring(elementEnd + `</${tagName}>`.length);
        } else {
          // Self-closing tag
          const selfCloseMatch = remaining.substring(startPos).match(/\/>/);
          if (selfCloseMatch) {
            remaining = remaining.substring(startPos + selfCloseMatch.index! + 2);
          } else {
            break;
          }
        }
      } else {
        break;
      }
    }
    
    return components;
  };

  // Apply edited code to components
  const handleApplyCode = () => {
    if (!onApplyCode) {
      alert("Code application is not available. Please use the download button to save your code.");
      return;
    }

    try {
      const codeToParse = activeTab === "jsx" ? editedJsxCode : editedHtmlCode;
      
      if (activeTab === "jsx") {
        // Parse JSX
        const parsedComponents = parseJsxToComponents(codeToParse);
        if (parsedComponents.length > 0) {
          onApplyCode(parsedComponents);
          setIsEditing(false);
          alert("Code applied successfully! Check the Edit and Preview tabs.");
        } else {
          alert("No components found in the code. Please check the syntax.");
        }
      } else {
        // Parse HTML
        const parsedComponents = parseHtmlToComponents(codeToParse);
        onApplyCode(parsedComponents);
        setIsEditing(false);
        alert("Code applied successfully! Check the Edit and Preview tabs.");
      }
    } catch (error) {
      console.error("Error applying code:", error);
      alert(`Failed to apply code: ${error instanceof Error ? error.message : "Please check the syntax."}`);
    }
  };

  const handleEditToggle = () => {
    if (!isEditing) {
      // Entering edit mode - sync current generated code
      setEditedJsxCode(generatedJsxCode);
      setEditedHtmlCode(htmlCode);
    }
    setIsEditing(!isEditing);
  };

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const currentCode = activeTab === "jsx" 
    ? (isEditing ? editedJsxCode : generatedJsxCode)
    : (isEditing ? editedHtmlCode : htmlCode);
  
  const language = activeTab === "jsx" ? "tsx" : "html";
  const lineCount = currentCode.split("\n").length;

  const handleCodeChange = (value: string) => {
    if (activeTab === "jsx") {
      setEditedJsxCode(value);
    } else {
      setEditedHtmlCode(value);
    }
  };

  // Calculate line numbers for the current code
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-[#1e1e1e]">
      {/* Editor Title Bar */}
      <div className="h-9 bg-[#323233] flex items-center px-4 border-b border-[#252526] flex-shrink-0">
        <div className="flex items-center gap-1.5 mr-4">
          <Circle className="w-3 h-3 text-[#ff5f57] fill-[#ff5f57]" />
          <Circle className="w-3 h-3 text-[#febc2e] fill-[#febc2e]" />
          <Circle className="w-3 h-3 text-[#28c840] fill-[#28c840]" />
        </div>
        <span className="text-[#cccccc] text-xs font-medium">
          Email Template {isEditing && <span className="text-[#febc2e] ml-2">• Editing</span>}
        </span>
      </div>

      {/* Editor Tabs */}
      <div className="h-9 bg-[#252526] flex items-end border-b border-[#1e1e1e] flex-shrink-0">
        <button
          onClick={() => setActiveTab("jsx")}
          className={`group h-[35px] px-4 flex items-center gap-2 text-xs font-medium transition-colors border-t-2 ${
            activeTab === "jsx"
              ? "bg-[#1e1e1e] text-[#ffffff] border-t-[#1e9df1]"
              : "bg-[#2d2d2d] text-[#969696] border-t-transparent hover:bg-[#2d2d2d]/80"
          }`}
        >
          <FileCode2 className="w-4 h-4 text-[#519aba]" />
          <span>email.tsx</span>
          {activeTab === "jsx" && copied === "jsx" && (
            <span className="text-[10px] text-green-400 ml-1">Copied!</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("html")}
          className={`group h-[35px] px-4 flex items-center gap-2 text-xs font-medium transition-colors border-t-2 ${
            activeTab === "html"
              ? "bg-[#1e1e1e] text-[#ffffff] border-t-[#1e9df1]"
              : "bg-[#2d2d2d] text-[#969696] border-t-transparent hover:bg-[#2d2d2d]/80"
          }`}
        >
          <FileText className="w-4 h-4 text-[#e37933]" />
          <span>email.html</span>
          {activeTab === "html" && copied === "html" && (
            <span className="text-[10px] text-green-400 ml-1">Copied!</span>
          )}
        </button>
        
        {/* Spacer and Action Buttons */}
        <div className="flex-1" />
        <div className="px-3 h-full flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 px-3 text-xs rounded gap-1.5 ${
              isEditing 
                ? "bg-[#4d4d4d] hover:bg-[#5a5a5a] text-white" 
                : "bg-[#3c3c3c] hover:bg-[#4d4d4d] text-[#cccccc]"
            }`}
            onClick={handleEditToggle}
          >
            {isEditing ? (
              <>
                <Eye className="h-3.5 w-3.5" />
                Preview
              </>
            ) : (
              <>
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-3 text-xs bg-[#0e639c] hover:bg-[#1177bb] text-white rounded gap-1.5"
            onClick={() => copyToClipboard(currentCode, activeTab)}
          >
            {copied === activeTab ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy
              </>
            )}
          </Button>
          {isEditing && onApplyCode ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-3 text-xs bg-[#28a745] hover:bg-[#218838] text-white rounded gap-1.5"
              onClick={handleApplyCode}
            >
              <Save className="h-3.5 w-3.5" />
              Apply
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-3 text-xs bg-[#28a745] hover:bg-[#218838] text-white rounded gap-1.5"
              onClick={() => downloadCode(currentCode, activeTab)}
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </Button>
          )}
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Line Numbers Gutter */}
        <div className="w-14 bg-[#1e1e1e] border-r border-[#252526] flex-shrink-0 select-none overflow-hidden">
          <div className="h-full overflow-auto scrollbar-hide">
            <div className="py-4 pr-4 text-right font-mono text-[13px] leading-[1.6] text-[#858585]">
              {lineNumbers.map((num) => (
                <div key={num} className="h-[20.8px]">
                  {num}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Code Area */}
        {isEditing ? (
          <div className="flex-1 overflow-auto">
            <textarea
              ref={textareaRef}
              value={currentCode}
              onChange={(e) => handleCodeChange(e.target.value)}
              className="w-full h-full min-h-full p-4 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-[13px] leading-[1.6] resize-none outline-none border-none"
              style={{
                fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', Menlo, Monaco, Consolas, monospace",
                tabSize: 2,
              }}
              spellCheck={false}
            />
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="min-h-full">
              <SyntaxHighlighter
                language={language}
                style={editorTheme}
                showLineNumbers={false}
                wrapLines={true}
                customStyle={{
                  margin: 0,
                  padding: "16px",
                  background: "#1e1e1e",
                  minHeight: "100%",
                  fontSize: "13px",
                  lineHeight: "1.6",
                }}
                codeTagProps={{
                  style: {
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', Menlo, Monaco, Consolas, monospace",
                    fontSize: "13px",
                    lineHeight: "1.6",
                  }
                }}
              >
                {currentCode}
              </SyntaxHighlighter>
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Status Bar */}
      <div className={`h-6 flex items-center justify-between px-3 text-xs text-white flex-shrink-0 ${
        isEditing ? "bg-[#d97706]" : "bg-[#007acc]"
      }`}>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            {isEditing ? <Pencil className="w-3.5 h-3.5" /> : <FileCode2 className="w-3.5 h-3.5" />}
            {isEditing ? "Editing Mode" : (activeTab === "jsx" ? "TypeScript React" : "HTML")}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>Ln {lineCount}</span>
          <span>UTF-8</span>
          <span>Spaces: 2</span>
        </div>
      </div>
    </div>
  );
}

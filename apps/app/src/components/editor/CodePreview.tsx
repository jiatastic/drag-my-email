"use client";

import type { EmailComponent, TailwindConfig, EmailGlobalStyles } from "@/types";
import { generateFullEmailJSX } from "@/lib/email-renderer";
import { ScrollArea, Button } from "@react-email-builder/ui";
import { Copy, Check, FileCode2, FileText, Circle, Pencil, Eye } from "lucide-react";
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
}

export function CodePreview({ components, tailwindConfig, globalStyles }: CodePreviewProps) {
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

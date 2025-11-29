"use client";

import { EmailComponent, TailwindConfig, EmailGlobalStyles } from "@/types";
import { generateFullEmailJSX } from "@/lib/email-renderer";
import { Tabs, TabsContent, TabsList, TabsTrigger, ScrollArea, Button } from "@react-email-builder/ui";
import { Copy, Check } from "lucide-react";
import { useState, useEffect } from "react";

interface CodePreviewProps {
  components: EmailComponent[];
  tailwindConfig?: TailwindConfig;
  globalStyles?: EmailGlobalStyles;
}

export function CodePreview({ components, tailwindConfig, globalStyles }: CodePreviewProps) {
  const [copied, setCopied] = useState<"jsx" | "html" | null>(null);
  const [activeTab, setActiveTab] = useState("jsx");
  const [htmlCode, setHtmlCode] = useState<string>("Loading...");

  // Generate full JSX code with Tailwind wrapper
  const jsxCode = generateFullEmailJSX(components, {
    useTailwind: true,
    tailwindConfig,
    globalStyles,
  });

  // Generate HTML code asynchronously
  useEffect(() => {
    const generateHtml = async () => {
      try {
        // Dynamically import to avoid SSR issues
        const { renderEmailTemplate } = await import("@/lib/email-renderer");
        const html = await renderEmailTemplate(components, {
          useTailwind: true,
          tailwindConfig,
          globalStyles,
        });
        setHtmlCode(html);
      } catch (error) {
        console.error("Error rendering email:", error);
        setHtmlCode("<!-- Error rendering email template -->");
      }
    };
    
    generateHtml();
  }, [components, tailwindConfig, globalStyles]);

  const copyToClipboard = async (text: string, type: "jsx" | "html") => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="h-full w-full bg-background flex flex-col overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <div className="border-b px-4 pt-2 bg-background">
          <TabsList>
            <TabsTrigger value="jsx">React JSX</TabsTrigger>
            <TabsTrigger value="html">HTML</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="jsx" className="flex-1 flex flex-col m-0 overflow-hidden">
          <div className="m-2 flex-1 flex flex-col border rounded-lg overflow-hidden">
            <div className="border-b p-2 flex justify-between items-center bg-muted/30">
              <span className="text-xs text-muted-foreground font-mono">email.tsx</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => copyToClipboard(jsxCode, "jsx")}
              >
                {copied === "jsx" ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <pre className="p-3 text-xs font-mono overflow-auto bg-card">
                <code>{jsxCode}</code>
              </pre>
            </ScrollArea>
          </div>
        </TabsContent>
        
        <TabsContent value="html" className="flex-1 flex flex-col m-0 overflow-hidden">
          <div className="m-2 flex-1 flex flex-col border rounded-lg overflow-hidden">
            <div className="border-b p-2 flex justify-between items-center bg-muted/30">
              <span className="text-xs text-muted-foreground font-mono">email.html</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => copyToClipboard(htmlCode, "html")}
              >
                {copied === "html" ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <pre className="p-3 text-xs font-mono overflow-auto bg-card">
                <code>{htmlCode}</code>
              </pre>
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

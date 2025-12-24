"use client";

import { cn } from "@/lib/utils";
import { Steps, StepsContent, StepsItem, StepsTrigger } from "./steps";
import { Tool } from "./tool";
import React from "react";

type MessageProps = React.HTMLAttributes<HTMLDivElement>;

export function Message({ className, ...props }: MessageProps) {
  return <div className={cn("flex items-start gap-3", className)} {...props} />;
}

type MessageAvatarProps = {
  src?: string;
  alt?: string;
  fallback?: string;
} & React.ImgHTMLAttributes<HTMLImageElement>;

export function MessageAvatar({ src, alt, fallback, className, ...props }: MessageAvatarProps) {
  return src ? (
    <img
      src={src}
      alt={alt}
      className={cn("h-8 w-8 rounded-full object-cover", className)}
      {...props}
    />
  ) : (
    <div
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground",
        className
      )}
      {...props}
    >
      {fallback ?? "?"}
    </div>
  );
}

type MessageContentProps = {
  markdown?: boolean;
  children?: React.ReactNode;
  isStreaming?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

// Parse EMAIL_JSON to extract meaningful info for steps
function parseEmailJson(jsonStr: string): { componentCount: number; hasGlobalStyles: boolean; notes?: string } {
  try {
    const data = JSON.parse(jsonStr);
    return {
      componentCount: data.components?.length ?? 0,
      hasGlobalStyles: !!data.globalStyles,
      notes: data.notes,
    };
  } catch {
    return { componentCount: 0, hasGlobalStyles: false };
  }
}

// Parse content and extract code blocks and EMAIL_JSON blocks
function parseContent(content: string, isStreaming?: boolean): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let keyIndex = 0;

  // Check for unclosed EMAIL_JSON (streaming in progress)
  const hasOpenEmailJson = content.includes("{{EMAIL_JSON}}");
  const hasCloseEmailJson = content.includes("{{/EMAIL_JSON}}");
  const isEmailJsonStreaming = hasOpenEmailJson && !hasCloseEmailJson;

  // Check for unclosed code block (streaming in progress)
  const codeBlockMatches = content.match(/```/g);
  const isCodeBlockStreaming = codeBlockMatches && codeBlockMatches.length % 2 !== 0;

  if (isEmailJsonStreaming) {
    // EMAIL_JSON is being streamed - show text before it + loading Steps
    const emailJsonStart = content.indexOf("{{EMAIL_JSON}}");
    const textBefore = content.slice(0, emailJsonStart).trim();
    
    if (textBefore) {
      parts.push(<span key={`text-${keyIndex++}`}>{textBefore}</span>);
    }
    
    // Show streaming Steps component
    parts.push(
      <Steps key={`steps-${keyIndex++}`} defaultOpen={true} isComplete={false} className="my-2">
        <StepsTrigger>Generating email template...</StepsTrigger>
        <StepsContent>
          <div className="space-y-1">
            <StepsItem status="complete">Analyzing your request</StepsItem>
            <StepsItem status="active">Building template structure</StepsItem>
            <StepsItem status="pending">Applying styles</StepsItem>
          </div>
        </StepsContent>
      </Steps>
    );
    
    return parts;
  }

  if (isCodeBlockStreaming) {
    // Code block is being streamed - show text before it + loading Tool
    const lastCodeBlockStart = content.lastIndexOf("```");
    const textBefore = content.slice(0, lastCodeBlockStart).trim();
    
    if (textBefore) {
      parts.push(<span key={`text-${keyIndex++}`}>{textBefore}</span>);
    }
    
    // Show streaming code block
    parts.push(
      <Tool
        key={`code-${keyIndex++}`}
        title="Generating code..."
        language=""
        code="..."
        className="my-2"
      />
    );
    
    return parts;
  }

  // Match completed blocks:
  // 1. Standard markdown code blocks: ```language\ncode\n```
  // 2. EMAIL_JSON blocks: {{EMAIL_JSON}}...{{/EMAIL_JSON}}
  const combinedRegex = /```(\w+)?\n?([\s\S]*?)```|\{\{EMAIL_JSON\}\}([\s\S]*?)\{\{\/EMAIL_JSON\}\}/g;
  let lastIndex = 0;
  let match;

  while ((match = combinedRegex.exec(content)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      const textBefore = content.slice(lastIndex, match.index).trim();
      if (textBefore) {
        parts.push(<span key={`text-${keyIndex++}`}>{textBefore}</span>);
      }
    }

    // Check which pattern matched
    if (match[3] !== undefined) {
      // EMAIL_JSON block - show as Steps component
      const code = match[3].trim();
      const info = parseEmailJson(code);
      
      parts.push(
        <Steps key={`steps-${keyIndex++}`} defaultOpen={false} isComplete={true} className="my-2">
          <StepsTrigger>Template applied successfully</StepsTrigger>
          <StepsContent>
            <div className="space-y-1">
              <StepsItem status="complete">Analyzing your request</StepsItem>
              <StepsItem status="complete">Selecting components from registry</StepsItem>
              <StepsItem status="complete">
                Built {info.componentCount > 0 ? `${info.componentCount} components` : "template structure"}
              </StepsItem>
              {info.hasGlobalStyles && (
                <StepsItem status="complete">Applied global styles</StepsItem>
              )}
              {info.notes && (
                <StepsItem status="complete" className="text-foreground mt-2 pt-2 border-t border-border">
                  {info.notes}
                </StepsItem>
              )}
            </div>
            <Tool
              title="View JSON payload"
              language="json"
              code={code}
              className="mt-3"
            />
          </StepsContent>
        </Steps>
      );
    } else {
      // Standard markdown code block
      const language = match[1] || "";
      const code = match[2].trim();
      parts.push(
        <Tool
          key={`code-${keyIndex++}`}
          title={language ? `${language.charAt(0).toUpperCase() + language.slice(1)} code` : "Code"}
          language={language}
          code={code}
          className="my-2"
        />
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last code block
  if (lastIndex < content.length) {
    const textAfter = content.slice(lastIndex).trim();
    if (textAfter) {
      parts.push(<span key={`text-${keyIndex++}`}>{textAfter}</span>);
    }
  }

  return parts.length > 0 ? parts : [content];
}

export function MessageContent({ markdown, className, children, isStreaming, ...props }: MessageContentProps) {
  // Check if children is a string that might contain code blocks or EMAIL_JSON
  const hasCodeBlocks =
    typeof children === "string" && 
    (children.includes("```") || children.includes("{{EMAIL_JSON}}"));

  if (hasCodeBlocks && typeof children === "string") {
    const parsedContent = parseContent(children, isStreaming);
    return (
      <div
        className={cn(
          "flex max-w-[90%] flex-col gap-2 whitespace-pre-wrap rounded-2xl bg-muted/60 px-4 py-3 text-sm text-foreground",
          className
        )}
        {...props}
      >
        {parsedContent}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex max-w-[90%] whitespace-pre-wrap rounded-2xl bg-muted/60 px-4 py-3 text-sm text-foreground",
        markdown && "prose prose-sm prose-slate dark:prose-invert",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

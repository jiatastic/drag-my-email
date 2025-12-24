"use client";

import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, FileJson2, Copy, Check } from "lucide-react";
import { useState } from "react";

type ToolProps = {
  title?: string;
  language?: string;
  code: string;
  className?: string;
  defaultExpanded?: boolean;
};

export function Tool({
  title = "Code",
  language,
  code,
  className,
  defaultExpanded = false,
}: ToolProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-xl border border-border/50 bg-background/80 backdrop-blur-sm",
        className
      )}
    >
      <div className="flex w-full items-center justify-between gap-2 px-3 py-2 text-xs text-muted-foreground">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsExpanded(!isExpanded)}
          onKeyDown={(e) => e.key === "Enter" && setIsExpanded(!isExpanded)}
          className="flex flex-1 cursor-pointer items-center gap-2 transition-colors hover:text-foreground"
        >
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
          <FileJson2 className="h-3.5 w-3.5" />
          <span className="font-medium">{title}</span>
          {language && (
            <span className="rounded-full bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {language}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex h-5 w-5 items-center justify-center rounded-md transition-colors hover:bg-muted"
          title="Copy code"
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </button>
      </div>
      {isExpanded && (
        <div className="border-t border-border/50 bg-zinc-900 p-3">
          <pre className="max-h-[200px] overflow-auto text-[11px] leading-relaxed text-zinc-400">
            <code>{code}</code>
          </pre>
        </div>
      )}
    </div>
  );
}

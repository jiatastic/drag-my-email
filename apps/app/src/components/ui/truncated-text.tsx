"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface TruncatedTextProps {
  text: string;
  maxLines?: number;
  className?: string;
  textClassName?: string;
  showMoreClassName?: string;
}

export function TruncatedText({
  text,
  maxLines = 3,
  className,
  textClassName,
  showMoreClassName,
}: TruncatedTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (textRef.current) {
      const checkTruncation = () => {
        if (textRef.current) {
          // Create a clone to measure full height without truncation
          const clone = textRef.current.cloneNode(true) as HTMLElement;
          clone.style.position = "absolute";
          clone.style.visibility = "hidden";
          clone.style.height = "auto";
          clone.style.maxHeight = "none";
          clone.style.display = "block";
          clone.style.webkitLineClamp = "none";
          clone.style.webkitBoxOrient = "unset";
          clone.style.overflow = "visible";
          
          textRef.current.parentElement?.appendChild(clone);
          const fullHeight = clone.scrollHeight;
          textRef.current.parentElement?.removeChild(clone);
          
          // Calculate expected truncated height
          const lineHeight = parseFloat(
            window.getComputedStyle(textRef.current).lineHeight || "16"
          );
          const maxHeight = lineHeight * maxLines;
          
          setIsTruncated(fullHeight > maxHeight);
        }
      };

      // Check after styles are applied
      const timeoutId = setTimeout(checkTruncation, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [text, maxLines]);

  return (
    <div className={cn("space-y-1", className)}>
      <p
        ref={textRef}
        className={cn("text-xs text-muted-foreground", textClassName)}
        style={
          isExpanded
            ? undefined
            : {
                display: "-webkit-box",
                WebkitLineClamp: maxLines,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }
        }
      >
        {text}
      </p>
      {isTruncated && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "text-xs text-primary hover:underline",
            showMoreClassName
          )}
        >
          {isExpanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}


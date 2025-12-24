"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type InputOTPProps = {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  className?: string;
};

/**
 * A lightweight, shadcn-style OTP input (no external deps).
 * - Numeric only
 * - Auto-advance focus
 * - Backspace navigates backward
 * - Paste supported
 */
export function InputOTP({
  value,
  onChange,
  length = 6,
  disabled,
  className,
}: InputOTPProps) {
  const inputsRef = React.useRef<Array<HTMLInputElement | null>>([]);
  const chars = React.useMemo(() => {
    const padded = (value || "").slice(0, length).split("");
    while (padded.length < length) padded.push("");
    return padded;
  }, [value, length]);

  const setCharAt = (index: number, nextChar: string) => {
    const clean = nextChar.replace(/\D/g, "").slice(-1);
    const next = chars.slice();
    next[index] = clean;
    onChange(next.join("").trimEnd());
  };

  const focusIndex = (index: number) => {
    const el = inputsRef.current[index];
    if (el) el.focus();
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {Array.from({ length }).map((_, i) => (
        <input
          // eslint-disable-next-line react/no-array-index-key
          key={i}
          ref={(el) => {
            inputsRef.current[i] = el;
          }}
          value={chars[i]}
          disabled={disabled}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={1}
          className={cn(
            "h-11 w-10 rounded-md border border-input bg-background text-center text-base font-medium",
            "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onChange={(e) => {
            setCharAt(i, e.target.value);
            if (e.target.value && i < length - 1) {
              focusIndex(i + 1);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace") {
              if (chars[i]) {
                setCharAt(i, "");
                return;
              }
              if (i > 0) focusIndex(i - 1);
            }
            if (e.key === "ArrowLeft" && i > 0) focusIndex(i - 1);
            if (e.key === "ArrowRight" && i < length - 1) focusIndex(i + 1);
          }}
          onPaste={(e) => {
            e.preventDefault();
            const text = e.clipboardData.getData("text");
            const digits = text.replace(/\D/g, "").slice(0, length);
            if (!digits) return;
            const next = digits.split("");
            while (next.length < length) next.push("");
            onChange(next.join("").trimEnd());
            const nextIndex = Math.min(digits.length, length - 1);
            focusIndex(nextIndex);
          }}
        />
      ))}
    </div>
  );
}



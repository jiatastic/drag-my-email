"use client";

import { cn } from "@/lib/utils";
import React, { type KeyboardEvent, type ReactNode } from "react";

export type PromptInputTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  disableAutosize?: boolean;
  onSubmit?: () => void;
};

export const PromptInputTextarea = ({
  disableAutosize,
  className,
  onSubmit,
  onKeyDown,
  ...props
}: PromptInputTextareaProps) => {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit?.();
    }
    onKeyDown?.(e);
  };

  return (
    <textarea
      className={cn(
        "flex min-h-[60px] w-full rounded-md bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        disableAutosize ? "resize-none" : "resize",
        className
      )}
      onKeyDown={handleKeyDown}
      {...props}
    />
  );
};

export type PromptInputActionsProps = {
  children?: ReactNode;
  className?: string;
};

export const PromptInputActions = ({
  children,
  className,
  ...props
}: PromptInputActionsProps) => {
  return (
    <div className={cn("flex items-center gap-1", className)} {...props}>
      {children}
    </div>
  );
};

export type PromptInputActionProps = {
  children?: ReactNode;
  tooltip?: string;
};

export const PromptInputAction = ({ children, tooltip }: PromptInputActionProps) => {
  return <div title={tooltip}>{children}</div>;
};

export type PromptInputProps = {
  isLoading?: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
  maxHeight?: number | string;
  onSubmit?: () => void;
  children?: ReactNode;
  className?: string;
};

export const PromptInput = ({
  isLoading,
  value,
  onValueChange,
  maxHeight = 240,
  onSubmit,
  children,
  className,
}: PromptInputProps) => {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit?.();
    }
  };

  const disableAutosize = typeof maxHeight === "number" && maxHeight <= 60;

  const childrenArray = React.Children.toArray(children);
  const hasCustomChildren = childrenArray.length > 0;

  // Clone children to inject onSubmit into PromptInputTextarea
  // If child already has value/onChange/onSubmit, preserve them; otherwise use props from PromptInput
  const clonedChildren = hasCustomChildren
    ? React.Children.map(childrenArray, (child) => {
        if (
          child &&
          typeof child === "object" &&
          "type" in child &&
          child.type === PromptInputTextarea
        ) {
          const childProps = (child as React.ReactElement).props as {
            onSubmit?: () => void;
            value?: string;
            onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
          };
          return React.cloneElement(child as React.ReactElement, {
            // Only inject onSubmit if child doesn't already have it
            ...(childProps.onSubmit === undefined && onSubmit && { onSubmit }),
            // Only inject value/onChange if child doesn't already have them
            ...(childProps.value === undefined && value !== undefined && { value }),
            ...(childProps.onChange === undefined &&
              onValueChange && {
                onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => {
                  onValueChange(e.target.value);
                },
              }),
          });
        }
        return child;
      })
    : null;

  return (
    <div
      className={cn(
        "relative flex w-full flex-col items-stretch gap-2 rounded-md border border-input bg-background transition-colors duration-300 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
        className
      )}
      style={{ maxHeight: typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight }}
    >
      {hasCustomChildren ? (
        // New structure: children include PromptInputTextarea
        clonedChildren
      ) : (
        // Old structure: render PromptInputTextarea directly
        <>
          <PromptInputTextarea
            value={value}
            onChange={(e) => onValueChange?.(e.target.value)}
            onKeyDown={handleKeyDown}
            disableAutosize={disableAutosize}
            className="min-h-[60px] pr-8"
            style={{ maxHeight: typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight }}
          />
          <div className="absolute bottom-2 right-2 flex items-center gap-1">
            {children}
            {isLoading && (
              <div className="flex h-8 w-8 items-center justify-center">
                <svg
                  className="h-4 w-4 animate-spin text-muted-foreground"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 12a9 9 0 1 1-6.23-8.57" />
                </svg>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

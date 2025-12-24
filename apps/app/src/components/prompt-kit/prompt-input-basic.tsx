"use client";

import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/prompt-kit/prompt-input";
import { Button } from "@/components/ui/button";
import { ArrowUp, Square } from "lucide-react";

type PromptInputBasicProps = {
  value: string;
  onValueChange: (value: string) => void;
  isLoading: boolean;
  onSubmit: () => void;
  onStop?: () => void;
  placeholder?: string;
  className?: string;
};

export function PromptInputBasic({
  value,
  onValueChange,
  isLoading,
  onSubmit,
  onStop,
  placeholder = "Ask me anything...",
  className,
}: PromptInputBasicProps) {
  return (
    <PromptInput
      value={value}
      onValueChange={onValueChange}
      isLoading={isLoading}
      onSubmit={onSubmit}
      className={className || "w-full"}
    >
      <PromptInputTextarea placeholder={placeholder} />
      <PromptInputActions className="justify-end pt-2">
        <PromptInputAction
          tooltip={isLoading ? "Stop generation" : "Send message"}
        >
          <Button
            variant="default"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={isLoading && onStop ? onStop : onSubmit}
            type="button"
          >
            {isLoading ? (
              <Square className="size-5 fill-current" />
            ) : (
              <ArrowUp className="size-5" />
            )}
          </Button>
        </PromptInputAction>
      </PromptInputActions>
    </PromptInput>
  );
}

"use client";

import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/prompt-kit/prompt-input";
import { Button } from "@/components/ui/button";
import { ArrowUp, Paperclip, Square, X } from "lucide-react";
import { useRef, useState } from "react";

type PromptInputWithActionsProps = {
  value?: string;
  onValueChange?: (value: string) => void;
  isLoading?: boolean;
  onSubmit?: () => void;
  onStop?: () => void;
  placeholder?: string;
  className?: string;
};

export function PromptInputWithActions({
  value: externalValue,
  onValueChange: externalOnValueChange,
  isLoading: externalIsLoading = false,
  onSubmit: externalOnSubmit,
  onStop,
  placeholder = "Ask me anything...",
  className,
}: PromptInputWithActionsProps) {
  const [internalInput, setInternalInput] = useState("");
  const [internalIsLoading, setInternalIsLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // Use external props if provided, otherwise use internal state
  const input = externalValue !== undefined ? externalValue : internalInput;
  const isLoading = externalIsLoading !== undefined ? externalIsLoading : internalIsLoading;
  const setInput = externalOnValueChange || ((value: string) => setInternalInput(value));

  const handleSubmit = () => {
    // Always call external onSubmit if provided, let it handle validation
    if (externalOnSubmit) {
      externalOnSubmit();
      return;
    }
    // Fallback to internal handling
    if (input.trim() || files.length > 0) {
      setInternalIsLoading(true);
      setTimeout(() => {
        setInternalIsLoading(false);
        setInternalInput("");
        setFiles([]);
      }, 2000);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    if (uploadInputRef?.current) {
      uploadInputRef.current.value = "";
    }
  };

  const handleStop = () => {
    if (onStop) {
      onStop();
    } else {
      setInternalIsLoading(false);
    }
  };

  return (
    <PromptInput
      value={input}
      onValueChange={setInput}
      isLoading={isLoading}
      onSubmit={handleSubmit}
      className={className}
    >
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 pb-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="bg-muted text-muted-foreground flex items-center gap-2 rounded-lg px-3 py-2 text-sm border border-border"
              onClick={(e) => e.stopPropagation()}
            >
              <Paperclip className="size-4 text-muted-foreground" />
              <span className="max-w-[120px] truncate text-muted-foreground">{file.name}</span>
              <button
                onClick={() => handleRemoveFile(index)}
                className="hover:bg-muted-foreground/20 text-muted-foreground rounded-full p-1 transition-colors"
                type="button"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      <PromptInputTextarea
        placeholder={placeholder}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onSubmit={handleSubmit}
      />
      <PromptInputActions className="flex items-center justify-between gap-2 pt-2">
        <PromptInputAction tooltip="Attach files">
          <label
            htmlFor="file-upload"
            className="hover:bg-secondary-foreground/10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-2xl"
          >
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
              ref={uploadInputRef}
            />
            <Paperclip className="text-primary size-5" />
          </label>
        </PromptInputAction>
        <PromptInputAction tooltip={isLoading ? "Stop generation" : "Send message"}>
          <Button
            type="button"
            variant="default"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (isLoading) {
                handleStop();
              } else {
                handleSubmit();
              }
            }}
          >
            {isLoading ? <Square className="size-5 fill-current" /> : <ArrowUp className="size-5" />}
          </Button>
        </PromptInputAction>
      </PromptInputActions>
    </PromptInput>
  );
}

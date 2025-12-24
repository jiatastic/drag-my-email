"use client";

import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, Loader2, CheckCircle2 } from "lucide-react";
import { createContext, useContext, useState } from "react";

type StepsContextValue = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isComplete: boolean;
};

const StepsContext = createContext<StepsContextValue | null>(null);

function useStepsContext() {
  const context = useContext(StepsContext);
  if (!context) {
    throw new Error("Steps components must be used within <Steps>");
  }
  return context;
}

type StepsProps = {
  children: React.ReactNode;
  defaultOpen?: boolean;
  isComplete?: boolean;
  className?: string;
};

export function Steps({
  children,
  defaultOpen = false,
  isComplete = false,
  className,
}: StepsProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <StepsContext.Provider value={{ isOpen, setIsOpen, isComplete }}>
      <div
        className={cn(
          "w-full overflow-hidden rounded-lg border border-border bg-muted/20",
          className
        )}
      >
        {children}
      </div>
    </StepsContext.Provider>
  );
}

type StepsTriggerProps = {
  children: React.ReactNode;
  className?: string;
};

export function StepsTrigger({ children, className }: StepsTriggerProps) {
  const { isOpen, setIsOpen, isComplete } = useStepsContext();

  return (
    <button
      type="button"
      onClick={() => setIsOpen(!isOpen)}
      className={cn(
        "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50",
        className
      )}
    >
      <div className="flex items-center gap-2">
        {isOpen ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        <span>{children}</span>
      </div>
      {isComplete ? (
        <CheckCircle2 className="h-4 w-4 text-green-500" />
      ) : (
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
      )}
    </button>
  );
}

type StepsContentProps = {
  children: React.ReactNode;
  className?: string;
};

export function StepsContent({ children, className }: StepsContentProps) {
  const { isOpen } = useStepsContext();

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "border-t border-border bg-background/50 px-3 py-2",
        className
      )}
    >
      {children}
    </div>
  );
}

type StepsItemProps = {
  children: React.ReactNode;
  className?: string;
  status?: "pending" | "active" | "complete";
};

export function StepsItem({
  children,
  className,
  status = "complete",
}: StepsItemProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 py-0.5 text-xs",
        status === "pending" && "text-muted-foreground/50",
        status === "active" && "text-primary font-medium",
        status === "complete" && "text-muted-foreground",
        className
      )}
    >
      {status === "active" && (
        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
      )}
      {status === "complete" && (
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
      )}
      {status === "pending" && (
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
      )}
      <span>{children}</span>
    </div>
  );
}

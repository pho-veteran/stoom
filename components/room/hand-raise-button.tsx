"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Hand } from "lucide-react";

export interface HandRaiseButtonProps {
  isRaised: boolean;
  onToggle: () => void;
  disabled?: boolean;
  enableKeyboardShortcut?: boolean;
}

export function HandRaiseButton({
  isRaised,
  onToggle,
  disabled = false,
  enableKeyboardShortcut = true,
}: HandRaiseButtonProps) {
  const tooltipText = isRaised ? "Lower hand" : "Raise hand";

  // Add keyboard shortcut (H key) for raising/lowering hand
  useEffect(() => {
    if (!enableKeyboardShortcut || disabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if H key is pressed without modifiers (except Shift)
      // Ignore if user is typing in an input field
      if (
        event.key === "h" &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !(event.target instanceof HTMLInputElement) &&
        !(event.target instanceof HTMLTextAreaElement)
      ) {
        event.preventDefault();
        onToggle();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enableKeyboardShortcut, disabled, onToggle]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isRaised ? "default" : "outline"}
            size="icon"
            onClick={onToggle}
            disabled={disabled}
            className="h-10 w-10"
            aria-label={tooltipText}
            aria-pressed={isRaised}
          >
            <Hand className="h-5 w-5" strokeWidth={1.5} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
          {enableKeyboardShortcut && <p className="text-xs text-muted-foreground mt-1">Press H</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

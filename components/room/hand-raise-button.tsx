"use client";

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
}

export function HandRaiseButton({
  isRaised,
  onToggle,
  disabled = false,
}: HandRaiseButtonProps) {
  const tooltipText = isRaised ? "Lower hand" : "Raise hand";

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
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { Grab } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Props for HandRaiseControls component
 */
export interface HandRaiseControlsProps {
  participantId: string;
  isRaised: boolean;
  isHost: boolean;
  onLowerHand: (participantId: string) => void;
}

/**
 * HandRaiseControls Component
 * 
 * Displays host controls for lowering a participant's raised hand.
 * Only visible to hosts/co-hosts when the participant has their hand raised.
 * 
 * Requirements: 3.1
 */
export function HandRaiseControls({
  participantId,
  isRaised,
  isHost,
  onLowerHand,
}: HandRaiseControlsProps) {
  // Only show controls if user is host and participant has hand raised
  if (!isHost || !isRaised) {
    return null;
  }

  const handleLowerHand = () => {
    onLowerHand(participantId);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLowerHand}
            className="h-6 w-6 hover:bg-amber-100 shrink-0"
            aria-label="Lower participant's hand"
          >
            <Grab className="h-3.5 w-3.5 text-amber-600" strokeWidth={2} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Lower hand</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

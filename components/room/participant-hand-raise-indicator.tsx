"use client";

/**
 * ParticipantHandRaiseIndicator Component
 * 
 * Displays a hand icon and queue position badge when a participant has their hand raised.
 * Uses accent color for visibility.
 * 
 * Requirements: 2.1, 2.3
 */

import { Hand } from "lucide-react";

export interface ParticipantHandRaiseIndicatorProps {
  isRaised: boolean;
  raisedAt?: number;
  queuePosition?: number; // Position in queue (1-indexed)
}

export function ParticipantHandRaiseIndicator({
  isRaised,
  queuePosition,
}: ParticipantHandRaiseIndicatorProps) {
  if (!isRaised) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <div className="relative flex items-center justify-center">
        {/* Hand icon with accent color */}
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100">
          <Hand className="h-3.5 w-3.5 text-amber-600" strokeWidth={2} />
        </div>
        
        {/* Queue position badge */}
        {queuePosition !== undefined && (
          <div className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-600 px-1">
            <span className="text-[10px] font-bold text-white leading-none">
              {queuePosition}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { mockParticipants } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Mic, MicOff, Video, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ParticipantsSidebarProps {
  roomId?: string;
  meetingTitle?: string;
}

export function ParticipantsSidebar({ roomId, meetingTitle }: ParticipantsSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Mock meeting title if not provided
  const displayTitle = meetingTitle || `Meeting ${roomId || "Room"}`;

  if (isCollapsed) {
    return (
      <div className="flex h-full w-12 flex-col items-center border-r border-border bg-card transition-all duration-300">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(false)}
          className="mt-2 h-8 w-8"
          title="Expand Participants"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2} />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-card transition-all duration-300">
      {/* Header with Meeting Title */}
      <div className="border-b border-border px-4 py-3">
        <div className="mb-2">
          <h2 className="text-sm font-bold leading-tight line-clamp-2">{displayTitle}</h2>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {mockParticipants.length} {mockParticipants.length === 1 ? "participant" : "participants"}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(true)}
            className="h-7 w-7"
            title="Collapse"
          >
            <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2} />
          </Button>
        </div>
      </div>
      
      {/* Participants List */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-2">
          {mockParticipants.map((participant) => (
            <div
              key={participant.id}
              className={cn(
                "flex items-center gap-3 rounded-lg p-3 transition-colors",
                participant.isSpeaking
                  ? "bg-violet-100 dark:bg-violet-900/30 border border-violet-300 dark:border-violet-700"
                  : "bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 border border-transparent"
              )}
            >
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-white text-sm font-bold">
                  {participant.name.charAt(0)}
                </div>
                {participant.isSpeaking && (
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{participant.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  {participant.isSpeaking ? (
                    <Mic className="h-3 w-3 text-emerald-500" strokeWidth={2} />
                  ) : (
                    <MicOff className="h-3 w-3 text-muted-foreground" strokeWidth={2} />
                  )}
                  <Video className="h-3 w-3 text-muted-foreground" strokeWidth={2} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

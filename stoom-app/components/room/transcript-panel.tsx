"use client";

import { Button } from "@/components/ui/button";
import { mockTranscript } from "@/lib/mock-data";
import { ScrollText, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TranscriptPanelProps {
  onClose: () => void;
}

export function TranscriptPanel({ onClose }: TranscriptPanelProps) {
  return (
    <div className="flex h-full w-full flex-col border-l border-border bg-card">
      {/* Header */}
      <div className="flex h-12 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2">
          <ScrollText className="h-4 w-4" strokeWidth={1.5} />
          <span className="text-sm font-semibold">Transcript</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8"
          title="Close Panel"
        >
          <X className="h-4 w-4" strokeWidth={1.5} />
        </Button>
      </div>

      {/* Transcript Content */}
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {mockTranscript.map((entry) => (
          <div
            key={entry.id}
            className={cn(
              "rounded-lg p-3 transition-colors",
              entry.isActive
                ? "bg-violet-100 dark:bg-violet-900/30 border-l-4 border-violet-600 dark:border-violet-500"
                : "bg-slate-50 dark:bg-slate-900/50"
            )}
          >
            <div className="mb-1 flex items-center gap-2">
              <span className="text-sm font-semibold">{entry.speaker}:</span>
              <span className="text-xs text-muted-foreground">
                {Math.floor(entry.timestamp / 60)}:
                {String(entry.timestamp % 60).padStart(2, "0")}
              </span>
            </div>
            <p className="text-sm">{entry.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}



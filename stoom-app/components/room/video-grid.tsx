"use client";

import { mockParticipants } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Mic, MicOff } from "lucide-react";

export function VideoGrid() {
  return (
    <div className="grid h-full w-full grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
      {mockParticipants.map((participant) => (
        <div
          key={participant.id}
          className={cn(
            "relative flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-slate-900",
            participant.isSpeaking && "ring-4 ring-emerald-500"
          )}
        >
          <div className="text-center">
            <div className="mb-2 h-20 w-20 mx-auto rounded-full bg-violet-600 flex items-center justify-center text-white text-3xl font-bold">
              {participant.name.charAt(0)}
            </div>
            <p className="text-sm font-medium text-white">{participant.name}</p>
          </div>
          <div className="absolute bottom-2 left-2 flex items-center gap-2 rounded bg-black/50 px-2 py-1">
            {participant.isSpeaking ? (
              <Mic className="h-4 w-4 text-emerald-500" strokeWidth={1.5} />
            ) : (
              <MicOff className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}



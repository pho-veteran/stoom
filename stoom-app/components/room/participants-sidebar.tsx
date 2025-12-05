"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ChevronLeft,
  ChevronRight,
  Users,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ParticipantInfo } from "@/hooks/use-participants";

interface ParticipantsSidebarProps {
  roomId?: string;
  meetingTitle?: string;
  participants?: ParticipantInfo[];
  activeSpeaker?: ParticipantInfo | null;
}

export function ParticipantsSidebar({
  roomId,
  meetingTitle,
  participants = [],
  activeSpeaker,
}: ParticipantsSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);

  const displayTitle = meetingTitle || "Study Session";
  const roomCode = roomId || "------";

  const handleCopyCode = async () => {
    if (roomId) {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isCollapsed) {
    return (
      <div className="flex h-full w-16 flex-col items-center border-r border-slate-200 bg-white transition-all duration-300">
        {/* Expand button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(false)}
          className="mt-3 h-9 w-9 hover:bg-slate-100"
          title="Expand Sidebar"
        >
          <ChevronRight className="h-4 w-4 text-slate-600" strokeWidth={2} />
        </Button>

        {/* Participant count badge */}
        <div className="mt-4 flex h-10 w-10 items-center justify-center rounded-full bg-violet-100">
          <span className="text-sm font-bold text-violet-600">
            {participants.length}
          </span>
        </div>

        {/* Participant avatars */}
        <div className="mt-4 flex-1 overflow-y-auto px-2">
          <div className="flex flex-col items-center gap-2">
            {participants.slice(0, 8).map((participant) => {
              const isActive =
                activeSpeaker?.identity === participant.identity ||
                participant.isSpeaking;

              return (
                <div
                  key={participant.identity}
                  className="relative"
                  title={`${participant.name}${participant.isLocal ? " (You)" : ""}`}
                >
                  {participant.imageUrl ? (
                    <Image
                      src={participant.imageUrl}
                      alt={participant.name}
                      width={40}
                      height={40}
                      className={cn(
                        "h-10 w-10 rounded-full object-cover transition-all",
                        isActive && "ring-2 ring-violet-300 ring-offset-2"
                      )}
                    />
                  ) : (
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full text-white text-sm font-semibold transition-all",
                        isActive
                          ? "bg-violet-600 ring-2 ring-violet-300 ring-offset-2"
                          : "bg-slate-400"
                      )}
                    >
                      {participant.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {!participant.isAudioEnabled && (
                    <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500">
                      <MicOff className="h-2.5 w-2.5 text-white" strokeWidth={2} />
                    </div>
                  )}
                </div>
              );
            })}
            {participants.length > 8 && (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-600">
                +{participants.length - 8}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-72 flex-col border-r border-slate-200 bg-white transition-all duration-300">
      {/* Header */}
      <div className="border-b border-slate-100 p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-slate-900 truncate">
              {displayTitle}
            </h2>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5">
                <span className="text-xs font-medium text-slate-500">Code:</span>
                <span className="font-mono text-sm font-semibold text-slate-700">
                  {roomCode}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopyCode}
                className="h-8 w-8 hover:bg-slate-100"
                title="Copy room code"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-500" strokeWidth={2} />
                ) : (
                  <Copy className="h-4 w-4 text-slate-400" strokeWidth={2} />
                )}
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(true)}
            className="h-8 w-8 hover:bg-slate-100 -mr-1"
            title="Collapse Sidebar"
          >
            <ChevronLeft className="h-4 w-4 text-slate-400" strokeWidth={2} />
          </Button>
        </div>
      </div>

      {/* Participants Section */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Section Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-400" strokeWidth={2} />
            <span className="text-sm font-medium text-slate-700">Participants</span>
          </div>
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-violet-100 px-2 text-xs font-semibold text-violet-600">
            {participants.length}
          </span>
        </div>

        {/* Participants List */}
        <div className="flex-1 overflow-y-auto p-3">
          {participants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 mb-3">
                <Users className="h-7 w-7 text-slate-400" strokeWidth={1.5} />
              </div>
              <p className="text-sm font-medium text-slate-500">No participants yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Share the room code to invite others
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {participants.map((participant) => {
                const isActive =
                  activeSpeaker?.identity === participant.identity ||
                  participant.isSpeaking;

                return (
                  <div
                    key={participant.identity}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-150",
                      isActive
                        ? "bg-violet-50 border border-violet-200"
                        : "hover:bg-slate-50"
                    )}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      {participant.imageUrl ? (
                        <Image
                          src={participant.imageUrl}
                          alt={participant.name}
                          width={36}
                          height={36}
                          className={cn(
                            "h-9 w-9 rounded-full object-cover",
                            isActive && "ring-2 ring-violet-300"
                          )}
                        />
                      ) : (
                        <div
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-full text-white text-sm font-semibold",
                            isActive ? "bg-violet-600" : "bg-slate-400"
                          )}
                        >
                          {participant.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {isActive && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {participant.name}
                        {participant.isLocal && (
                          <span className="ml-1 text-xs font-normal text-slate-400">
                            (You)
                          </span>
                        )}
                      </p>
                      {isActive && (
                        <p className="text-xs text-violet-600 font-medium">Speaking</p>
                      )}
                    </div>

                    {/* Status Icons */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <div
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full",
                          participant.isAudioEnabled
                            ? "bg-emerald-100"
                            : "bg-red-100"
                        )}
                      >
                        {participant.isAudioEnabled ? (
                          <Mic className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2} />
                        ) : (
                          <MicOff className="h-3.5 w-3.5 text-red-500" strokeWidth={2} />
                        )}
                      </div>
                      <div
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full",
                          participant.isVideoEnabled
                            ? "bg-emerald-100"
                            : "bg-slate-100"
                        )}
                      >
                        {participant.isVideoEnabled ? (
                          <Video className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2} />
                        ) : (
                          <VideoOff className="h-3.5 w-3.5 text-slate-400" strokeWidth={2} />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { Track } from "livekit-client";
import {
  useTracks,
  VideoTrack as LKVideoTrack,
  useParticipants,
} from "@livekit/components-react";
import { shouldScroll } from "@/lib/video-layout";
import { cn } from "@/lib/utils";
import { Users, Mic, MicOff, VideoOff } from "lucide-react";

interface VideoFeedsViewProps {
  className?: string;
  parentLayout?: "horizontal" | "vertical";
}

export function VideoFeedsView({ className, parentLayout = "horizontal" }: VideoFeedsViewProps) {
  const participants = useParticipants();
  const tracks = useTracks([Track.Source.Camera], { onlySubscribed: false });

  // Only show participants with camera enabled
  const participantsWithCamera = participants.filter((p) => p.isCameraEnabled);
  const userCount = participantsWithCamera.length;
  
  // Grid layout based on parent layout direction
  // If parent is horizontal (side by side panels), use column layout for videos
  // If parent is vertical (stacked panels), use row layout for videos
  const getResponsiveGridClasses = () => {
    if (userCount <= 0) return "";
    if (userCount === 1) return "grid grid-cols-1 grid-rows-1";
    if (userCount === 2) {
      // Opposite of parent layout
      return parentLayout === "horizontal"
        ? "grid grid-cols-1 grid-rows-2 gap-2"  // Stack vertically when parent is horizontal
        : "grid grid-cols-2 grid-rows-1 gap-2"; // Side by side when parent is vertical
    }
    if (userCount <= 4) return "grid grid-cols-2 grid-rows-2 gap-2 p-2";
    if (userCount <= 9) return "grid grid-cols-3 grid-rows-3 gap-2 p-2";
    return "grid grid-cols-4 auto-rows-fr gap-2 p-2 overflow-auto";
  };

  const gridClasses = getResponsiveGridClasses();
  const needsScroll = shouldScroll(userCount);

  if (userCount === 0) {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center bg-slate-900",
          className
        )}
      >
        <div className="text-center">
          <div className="mb-4 h-24 w-24 mx-auto rounded-lg bg-slate-800 flex items-center justify-center">
            <Users className="h-12 w-12 text-violet-500" strokeWidth={1.5} />
          </div>
          <p className="text-muted-foreground">Video Feeds</p>
          <p className="text-sm text-muted-foreground mt-2">
            Waiting for participants to enable camera...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "h-full w-full bg-slate-950",
        gridClasses,
        needsScroll && "overflow-y-auto",
        className
      )}
    >
      {participantsWithCamera.map((participant) => {
        const trackRef = tracks.find(
          (t) => t.participant.identity === participant.identity
        );

        const name = participant.name || participant.identity;
        const initials = name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);

        return (
          <div key={participant.identity} className="relative min-h-0">
            <div
              className={cn(
                "relative h-full w-full overflow-hidden rounded-lg bg-slate-900 transition-all duration-300",
                participant.isSpeaking &&
                  "ring-2 ring-violet-500 ring-offset-2 ring-offset-slate-950"
              )}
            >
              {trackRef?.publication?.track ? (
                <LKVideoTrack
                  trackRef={trackRef}
                  className={cn(
                    "h-full w-full object-cover",
                    participant.isLocal && "scale-x-[-1]"
                  )}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-slate-800">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-violet-600 text-2xl font-bold text-white">
                    {initials}
                  </div>
                </div>
              )}

              {/* Participant info overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white truncate">
                    {name}
                    {participant.isLocal && " (You)"}
                  </span>
                  <div className="flex items-center gap-2">
                    {participant.isMicrophoneEnabled ? (
                      <Mic className="h-4 w-4 text-white" strokeWidth={2} />
                    ) : (
                      <MicOff className="h-4 w-4 text-red-400" strokeWidth={2} />
                    )}
                    {!participant.isCameraEnabled && (
                      <VideoOff
                        className="h-4 w-4 text-red-400"
                        strokeWidth={2}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Active speaker indicator */}
              {participant.isSpeaking && (
                <div className="absolute top-2 left-2">
                  <div className="flex items-center gap-1 rounded-full bg-violet-600 px-2 py-1">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-white" />
                    <span className="text-xs font-medium text-white">
                      Speaking
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

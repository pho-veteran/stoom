"use client";

import { useRef } from "react";
import { Track } from "livekit-client";
import {
  useTracks,
  VideoTrack as LKVideoTrack,
} from "@livekit/components-react";
import { cn } from "@/lib/utils";
import { Monitor, Maximize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScreenShareViewProps {
  onStopSharing?: () => void;
  className?: string;
}

export function ScreenShareView({
  onStopSharing,
  className,
}: ScreenShareViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const screenShareTracks = useTracks([Track.Source.ScreenShare], {
    onlySubscribed: false,
  });

  const screenShareTrack = screenShareTracks[0];
  const isLocal = screenShareTrack?.participant.isLocal;
  const sharerName =
    screenShareTrack?.participant.name ||
    screenShareTrack?.participant.identity ||
    "Unknown";

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  if (!screenShareTrack?.publication?.track) {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center bg-slate-900",
          className
        )}
      >
        <div className="text-center">
          <div className="mb-4 h-24 w-24 mx-auto rounded-lg bg-slate-800 flex items-center justify-center">
            <Monitor className="h-12 w-12 text-violet-500" strokeWidth={1.5} />
          </div>
          <p className="text-muted-foreground">Screen Share</p>
          <p className="text-sm text-muted-foreground mt-2">
            No one is sharing their screen
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative h-full w-full bg-slate-950", className)}>
      <LKVideoTrack
        trackRef={screenShareTrack}
        className="h-full w-full object-contain"
      />

      {/* Overlay controls */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
        <div className="flex items-center gap-2 rounded-lg bg-black/60 px-3 py-2 backdrop-blur-sm">
          <Monitor className="h-4 w-4 text-violet-400" strokeWidth={2} />
          <span className="text-sm font-medium text-white">
            {sharerName}&apos;s screen
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleFullscreen}
            className="h-9 w-9 bg-black/60 border-white/20 hover:bg-black/80"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="h-4 w-4 text-white" strokeWidth={2} />
          </Button>

          {isLocal && onStopSharing && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onStopSharing}
              className="gap-2"
            >
              <X className="h-4 w-4" strokeWidth={2} />
              Stop Sharing
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

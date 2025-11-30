"use client";

import { Button } from "@/components/ui/button";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  Sparkles,
  PhoneOff,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function ControlBar() {
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [screenShare, setScreenShare] = useState(false);

  return (
    <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 shadow-lg">
      <Button
        variant={micEnabled ? "default" : "destructive"}
        size="icon"
        onClick={() => setMicEnabled(!micEnabled)}
        className="h-10 w-10"
        title={micEnabled ? "Mute" : "Unmute"}
      >
        {micEnabled ? (
          <Mic className="h-5 w-5" strokeWidth={1.5} />
        ) : (
          <MicOff className="h-5 w-5" strokeWidth={1.5} />
        )}
      </Button>

      <Button
        variant={videoEnabled ? "default" : "destructive"}
        size="icon"
        onClick={() => setVideoEnabled(!videoEnabled)}
        className="h-10 w-10"
        title={videoEnabled ? "Turn off camera" : "Turn on camera"}
      >
        {videoEnabled ? (
          <Video className="h-5 w-5" strokeWidth={1.5} />
        ) : (
          <VideoOff className="h-5 w-5" strokeWidth={1.5} />
        )}
      </Button>

      <Button
        variant={screenShare ? "default" : "outline"}
        size="icon"
        onClick={() => setScreenShare(!screenShare)}
        className="h-10 w-10"
        title="Share screen"
      >
        <Monitor className="h-5 w-5" strokeWidth={1.5} />
      </Button>

      <div className="mx-2 h-6 w-px bg-border" />

      <Button
        variant="default"
        size="icon"
        className="h-10 w-10 bg-violet-600 hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600"
        title="AI Insights"
      >
        <Sparkles className="h-5 w-5" strokeWidth={1.5} />
      </Button>

      <Button
        variant="destructive"
        size="icon"
        className="h-10 w-10"
        title="End call"
      >
        <PhoneOff className="h-5 w-5" strokeWidth={1.5} />
      </Button>
    </div>
  );
}



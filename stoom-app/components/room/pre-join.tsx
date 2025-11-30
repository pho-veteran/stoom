"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff, Video, VideoOff, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PreJoinProps {
  roomId: string;
  onJoin: () => void;
}

export function PreJoin({ roomId, onJoin }: PreJoinProps) {
  const name = "Vinh";
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);

  return (
    <div className="flex h-screen items-center justify-center bg-slate-950">
      <div className="w-full max-w-2xl px-4">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          Back to Dashboard
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Join Room: {roomId}</CardTitle>
            <CardDescription>
              Test your audio and video before joining
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Video Preview */}
            <div className="aspect-video w-full overflow-hidden rounded-lg bg-slate-900">
              <div className="flex h-full items-center justify-center">
                {videoEnabled ? (
                  <div className="text-center">
                    <div className="mb-4 h-24 w-24 mx-auto rounded-full bg-violet-600 flex items-center justify-center text-white text-2xl font-bold">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-muted-foreground">Video Preview</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <VideoOff className="h-16 w-16 mx-auto mb-2 text-muted-foreground" strokeWidth={1.5} />
                    <p className="text-muted-foreground">Camera is off</p>
                  </div>
                )}
              </div>
            </div>

            {/* Media Controls */}
            <div className="flex items-center justify-center gap-4">
              <Button
                variant={micEnabled ? "default" : "destructive"}
                size="icon"
                onClick={() => setMicEnabled(!micEnabled)}
                className="h-12 w-12"
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
                className="h-12 w-12"
              >
                {videoEnabled ? (
                  <Video className="h-5 w-5" strokeWidth={1.5} />
                ) : (
                  <VideoOff className="h-5 w-5" strokeWidth={1.5} />
                )}
              </Button>
            </div>

            {/* Join Button */}
            <Button
              className="w-full"
              size="lg"
              onClick={onJoin}
            >
              Join Room
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


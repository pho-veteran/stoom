"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mic, MicOff, Video, VideoOff, ArrowLeft, Loader2, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import Image from "next/image";

interface PreJoinProps {
  roomId: string;
  roomName?: string;
  hasPassword?: boolean;
  isHost?: boolean;
  onJoin: (settings: { micEnabled: boolean; videoEnabled: boolean; password?: string }) => void;
}

export function PreJoin({ roomId, roomName, hasPassword, isHost, onJoin }: PreJoinProps) {
  const { user } = useUser();
  const userName = user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] || "User";
  const userImageUrl = user?.imageUrl;
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [password, setPassword] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  // Initialize media stream
  const initializeMedia = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoEnabled,
        audio: micEnabled,
      });

      streamRef.current = stream;

      // Set video source
      if (videoRef.current && videoEnabled) {
        videoRef.current.srcObject = stream;
      }

      // Set up audio level monitoring
      if (micEnabled) {
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 256;

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateAudioLevel = () => {
          if (analyserRef.current) {
            analyserRef.current.getByteFrequencyData(dataArray);
            const average =
              dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
            setAudioLevel(Math.min(100, average * 2));
          }
          animationRef.current = requestAnimationFrame(updateAudioLevel);
        };

        updateAudioLevel();
      }

      setIsLoading(false);
    } catch (err) {
      console.error("Failed to access media devices:", err);
      setError(
        err instanceof Error ? err.message : "Failed to access camera/microphone"
      );
      setIsLoading(false);
    }
  }, [micEnabled, videoEnabled]);

  // Cleanup media stream
  const cleanupMedia = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    streamRef.current = null;
    audioContextRef.current = null;
    analyserRef.current = null;
  }, []);

  // Initialize on mount
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        // Set video source and play
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch (playErr) {
            console.log("Video autoplay handled by browser:", playErr);
          }
        }

        // Set up audio level monitoring
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 256;

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateAudioLevel = () => {
          if (analyserRef.current && mounted) {
            analyserRef.current.getByteFrequencyData(dataArray);
            const average =
              dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
            setAudioLevel(Math.min(100, average * 2));
            animationRef.current = requestAnimationFrame(updateAudioLevel);
          }
        };

        updateAudioLevel();
        setIsLoading(false);
      } catch (err) {
        if (mounted) {
          console.error("Failed to access media devices:", err);
          setError(
            err instanceof Error
              ? err.message
              : "Failed to access camera/microphone"
          );
          setIsLoading(false);
        }
      }
    };

    init();

    return () => {
      mounted = false;
      cleanupMedia();
    };
  }, [cleanupMedia]);

  // Toggle video
  const toggleVideo = async () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoEnabled;
        setVideoEnabled(!videoEnabled);
      } else if (!videoEnabled) {
        // Need to get a new video track
        try {
          const newStream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
          const newVideoTrack = newStream.getVideoTracks()[0];
          streamRef.current.addTrack(newVideoTrack);
          if (videoRef.current) {
            videoRef.current.srcObject = streamRef.current;
          }
          setVideoEnabled(true);
        } catch (err) {
          console.error("Failed to enable video:", err);
        }
      }
    }
  };

  // Toggle mic
  const toggleMic = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !micEnabled;
        setMicEnabled(!micEnabled);
        if (!micEnabled) {
          setAudioLevel(0);
        }
      }
    }
  };

  // Handle join
  const handleJoin = () => {
    cleanupMedia();
    onJoin({ micEnabled, videoEnabled, password: hasPassword ? password : undefined });
  };

  return (
    <div className="relative flex h-screen items-center justify-center bg-linear-to-br from-slate-50 via-white to-violet-50/30">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[32px_32px]" />
      <div className="relative z-10 w-full max-w-2xl px-4">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          Back to Dashboard
        </Link>

        <Card className="border-slate-200 bg-white/80 backdrop-blur-xl shadow-2xl shadow-slate-900/10">
          <CardHeader>
            <CardTitle className="text-slate-900">{roomName || `Room: ${roomId}`}</CardTitle>
            <CardDescription className="text-slate-500">
              Test your audio and video before joining
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Video Preview */}
            <div className="aspect-video w-full overflow-hidden rounded-xl bg-slate-100 border border-slate-200 relative">
              {/* Always render video element but hide when not needed */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`absolute inset-0 h-full w-full object-cover scale-x-[-1] ${
                  !isLoading && !error && videoEnabled ? "block" : "hidden"
                }`}
              />

              {isLoading && (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                </div>
              )}

              {error && !isLoading && (
                <div className="flex h-full items-center justify-center text-center p-4">
                  <div>
                    <VideoOff
                      className="h-12 w-12 mx-auto mb-2 text-red-400"
                      strokeWidth={1.5}
                    />
                    <p className="text-red-400 text-sm">{error}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={initializeMedia}
                    >
                      Retry
                    </Button>
                  </div>
                </div>
              )}

              {!isLoading && !error && !videoEnabled && (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    {userImageUrl ? (
                      <Image
                        src={userImageUrl}
                        alt={userName}
                        width={96}
                        height={96}
                        className="mb-4 h-24 w-24 mx-auto rounded-full object-cover"
                      />
                    ) : (
                      <div className="mb-4 h-24 w-24 mx-auto rounded-full bg-violet-600 flex items-center justify-center text-white text-2xl font-bold">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <p className="text-muted-foreground">Camera is off</p>
                  </div>
                </div>
              )}

              {/* Audio level indicator */}
              {micEnabled && !isLoading && !error && (
                <div className="absolute bottom-4 left-4 right-4 z-10">
                  <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-75"
                      style={{ width: `${audioLevel}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Password Input (if required and not host) */}
            {hasPassword && !isHost && (
              <div className="space-y-2">
                <Label htmlFor="room-password" className="text-sm font-medium flex items-center gap-2">
                  <Lock className="h-4 w-4 text-slate-500" strokeWidth={1.5} />
                  Room Password
                </Label>
                <Input
                  id="room-password"
                  type="password"
                  placeholder="Enter room password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11"
                />
              </div>
            )}

            {/* Media Controls */}
            <div className="flex items-center justify-center gap-4">
              <Button
                variant={micEnabled ? "default" : "destructive"}
                size="icon"
                onClick={toggleMic}
                className="h-14 w-14 rounded-full"
                disabled={isLoading}
              >
                {micEnabled ? (
                  <Mic className="h-6 w-6" strokeWidth={1.5} />
                ) : (
                  <MicOff className="h-6 w-6" strokeWidth={1.5} />
                )}
              </Button>
              <Button
                variant={videoEnabled ? "default" : "destructive"}
                size="icon"
                onClick={toggleVideo}
                className="h-14 w-14 rounded-full"
                disabled={isLoading}
              >
                {videoEnabled ? (
                  <Video className="h-6 w-6" strokeWidth={1.5} />
                ) : (
                  <VideoOff className="h-6 w-6" strokeWidth={1.5} />
                )}
              </Button>
            </div>

            {/* Join Button */}
            <Button
              className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium"
              size="lg"
              onClick={handleJoin}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Initializing...
                </>
              ) : (
                "Join Room"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  Circle,
  PhoneOff,
  MessageSquare,
  ScrollText,
  ChevronUp,
  AlertTriangle,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface FloatingDockProps {
  onToggleScreenShare: () => void;
  onToggleChatNotes: () => void;
  onToggleTranscript: () => void;
  screenShareVisible: boolean;
  chatNotesVisible: boolean;
  transcriptVisible: boolean;
}

export function FloatingDock({
  onToggleScreenShare,
  onToggleChatNotes,
  onToggleTranscript,
  screenShareVisible,
  chatNotesVisible,
  transcriptVisible,
}: FloatingDockProps) {
  const router = useRouter();
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleRecordingClick = () => {
    setShowRecordingModal(true);
  };

  const handleConfirmRecording = () => {
    setIsRecording(!isRecording);
    setShowRecordingModal(false);
  };

  // Auto-hide after 3 seconds of no hover
  useEffect(() => {
    if (isHovered) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setIsVisible(true);
    } else {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 3000);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isHovered]);

  return (
    <>
      {/* Show button when dock is hidden */}
      {!isVisible && (
        <div
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
          onMouseEnter={() => setIsHovered(true)}
        >
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full bg-card/95 backdrop-blur-xl"
            onClick={() => setIsVisible(true)}
            title="Show Controls"
          >
            <ChevronUp className="h-4 w-4" strokeWidth={2} />
          </Button>
        </div>
      )}

      <div
        className={cn(
          "fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border-2 border-border/50 bg-card/95 backdrop-blur-xl px-4 py-3 shadow-2xl supports-[backdrop-filter]:bg-card/80 transition-all duration-300",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
      {/* Media Controls */}
      <Button
        variant={micEnabled ? "default" : "destructive"}
        size="icon"
        onClick={() => setMicEnabled(!micEnabled)}
        className="h-11 w-11 rounded-full"
        title={micEnabled ? "Mute" : "Unmute"}
      >
        {micEnabled ? (
          <Mic className="h-5 w-5" strokeWidth={2} />
        ) : (
          <MicOff className="h-5 w-5" strokeWidth={2} />
        )}
      </Button>

      <Button
        variant={videoEnabled ? "default" : "destructive"}
        size="icon"
        onClick={() => setVideoEnabled(!videoEnabled)}
        className="h-11 w-11 rounded-full"
        title={videoEnabled ? "Turn off camera" : "Turn on camera"}
      >
        {videoEnabled ? (
          <Video className="h-5 w-5" strokeWidth={2} />
        ) : (
          <VideoOff className="h-5 w-5" strokeWidth={2} />
        )}
      </Button>

      <Button
        variant={screenShareVisible ? "default" : "outline"}
        size="icon"
        onClick={onToggleScreenShare}
        className={cn(
          "h-11 w-11 rounded-full",
          screenShareVisible && "bg-violet-600 hover:bg-violet-700 text-white"
        )}
        title="Toggle Screen Share"
      >
        <Monitor className="h-5 w-5" strokeWidth={2} />
      </Button>

      <div className="mx-1 h-8 w-px bg-border" />

      {/* Record Meeting */}
      <Button
        variant={isRecording ? "destructive" : "default"}
        size="icon"
        onClick={handleRecordingClick}
        className={cn(
          "h-11 w-11 rounded-full",
          isRecording && "bg-red-600 hover:bg-red-700 text-white"
        )}
        title={isRecording ? "Stop Recording" : "Start Recording"}
      >
        <Circle className={cn("h-5 w-5", isRecording && "fill-white")} strokeWidth={2} />
      </Button>

      <div className="mx-1 h-8 w-px bg-border" />

      {/* Toggle Panels */}
      <Button
        variant={chatNotesVisible ? "default" : "outline"}
        size="icon"
        onClick={onToggleChatNotes}
        className={cn(
          "h-11 w-11 rounded-full",
          chatNotesVisible && "bg-violet-600 hover:bg-violet-700 text-white"
        )}
        title="Toggle Chat & Notes"
      >
        <MessageSquare className="h-5 w-5" strokeWidth={2} />
      </Button>

      <Button
        variant={transcriptVisible ? "default" : "outline"}
        size="icon"
        onClick={onToggleTranscript}
        className={cn(
          "h-11 w-11 rounded-full",
          transcriptVisible && "bg-violet-600 hover:bg-violet-700 text-white"
        )}
        title="Toggle Transcript"
      >
        <ScrollText className="h-5 w-5" strokeWidth={2} />
      </Button>

      <div className="mx-1 h-8 w-px bg-border" />

      {/* Leave Room */}
      <Button
        variant="destructive"
        size="icon"
        className="h-11 w-11 rounded-full"
        onClick={() => router.push("/dashboard")}
        title="Leave Room"
      >
        <PhoneOff className="h-5 w-5" strokeWidth={2} />
      </Button>
    </div>

    {/* Recording Confirmation Modal */}
    <Dialog open={showRecordingModal} onOpenChange={setShowRecordingModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              isRecording ? "bg-red-100 dark:bg-red-900/30" : "bg-violet-100 dark:bg-violet-900/30"
            )}>
              {isRecording ? (
                <Circle className="h-5 w-5 text-red-600 dark:text-red-400 fill-red-600 dark:fill-red-400" strokeWidth={2} />
              ) : (
                <AlertTriangle className="h-5 w-5 text-violet-600 dark:text-violet-400" strokeWidth={2} />
              )}
            </div>
            <DialogTitle>
              {isRecording ? "Stop Recording?" : "Start Recording?"}
            </DialogTitle>
          </div>
        </DialogHeader>
        <DialogDescription className="pt-2">
          {isRecording ? (
            <>
              Are you sure you want to stop recording this meeting? The recording will be saved and available in your recordings.
            </>
          ) : (
            <>
              This meeting will be recorded. All participants will be notified. The recording will include audio, video, and screen shares.
            </>
          )}
        </DialogDescription>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => setShowRecordingModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant={isRecording ? "destructive" : "default"}
            onClick={handleConfirmRecording}
            className={cn(
              isRecording && "bg-red-600 hover:bg-red-700"
            )}
          >
            {isRecording ? "Stop Recording" : "Start Recording"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}

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
  LogOut,
  XCircle,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import axios from "axios";

interface FloatingDockProps {
  roomId: string;
  isHost?: boolean;
  micEnabled: boolean;
  videoEnabled: boolean;
  isScreenSharing: boolean;
  currentScreenSharerName?: string;
  onToggleMic: () => Promise<void>;
  onToggleVideo: () => Promise<void>;
  onStartScreenShare: () => Promise<void>;
  onStopScreenShare: () => Promise<void>;
  onToggleChatNotes: () => void;
  onToggleTranscript: () => void;
  chatNotesVisible: boolean;
  transcriptVisible: boolean;
  onLeaveRoom?: () => void;
  onEndRoom?: () => void;
}

export function FloatingDock({
  roomId,
  isHost = false,
  micEnabled,
  videoEnabled,
  isScreenSharing,
  currentScreenSharerName,
  onToggleMic,
  onToggleVideo,
  onStartScreenShare,
  onStopScreenShare,
  onToggleChatNotes,
  onToggleTranscript,
  chatNotesVisible,
  transcriptVisible,
  onLeaveRoom,
  onEndRoom,
}: FloatingDockProps) {
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const [showScreenShareModal, setShowScreenShareModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showEndMeetingModal, setShowEndMeetingModal] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleRecordingClick = () => {
    setShowRecordingModal(true);
  };

  const handleConfirmRecording = () => {
    setIsRecording(!isRecording);
    setShowRecordingModal(false);
  };

  const handleLeaveRoom = async () => {
    setIsLeaving(true);
    try {
      await axios.post("/api/room/leave", { roomId });
      onLeaveRoom?.();
      router.push("/dashboard");
    } catch (error) {
      console.error("Error leaving room:", error);
      router.push("/dashboard");
    } finally {
      setIsLeaving(false);
      setShowLeaveModal(false);
    }
  };

  const handleEndMeeting = async () => {
    setIsLeaving(true);
    try {
      // Broadcast to all participants that room is ending
      await onEndRoom?.();
      // End room in database
      await axios.post("/api/room/end", { roomId });
      router.push("/dashboard");
    } catch (error) {
      console.error("Error ending meeting:", error);
      router.push("/dashboard");
    } finally {
      setIsLeaving(false);
      setShowEndMeetingModal(false);
    }
  };

  // Auto-hide after 3 seconds of no hover
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!isHovered && isVisible) {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 3000);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isHovered, isVisible]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <>
      {/* Show button when dock is hidden */}
      {!isVisible && (
        <div
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
          onMouseEnter={handleMouseEnter}
        >
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-full bg-white/90 backdrop-blur-xl border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-lg"
            onClick={() => setIsVisible(true)}
            title="Show Controls"
          >
            <ChevronUp className="h-5 w-5 text-slate-700" strokeWidth={2} />
          </Button>
        </div>
      )}

      <div
        className={cn(
          "fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-2xl px-5 py-3.5 shadow-2xl shadow-slate-900/10 transition-all duration-300",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Media Controls */}
        <Button
          variant={micEnabled ? "default" : "destructive"}
          size="icon"
          onClick={onToggleMic}
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
          onClick={onToggleVideo}
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
          variant={isScreenSharing ? "default" : "outline"}
          size="icon"
          onClick={() => {
            if (isScreenSharing) {
              onStopScreenShare();
            } else if (currentScreenSharerName) {
              setShowScreenShareModal(true);
            } else {
              onStartScreenShare();
            }
          }}
          className={cn(
            "h-11 w-11 rounded-full",
            isScreenSharing && "bg-violet-600 hover:bg-violet-700 text-white"
          )}
          title={isScreenSharing ? "Stop Screen Share" : "Start Screen Share"}
        >
          <Monitor className="h-5 w-5" strokeWidth={2} />
        </Button>

        <div className="mx-1 h-8 w-px bg-slate-200" />

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

        <div className="mx-1 h-8 w-px bg-slate-200" />

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

        <div className="mx-1 h-8 w-px bg-slate-200" />

        {/* Leave Room */}
        <Button
          variant="outline"
          size="icon"
          className="h-11 w-11 rounded-full border-amber-300 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
          onClick={() => setShowLeaveModal(true)}
          title="Leave Room"
        >
          <LogOut className="h-5 w-5" strokeWidth={2} />
        </Button>

        {/* End Meeting (Host only) */}
        {isHost && (
          <Button
            variant="destructive"
            size="icon"
            className="h-11 w-11 rounded-full"
            onClick={() => setShowEndMeetingModal(true)}
            title="End Meeting for All"
          >
            <PhoneOff className="h-5 w-5" strokeWidth={2} />
          </Button>
        )}
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
          <DialogFooter className="gap-3">
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

      {/* Screen Share Takeover Confirmation Modal */}
      <Dialog open={showScreenShareModal} onOpenChange={setShowScreenShareModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                <Monitor className="h-5 w-5 text-amber-600 dark:text-amber-400" strokeWidth={2} />
              </div>
              <DialogTitle>Replace Current Presentation?</DialogTitle>
            </div>
          </DialogHeader>
          <DialogDescription className="pt-2">
            <span className="font-semibold">{currentScreenSharerName}</span> is currently sharing their screen. 
            Starting your screen share will replace their presentation. They will be notified that their screen share has ended.
          </DialogDescription>
          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setShowScreenShareModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={async () => {
                setShowScreenShareModal(false);
                await onStartScreenShare();
              }}
              className="bg-violet-600 hover:bg-violet-700"
            >
              Replace Presentation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leave Room Confirmation Modal */}
      <Dialog open={showLeaveModal} onOpenChange={setShowLeaveModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                <LogOut className="h-5 w-5 text-amber-600" strokeWidth={2} />
              </div>
              <DialogTitle>Leave Meeting?</DialogTitle>
            </div>
          </DialogHeader>
          <DialogDescription className="pt-2">
            Are you sure you want to leave this meeting? You can rejoin later using the room code.
          </DialogDescription>
          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setShowLeaveModal(false)}
              disabled={isLeaving}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleLeaveRoom}
              disabled={isLeaving}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isLeaving ? "Leaving..." : "Leave Meeting"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* End Meeting Confirmation Modal (Host only) */}
      <Dialog open={showEndMeetingModal} onOpenChange={setShowEndMeetingModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-5 w-5 text-red-600" strokeWidth={2} />
              </div>
              <DialogTitle>End Meeting for Everyone?</DialogTitle>
            </div>
          </DialogHeader>
          <DialogDescription className="pt-2">
            This will end the meeting for all participants. Everyone will be disconnected and the meeting will be marked as ended.
          </DialogDescription>
          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setShowEndMeetingModal(false)}
              disabled={isLeaving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleEndMeeting}
              disabled={isLeaving}
            >
              {isLeaving ? "Ending..." : "End Meeting"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

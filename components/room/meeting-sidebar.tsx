"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import axios from "axios";
import { cn } from "@/lib/utils";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  Square,
  Users,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  LogOut,
  PhoneOff,
  Settings,
  X,
  MessageSquare,
  Rows2,
  Columns2,
  Save,
  Loader2,
  ChevronsUpDown,
  Crown,
  Shield,
  Hand,
  Grab,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ParticipantInfo } from "@/hooks/use-participants";
import type { CollaborationPermissions, PermissionLevel } from "@/lib/collaboration-types";
import type { HandRaiseState } from "@/lib/hand-raise-types";
import { HandRaiseButton } from "./hand-raise-button";
import { ParticipantHandRaiseIndicator } from "./participant-hand-raise-indicator";
import { HandRaiseControls } from "./hand-raise-controls";

interface MeetingSidebarProps {
  roomId: string;
  currentUserId: string;
  meetingTitle?: string;
  participants?: ParticipantInfo[];
  activeSpeaker?: ParticipantInfo | null;
  // Media controls
  micEnabled: boolean;
  videoEnabled: boolean;
  isScreenSharing: boolean;
  currentScreenSharerName?: string;
  onToggleMic: () => Promise<void>;
  onToggleVideo: () => Promise<void>;
  onStartScreenShare: () => Promise<void>;
  onStopScreenShare: () => Promise<void>;
  onLeaveRoom?: () => void;
  onEndRoom?: () => void;
  // Hand raise controls
  isHandRaised?: boolean;
  onToggleHandRaise?: () => void;
  isConnected?: boolean;
  handRaiseQueue?: HandRaiseState[];
  handRaiseCount?: number;
  onLowerParticipantHand?: (participantId: string) => void;
  onLowerAllHands?: () => void;
  // Whiteboard save
  onSaveWhiteboard?: () => Promise<void>;
  isWhiteboardSaving?: boolean;
  whiteboardSaveStatus?: "idle" | "saved";
  canEditWhiteboard?: boolean;
  canSaveWhiteboard?: boolean;
  // Panel toggles
  showScreenShare: boolean;
  showWhiteboard: boolean;
  showVideoFeeds: boolean;
  onToggleScreenShare: () => void;
  onToggleWhiteboard: () => void;
  onToggleVideoFeeds: () => void;
  // Chat/Notes toggle
  chatNotesVisible: boolean;
  onToggleChatNotes: () => void;
  // Layout
  layout: "horizontal" | "vertical";
  onToggleLayout: () => void;
  // Permission controls (host/co-host)
  permissions?: CollaborationPermissions;
  canManagePermissions?: boolean;
  canEndMeeting?: boolean;
  canManageCoHosts?: boolean;
  onUpdatePermissions?: (permissions: Partial<CollaborationPermissions>) => Promise<void>;
  onGrantWhiteboardAccess?: (userId: string) => Promise<void>;
  onRevokeWhiteboardAccess?: (userId: string) => Promise<void>;
  onGrantCoHost?: (userId: string) => Promise<void>;
  onRevokeCoHost?: (userId: string) => Promise<void>;
  // Whiteboard visibility
  canViewWhiteboard?: boolean;
}


export function MeetingSidebar({
  roomId,
  currentUserId,
  meetingTitle,
  participants = [],
  activeSpeaker,
  micEnabled,
  videoEnabled,
  isScreenSharing,
  currentScreenSharerName,
  onToggleMic,
  onToggleVideo,
  onStartScreenShare,
  onStopScreenShare,
  onLeaveRoom,
  onEndRoom,
  isHandRaised = false,
  onToggleHandRaise,
  isConnected = true,
  handRaiseQueue = [],
  handRaiseCount = 0,
  onLowerParticipantHand,
  onLowerAllHands,
  onSaveWhiteboard,
  isWhiteboardSaving = false,
  whiteboardSaveStatus = "idle",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  canEditWhiteboard = true,
  canSaveWhiteboard = false,
  showScreenShare,
  showWhiteboard,
  showVideoFeeds,
  onToggleScreenShare,
  onToggleWhiteboard,
  onToggleVideoFeeds,
  chatNotesVisible,
  onToggleChatNotes,
  layout,
  onToggleLayout,
  permissions,
  canManagePermissions = false,
  canEndMeeting = false,
  canManageCoHosts = false,
  onUpdatePermissions,
  onGrantWhiteboardAccess,
  onRevokeWhiteboardAccess,
  onGrantCoHost,
  onRevokeCoHost,
  canViewWhiteboard = true,
}: MeetingSidebarProps) {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showScreenShareModal, setShowScreenShareModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showEndMeetingModal, setShowEndMeetingModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const displayTitle = meetingTitle || "Study Session";
  const roomCode = roomId || "------";

  const handleCopyCode = async () => {
    if (roomId) {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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
      await onEndRoom?.();
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

  const visiblePanelCount = [showScreenShare, showWhiteboard, showVideoFeeds].filter(Boolean).length;

  if (isCollapsed) {
    return (
      <CollapsedSidebar
        participants={participants}
        activeSpeaker={activeSpeaker}
        micEnabled={micEnabled}
        videoEnabled={videoEnabled}
        onToggleMic={onToggleMic}
        onToggleVideo={onToggleVideo}
        onExpand={() => setIsCollapsed(false)}
        isHandRaised={isHandRaised}
        onToggleHandRaise={onToggleHandRaise}
        isConnected={isConnected}
        handRaiseCount={handRaiseCount}
      />
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

      {/* Media Controls */}
      <div className="border-b border-slate-100 p-3">
        <div className="flex items-center justify-center gap-2">
          <Button
            variant={micEnabled ? "default" : "destructive"}
            size="icon"
            onClick={onToggleMic}
            className="h-10 w-10 rounded-full"
            title={micEnabled ? "Mute" : "Unmute"}
          >
            {micEnabled ? (
              <Mic className="h-4 w-4" strokeWidth={2} />
            ) : (
              <MicOff className="h-4 w-4" strokeWidth={2} />
            )}
          </Button>

          <Button
            variant={videoEnabled ? "default" : "destructive"}
            size="icon"
            onClick={onToggleVideo}
            className="h-10 w-10 rounded-full"
            title={videoEnabled ? "Turn off camera" : "Turn on camera"}
          >
            {videoEnabled ? (
              <Video className="h-4 w-4" strokeWidth={2} />
            ) : (
              <VideoOff className="h-4 w-4" strokeWidth={2} />
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
              "h-10 w-10 rounded-full",
              isScreenSharing && "bg-violet-600 hover:bg-violet-700 text-white"
            )}
            title={isScreenSharing ? "Stop Screen Share" : "Start Screen Share"}
          >
            <Monitor className="h-4 w-4" strokeWidth={2} />
          </Button>

          {/* Hand Raise Button */}
          {onToggleHandRaise && (
            <div className="h-10 w-10">
              <HandRaiseButton
                isRaised={isHandRaised}
                onToggle={onToggleHandRaise}
                disabled={!isConnected}
              />
            </div>
          )}

          {/* Save Whiteboard Button - only for host/co-host */}
          {canSaveWhiteboard && onSaveWhiteboard && (
            <Button
              variant={whiteboardSaveStatus === "saved" ? "default" : "outline"}
              size="icon"
              onClick={onSaveWhiteboard}
              disabled={isWhiteboardSaving}
              className={cn(
                "h-10 w-10 rounded-full",
                whiteboardSaveStatus === "saved" && "bg-green-600 hover:bg-green-700 text-white"
              )}
              title="Save Whiteboard"
            >
              {isWhiteboardSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
              ) : whiteboardSaveStatus === "saved" ? (
                <Check className="h-4 w-4" strokeWidth={2} />
              ) : (
                <Save className="h-4 w-4" strokeWidth={2} />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Panel Toggles */}
      <div className="border-b border-slate-100 p-3">
        <p className="text-xs font-medium text-slate-500 mb-2 px-1">View Options</p>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={showScreenShare ? "default" : "outline"}
            size="sm"
            onClick={onToggleScreenShare}
            className="gap-1.5 text-xs"
          >
            <Monitor className="h-3.5 w-3.5" strokeWidth={2} />
            Screen
          </Button>
          {canViewWhiteboard && (
            <Button
              variant={showWhiteboard ? "default" : "outline"}
              size="sm"
              onClick={onToggleWhiteboard}
              className="gap-1.5 text-xs"
            >
              <Square className="h-3.5 w-3.5" strokeWidth={2} />
              Board
            </Button>
          )}
          <Button
            variant={showVideoFeeds ? "default" : "outline"}
            size="sm"
            onClick={onToggleVideoFeeds}
            className="gap-1.5 text-xs"
          >
            <Users className="h-3.5 w-3.5" strokeWidth={2} />
            Videos
          </Button>
          <Button
            variant={chatNotesVisible ? "default" : "outline"}
            size="sm"
            onClick={onToggleChatNotes}
            className="gap-1.5 text-xs"
          >
            <MessageSquare className="h-3.5 w-3.5" strokeWidth={2} />
            Chat
          </Button>
        </div>
        {visiblePanelCount === 2 && (
          <div className="mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleLayout}
              className="w-full gap-1.5 text-xs"
              title={layout === "horizontal" ? "Switch to vertical layout" : "Switch to horizontal layout"}
            >
              {layout === "horizontal" ? (
                <Rows2 className="h-3.5 w-3.5" strokeWidth={2} />
              ) : (
                <Columns2 className="h-3.5 w-3.5" strokeWidth={2} />
              )}
              {layout === "horizontal" ? "Vertical Layout" : "Horizontal Layout"}
            </Button>
          </div>
        )}
      </div>


      {/* Participants Section */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-400" strokeWidth={2} />
            <span className="text-sm font-medium text-slate-700">Participants</span>
          </div>
          <div className="flex items-center gap-2">
            {handRaiseCount > 0 && (
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-amber-100 px-2 text-xs font-semibold text-amber-600 gap-1">
                <Hand className="h-3 w-3" strokeWidth={2} />
                {handRaiseCount}
              </span>
            )}
            {canManagePermissions && handRaiseCount > 0 && onLowerAllHands && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onLowerAllHands}
                      className="h-6 w-6 hover:bg-amber-100"
                      aria-label="Lower all hands"
                    >
                      <Grab className="h-3.5 w-3.5 text-amber-600" strokeWidth={2} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Lower all hands</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-violet-100 px-2 text-xs font-semibold text-violet-600">
              {participants.length}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {participants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 mb-3">
                <Users className="h-6 w-6 text-slate-400" strokeWidth={1.5} />
              </div>
              <p className="text-sm font-medium text-slate-500">No participants yet</p>
              <p className="text-xs text-slate-400 mt-1">Share the room code</p>
            </div>
          ) : (
            <div className="space-y-1">
              {participants.map((participant) => {
                const isActive = activeSpeaker?.identity === participant.identity || participant.isSpeaking;
                
                // Find hand raise state for this participant
                const handRaiseState = handRaiseQueue.find(
                  (state) => state.participantId === participant.identity
                );
                const queuePosition = handRaiseState
                  ? handRaiseQueue.indexOf(handRaiseState) + 1
                  : undefined;
                
                return (
                  <div
                    key={participant.identity}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-150",
                      isActive ? "bg-violet-50 border border-violet-200" : "hover:bg-slate-50"
                    )}
                  >
                    <div className="relative shrink-0">
                      {participant.imageUrl ? (
                        <Image
                          src={participant.imageUrl}
                          alt={participant.name}
                          width={32}
                          height={32}
                          className={cn(
                            "h-8 w-8 rounded-full object-cover",
                            isActive && "ring-2 ring-violet-300"
                          )}
                        />
                      ) : (
                        <div
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full text-white text-xs font-semibold",
                            isActive ? "bg-violet-600" : "bg-slate-400"
                          )}
                        >
                          {participant.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {participant.name}
                        {participant.isLocal && (
                          <span className="ml-1 text-xs font-normal text-slate-400">(You)</span>
                        )}
                      </p>
                    </div>
                    
                    {/* Hand Raise Indicator */}
                    <ParticipantHandRaiseIndicator
                      isRaised={!!handRaiseState}
                      raisedAt={handRaiseState?.raisedAt}
                      queuePosition={queuePosition}
                    />
                    
                    {/* Host Controls for Hand Raise */}
                    {onLowerParticipantHand && (
                      <HandRaiseControls
                        participantId={participant.identity}
                        isRaised={!!handRaiseState}
                        isHost={canManagePermissions || false}
                        onLowerHand={onLowerParticipantHand}
                      />
                    )}
                    
                    <div className="flex items-center gap-1 shrink-0">
                      <div className={cn("flex h-5 w-5 items-center justify-center rounded-full", participant.isAudioEnabled ? "bg-emerald-100" : "bg-red-100")}>
                        {participant.isAudioEnabled ? (
                          <Mic className="h-3 w-3 text-emerald-600" strokeWidth={2} />
                        ) : (
                          <MicOff className="h-3 w-3 text-red-500" strokeWidth={2} />
                        )}
                      </div>
                      <div className={cn("flex h-5 w-5 items-center justify-center rounded-full", participant.isVideoEnabled ? "bg-emerald-100" : "bg-slate-100")}>
                        {participant.isVideoEnabled ? (
                          <Video className="h-3 w-3 text-emerald-600" strokeWidth={2} />
                        ) : (
                          <VideoOff className="h-3 w-3 text-slate-400" strokeWidth={2} />
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


      {/* Bottom Actions */}
      <div className="border-t border-slate-100 p-3">
        <div className="flex items-center justify-center gap-2">
          {canManagePermissions && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowPermissionsModal(true)}
              className="h-10 w-10 rounded-full"
              title="Collaboration Settings"
            >
              <Settings className="h-4 w-4" strokeWidth={2} />
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full border-amber-300 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
            onClick={() => setShowLeaveModal(true)}
            title="Leave Room"
          >
            <LogOut className="h-4 w-4" strokeWidth={2} />
          </Button>
          {canEndMeeting && (
            <Button
              variant="destructive"
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={() => setShowEndMeetingModal(true)}
              title="End Meeting for All"
            >
              <PhoneOff className="h-4 w-4" strokeWidth={2} />
            </Button>
          )}
        </div>
      </div>

      {/* Modals */}
      <ScreenShareModal
        open={showScreenShareModal}
        onOpenChange={setShowScreenShareModal}
        currentScreenSharerName={currentScreenSharerName}
        onStartScreenShare={onStartScreenShare}
      />

      <LeaveRoomModal
        open={showLeaveModal}
        onOpenChange={setShowLeaveModal}
        isLeaving={isLeaving}
        onLeave={handleLeaveRoom}
      />

      <EndMeetingModal
        open={showEndMeetingModal}
        onOpenChange={setShowEndMeetingModal}
        isLeaving={isLeaving}
        onEnd={handleEndMeeting}
      />

      <PermissionsModal
        open={showPermissionsModal}
        onOpenChange={setShowPermissionsModal}
        roomId={roomId}
        currentUserId={currentUserId}
        permissions={permissions}
        canManageCoHosts={canManageCoHosts}
        onUpdatePermissions={onUpdatePermissions}
        onGrantWhiteboardAccess={onGrantWhiteboardAccess}
        onRevokeWhiteboardAccess={onRevokeWhiteboardAccess}
        onGrantCoHost={onGrantCoHost}
        onRevokeCoHost={onRevokeCoHost}
      />
    </div>
  );
}


// Collapsed sidebar view
function CollapsedSidebar({
  participants,
  activeSpeaker,
  micEnabled,
  videoEnabled,
  onToggleMic,
  onToggleVideo,
  onExpand,
  isHandRaised,
  onToggleHandRaise,
  isConnected,
  handRaiseCount,
}: {
  participants: ParticipantInfo[];
  activeSpeaker?: ParticipantInfo | null;
  micEnabled: boolean;
  videoEnabled: boolean;
  onToggleMic: () => Promise<void>;
  onToggleVideo: () => Promise<void>;
  onExpand: () => void;
  isHandRaised?: boolean;
  onToggleHandRaise?: () => void;
  isConnected?: boolean;
  handRaiseCount?: number;
}) {
  return (
    <div className="flex h-full w-16 flex-col items-center border-r border-slate-200 bg-white transition-all duration-300">
      <Button
        variant="ghost"
        size="icon"
        onClick={onExpand}
        className="mt-3 h-9 w-9 hover:bg-slate-100"
        title="Expand Sidebar"
      >
        <ChevronRight className="h-4 w-4 text-slate-600" strokeWidth={2} />
      </Button>

      {/* Quick media controls */}
      <div className="mt-3 flex flex-col gap-2">
        <Button
          variant={micEnabled ? "default" : "destructive"}
          size="icon"
          onClick={onToggleMic}
          className="h-9 w-9 rounded-full"
          title={micEnabled ? "Mute" : "Unmute"}
        >
          {micEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        </Button>
        <Button
          variant={videoEnabled ? "default" : "destructive"}
          size="icon"
          onClick={onToggleVideo}
          className="h-9 w-9 rounded-full"
          title={videoEnabled ? "Turn off camera" : "Turn on camera"}
        >
          {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
        </Button>
        {onToggleHandRaise && (
          <div className="h-9 w-9">
            <HandRaiseButton
              isRaised={isHandRaised || false}
              onToggle={onToggleHandRaise}
              disabled={!isConnected}
            />
          </div>
        )}
      </div>

      <div className="mt-4 flex h-10 w-10 items-center justify-center rounded-full bg-violet-100">
        <span className="text-sm font-bold text-violet-600">{participants.length}</span>
      </div>
      
      {/* Hand raise count badge */}
      {handRaiseCount && handRaiseCount > 0 && (
        <div className="mt-2 flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
          <span className="text-xs font-bold text-amber-600">{handRaiseCount}</span>
        </div>
      )}

      <div className="mt-4 flex-1 overflow-y-auto px-2">
        <div className="flex flex-col items-center gap-2">
          {participants.slice(0, 6).map((participant) => {
            const isActive = activeSpeaker?.identity === participant.identity || participant.isSpeaking;
            return (
              <div key={participant.identity} className="relative" title={`${participant.name}${participant.isLocal ? " (You)" : ""}`}>
                {participant.imageUrl ? (
                  <Image
                    src={participant.imageUrl}
                    alt={participant.name}
                    width={36}
                    height={36}
                    className={cn("h-9 w-9 rounded-full object-cover transition-all", isActive && "ring-2 ring-violet-300 ring-offset-2")}
                  />
                ) : (
                  <div className={cn("flex h-9 w-9 items-center justify-center rounded-full text-white text-sm font-semibold transition-all", isActive ? "bg-violet-600 ring-2 ring-violet-300 ring-offset-2" : "bg-slate-400")}>
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
          {participants.length > 6 && (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-600">
              +{participants.length - 6}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// Modal components
function ScreenShareModal({
  open,
  onOpenChange,
  currentScreenSharerName,
  onStartScreenShare,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentScreenSharerName?: string;
  onStartScreenShare: () => Promise<void>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
              <Monitor className="h-5 w-5 text-amber-600" strokeWidth={2} />
            </div>
            <DialogTitle>Replace Current Presentation?</DialogTitle>
          </div>
        </DialogHeader>
        <DialogDescription className="pt-2">
          <span className="font-semibold">{currentScreenSharerName}</span> is currently sharing their screen.
          Starting your screen share will replace their presentation.
        </DialogDescription>
        <DialogFooter className="gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant="default"
            onClick={async () => {
              onOpenChange(false);
              await onStartScreenShare();
            }}
            className="bg-violet-600 hover:bg-violet-700"
          >
            Replace Presentation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LeaveRoomModal({
  open,
  onOpenChange,
  isLeaving,
  onLeave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLeaving: boolean;
  onLeave: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLeaving}>Cancel</Button>
          <Button variant="default" onClick={onLeave} disabled={isLeaving} className="bg-amber-600 hover:bg-amber-700">
            {isLeaving ? "Leaving..." : "Leave Meeting"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EndMeetingModal({
  open,
  onOpenChange,
  isLeaving,
  onEnd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLeaving: boolean;
  onEnd: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <PhoneOff className="h-5 w-5 text-red-600" strokeWidth={2} />
            </div>
            <DialogTitle>End Meeting for Everyone?</DialogTitle>
          </div>
        </DialogHeader>
        <DialogDescription className="pt-2">
          This will end the meeting for all participants. Everyone will be disconnected.
        </DialogDescription>
        <DialogFooter className="gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLeaving}>Cancel</Button>
          <Button variant="destructive" onClick={onEnd} disabled={isLeaving}>
            {isLeaving ? "Ending..." : "End Meeting"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


/**
 * Database participant type
 */
interface DbParticipant {
  odId: string;
  identity: string;
  name: string;
  email: string;
  imageUrl: string | null;
  role: string;
  joinedAt: string;
  leftAt: string | null;
  isActive: boolean;
}

function PermissionsModal({
  open,
  onOpenChange,
  roomId,
  currentUserId,
  permissions,
  canManageCoHosts,
  onUpdatePermissions,
  onGrantWhiteboardAccess,
  onRevokeWhiteboardAccess,
  onGrantCoHost,
  onRevokeCoHost,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  currentUserId: string;
  permissions?: CollaborationPermissions;
  canManageCoHosts?: boolean;
  onUpdatePermissions?: (permissions: Partial<CollaborationPermissions>) => Promise<void>;
  onGrantWhiteboardAccess?: (userId: string) => Promise<void>;
  onRevokeWhiteboardAccess?: (userId: string) => Promise<void>;
  onGrantCoHost?: (userId: string) => Promise<void>;
  onRevokeCoHost?: (userId: string) => Promise<void>;
}) {
  const [dbParticipants, setDbParticipants] = useState<DbParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  // Fetch participants from database only when modal opens (not on button click)
  useEffect(() => {
    if (!open) {
      // Reset when modal closes
      setHasFetched(false);
      return;
    }
    
    // Only fetch once when modal opens
    if (hasFetched || isLoading || !roomId) return;
    
    const fetchParticipants = async () => {
      setIsLoading(true);
      console.log("[PermissionsModal] Modal opened, fetching participants for room:", roomId);
      try {
        const response = await axios.get(`/api/room/${roomId}/participants`);
        const participants = response.data.participants || [];
        console.log("[PermissionsModal] Fetched participants:", participants);
        console.log("[PermissionsModal] Current user ID:", currentUserId);
        setDbParticipants(participants);
        setHasFetched(true);
      } catch (error) {
        console.error("[PermissionsModal] Failed to fetch participants:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchParticipants();
  }, [open, roomId, currentUserId, hasFetched, isLoading]);

  // Convert DB participants to SimpleParticipant format, excluding current user and host
  const participantsForSelector: SimpleParticipant[] = dbParticipants
    .filter((p) => p.identity !== currentUserId && p.role !== "HOST")
    .map((p) => ({
      identity: p.identity,
      name: p.name,
      imageUrl: p.imageUrl,
    }));
  
  // Debug log only when we have data
  useEffect(() => {
    if (open && hasFetched) {
      console.log("[PermissionsModal] Participants for selector:", participantsForSelector);
    }
  }, [open, hasFetched, participantsForSelector]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100">
              <Settings className="h-5 w-5 text-violet-600" strokeWidth={2} />
            </div>
            <div>
              <DialogTitle>Collaboration Settings</DialogTitle>
              <DialogDescription>Manage permissions and co-hosts for this meeting</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
          </div>
        ) : (
        <div className="space-y-6 py-4">
          {/* Co-Host Management (Host only) */}
          {canManageCoHosts && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-500" strokeWidth={2} />
                <Label className="text-sm font-medium">Co-Hosts</Label>
              </div>
              <p className="text-xs text-muted-foreground">Co-hosts can end the meeting and manage permissions</p>
              <ParticipantSelector
                participants={participantsForSelector}
                selectedUsers={permissions?.coHosts || []}
                onSelect={onGrantCoHost}
                onRemove={onRevokeCoHost}
                placeholder="Add co-host..."
                emptyText="No participants available"
                badgeVariant="amber"
              />
            </div>
          )}

          {/* Whiteboard Permissions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Square className="h-4 w-4 text-slate-600" strokeWidth={2} />
              <Label className="text-sm font-medium">Whiteboard Access</Label>
            </div>
            <div className="flex gap-2">
              <PermissionButton level="open" currentLevel={permissions?.whiteboard || "open"} onClick={() => onUpdatePermissions?.({ whiteboard: "open" })} label="Everyone" />
              <PermissionButton level="restricted" currentLevel={permissions?.whiteboard || "open"} onClick={() => onUpdatePermissions?.({ whiteboard: "restricted" })} label="Restricted" />
            </div>
            {permissions?.whiteboard === "restricted" && (
              <ParticipantSelector
                participants={participantsForSelector}
                selectedUsers={permissions.whiteboardAllowedUsers}
                onSelect={onGrantWhiteboardAccess}
                onRemove={onRevokeWhiteboardAccess}
                placeholder="Add participant..."
                emptyText="No participants available"
              />
            )}
          </div>
        </div>
        )}
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PermissionButton({ level, currentLevel, onClick, label }: { level: PermissionLevel; currentLevel: PermissionLevel; onClick: () => void; label: string }) {
  const isActive = level === currentLevel;
  return (
    <Button variant={isActive ? "default" : "outline"} size="sm" onClick={onClick} className={cn("flex-1", isActive && "bg-violet-600 hover:bg-violet-700")}>
      {label}
    </Button>
  );
}

/**
 * Simple participant info for selector (doesn't require LiveKit Participant)
 */
interface SimpleParticipant {
  identity: string;
  name: string;
  imageUrl: string | null;
}

/**
 * ParticipantSelector - Simple dropdown for selecting participants
 * Uses basic Popover instead of Command to avoid focus conflicts with Dialog
 */
function ParticipantSelector({
  participants,
  selectedUsers,
  onSelect,
  onRemove,
  placeholder,
  emptyText,
  badgeVariant = "violet",
}: {
  participants: SimpleParticipant[];
  selectedUsers: string[];
  onSelect?: (userId: string) => Promise<void>;
  onRemove?: (userId: string) => Promise<void>;
  placeholder: string;
  emptyText: string;
  badgeVariant?: "violet" | "amber";
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  
  // Filter out already selected participants
  const availableParticipants = participants.filter(
    (p) => !selectedUsers.includes(p.identity)
  );
  
  // Filter by search
  const filteredParticipants = availableParticipants.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase())
  );
  
  // Get selected participant info
  const selectedParticipants = participants.filter(
    (p) => selectedUsers.includes(p.identity)
  );

  const badgeClass = badgeVariant === "amber" 
    ? "bg-amber-100 text-amber-800 hover:bg-amber-200" 
    : "bg-violet-100 text-violet-800 hover:bg-violet-200";

  const handleSelect = async (participantId: string) => {
    console.log("[ParticipantSelector] Selected:", participantId);
    await onSelect?.(participantId);
    setOpen(false);
    setSearch("");
  };

  return (
    <div className="space-y-2">
      {/* Selected participants as badges */}
      {selectedParticipants.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedParticipants.map((participant) => (
            <Badge
              key={participant.identity}
              variant="secondary"
              className={cn("gap-1 pr-1", badgeClass)}
            >
              {badgeVariant === "amber" && <Shield className="h-3 w-3" />}
              {participant.name}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRemove?.(participant.identity);
                }}
                className="ml-1 rounded-full p-0.5 hover:bg-black/10"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Simple dropdown */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between text-muted-foreground"
            size="sm"
            type="button"
          >
            {placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[300px] p-0" 
          align="start"
          side="bottom"
          sideOffset={4}
        >
          <div className="p-2 border-b">
            <input
              type="text"
              placeholder="Search participants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border rounded-md outline-none focus:ring-2 focus:ring-violet-500"
              autoFocus
            />
          </div>
          <div className="max-h-[200px] overflow-y-auto p-1">
            {filteredParticipants.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                {emptyText}
              </div>
            ) : (
              filteredParticipants.map((participant) => (
                <button
                  key={participant.identity}
                  type="button"
                  onClick={() => handleSelect(participant.identity)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-slate-100 cursor-pointer text-left"
                >
                  {participant.imageUrl ? (
                    <Image
                      src={participant.imageUrl}
                      alt={participant.name}
                      width={24}
                      height={24}
                      className="h-6 w-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-medium">
                      {participant.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span>{participant.name}</span>
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

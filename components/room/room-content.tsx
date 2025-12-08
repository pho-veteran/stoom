"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Stage } from "./stage";
import { MeetingSidebar } from "./meeting-sidebar";
import { ChatNotesPanel } from "./chat-notes-panel";
import { LiveKitRoomWrapper, useRoomControls, useRoomParticipants } from "./livekit-room-wrapper";
import { MeetingEndedOverlay } from "./meeting-ended-overlay";
import { usePanelToggle } from "@/hooks/use-panel-toggle";
import { Loader2 } from "lucide-react";
import { useChat } from "@/hooks/use-chat";
import { useRoomContext, useLocalParticipant } from "@livekit/components-react";
import { useCollaborationPermissions } from "@/hooks/use-collaboration-permissions";
import { useCollaborationSync } from "@/hooks/use-collaboration-sync";
import { useHandRaise } from "@/hooks/use-hand-raise";

// Local storage key for whiteboard state (used for manual save to DB)
const getWhiteboardStorageKey = (roomId: string) => `stoom-whiteboard-${roomId}`;

/**
 * Clear whiteboard localStorage on room exit
 */
function clearWhiteboardStorage(roomId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(getWhiteboardStorageKey(roomId));
  } catch {
    // Storage error
  }
}

interface RoomContentProps {
  roomId: string;
  initialMicEnabled?: boolean;
  initialVideoEnabled?: boolean;
  isHost?: boolean;
  password?: string;
}

const STORAGE_KEY = "stoom-panel-sizes";

function RoomContentInner({ roomId, isHost = false }: { roomId: string; isHost?: boolean }) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const {
    isMicEnabled,
    isCameraEnabled,
    isScreenShareEnabled,
    currentScreenSharer,
    meetingEndedBy,
    wasKicked,
    kickedBy,
    toggleMicrophone,
    toggleCamera,
    toggleScreenShare,
    startScreenShare,
    stopScreenShare,
    broadcastRoomEnded,
  } = useRoomControls();

  const { participants } = useRoomParticipants();
  
  // Store participant join times from database
  const [participantJoinTimes, setParticipantJoinTimes] = useState<Record<string, Date>>({});
  const chat = useChat(room, roomId);

  // Collaboration permissions
  const userId = localParticipant?.identity || "";
  const participantName = localParticipant?.name || userId;

  // Collaboration permissions - must be before useHandRaise to provide canManagePermissions
  const {
    permissions,
    canEditWhiteboard,
    canViewWhiteboard,
    canManagePermissions,
    canEndMeeting,
    canManageCoHosts,
    updatePermissions,
    grantWhiteboardAccess,
    revokeWhiteboardAccess,
    grantCoHost,
    revokeCoHost,
    handlePermissionUpdate,
  } = useCollaborationPermissions(room, {
    roomId,
    userId,
    isHost,
  });

  // Hand raise state - uses canManagePermissions so co-hosts can also manage hands
  const {
    isHandRaised,
    handRaiseQueue,
    handRaiseCount,
    toggleHandRaise,
    lowerParticipantHand,
    lowerAllHands,
    isConnected: handRaiseConnected,
    screenReaderAnnouncement,
  } = useHandRaise({
    roomId,
    participantId: userId,
    participantName,
    isHost,
    canManageParticipants: canManagePermissions,
    room,
  });

  // Remote save status state (from other host/co-host)
  const [remoteSaveStatus, setRemoteSaveStatus] = useState<{
    status: 'saving' | 'saved' | 'error';
    senderName: string;
  } | null>(null);

  // Set up collaboration sync to listen for permission updates and save status from other participants
  const { sendSaveStatus } = useCollaborationSync(room, {
    roomId,
    onPermissionUpdate: handlePermissionUpdate,
    onSaveStatus: (message) => {
      // Only show save status for whiteboard
      if (message.payload.feature === 'whiteboard') {
        setRemoteSaveStatus({
          status: message.payload.status,
          senderName: message.payload.senderName,
        });
        
        // Clear status after 3 seconds for 'saved' or 'error'
        if (message.payload.status !== 'saving') {
          setTimeout(() => setRemoteSaveStatus(null), 3000);
        }
      }
    },
  });

  // Cleanup whiteboard storage when leaving the room
  useEffect(() => {
    return () => {
      // Clear whiteboard localStorage and sessionStorage on room exit
      clearWhiteboardStorage(roomId);
    };
  }, [roomId]);

  // Fetch participant join times from database
  useEffect(() => {
    const fetchParticipantJoinTimes = async () => {
      try {
        const response = await axios.get(`/api/room/${roomId}/participants`);
        const participantsData = response.data.participants as Array<{
          identity: string;
          joinedAt: string;
        }>;
        
        const joinTimes: Record<string, Date> = {};
        participantsData.forEach((p) => {
          joinTimes[p.identity] = new Date(p.joinedAt);
        });
        setParticipantJoinTimes(joinTimes);
      } catch (error) {
        console.error("Failed to fetch participant join times:", error);
      }
    };

    fetchParticipantJoinTimes();
  }, [roomId, participants.length]);

  const { panels, togglePanel } = usePanelToggle({
    screenShare: false,
    whiteboard: true,
    videoFeeds: false,
  });

  const [layout, setLayout] = useState<"horizontal" | "vertical">("horizontal");
  const [showChatNotes, setShowChatNotes] = useState(true);
  const [chatNotesSize, setChatNotesSize] = useState(30);
  
  // Whiteboard save state
  const [isWhiteboardSaving, setIsWhiteboardSaving] = useState(false);
  const [whiteboardSaveStatus, setWhiteboardSaveStatus] = useState<"idle" | "saved">("idle");

  /**
   * Save whiteboard snapshot to database
   */
  const handleSaveWhiteboard = useCallback(async () => {
    if (isWhiteboardSaving) return;

    setIsWhiteboardSaving(true);
    setWhiteboardSaveStatus("idle");
    
    // Broadcast saving status to other participants
    sendSaveStatus("whiteboard", "saving");

    try {
      // Get snapshot from localStorage (where whiteboard component saves it)
      const storageKey = getWhiteboardStorageKey(roomId);
      const savedSnapshot = localStorage.getItem(storageKey);
      
      if (savedSnapshot) {
        const snapshot = JSON.parse(savedSnapshot);
        await axios.post(`/api/room/${roomId}/whiteboard`, { snapshot });
        setWhiteboardSaveStatus("saved");
        
        // Broadcast saved status to other participants
        sendSaveStatus("whiteboard", "saved");
        
        // Reset status after 2 seconds
        setTimeout(() => setWhiteboardSaveStatus("idle"), 2000);
      }
    } catch (error) {
      console.error("Failed to save whiteboard:", error);
      // Broadcast error status to other participants
      sendSaveStatus("whiteboard", "error");
    } finally {
      setIsWhiteboardSaving(false);
    }
  }, [roomId, isWhiteboardSaving, sendSaveStatus]);

  // Load panel sizes from localStorage
  useEffect(() => {
    const loadSizes = () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const sizes = JSON.parse(saved);
          if (sizes.chatNotes) setChatNotesSize(sizes.chatNotes);
          if (sizes.layout) setLayout(sizes.layout);
        } catch {
          // Ignore parse errors
        }
      }
    };
    loadSizes();
  }, []);

  // Save panel sizes to localStorage
  const savePanelSizes = () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        chatNotes: chatNotesSize,
        layout,
      })
    );
  };

  const handleLayout = (sizes: number[]) => {
    if (showChatNotes) {
      setChatNotesSize(sizes[0]);
    }
    savePanelSizes();
  };

  const handleToggleLayout = () => {
    const newLayout = layout === "horizontal" ? "vertical" : "horizontal";
    setLayout(newLayout);
    savePanelSizes();
  };

  // Calculate main stage size
  const calculateMainStageSize = () => {
    let total = 100;
    if (showChatNotes) total -= chatNotesSize;
    return Math.max(50, total);
  };

  const visiblePanels = showChatNotes ? 1 : 0;

  // Map participants to the format expected by MeetingSidebar
  const participantInfos = participants.map((p) => {
    // Parse metadata to get imageUrl and role
    let imageUrl: string | null = null;
    let role: 'HOST' | 'CO_HOST' | 'PARTICIPANT' = 'PARTICIPANT';
    try {
      if (p.metadata) {
        const metadata = JSON.parse(p.metadata);
        imageUrl = metadata.imageUrl || null;
        role = metadata.role || 'PARTICIPANT';
      }
    } catch {
      // Ignore JSON parse errors
    }

    return {
      identity: p.identity,
      name: p.name || p.identity,
      imageUrl,
      role,
      isSpeaking: p.isSpeaking,
      isAudioEnabled: p.isMicrophoneEnabled,
      isVideoEnabled: p.isCameraEnabled,
      isLocal: p.isLocal,
      participant: p,
      joinedAt: participantJoinTimes[p.identity],
    };
  });

  const activeSpeaker = participantInfos.find((p) => p.isSpeaking) || null;

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-linear-to-br from-slate-50 via-white to-violet-50/30">
      {/* Screen reader announcements for accessibility */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {screenReaderAnnouncement}
      </div>

      {/* Meeting Ended Overlay - shows when meeting ends or user is kicked */}
      {meetingEndedBy && <MeetingEndedOverlay hostName={meetingEndedBy} />}
      {wasKicked && <MeetingEndedOverlay hostName={kickedBy || undefined} wasKicked={true} />}

      {/* Meeting Sidebar - combines participants, controls, and panel toggles */}
      <MeetingSidebar
        roomId={roomId}
        currentUserId={userId}
        participants={participantInfos}
        activeSpeaker={activeSpeaker}
        micEnabled={isMicEnabled}
        videoEnabled={isCameraEnabled}
        isScreenSharing={isScreenShareEnabled}
        currentScreenSharerName={currentScreenSharer?.name || currentScreenSharer?.identity}
        onToggleMic={toggleMicrophone}
        onToggleVideo={toggleCamera}
        onStartScreenShare={startScreenShare}
        onStopScreenShare={stopScreenShare}
        onEndRoom={broadcastRoomEnded}
        isHandRaised={isHandRaised}
        onToggleHandRaise={toggleHandRaise}
        isConnected={handRaiseConnected}
        handRaiseQueue={handRaiseQueue}
        handRaiseCount={handRaiseCount}
        onLowerParticipantHand={lowerParticipantHand}
        onLowerAllHands={lowerAllHands}
        onSaveWhiteboard={handleSaveWhiteboard}
        isWhiteboardSaving={isWhiteboardSaving}
        whiteboardSaveStatus={whiteboardSaveStatus}
        canEditWhiteboard={canEditWhiteboard}
        canSaveWhiteboard={canManagePermissions}
        showScreenShare={panels.screenShare}
        showWhiteboard={panels.whiteboard}
        showVideoFeeds={panels.videoFeeds}
        onToggleScreenShare={() => togglePanel("screenShare")}
        onToggleWhiteboard={() => togglePanel("whiteboard")}
        onToggleVideoFeeds={() => togglePanel("videoFeeds")}
        chatNotesVisible={showChatNotes}
        onToggleChatNotes={() => setShowChatNotes(!showChatNotes)}
        layout={layout}
        onToggleLayout={handleToggleLayout}
        permissions={permissions}
        canManagePermissions={canManagePermissions}
        canEndMeeting={canEndMeeting}
        canManageCoHosts={canManageCoHosts}
        onUpdatePermissions={updatePermissions}
        onGrantWhiteboardAccess={grantWhiteboardAccess}
        onRevokeWhiteboardAccess={revokeWhiteboardAccess}
        onGrantCoHost={grantCoHost}
        onRevokeCoHost={revokeCoHost}
        canViewWhiteboard={canViewWhiteboard}
      />

      {/* Main Content Area */}
      <PanelGroup
        direction="horizontal"
        onLayout={handleLayout}
        className="flex-1"
      >
        {/* Main Stage Panel */}
        <Panel
          defaultSize={calculateMainStageSize()}
          minSize={visiblePanels > 0 ? 50 : 100}
          className="relative"
        >
          <Stage
            room={room}
            roomId={roomId}
            showScreenShare={panels.screenShare}
            showWhiteboard={panels.whiteboard && canViewWhiteboard}
            showVideoFeeds={panels.videoFeeds}
            layout={layout}
            isLocalSharing={isScreenShareEnabled}
            onStopScreenShare={toggleScreenShare}
            whiteboardReadOnly={!canEditWhiteboard}
            whiteboardSaveStatus={remoteSaveStatus}
          />
        </Panel>

        {/* Chat & Notes Panel */}
        {showChatNotes && (
          <>
            <PanelResizeHandle className="w-1 bg-border hover:bg-violet-500 transition-colors cursor-col-resize active:bg-violet-600" />
            <Panel
              defaultSize={chatNotesSize}
              minSize={20}
              maxSize={50}
              className="min-w-[300px]"
            >
              <ChatNotesPanel
                roomId={roomId}
                userId={userId}
                onClose={() => setShowChatNotes(false)}
                messages={chat.messages}
                onSendMessage={chat.sendMessage}
              />
            </Panel>
          </>
        )}
      </PanelGroup>

    </div>
  );
}

export function RoomContent({
  roomId,
  initialMicEnabled = true,
  initialVideoEnabled = true,
  isHost = false,
  password,
}: RoomContentProps) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || "ws://localhost:7880";

  useEffect(() => {
    const getToken = async () => {
      try {
        const response = await axios.post<{ token: string }>("/api/livekit/token", {
          roomName: roomId,
          password, // Pass password for validation (Requirement 3.5)
        });
        setToken(response.data.token);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.data?.code === "INVALID_PASSWORD") {
          setError(new Error("Incorrect password. Please try again."));
        } else if (axios.isAxiosError(err) && err.response?.data?.code === "PASSWORD_REQUIRED") {
          setError(new Error("This room requires a password."));
        } else {
          setError(err instanceof Error ? err : new Error("Failed to connect"));
        }
      } finally {
        setIsLoading(false);
      }
    };

    getToken();
  }, [roomId, password]);

  if (isLoading) {
    return (
      <div className="relative flex h-screen w-screen items-center justify-center bg-linear-to-br from-slate-50 via-white to-violet-50/30">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[32px_32px]" />
        <div className="relative z-10 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-violet-100 mx-auto border border-violet-200">
            <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
          </div>
          <p className="text-xl font-semibold text-slate-900">Connecting to room...</p>
          <p className="text-sm text-slate-500 mt-2">
            Setting up your audio and video
          </p>
        </div>
      </div>
    );
  }

  if (error || !token) {
    return (
      <div className="relative flex h-screen w-screen items-center justify-center bg-linear-to-br from-slate-50 via-white to-violet-50/30">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[32px_32px]" />
        <div className="relative z-10 text-center max-w-md px-6">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-red-100 mx-auto border border-red-200">
            <span className="text-3xl">⚠️</span>
          </div>
          <p className="text-xl font-semibold text-slate-900">
            Connection Failed
          </p>
          <p className="text-sm text-slate-500 mt-2">
            {error?.message || "Could not connect to room"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <LiveKitRoomWrapper
      token={token}
      serverUrl={serverUrl}
      initialAudioEnabled={initialMicEnabled}
      initialVideoEnabled={initialVideoEnabled}
      onDisconnected={() => {
        console.log("Disconnected from room");
      }}
    >
      <RoomContentInner roomId={roomId} isHost={isHost} />
    </LiveKitRoomWrapper>
  );
}

"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Stage } from "./stage";
import { ParticipantsSidebar } from "./participants-sidebar";
import { ChatNotesPanel } from "./chat-notes-panel";
import { TranscriptPanel } from "./transcript-panel";
import { FloatingDock } from "./floating-dock";
import { LiveKitRoomWrapper, useRoomControls, useRoomParticipants } from "./livekit-room-wrapper";
import { MeetingEndedOverlay } from "./meeting-ended-overlay";
import { usePanelToggle } from "@/hooks/use-panel-toggle";
import { Loader2 } from "lucide-react";
import { useChat } from "@/hooks/use-chat";
import { useRoomContext } from "@livekit/components-react";

interface RoomContentProps {
  roomId: string;
  initialMicEnabled?: boolean;
  initialVideoEnabled?: boolean;
  isHost?: boolean;
}

const STORAGE_KEY = "stoom-panel-sizes";

function RoomContentInner({ roomId, isHost = false }: { roomId: string; isHost?: boolean }) {
  const room = useRoomContext();
  const {
    isMicEnabled,
    isCameraEnabled,
    isScreenShareEnabled,
    currentScreenSharer,
    meetingEndedBy,
    toggleMicrophone,
    toggleCamera,
    toggleScreenShare,
    startScreenShare,
    stopScreenShare,
    broadcastRoomEnded,
  } = useRoomControls();

  const { participants } = useRoomParticipants();
  const chat = useChat(room);

  const { panels, togglePanel } = usePanelToggle({
    screenShare: true,
    whiteboard: false,
    videoFeeds: true,
  });

  const [layout, setLayout] = useState<"horizontal" | "vertical">("horizontal");
  const [showChatNotes, setShowChatNotes] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);
  const [chatNotesSize, setChatNotesSize] = useState(30);
  const [transcriptSize, setTranscriptSize] = useState(30);

  // Load panel sizes from localStorage
  useEffect(() => {
    const loadSizes = () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const sizes = JSON.parse(saved);
          if (sizes.chatNotes) setChatNotesSize(sizes.chatNotes);
          if (sizes.transcript) setTranscriptSize(sizes.transcript);
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
        transcript: transcriptSize,
        layout,
      })
    );
  };

  const handleLayout = (sizes: number[]) => {
    let index = 0;
    if (showChatNotes) {
      setChatNotesSize(sizes[index]);
      index++;
    }
    if (showTranscript) {
      setTranscriptSize(sizes[index]);
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
    if (showTranscript) total -= transcriptSize;
    return Math.max(50, total);
  };

  const visiblePanels = [showChatNotes, showTranscript].filter(Boolean).length;

  // Map participants to the format expected by ParticipantsSidebar
  const participantInfos = participants.map((p) => {
    // Parse metadata to get imageUrl
    let imageUrl: string | null = null;
    try {
      if (p.metadata) {
        const metadata = JSON.parse(p.metadata);
        imageUrl = metadata.imageUrl || null;
      }
    } catch {
      // Ignore JSON parse errors
    }

    return {
      identity: p.identity,
      name: p.name || p.identity,
      imageUrl,
      isSpeaking: p.isSpeaking,
      isAudioEnabled: p.isMicrophoneEnabled,
      isVideoEnabled: p.isCameraEnabled,
      isLocal: p.isLocal,
      participant: p,
    };
  });

  const activeSpeaker = participantInfos.find((p) => p.isSpeaking) || null;

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-linear-to-br from-slate-50 via-white to-violet-50/30">
      {/* Meeting Ended Overlay */}
      {meetingEndedBy && <MeetingEndedOverlay hostName={meetingEndedBy} />}

      {/* Participants Sidebar */}
      <ParticipantsSidebar
        roomId={roomId}
        participants={participantInfos}
        activeSpeaker={activeSpeaker}
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
            showScreenShare={panels.screenShare}
            showWhiteboard={panels.whiteboard}
            showVideoFeeds={panels.videoFeeds}
            onToggleScreenShare={() => togglePanel("screenShare")}
            onToggleWhiteboard={() => togglePanel("whiteboard")}
            onToggleVideoFeeds={() => togglePanel("videoFeeds")}
            layout={layout}
            onToggleLayout={handleToggleLayout}
            screenShareInfo={null}
            isLocalSharing={isScreenShareEnabled}
            onStopScreenShare={toggleScreenShare}
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
                onClose={() => setShowChatNotes(false)}
                messages={chat.messages}
                onSendMessage={chat.sendMessage}
              />
            </Panel>
          </>
        )}

        {/* Transcript Panel */}
        {showTranscript && (
          <>
            <PanelResizeHandle className="w-1 bg-border hover:bg-violet-500 transition-colors cursor-col-resize active:bg-violet-600" />
            <Panel
              defaultSize={transcriptSize}
              minSize={20}
              maxSize={50}
              className="min-w-[300px]"
            >
              <TranscriptPanel onClose={() => setShowTranscript(false)} />
            </Panel>
          </>
        )}
      </PanelGroup>

      {/* Floating Dock */}
      <FloatingDock
        roomId={roomId}
        isHost={isHost}
        micEnabled={isMicEnabled}
        videoEnabled={isCameraEnabled}
        isScreenSharing={isScreenShareEnabled}
        currentScreenSharerName={currentScreenSharer?.name || currentScreenSharer?.identity}
        onToggleMic={toggleMicrophone}
        onToggleVideo={toggleCamera}
        onStartScreenShare={startScreenShare}
        onStopScreenShare={stopScreenShare}
        onToggleChatNotes={() => setShowChatNotes(!showChatNotes)}
        onToggleTranscript={() => setShowTranscript(!showTranscript)}
        chatNotesVisible={showChatNotes}
        transcriptVisible={showTranscript}
        onEndRoom={broadcastRoomEnded}
      />
    </div>
  );
}

export function RoomContent({
  roomId,
  initialMicEnabled = true,
  initialVideoEnabled = true,
  isHost = false,
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
        });
        setToken(response.data.token);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to connect"));
      } finally {
        setIsLoading(false);
      }
    };

    getToken();
  }, [roomId]);

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

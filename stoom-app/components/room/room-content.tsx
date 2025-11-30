"use client";

import { useState, useEffect } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Stage } from "./stage";
import { ParticipantsSidebar } from "./participants-sidebar";
import { ChatNotesPanel } from "./chat-notes-panel";
import { TranscriptPanel } from "./transcript-panel";
import { FloatingDock } from "./floating-dock";

interface RoomContentProps {
  roomId: string;
}

const STORAGE_KEY = "stoom-panel-sizes";

export function RoomContent({ roomId }: RoomContentProps) {
  const [showScreenShare, setShowScreenShare] = useState(true);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [layout, setLayout] = useState<"horizontal" | "vertical">("horizontal");
  const [showChatNotes, setShowChatNotes] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);
  const [chatNotesSize, setChatNotesSize] = useState(30);
  const [transcriptSize, setTranscriptSize] = useState(30);

  // Load panel sizes from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const sizes = JSON.parse(saved);
        if (sizes.chatNotes) setChatNotesSize(sizes.chatNotes);
        if (sizes.transcript) setTranscriptSize(sizes.transcript);
        if (sizes.layout) setLayout(sizes.layout);
      } catch (e) {
        // Ignore parse errors
      }
    }
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

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Participants Sidebar */}
      <ParticipantsSidebar roomId={roomId} />

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
            showScreenShare={showScreenShare}
            showWhiteboard={showWhiteboard}
            onToggleScreenShare={() => setShowScreenShare(!showScreenShare)}
            onToggleWhiteboard={() => setShowWhiteboard(!showWhiteboard)}
            layout={layout}
            onToggleLayout={handleToggleLayout}
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
              <ChatNotesPanel onClose={() => setShowChatNotes(false)} />
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
        onToggleScreenShare={() => setShowScreenShare(!showScreenShare)}
        onToggleChatNotes={() => setShowChatNotes(!showChatNotes)}
        onToggleTranscript={() => setShowTranscript(!showTranscript)}
        screenShareVisible={showScreenShare}
        chatNotesVisible={showChatNotes}
        transcriptVisible={showTranscript}
      />
    </div>
  );
}

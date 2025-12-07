"use client";

import { useMemo } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Room } from "livekit-client";
import { cn } from "@/lib/utils";
import { ScreenShareView } from "./screen-share-view";
import { VideoFeedsView } from "./video-feeds-view";
import { WhiteboardWrapper as Whiteboard } from "./whiteboard-wrapper";

interface StageProps {
  room: Room | null;
  roomId: string;
  showScreenShare: boolean;
  showWhiteboard: boolean;
  showVideoFeeds: boolean;
  layout: "horizontal" | "vertical";
  isLocalSharing: boolean;
  onStopScreenShare: () => void;
  whiteboardReadOnly?: boolean;
  /** Remote save status from host/co-host */
  whiteboardSaveStatus?: {
    status: 'saving' | 'saved' | 'error';
    senderName: string;
  } | null;
}

export function Stage({
  roomId,
  showScreenShare,
  showWhiteboard,
  showVideoFeeds,
  layout,
  isLocalSharing,
  onStopScreenShare,
  whiteboardReadOnly = false,
  whiteboardSaveStatus,
}: StageProps) {
  const visiblePanels = [showScreenShare, showWhiteboard, showVideoFeeds].filter(Boolean);
  const panelCount = visiblePanels.length;

  // Get all visible panel types in order
  const panelTypes = useMemo(() => {
    const types: ("screenShare" | "whiteboard" | "videoFeeds")[] = [];
    if (showScreenShare) types.push("screenShare");
    if (showWhiteboard) types.push("whiteboard");
    if (showVideoFeeds) types.push("videoFeeds");
    return types;
  }, [showScreenShare, showWhiteboard, showVideoFeeds]);

  const renderPanel = (type: "screenShare" | "whiteboard" | "videoFeeds") => {
    switch (type) {
      case "screenShare":
        return (
          <ScreenShareView
            onStopSharing={isLocalSharing ? onStopScreenShare : undefined}
            className="h-full w-full"
          />
        );
      case "whiteboard":
        return <Whiteboard roomId={roomId} readOnly={whiteboardReadOnly} remoteSaveStatus={whiteboardSaveStatus} />;
      case "videoFeeds":
        return <VideoFeedsView className="h-full w-full" parentLayout={layout} />;
    }
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-linear-to-br from-slate-100 to-slate-50">
      {/* Empty state */}
      {panelCount === 0 && (
        <div className="flex h-full w-full items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">No content to display</p>
            <p className="text-sm text-muted-foreground mt-2">
              Toggle Screen Share, Whiteboard, or Video Feeds to start
            </p>
          </div>
        </div>
      )}

      {/* Single panel - full screen */}
      {panelCount === 1 && (
        <div className="h-full w-full">
          {renderPanel(panelTypes[0])}
        </div>
      )}

      {/* Two panels - split view */}
      {panelCount === 2 && (
        <PanelGroup direction={layout} className="h-full w-full" id="stage-2-panels">
          <Panel id="panel-1" order={1} defaultSize={50} minSize={30}>
            <div className="h-full w-full">
              {renderPanel(panelTypes[0])}
            </div>
          </Panel>
          <PanelResizeHandle
            className={cn(
              layout === "horizontal" ? "w-1 h-full" : "h-1 w-full",
              "bg-border hover:bg-violet-500 transition-colors cursor-col-resize active:bg-violet-600"
            )}
          />
          <Panel id="panel-2" order={2} defaultSize={50} minSize={30}>
            <div className="h-full w-full">
              {renderPanel(panelTypes[1])}
            </div>
          </Panel>
        </PanelGroup>
      )}

      {/* Three panels - three-way split */}
      {panelCount === 3 && (
        <PanelGroup direction={layout} className="h-full w-full" id="stage-3-panels">
          <Panel id="panel-1" order={1} defaultSize={33} minSize={20}>
            <div className="h-full w-full">
              {renderPanel(panelTypes[0])}
            </div>
          </Panel>
          <PanelResizeHandle
            className={cn(
              layout === "horizontal" ? "w-1 h-full" : "h-1 w-full",
              "bg-border hover:bg-violet-500 transition-colors cursor-col-resize active:bg-violet-600"
            )}
          />
          <Panel id="panel-2" order={2} defaultSize={33} minSize={20}>
            <div className="h-full w-full">
              {renderPanel(panelTypes[1])}
            </div>
          </Panel>
          <PanelResizeHandle
            className={cn(
              layout === "horizontal" ? "w-1 h-full" : "h-1 w-full",
              "bg-border hover:bg-violet-500 transition-colors cursor-col-resize active:bg-violet-600"
            )}
          />
          <Panel id="panel-3" order={3} defaultSize={34} minSize={20}>
            <div className="h-full w-full">
              {renderPanel(panelTypes[2])}
            </div>
          </Panel>
        </PanelGroup>
      )}
    </div>
  );
}

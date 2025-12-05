"use client";

import { useState, useEffect, useRef } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Room } from "livekit-client";
import { cn } from "@/lib/utils";
import { Monitor, Square, Columns2, Rows2, ChevronUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScreenShareView } from "./screen-share-view";
import { VideoFeedsView } from "./video-feeds-view";

interface StageProps {
  room: Room | null;
  showScreenShare: boolean;
  showWhiteboard: boolean;
  showVideoFeeds: boolean;
  onToggleScreenShare: () => void;
  onToggleWhiteboard: () => void;
  onToggleVideoFeeds: () => void;
  layout: "horizontal" | "vertical";
  onToggleLayout: () => void;
  screenShareInfo: unknown;
  isLocalSharing: boolean;
  onStopScreenShare: () => void;
}

export function Stage({
  showScreenShare,
  showWhiteboard,
  showVideoFeeds,
  onToggleScreenShare,
  onToggleWhiteboard,
  onToggleVideoFeeds,
  layout,
  onToggleLayout,
  isLocalSharing,
  onStopScreenShare,
}: StageProps) {
  const visiblePanels = [showScreenShare, showWhiteboard, showVideoFeeds].filter(
    Boolean
  );
  const panelCount = visiblePanels.length;
  const [isControlBarVisible, setIsControlBarVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-collapse control bar after 3 seconds of no hover
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!isHovered && isControlBarVisible) {
      timeoutRef.current = setTimeout(() => {
        setIsControlBarVisible(false);
      }, 3000);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isHovered, isControlBarVisible]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    setIsControlBarVisible(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const renderScreenShare = () => (
    <ScreenShareView
      onStopSharing={isLocalSharing ? onStopScreenShare : undefined}
      className="h-full w-full"
    />
  );

  const renderWhiteboard = () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="mb-4 h-24 w-24 mx-auto rounded-xl bg-violet-100 flex items-center justify-center border border-violet-200">
          <svg
            className="h-12 w-12 text-violet-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
            />
          </svg>
        </div>
        <p className="text-muted-foreground">Whiteboard</p>
        <p className="text-sm text-muted-foreground mt-2">
          Whiteboard will be displayed here
        </p>
      </div>
    </div>
  );

  const renderVideoFeeds = () => (
    <VideoFeedsView className="h-full w-full" parentLayout={layout} />
  );

  const renderPanel = (type: "screenShare" | "whiteboard" | "videoFeeds") => {
    switch (type) {
      case "screenShare":
        return renderScreenShare();
      case "whiteboard":
        return renderWhiteboard();
      case "videoFeeds":
        return renderVideoFeeds();
    }
  };

  const getVisiblePanelTypes = (): (
    | "screenShare"
    | "whiteboard"
    | "videoFeeds"
  )[] => {
    const types: ("screenShare" | "whiteboard" | "videoFeeds")[] = [];
    if (showScreenShare) types.push("screenShare");
    if (showWhiteboard) types.push("whiteboard");
    if (showVideoFeeds) types.push("videoFeeds");
    return types;
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50">
      {/* Control Bar */}
      <div
        className={cn(
          "absolute top-4 right-4 z-10 flex items-center gap-2 rounded-xl border border-slate-200 bg-white/95 backdrop-blur-xl px-3 py-2 shadow-lg shadow-slate-900/5 transition-all duration-300",
          isControlBarVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-2 pointer-events-none"
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Button
          variant={showScreenShare ? "default" : "outline"}
          size="sm"
          onClick={onToggleScreenShare}
          className="gap-2"
        >
          <Monitor className="h-4 w-4" strokeWidth={2} />
          Screen
        </Button>
        <Button
          variant={showWhiteboard ? "default" : "outline"}
          size="sm"
          onClick={onToggleWhiteboard}
          className="gap-2"
        >
          <Square className="h-4 w-4" strokeWidth={2} />
          Board
        </Button>
        <Button
          variant={showVideoFeeds ? "default" : "outline"}
          size="sm"
          onClick={onToggleVideoFeeds}
          className="gap-2"
        >
          <Users className="h-4 w-4" strokeWidth={2} />
          Videos
        </Button>
        {panelCount === 2 && (
          <>
            <div className="mx-1 h-6 w-px bg-slate-200" />
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleLayout}
              className="gap-2"
              title={
                layout === "horizontal"
                  ? "Switch to vertical layout"
                  : "Switch to horizontal layout"
              }
            >
              {layout === "horizontal" ? (
                <Rows2 className="h-4 w-4" strokeWidth={2} />
              ) : (
                <Columns2 className="h-4 w-4" strokeWidth={2} />
              )}
            </Button>
          </>
        )}
      </div>

      {/* Show button when collapsed */}
      {!isControlBarVisible && (
        <div
          className="absolute top-4 right-4 z-10"
          onMouseEnter={handleMouseEnter}
        >
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full bg-white/95 backdrop-blur-xl border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-lg"
            onClick={() => setIsControlBarVisible(true)}
            title="Show Controls"
          >
            <ChevronUp className="h-4 w-4 text-slate-700" strokeWidth={2} />
          </Button>
        </div>
      )}

      {/* Content */}
      {panelCount === 0 ? (
        <div className="flex h-full w-full items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">No content to display</p>
            <p className="text-sm text-muted-foreground mt-2">
              Toggle Screen Share, Whiteboard, or Video Feeds to start
            </p>
          </div>
        </div>
      ) : panelCount === 1 ? (
        // Single view
        <div className="h-full w-full">{renderPanel(getVisiblePanelTypes()[0])}</div>
      ) : (
        // Split view (2 panels)
        <PanelGroup direction={layout} className="h-full w-full">
          <Panel defaultSize={50} minSize={30}>
            {renderPanel(getVisiblePanelTypes()[0])}
          </Panel>
          <PanelResizeHandle
            className={cn(
              layout === "horizontal" ? "w-1 h-full" : "h-1 w-full",
              "bg-border hover:bg-violet-500 transition-colors cursor-col-resize active:bg-violet-600"
            )}
          />
          <Panel defaultSize={50} minSize={30}>
            {renderPanel(getVisiblePanelTypes()[1])}
          </Panel>
        </PanelGroup>
      )}
    </div>
  );
}

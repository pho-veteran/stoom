"use client";

import { useState, useEffect, useRef } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { cn } from "@/lib/utils";
import { Monitor, Square, Columns2, Rows2, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StageProps {
  showScreenShare: boolean;
  showWhiteboard: boolean;
  onToggleScreenShare: () => void;
  onToggleWhiteboard: () => void;
  layout: "horizontal" | "vertical";
  onToggleLayout: () => void;
}

export function Stage({
  showScreenShare,
  showWhiteboard,
  onToggleScreenShare,
  onToggleWhiteboard,
  layout,
  onToggleLayout,
}: StageProps) {
  const hasBoth = showScreenShare && showWhiteboard;
  const [isControlBarVisible, setIsControlBarVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-collapse control bar after 3 seconds of no hover
  useEffect(() => {
    if (isHovered) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setIsControlBarVisible(true);
    } else {
      timeoutRef.current = setTimeout(() => {
        setIsControlBarVisible(false);
      }, 3000);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isHovered]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-950">
      {/* Control Bar */}
      <div
        className={cn(
          "absolute top-4 right-4 z-10 flex items-center gap-2 rounded-lg border border-border/50 bg-card/95 backdrop-blur-xl px-3 py-2 shadow-lg supports-[backdrop-filter]:bg-card/80 transition-all duration-300",
          isControlBarVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
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
        {hasBoth && (
          <>
            <div className="mx-1 h-6 w-px bg-border" />
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleLayout}
              className="gap-2"
              title={layout === "horizontal" ? "Switch to vertical layout" : "Switch to horizontal layout"}
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
          onMouseEnter={() => setIsHovered(true)}
        >
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full bg-card/95 backdrop-blur-xl"
            onClick={() => setIsControlBarVisible(true)}
            title="Show Controls"
          >
            <ChevronUp className="h-4 w-4" strokeWidth={2} />
          </Button>
        </div>
      )}

      {/* Content */}
      {!showScreenShare && !showWhiteboard ? (
        <div className="flex h-full w-full items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">No content to display</p>
            <p className="text-sm text-muted-foreground mt-2">
              Toggle Screen Share or Whiteboard to start
            </p>
          </div>
        </div>
      ) : !hasBoth ? (
        // Single view
        <div className="h-full w-full">
          {showScreenShare && (
            <div className="flex h-full w-full items-center justify-center bg-slate-900">
              <div className="text-center">
                <div className="mb-4 h-24 w-24 mx-auto rounded-lg bg-slate-800 flex items-center justify-center">
                  <Monitor className="h-12 w-12 text-violet-500" strokeWidth={1.5} />
                </div>
                <p className="text-muted-foreground">Screen Share</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Screen sharing will be displayed here
                </p>
              </div>
            </div>
          )}
          {showWhiteboard && (
            <div className="flex h-full w-full items-center justify-center bg-slate-900">
              <div className="text-center">
                <div className="mb-4 h-24 w-24 mx-auto rounded-lg bg-slate-800 flex items-center justify-center">
                  <svg
                    className="h-12 w-12 text-violet-500"
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
          )}
        </div>
      ) : (
        // Split view
        <PanelGroup
          direction={layout}
          className="h-full w-full"
        >
          <Panel defaultSize={50} minSize={30}>
            <div className="flex h-full w-full items-center justify-center bg-slate-900">
              <div className="text-center">
                <div className="mb-4 h-24 w-24 mx-auto rounded-lg bg-slate-800 flex items-center justify-center">
                  <Monitor className="h-12 w-12 text-violet-500" strokeWidth={1.5} />
                </div>
                <p className="text-muted-foreground">Screen Share</p>
              </div>
            </div>
          </Panel>
          <PanelResizeHandle className={cn(
            layout === "horizontal" ? "w-1 h-full" : "h-1 w-full",
            "bg-border hover:bg-violet-500 transition-colors cursor-col-resize active:bg-violet-600"
          )} />
          <Panel defaultSize={50} minSize={30}>
            <div className="flex h-full w-full items-center justify-center bg-slate-900">
              <div className="text-center">
                <div className="mb-4 h-24 w-24 mx-auto rounded-lg bg-slate-800 flex items-center justify-center">
                  <svg
                    className="h-12 w-12 text-violet-500"
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
              </div>
            </div>
          </Panel>
        </PanelGroup>
      )}
    </div>
  );
}

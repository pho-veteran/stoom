"use client";

import { Button } from "@/components/ui/button";
import {
  LayoutGrid,
  PenTool,
  Eraser,
  Square,
  Circle,
  Settings,
  LogOut,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Toolbar() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"grid" | "whiteboard">("grid");
  const [whiteboardMode, setWhiteboardMode] = useState(false);

  return (
    <div className="flex h-full w-16 flex-col items-center border-r border-border bg-card py-4">
      {/* View Switch */}
      <div className="mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setViewMode(viewMode === "grid" ? "whiteboard" : "grid")}
          className={cn(
            "h-12 w-12",
            viewMode === "whiteboard" && "bg-violet-100 dark:bg-violet-900/30"
          )}
          title={viewMode === "grid" ? "Switch to Whiteboard" : "Switch to Grid View"}
        >
          <LayoutGrid className="h-5 w-5" strokeWidth={1.5} />
        </Button>
      </div>

      {/* Drawing Tools (only in whiteboard mode) */}
      {viewMode === "whiteboard" && (
        <div className="mb-4 space-y-2">
          <Button
            variant={whiteboardMode ? "default" : "ghost"}
            size="icon"
            onClick={() => setWhiteboardMode(!whiteboardMode)}
            className="h-10 w-10"
            title="Pen Tool"
          >
            <PenTool className="h-4 w-4" strokeWidth={1.5} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            title="Eraser"
          >
            <Eraser className="h-4 w-4" strokeWidth={1.5} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            title="Rectangle"
          >
            <Square className="h-4 w-4" strokeWidth={1.5} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            title="Circle"
          >
            <Circle className="h-4 w-4" strokeWidth={1.5} />
          </Button>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Settings & Leave */}
      <div className="space-y-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          title="Settings"
        >
          <Settings className="h-4 w-4" strokeWidth={1.5} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 text-destructive hover:text-destructive"
          onClick={() => router.push("/dashboard")}
          title="Leave Room"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.5} />
        </Button>
      </div>
    </div>
  );
}



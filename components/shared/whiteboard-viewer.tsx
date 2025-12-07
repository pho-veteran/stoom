"use client";

/**
 * WhiteboardViewer Component
 * 
 * Reusable tldraw whiteboard viewer/editor.
 * Used in both room (whiteboard) and session detail (whiteboard-snapshot-viewer).
 * 
 * Modes:
 * - View-only: For displaying saved snapshots
 * - Editable: For live collaboration or editing saved content
 */

import { useEffect, useRef, useState } from "react";
import { Tldraw, Editor, TLRecord, TLUiOverrides, TLUiActionsContextType } from "tldraw";
import type { TLStoreSnapshot } from "tldraw";
import "tldraw/tldraw.css";
import { Loader2, PenTool, AlertTriangle } from "lucide-react";

/**
 * UI overrides to customize tldraw toolbar
 * Removes embed tool from the insert menu
 */
const uiOverrides: TLUiOverrides = {
  actions(_editor, actions): TLUiActionsContextType {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { "insert-embed": _, ...rest } = actions;
    return rest;
  },
};

export interface WhiteboardViewerProps {
  /** Initial snapshot to load */
  snapshot?: TLStoreSnapshot | null;
  /** Whether the whiteboard is read-only */
  readOnly?: boolean;
  /** Whether to hide the tldraw UI */
  hideUi?: boolean;
  /** Called when editor is mounted */
  onMount?: (editor: Editor) => void;
  /** Optional CSS class name */
  className?: string;
  /** Height of the whiteboard */
  height?: string;
  /** Show "changes not saved" warning */
  showUnsavedWarning?: boolean;
  /** Show empty state when no content */
  showEmptyState?: boolean;
  /** Custom empty state message */
  emptyStateMessage?: string;
}

/**
 * Check if snapshot has any drawing content (not just default records)
 */
function hasDrawingContent(snapshot: TLStoreSnapshot | null | undefined): boolean {
  if (!snapshot?.store) return false;
  
  const records = Object.values(snapshot.store);
  return records.some((record) => {
    const r = record as TLRecord;
    return r.typeName === "shape";
  });
}

/**
 * Apply a snapshot to the editor
 */
export function applySnapshot(editor: Editor, snapshot: TLStoreSnapshot): void {
  try {
    if (snapshot.store) {
      editor.store.mergeRemoteChanges(() => {
        const records = Object.values(snapshot.store) as TLRecord[];
        editor.store.put(records);
      });
    }
  } catch (error) {
    console.error("Failed to apply snapshot:", error);
  }
}

/**
 * Get current snapshot from editor
 */
export function getEditorSnapshot(editor: Editor): TLStoreSnapshot {
  const records = editor.store.allRecords();
  const store: Record<string, TLRecord> = {};
  for (const record of records) {
    store[record.id] = record;
  }
  return {
    store,
    schema: editor.store.schema.serialize(),
  } as TLStoreSnapshot;
}

/**
 * WhiteboardViewer - Reusable tldraw whiteboard component
 */
export function WhiteboardViewer({
  snapshot,
  readOnly = false,
  hideUi = false,
  onMount,
  className = "",
  height = "500px",
  showUnsavedWarning = false,
  showEmptyState = true,
  emptyStateMessage = "No whiteboard content",
}: WhiteboardViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);
  const editorRef = useRef<Editor | null>(null);

  const hasContent = hasDrawingContent(snapshot);

  const handleMount = (editor: Editor) => {
    editorRef.current = editor;

    // Set notebook-style defaults (grid via CSS, not tldraw's built-in)
    editor.user.updateUserPreferences({
      isSnapMode: true,
    });
    editor.updateInstanceState({
      isGridMode: false, // Disabled - using CSS grid instead
    });

    if (readOnly) {
      editor.updateInstanceState({ isReadonly: true });
    }

    if (snapshot && hasDrawingContent(snapshot)) {
      try {
        applySnapshot(editor, snapshot);
        setTimeout(() => {
          editor.zoomToFit();
          setHasApplied(true);
        }, 100);
      } catch (error) {
        console.error("Failed to load whiteboard snapshot:", error);
      }
    }

    setIsLoading(false);
    onMount?.(editor);
  };

  // Re-apply snapshot when it changes
  useEffect(() => {
    const editor = editorRef.current;
    if (editor && snapshot && hasDrawingContent(snapshot)) {
      try {
        applySnapshot(editor, snapshot);
        setTimeout(() => {
          editor.zoomToFit();
          setHasApplied(true);
        }, 100);
      } catch (error) {
        console.error("Failed to update whiteboard snapshot:", error);
      }
    }
  }, [snapshot]);

  // Check if className contains height override
  const hasHeightOverride = className.includes("h-");

  return (
    <div
      className={`relative w-full ${className}`}
      style={hasHeightOverride ? undefined : { height }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
        </div>
      )}

      {/* Empty state overlay */}
      {showEmptyState && !hasContent && !isLoading && !hasApplied && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 z-10 pointer-events-none">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
            <PenTool className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-2">{emptyStateMessage}</p>
          {!readOnly && (
            <p className="text-sm text-muted-foreground">
              You can still draw below
            </p>
          )}
        </div>
      )}

      <Tldraw
        onMount={handleMount}
        hideUi={hideUi || readOnly}
        overrides={uiOverrides}
        inferDarkMode
      />

      {/* Unsaved warning */}
      {showUnsavedWarning && hasApplied && (
        <div className="absolute bottom-4 right-4 rounded-lg bg-amber-100 px-3 py-1.5 text-sm text-amber-800 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800 flex items-center gap-2 z-20">
          <AlertTriangle className="h-4 w-4" />
          Changes not saved
        </div>
      )}

      {/* Read-only indicator */}
      {readOnly && (
        <div className="absolute bottom-4 left-4 rounded-lg bg-amber-100 px-3 py-1.5 text-sm text-amber-800 border border-amber-200">
          View only
        </div>
      )}
    </div>
  );
}

"use client";

/**
 * WhiteboardSnapshotViewer Component
 * 
 * Renders a saved tldraw snapshot with full editing capability.
 * Changes are NOT persisted to database - lost on reload.
 * Users can freely edit, annotate, and export the whiteboard.
 * 
 * Requirements: 3.3 - Display saved whiteboard snapshot with edit/export capability
 */

import type { TLStoreSnapshot } from "tldraw";
import "tldraw/tldraw.css";
import { WhiteboardViewer } from "@/components/shared/whiteboard-viewer";

export interface WhiteboardSnapshotViewerProps {
  /** The saved whiteboard snapshot to display */
  snapshot: TLStoreSnapshot | null;
  /** Optional CSS class name */
  className?: string;
}

/**
 * WhiteboardSnapshotViewer renders a saved tldraw snapshot with full editing capability.
 * Users can edit, annotate, and export - but changes are NOT saved to database.
 * 
 * Requirements: 3.3 - WHEN a user views a past session THEN the Stoom system
 * SHALL display the saved whiteboard snapshot with edit/export capability
 */
export function WhiteboardSnapshotViewer({
  snapshot,
  className = "",
}: WhiteboardSnapshotViewerProps) {
  return (
    <WhiteboardViewer
      snapshot={snapshot}
      readOnly={false}
      hideUi={false}
      className={className}
      height="500px"
      showUnsavedWarning={true}
      showEmptyState={true}
      emptyStateMessage="No whiteboard content saved"
    />
  );
}

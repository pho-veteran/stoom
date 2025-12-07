"use client";

/**
 * NotesContentViewer Component
 * 
 * Renders saved Tiptap content with editing capability for
 * viewing and modifying past session notes.
 * 
 * Requirements: 3.4 - Display saved notes content with edit capability
 */

import { useCallback } from "react";
import type { JSONContent } from "@tiptap/react";
import axios from "axios";
import { TiptapEditor } from "@/components/shared/tiptap-editor";

export interface NotesContentViewerProps {
  /** The saved notes content to display */
  content: JSONContent | null;
  /** Room ID for saving notes */
  roomId: string;
  /** Optional CSS class name */
  className?: string;
}

/**
 * NotesContentViewer renders saved Tiptap content with editing capability
 * for viewing and modifying past session notes.
 */
export function NotesContentViewer({
  content,
  roomId,
  className = "",
}: NotesContentViewerProps) {
  /**
   * Save notes to database
   */
  const handleSave = useCallback(async (noteContent: JSONContent) => {
    await axios.post(`/api/room/${roomId}/notes`, { content: noteContent });
  }, [roomId]);

  return (
    <TiptapEditor
      content={content}
      placeholder="Start taking notes..."
      onSave={handleSave}
      showToolbar={true}
      showSaveButton={true}
      className={className}
      minHeight="250px"
    />
  );
}

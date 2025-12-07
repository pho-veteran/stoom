"use client";

/**
 * PersonalNotes Component
 * 
 * A personal rich-text editor using Tiptap for individual note-taking.
 * Notes are NOT collaborative - each user has their own notes per room session.
 * Notes can be saved to the database.
 * 
 * Uses shared TiptapEditor component for consistent toolbar across app.
 */

import { useCallback, useEffect, useState } from "react";
import type { JSONContent } from "@tiptap/react";
import axios from "axios";
import { TiptapEditor } from "@/components/shared/tiptap-editor";

export interface PersonalNotesProps {
  roomId: string;
  userId: string;
  readOnly?: boolean;
}

// Local storage key for notes
const getNotesStorageKey = (roomId: string, userId: string) =>
  `stoom-notes-${roomId}-${userId}`;

/**
 * PersonalNotes component with Tiptap integration
 */
export function PersonalNotes({
  roomId,
  userId,
  readOnly = false,
}: PersonalNotesProps) {
  const [content, setContent] = useState<JSONContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load notes from database on mount
  useEffect(() => {
    const loadNotes = async () => {
      try {
        // First check localStorage (for unsaved changes during session)
        const storageKey = getNotesStorageKey(roomId, userId);
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          try {
            setContent(JSON.parse(saved));
            setIsLoading(false);
            return;
          } catch {
            // Invalid JSON, continue to DB
          }
        }

        // Load from database
        const response = await axios.get(`/api/room/${roomId}/notes`);
        if (response.data.content) {
          setContent(response.data.content);
        }
      } catch (error) {
        console.error("Failed to load notes:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotes();
  }, [roomId, userId]);

  /**
   * Handle content changes - save to localStorage
   */
  const handleChange = useCallback((newContent: JSONContent) => {
    if (readOnly) return;
    
    const storageKey = getNotesStorageKey(roomId, userId);
    localStorage.setItem(storageKey, JSON.stringify(newContent));
    setHasUnsavedChanges(true);
  }, [roomId, userId, readOnly]);

  /**
   * Save notes to database
   */
  const handleSave = useCallback(async (noteContent: JSONContent) => {
    await axios.post(`/api/room/${roomId}/notes`, {
      userId,
      content: noteContent,
    });
    setHasUnsavedChanges(false);
  }, [roomId, userId]);

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <TiptapEditor
        content={content}
        placeholder="Start taking notes..."
        readOnly={readOnly}
        onChange={handleChange}
        onSave={handleSave}
        showToolbar={!readOnly}
        showSaveButton={!readOnly}
        className="h-full"
        minHeight="200px"
      />

      {/* Unsaved changes indicator */}
      {hasUnsavedChanges && !readOnly && (
        <div className="absolute bottom-2 left-2 rounded-lg bg-amber-100 px-3 py-1.5 text-xs text-amber-800 border border-amber-200">
          Unsaved changes
        </div>
      )}
    </div>
  );
}

"use client";

/**
 * CollaborativeNotes Component
 * 
 * A collaborative rich-text editor using Tiptap that integrates with LiveKit
 * data channels for real-time synchronization.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { JSONContent } from "@tiptap/react";
import { useRoomContext } from "@livekit/components-react";
import { useCollaborationSync } from "@/hooks/use-collaboration-sync";
import type { NotesSyncMessage, ParticipantPresence, LocalPresence } from "@/lib/collaboration-types";

/**
 * Throttle interval for presence updates in milliseconds
 * Prevents flooding the data channel with selection updates
 */
const PRESENCE_THROTTLE_MS = 100;
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
} from "lucide-react";

export interface CollaborativeNotesProps {
  roomId: string;
  onContentChange?: (content: JSONContent) => void;
  initialContent?: JSONContent;
  readOnly?: boolean;
}

/**
 * Toolbar button component for formatting actions
 */
function ToolbarButton({
  onClick,
  isActive,
  disabled,
  children,
  title,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <Button
      type="button"
      variant={isActive ? "secondary" : "ghost"}
      size="icon"
      className="h-8 w-8"
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </Button>
  );
}


/**
 * Formatting toolbar for the notes editor
 */
function FormattingToolbar({
  editor,
  disabled,
}: {
  editor: Editor | null;
  disabled?: boolean;
}) {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border p-2">
      {/* Text formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        disabled={disabled}
        title="Bold (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        disabled={disabled}
        title="Italic (Ctrl+I)"
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive("strike")}
        disabled={disabled}
        title="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>

      <div className="mx-1 h-6 w-px bg-border" />

      {/* Headings */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive("heading", { level: 1 })}
        disabled={disabled}
        title="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive("heading", { level: 2 })}
        disabled={disabled}
        title="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive("heading", { level: 3 })}
        disabled={disabled}
        title="Heading 3"
      >
        <Heading3 className="h-4 w-4" />
      </ToolbarButton>

      <div className="mx-1 h-6 w-px bg-border" />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
        disabled={disabled}
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive("orderedList")}
        disabled={disabled}
        title="Numbered List"
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
}


/**
 * CollaborativeNotes component with Tiptap integration
 */
export function CollaborativeNotes({
  roomId,
  onContentChange,
  initialContent,
  readOnly = false,
}: CollaborativeNotesProps) {
  const room = useRoomContext();
  const isApplyingRemoteChanges = useRef(false);
  const hasRequestedSync = useRef(false);
  const [remotePresence, setRemotePresence] = useState<ParticipantPresence[]>([]);
  
  // Store sendNotesContent in a ref to avoid circular dependency
  const sendContentRef = useRef<((content: JSONContent) => void) | null>(null);

  // Need to reference editor in handleNotesUpdate, but editor is created after
  // So we use a ref pattern similar to whiteboard
  const editorRef = useRef<Editor | null>(null);
  
  // Presence tracking refs
  const sendPresenceRef = useRef<((presence: LocalPresence) => void) | null>(null);
  const lastPresenceUpdateRef = useRef<number>(0);

  /**
   * Handle notes updates from other participants
   */
  const handleNotesUpdate = useCallback((message: NotesSyncMessage) => {
    // Don't process our own messages
    if (message.payload.senderId === room?.localParticipant?.identity) return;

    const currentEditor = editorRef.current;
    if (!currentEditor) return;

    isApplyingRemoteChanges.current = true;

    try {
      if (message.action === "update" && message.payload.content) {
        // Apply content update - merge with local state
        // For simplicity, we replace content but preserve cursor position
        const { from, to } = currentEditor.state.selection;
        currentEditor.commands.setContent(message.payload.content, { emitUpdate: false });
        // Try to restore selection if valid
        try {
          const docSize = currentEditor.state.doc.content.size;
          const safeFrom = Math.min(from, docSize);
          const safeTo = Math.min(to, docSize);
          currentEditor.commands.setTextSelection({ from: safeFrom, to: safeTo });
        } catch {
          // Selection restoration failed, that's okay
        }
      } else if (message.action === "sync-response" && message.payload.content) {
        // Apply full content for initial sync
        currentEditor.commands.setContent(message.payload.content, { emitUpdate: false });
      } else if (message.action === "sync-request") {
        // Respond with current content
        const content = currentEditor.getJSON();
        sendContentRef.current?.(content);
      }
    } finally {
      isApplyingRemoteChanges.current = false;
    }
  }, [room?.localParticipant?.identity]);

  /**
   * Handle presence updates
   */
  const handlePresenceUpdate = useCallback((presence: ParticipantPresence[]) => {
    // Filter to only notes presence
    const notesPresence = presence.filter(p => p.feature === "notes");
    setRemotePresence(notesPresence);
  }, []);

  const {
    sendNotesContent,
    sendPresence,
    requestSync,
    isConnected,
  } = useCollaborationSync(room, {
    roomId,
    onNotesUpdate: handleNotesUpdate,
    onPresenceUpdate: handlePresenceUpdate,
  });

  // Update the refs when functions change
  useEffect(() => {
    sendContentRef.current = sendNotesContent;
  }, [sendNotesContent]);

  useEffect(() => {
    sendPresenceRef.current = sendPresence;
  }, [sendPresence]);

  /**
   * Send presence update with current selection
   */
  const sendSelectionPresence = useCallback((from: number, to: number) => {
    // Don't send presence if read-only or not connected
    if (readOnly || !isConnected) return;
    
    // Throttle presence updates
    const now = Date.now();
    if (now - lastPresenceUpdateRef.current < PRESENCE_THROTTLE_MS) return;
    lastPresenceUpdateRef.current = now;

    // Send presence update with selection position
    const presence: LocalPresence = {
      feature: "notes",
      selection: { from, to },
    };
    sendPresenceRef.current?.(presence);
  }, [readOnly, isConnected]);

  /**
   * Initialize Tiptap editor
   */
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Configure StarterKit with all needed features
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {},
        orderedList: {},
        bold: {},
        italic: {},
        strike: {},
      }),
    ],
    content: initialContent || {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [],
        },
      ],
    },
    editable: !readOnly,
    // Disable immediate rendering to avoid SSR hydration mismatches
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[200px] p-4",
      },
    },
    onUpdate: ({ editor }) => {
      // Don't broadcast changes we're applying from remote
      if (isApplyingRemoteChanges.current) return;
      
      // Don't broadcast if read-only
      if (readOnly) return;

      const content = editor.getJSON();
      
      // Broadcast to other participants
      sendNotesContent(content);

      // Notify parent of content change
      if (onContentChange) {
        onContentChange(content);
      }
    },
    onSelectionUpdate: ({ editor }) => {
      // Track selection changes for presence
      if (readOnly) return;
      
      const { from, to } = editor.state.selection;
      sendSelectionPresence(from, to);
    },
    onFocus: ({ editor }) => {
      // Send presence when editor gains focus
      if (readOnly) return;
      
      const { from, to } = editor.state.selection;
      sendSelectionPresence(from, to);
    },
    onBlur: () => {
      // Clear presence when editor loses focus
      if (readOnly || !isConnected) return;
      
      const presence: LocalPresence = {
        feature: "notes",
        selection: undefined,
      };
      sendPresenceRef.current?.(presence);
    },
  });

  // Update editor editable state when readOnly changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly);
    }
  }, [editor, readOnly]);

  // Keep editorRef in sync with editor
  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  /**
   * Request sync when joining a room with existing content
   */
  useEffect(() => {
    if (editor && isConnected && !hasRequestedSync.current && !initialContent) {
      hasRequestedSync.current = true;
      // Small delay to allow other participants to be ready
      const timeout = setTimeout(() => {
        requestSync("notes");
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [editor, isConnected, initialContent, requestSync]);

  return (
    <div className="relative flex h-full w-full flex-col bg-background">
      {/* Formatting toolbar - hidden in read-only mode */}
      {!readOnly && (
        <FormattingToolbar editor={editor} disabled={readOnly} />
      )}

      {/* Editor content */}
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} className="h-full" />
      </div>

      {/* Remote presence indicators */}
      {remotePresence.length > 0 && (
        <div className="absolute bottom-2 right-2 flex flex-wrap gap-1">
          {remotePresence.map((presence) => (
            <span
              key={presence.participantId}
              className="rounded-full bg-violet-500 px-2 py-0.5 text-xs text-white"
            >
              {presence.participantName}
            </span>
          ))}
        </div>
      )}

      {/* Read-only indicator */}
      {readOnly && (
        <div className="absolute bottom-2 left-2 rounded-lg bg-amber-100 px-3 py-1.5 text-sm text-amber-800 border border-amber-200">
          View only
        </div>
      )}

      {/* Connection status */}
      {!isConnected && (
        <div className="absolute top-2 right-2 rounded-lg bg-red-100 px-3 py-1.5 text-sm text-red-800 border border-red-200">
          Disconnected
        </div>
      )}
    </div>
  );
}

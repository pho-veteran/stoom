"use client";

/**
 * TiptapEditor Component
 * 
 * Reusable rich-text editor with full toolbar.
 * Used in both room (personal-notes) and session detail (notes-content-viewer).
 */

import { useCallback, useEffect, useState } from "react";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import Heading from "@tiptap/extension-heading";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import Strike from "@tiptap/extension-strike";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import History from "@tiptap/extension-history";
import Placeholder from "@tiptap/extension-placeholder";
import type { JSONContent } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import {
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Strikethrough,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Save,
  Loader2,
  Undo,
  Redo,
  Check,
} from "lucide-react";

export interface TiptapEditorProps {
  /** Initial content to load */
  content?: JSONContent | null;
  /** Placeholder text when editor is empty */
  placeholder?: string;
  /** Whether the editor is read-only */
  readOnly?: boolean;
  /** Called when content changes */
  onChange?: (content: JSONContent) => void;
  /** Called when save is triggered */
  onSave?: (content: JSONContent) => Promise<void>;
  /** Whether to show the toolbar */
  showToolbar?: boolean;
  /** Whether to show the save button */
  showSaveButton?: boolean;
  /** Optional CSS class name */
  className?: string;
  /** Minimum height for the editor */
  minHeight?: string;
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
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
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
  onSave,
  isSaving,
  saveStatus,
  showSaveButton,
}: {
  editor: Editor | null;
  disabled?: boolean;
  onSave?: () => void;
  isSaving: boolean;
  saveStatus: "idle" | "saved";
  showSaveButton?: boolean;
}) {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border p-2 bg-muted/30">
      {/* Undo/Redo */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={disabled || !editor.can().undo()}
        title="Undo (Ctrl+Z)"
      >
        <Undo className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={disabled || !editor.can().redo()}
        title="Redo (Ctrl+Y)"
      >
        <Redo className="h-4 w-4" />
      </ToolbarButton>

      <div className="mx-1 h-6 w-px bg-border" />

      {/* Text formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        disabled={disabled}
        title="Bold (Ctrl+B)"
      >
        <BoldIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        disabled={disabled}
        title="Italic (Ctrl+I)"
      >
        <ItalicIcon className="h-4 w-4" />
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

      {/* Spacer */}
      <div className="flex-1" />

      {/* Save button */}
      {showSaveButton && onSave && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onSave}
          disabled={disabled || isSaving}
          className="gap-1.5"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saveStatus === "saved" ? (
            <Check className="h-4 w-4 text-emerald-500" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saveStatus === "saved" ? "Saved" : "Save"}
        </Button>
      )}
    </div>
  );
}

/**
 * TiptapEditor - Reusable rich-text editor component
 */
export function TiptapEditor({
  content,
  placeholder = "Start typing...",
  readOnly = false,
  onChange,
  onSave,
  showToolbar = true,
  showSaveButton = true,
  className = "",
  minHeight = "200px",
}: TiptapEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");

  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Heading.configure({ levels: [1, 2, 3] }),
      Bold,
      Italic,
      Strike,
      BulletList,
      OrderedList,
      ListItem,
      History,
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
    ],
    content: content || { type: "doc", content: [{ type: "paragraph" }] },
    editable: !readOnly,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      if (readOnly) return;
      onChange?.(editor.getJSON());
    },
  });

  // Update editor editable state when readOnly changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly);
    }
  }, [editor, readOnly]);

  // Update content when prop changes
  useEffect(() => {
    if (editor && content) {
      const currentContent = JSON.stringify(editor.getJSON());
      const newContent = JSON.stringify(content);
      if (currentContent !== newContent) {
        editor.commands.setContent(content);
      }
    }
  }, [editor, content]);

  const handleSave = useCallback(async () => {
    if (!editor || isSaving || !onSave) return;

    setIsSaving(true);
    setSaveStatus("idle");

    try {
      await onSave(editor.getJSON());
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setIsSaving(false);
    }
  }, [editor, isSaving, onSave]);

  // Keyboard shortcut for save (Ctrl+S)
  useEffect(() => {
    if (!onSave) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave, onSave]);

  return (
    <div className={`relative flex flex-col bg-background rounded-lg border border-border ${className}`}>
      {showToolbar && !readOnly && (
        <FormattingToolbar
          editor={editor}
          disabled={readOnly}
          onSave={handleSave}
          isSaving={isSaving}
          saveStatus={saveStatus}
          showSaveButton={showSaveButton && !!onSave}
        />
      )}

      <div className="flex-1 overflow-y-auto">
        <EditorContent
          editor={editor}
          className={`tiptap-editor h-full [&_.ProseMirror]:p-4 [&_.ProseMirror]:outline-none [&_.ProseMirror_h1]:text-2xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:mb-4 [&_.ProseMirror_h1]:mt-6 [&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h2]:mb-3 [&_.ProseMirror_h2]:mt-5 [&_.ProseMirror_h3]:text-lg [&_.ProseMirror_h3]:font-medium [&_.ProseMirror_h3]:mb-2 [&_.ProseMirror_h3]:mt-4 [&_.ProseMirror_p]:mb-2 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ul]:mb-2 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6 [&_.ProseMirror_ol]:mb-2 [&_.ProseMirror_li]:mb-1 [&_.ProseMirror_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_.is-editor-empty:first-child::before]:text-muted-foreground [&_.ProseMirror_.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_.is-editor-empty:first-child::before]:pointer-events-none`}
          style={{ minHeight }}
        />
      </div>

      {readOnly && (
        <div className="absolute bottom-2 left-2 rounded-lg bg-slate-100 px-3 py-1.5 text-sm text-slate-600 border border-slate-200">
          View only
        </div>
      )}
    </div>
  );
}

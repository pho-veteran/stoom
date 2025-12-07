"use client";

/**
 * Whiteboard Component
 * 
 * A collaborative whiteboard using tldraw that integrates with LiveKit
 * data channels for real-time synchronization.
 * 
 * Note: This component is always mounted (hidden via CSS when not visible)
 * to preserve state. No localStorage/sessionStorage needed for panel toggles.
 * 
 * Requirements: 1.1, 1.2, 1.3, 4.1, 7.1, 8.8
 */

import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import {
  Tldraw,
  Editor,
  TLRecord,
  TLStoreEventInfo,
  TLAssetStore,
  TLUiOverrides,
  TLUiActionsContextType,
} from "tldraw";
import type { TLStoreSnapshot, TLAsset } from "tldraw";
import "tldraw/tldraw.css";

/**
 * UI overrides to customize tldraw toolbar
 * Removes embed tool only
 */
const uiOverrides: TLUiOverrides = {
  actions(_editor, actions): TLUiActionsContextType {
    // Remove embed-related action only
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { "insert-embed": _removed, ...filteredActions } = actions;
    return filteredActions;
  },
};
import { useRoomContext } from "@livekit/components-react";
import { useCollaborationSync } from "@/hooks/use-collaboration-sync";
import type { WhiteboardSyncMessage } from "@/lib/collaboration-types";
import { ConflictResolver } from "@/lib/collaboration-types";
import axios from "axios";

/**
 * Get localStorage key for whiteboard state
 * Used for saving whiteboard to database
 */
const getWhiteboardStorageKey = (roomId: string) => `stoom-whiteboard-${roomId}`;

export interface WhiteboardProps {
  roomId: string;
  onStateChange?: (snapshot: TLStoreSnapshot) => void;
  initialSnapshot?: TLStoreSnapshot;
  readOnly?: boolean;
  /** Remote save status from host/co-host */
  remoteSaveStatus?: {
    status: 'saving' | 'saved' | 'error';
    senderName: string;
  } | null;
}

/**
 * Get current snapshot from editor (includes assets)
 */
function getEditorSnapshot(editor: Editor): TLStoreSnapshot {
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
 * Check if a record is an asset record
 */
function isAssetRecord(record: TLRecord): boolean {
  return record.typeName === "asset";
}

/**
 * Get asset records that are referenced by shape records
 * Only includes assets that have been uploaded (have a src URL, not blob/base64)
 */
function getReferencedAssets(editor: Editor, shapeRecords: TLRecord[]): TLRecord[] {
  const assetIds = new Set<string>();
  
  // Collect asset IDs from shapes that reference assets (like image shapes)
  for (const record of shapeRecords) {
    // Image shapes have an assetId property
    if ('props' in record && record.props && typeof record.props === 'object') {
      const props = record.props as Record<string, unknown>;
      if (props.assetId && typeof props.assetId === 'string') {
        assetIds.add(props.assetId);
      }
    }
  }
  
  // Get the actual asset records (only if they have a URL src, not base64)
  const assets: TLRecord[] = [];
  for (const assetId of assetIds) {
    const asset = editor.store.get(assetId as TLRecord['id']);
    if (asset && 'props' in asset) {
      const props = asset.props as Record<string, unknown>;
      // Only include if src is a URL (starts with / or http), not base64
      if (props.src && typeof props.src === 'string' && 
          (props.src.startsWith('/') || props.src.startsWith('http'))) {
        assets.push(asset);
      }
    }
  }
  
  return assets;
}

/**
 * Create a custom asset store that uploads images to the server
 * This avoids the 64KB WebRTC limit by storing images on the server
 */
function createAssetStore(roomId: string): TLAssetStore {
  return {
    async upload(_asset: TLAsset, file: File): Promise<{ src: string }> {
      // Upload to server
      const formData = new FormData();
      formData.append("file", file);
      
      try {
        const response = await axios.post(`/api/room/${roomId}/assets`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        
        // Return the URL - this will be stored in the asset record
        return { src: response.data.url };
      } catch (error) {
        console.error("Failed to upload asset:", error);
        throw error;
      }
    },
    
    resolve(asset: TLAsset): string | null {
      // Return the src URL for the asset
      if ('props' in asset && asset.props && typeof asset.props === 'object') {
        const props = asset.props as Record<string, unknown>;
        if (props.src && typeof props.src === 'string') {
          return props.src;
        }
      }
      return null;
    },
  };
}

/**
 * Apply remote changes to the editor with timestamp-based conflict resolution
 * Requirements: 1.3, 6.4
 * 
 * Uses last-write-wins strategy: only applies changes if their timestamp
 * is newer than the last known timestamp for that record.
 * 
 * Assets are applied first to ensure they exist before shapes reference them.
 * 
 * @param editor - The tldraw editor instance
 * @param changes - Array of records to apply
 * @param timestamp - The timestamp of the incoming update
 * @param conflictResolver - The conflict resolver instance for tracking timestamps
 */
function applyRemoteChanges(
  editor: Editor,
  changes: TLRecord[],
  timestamp: number,
  conflictResolver: ConflictResolver
): void {
  // Sort changes: assets first, then other records
  // This ensures assets exist before shapes that reference them are applied
  const sortedChanges = [...changes].sort((a, b) => {
    const aIsAsset = isAssetRecord(a);
    const bIsAsset = isAssetRecord(b);
    if (aIsAsset && !bIsAsset) return -1;
    if (!aIsAsset && bIsAsset) return 1;
    return 0;
  });

  editor.store.mergeRemoteChanges(() => {
    for (const record of sortedChanges) {
      if (record === null) continue;
      
      // Check if this update should be applied based on timestamp (last-write-wins)
      // Requirement: 6.4
      if (!conflictResolver.shouldApplyUpdate(record.id, timestamp)) {
        // Skip this record - we have a newer version
        continue;
      }
      
      // Record the timestamp for this update
      conflictResolver.recordUpdate(record.id, timestamp);
      
      // Check if record exists
      const existing = editor.store.get(record.id);
      if (existing) {
        editor.store.update(record.id, () => record);
      } else {
        editor.store.put([record]);
      }
    }
  });
}

/**
 * Apply a full snapshot to the editor
 * Requirements: 1.4
 */
function applySnapshot(editor: Editor, snapshot: TLStoreSnapshot): void {
  try {
    // Load snapshot by putting all records
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
 * Whiteboard component with tldraw integration
 * 
 * Requirements:
 * - 1.1: Display tldraw whiteboard canvas when toggled
 * - 1.2: Broadcast drawing operations to all participants within 100ms
 * - 1.3: Render updates from other participants immediately
 * - 4.1: Provide pen, highlighter, eraser, and shape tools
 * - 8.8: Display in read-only mode for users without edit permission
 */

/**
 * Load whiteboard state from localStorage
 * Used to restore state when component remounts (e.g., panel toggle)
 */
function loadLocalSnapshot(roomId: string): TLStoreSnapshot | null {
  if (typeof window === "undefined") return null;
  
  try {
    const saved = localStorage.getItem(getWhiteboardStorageKey(roomId));
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Invalid JSON or storage error
  }
  return null;
}

/**
 * Save whiteboard state to localStorage
 * Used for panel toggle persistence and manual save to DB
 */
function saveLocalSnapshot(roomId: string, snapshot: TLStoreSnapshot): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(getWhiteboardStorageKey(roomId), JSON.stringify(snapshot));
  } catch {
    // Storage full or other error
  }
}

export function Whiteboard({
  roomId,
  onStateChange,
  initialSnapshot,
  readOnly = false,
  remoteSaveStatus,
}: WhiteboardProps) {
  const room = useRoomContext();
  const editorRef = useRef<Editor | null>(null);
  const [isReady, setIsReady] = useState(false);
  const isApplyingRemoteChanges = useRef(false);
  
  // Track readOnly state in a ref so store listener can access current value
  const readOnlyRef = useRef(readOnly);
  useEffect(() => {
    readOnlyRef.current = readOnly;
  }, [readOnly]);
  
  // Database snapshot state - loaded on mount as fallback
  const [dbSnapshot, setDbSnapshot] = useState<TLStoreSnapshot | null>(null);
  const [isLoadingDb, setIsLoadingDb] = useState(true);
  
  // Conflict resolver for timestamp-based last-write-wins resolution
  // Requirement: 6.4
  const conflictResolverRef = useRef<ConflictResolver>(new ConflictResolver());
  
  // Store sendWhiteboardSnapshot in a ref to avoid circular dependency
  const sendSnapshotRef = useRef<((snapshot: TLStoreSnapshot) => void) | null>(null);
  
  // Custom asset store for uploading images to server (avoids 64KB WebRTC limit)
  const assetStore = useMemo(() => createAssetStore(roomId), [roomId]);
  
  /**
   * Load whiteboard snapshot from database on mount
   * This serves as a fallback when no other participants are present to sync from
   */
  useEffect(() => {
    const loadFromDatabase = async () => {
      try {
        const response = await axios.get(`/api/room/${roomId}/whiteboard`);
        if (response.data.snapshot) {
          setDbSnapshot(response.data.snapshot);
        }
      } catch (error) {
        console.error("Failed to load whiteboard from database:", error);
      } finally {
        setIsLoadingDb(false);
      }
    };

    // Only load from DB if no initialSnapshot provided
    if (!initialSnapshot) {
      loadFromDatabase();
    } else {
      setIsLoadingDb(false);
    }
  }, [roomId, initialSnapshot]);

  // Store local participant identity in a ref to avoid callback recreation
  const localParticipantIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    localParticipantIdRef.current = room?.localParticipant?.identity;
  }, [room?.localParticipant?.identity]);

  // Store roomId in a ref to avoid callback recreation
  const roomIdRef = useRef(roomId);
  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  /**
   * Handle whiteboard updates from other participants
   * Requirements: 1.3, 6.4
   * Using refs to keep callback stable and avoid listener leaks
   */
  const handleWhiteboardUpdate = useCallback((message: WhiteboardSyncMessage) => {
    const editor = editorRef.current;
    if (!editor) return;

    // Don't process our own messages
    if (message.payload.senderId === localParticipantIdRef.current) return;

    isApplyingRemoteChanges.current = true;

    try {
      if (message.action === "update") {
        // Apply incremental changes with timestamp-based conflict resolution
        // Requirement: 6.4 - Uses last-write-wins strategy
        if (message.payload.changes && message.payload.changes.length > 0) {
          applyRemoteChanges(
            editor,
            message.payload.changes,
            message.payload.timestamp,
            conflictResolverRef.current
          );
        }
        
        // Handle removed records (for undo/delete operations)
        if (message.payload.removedIds && message.payload.removedIds.length > 0) {
          editor.store.mergeRemoteChanges(() => {
            for (const id of message.payload.removedIds!) {
              // Check if record exists before removing
              const existing = editor.store.get(id as TLRecord['id']);
              if (existing) {
                editor.store.remove([id as TLRecord['id']]);
              }
            }
          });
        }
        
        // Save to localStorage for panel toggle persistence during session
        const snapshot = getEditorSnapshot(editor);
        saveLocalSnapshot(roomIdRef.current, snapshot);
      } else if (message.action === "sync-response" && message.payload.snapshot) {
        // Apply full snapshot for initial sync from other participants
        // This is the highest priority source - overrides DB/initial snapshot
        // Clear conflict resolver since we're loading a fresh state
        conflictResolverRef.current.clear();
        applySnapshot(editor, message.payload.snapshot);
        // Save to localStorage for panel toggle persistence during session
        saveLocalSnapshot(roomIdRef.current, message.payload.snapshot);
      } else if (message.action === "sync-request") {
        // Respond with current state
        const snapshot = getEditorSnapshot(editor);
        sendSnapshotRef.current?.(snapshot);
      }
    } finally {
      isApplyingRemoteChanges.current = false;
    }
  }, []); // Empty deps - uses refs for values that change

  const {
    sendWhiteboardUpdate,
    sendWhiteboardSnapshot,
    requestSync,
    isConnected,
  } = useCollaborationSync(room, {
    roomId,
    onWhiteboardUpdate: handleWhiteboardUpdate,
  });

  // Update the refs when functions change
  useEffect(() => {
    sendSnapshotRef.current = sendWhiteboardSnapshot;
  }, [sendWhiteboardSnapshot]);

  /**
   * Handle editor mount
   * 
   * Data loading priority:
   * 1. localStorage (for panel toggle persistence within session)
   * 2. LiveKit sync from other participants (handled via sync-response message)
   * 3. Database snapshot (fallback when no other participants)
   * 4. initialSnapshot prop (lowest priority fallback)
   */
  const handleMount = useCallback((editor: Editor) => {
    editorRef.current = editor;

    // Set notebook-style defaults: white background with grid
    // Only apply if no existing snapshot (fresh whiteboard)
    const localSnapshot = loadLocalSnapshot(roomId);
    const hasExistingContent = localSnapshot || dbSnapshot || initialSnapshot;
    
    if (!hasExistingContent) {
      // Set default page state for notebook feel
      editor.user.updateUserPreferences({
        isSnapMode: true,
      });
    }
    
    // Disable tldraw's built-in grid (we use CSS grid instead)
    editor.updateInstanceState({
      isGridMode: false,
    });

    // Try localStorage first (for panel toggle persistence)
    
    // Apply snapshot based on priority
    if (localSnapshot) {
      // Restore from localStorage (panel was toggled)
      try {
        applySnapshot(editor, localSnapshot);
      } catch (error) {
        console.error("Failed to load local snapshot:", error);
      }
    } else if (dbSnapshot) {
      // Fall back to DB snapshot
      try {
        applySnapshot(editor, dbSnapshot);
        saveLocalSnapshot(roomId, dbSnapshot);
      } catch (error) {
        console.error("Failed to load database snapshot:", error);
      }
    } else if (initialSnapshot) {
      // Lowest priority fallback
      try {
        applySnapshot(editor, initialSnapshot);
        saveLocalSnapshot(roomId, initialSnapshot);
      } catch (error) {
        console.error("Failed to load initial snapshot:", error);
      }
    }

    // Set read-only mode based on prop
    editor.updateInstanceState({ isReadonly: readOnly });

    // Listen for store changes to broadcast updates
    // Requirements: 1.2, 6.4
    const handleStoreChange = (info: TLStoreEventInfo) => {
      // Don't broadcast changes we're applying from remote
      if (isApplyingRemoteChanges.current) return;
      
      // Don't broadcast if read-only (use ref to get current value)
      if (readOnlyRef.current) return;

      if (info.source === "user") {
        const changes: TLRecord[] = [];
        const removedIds: string[] = [];
        const timestamp = Date.now();
        
        // Collect added and updated records
        for (const record of Object.values(info.changes.added)) {
          changes.push(record);
          // Record local timestamp for conflict resolution (Requirement: 6.4)
          conflictResolverRef.current.recordUpdate(record.id, timestamp);
        }
        for (const [, to] of Object.values(info.changes.updated)) {
          changes.push(to);
          // Record local timestamp for conflict resolution (Requirement: 6.4)
          conflictResolverRef.current.recordUpdate(to.id, timestamp);
        }
        
        // Collect removed record IDs (for undo/delete operations)
        for (const record of Object.values(info.changes.removed)) {
          removedIds.push(record.id);
          // Record local timestamp for conflict resolution
          conflictResolverRef.current.recordUpdate(record.id, timestamp);
        }

        if (changes.length > 0 || removedIds.length > 0) {
          // Also include any referenced assets (for images, etc.)
          // This ensures the actual image data is synced, not just the shape reference
          const referencedAssets = changes.length > 0 ? getReferencedAssets(editor, changes) : [];
          const allChanges = [...referencedAssets, ...changes];
          
          // Send update with both changes and removed IDs
          sendWhiteboardUpdate(allChanges, removedIds);
        }

        // Save to localStorage for panel toggle persistence during session
        const snapshot = getEditorSnapshot(editor);
        saveLocalSnapshot(roomId, snapshot);

        // Notify parent of state change
        if (onStateChange) {
          onStateChange(snapshot);
        }
      }
    };

    const unsubscribe = editor.store.listen(handleStoreChange, {
      source: "user",
      scope: "document",
    });

    setIsReady(true);

    return () => {
      unsubscribe();
    };
  }, [initialSnapshot, readOnly, sendWhiteboardUpdate, onStateChange, roomId, dbSnapshot]);

  /**
   * Apply DB snapshot after it's loaded (if editor is ready)
   * This handles the case where Tldraw mounts before DB fetch completes
   */
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !dbSnapshot || !isReady) return;
    
    // Apply DB snapshot
    try {
      isApplyingRemoteChanges.current = true;
      applySnapshot(editor, dbSnapshot);
      saveLocalSnapshot(roomId, dbSnapshot);
    } catch (error) {
      console.error("Failed to apply DB snapshot:", error);
    } finally {
      isApplyingRemoteChanges.current = false;
    }
  }, [dbSnapshot, isReady, roomId]);

  /**
   * Update read-only state when prop changes
   * This ensures the whiteboard responds to permission changes in real-time
   */
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !isReady) return;
    
    editor.updateInstanceState({ isReadonly: readOnly });
  }, [readOnly, isReady]);

  /**
   * Request sync when joining a room with existing content
   * Requirements: 1.4
   * 
   * Note: We always request sync when the component mounts and is ready,
   * regardless of whether we've requested before. This handles the case
   * where the whiteboard is toggled off and back on - we need to get
   * the latest state from other participants.
   */
  useEffect(() => {
    if (isReady && isConnected && !initialSnapshot) {
      // Small delay to allow other participants to be ready
      const timeout = setTimeout(() => {
        requestSync("whiteboard");
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [isReady, isConnected, initialSnapshot, requestSync]);

  // Show loading state while fetching from database
  if (isLoadingDb) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading whiteboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full outline-none" tabIndex={0}>
      <Tldraw
        onMount={handleMount}
        assets={assetStore}
        overrides={uiOverrides}
        inferDarkMode
      />

      {/* Read-only indicator */}
      {readOnly && (
        <div className="absolute bottom-4 left-4 rounded-lg bg-amber-100 px-3 py-1.5 text-sm text-amber-800 border border-amber-200">
          View only
        </div>
      )}

      {/* Connection status */}
      {!isConnected && (
        <div className="absolute top-4 right-4 rounded-lg bg-red-100 px-3 py-1.5 text-sm text-red-800 border border-red-200">
          Disconnected
        </div>
      )}

      {/* Remote save status indicator */}
      {remoteSaveStatus && (
        <div className={`absolute bottom-4 right-4 rounded-lg px-3 py-1.5 text-sm border transition-opacity ${
          remoteSaveStatus.status === 'saving' 
            ? 'bg-blue-100 text-blue-800 border-blue-200' 
            : remoteSaveStatus.status === 'saved'
            ? 'bg-green-100 text-green-800 border-green-200'
            : 'bg-red-100 text-red-800 border-red-200'
        }`}>
          {remoteSaveStatus.status === 'saving' && (
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-300 border-t-blue-600" />
              {remoteSaveStatus.senderName} is saving...
            </span>
          )}
          {remoteSaveStatus.status === 'saved' && (
            <span>✓ Saved by {remoteSaveStatus.senderName}</span>
          )}
          {remoteSaveStatus.status === 'error' && (
            <span>Save failed</span>
          )}
        </div>
      )}
    </div>
  );
}

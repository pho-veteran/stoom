/**
 * Collaboration Types for Whiteboard and Notes Features
 * 
 * This module defines all message types, permission types, and sync interfaces
 * used for real-time collaboration via LiveKit data channels.
 * 
 * Requirements: 6.1, 6.2, 6.3, 8.1, 8.2
 */

import type { TLStoreSnapshot, TLRecord } from 'tldraw';
import type { JSONContent } from '@tiptap/react';
import type { Step } from '@tiptap/pm/transform';

// ============================================================================
// Permission Types (Requirements: 8.1, 8.2)
// ============================================================================

/**
 * Permission levels for collaboration features
 * - 'open': All participants can edit
 * - 'restricted': Only host and explicitly granted users can edit
 * - 'disabled': Feature is hidden from all participants
 */
export type PermissionLevel = 'open' | 'restricted' | 'disabled';

/**
 * User role in a room
 * - 'host': Room owner, full control
 * - 'co-host': Can end meeting and manage permissions
 * - 'participant': Regular participant
 */
export type UserRole = 'host' | 'co-host' | 'participant';

/**
 * Collaboration permissions for a room
 */
export interface CollaborationPermissions {
  whiteboard: PermissionLevel;
  notes: PermissionLevel;
  whiteboardAllowedUsers: string[];  // User IDs with explicit whiteboard access
  notesAllowedUsers: string[];       // User IDs with explicit notes access
  coHosts: string[];                 // User IDs with co-host privileges
}

/**
 * Default permissions for new rooms
 */
export const DEFAULT_PERMISSIONS: CollaborationPermissions = {
  whiteboard: 'open',
  notes: 'open',
  whiteboardAllowedUsers: [],
  notesAllowedUsers: [],
  coHosts: [],
};

// ============================================================================
// Whiteboard Sync Messages (Requirement: 6.1)
// ============================================================================

/**
 * Whiteboard synchronization message
 */
export interface WhiteboardSyncMessage {
  type: 'whiteboard';
  action: 'update' | 'sync-request' | 'sync-response';
  payload: {
    snapshot?: TLStoreSnapshot;
    changes?: TLRecord[];
    removedIds?: string[];  // IDs of records that were removed (for undo/delete)
    senderId: string;
    timestamp: number;
  };
}


// ============================================================================
// Notes Sync Messages (Requirement: 6.2)
// ============================================================================

/**
 * Notes synchronization message
 */
export interface NotesSyncMessage {
  type: 'notes';
  action: 'update' | 'sync-request' | 'sync-response';
  payload: {
    content?: JSONContent;
    operations?: Step[];
    senderId: string;
    timestamp: number;
  };
}

// ============================================================================
// Presence Messages (Requirements: 7.1, 7.2)
// ============================================================================

/**
 * Cursor position for whiteboard presence
 */
export interface WhiteboardCursor {
  x: number;
  y: number;
}

/**
 * Selection range for notes presence
 */
export interface NotesSelection {
  from: number;
  to: number;
}

/**
 * Presence message for tracking participant activity
 */
export interface PresenceMessage {
  type: 'presence';
  payload: {
    participantId: string;
    participantName: string;
    feature: 'whiteboard' | 'notes';
    cursor?: WhiteboardCursor;
    selection?: NotesSelection;
    timestamp: number;
  };
}

/**
 * Participant presence state
 */
export interface ParticipantPresence {
  participantId: string;
  participantName: string;
  feature: 'whiteboard' | 'notes';
  cursor?: WhiteboardCursor;
  selection?: NotesSelection;
  lastActive: number;
}

/**
 * Local presence state to broadcast
 */
export interface LocalPresence {
  feature: 'whiteboard' | 'notes';
  cursor?: WhiteboardCursor;
  selection?: NotesSelection;
}

// ============================================================================
// Permission Sync Messages (Requirements: 8.6, 8.7)
// ============================================================================

/**
 * Permission update message for syncing permission changes
 */
export interface PermissionUpdateMessage {
  type: 'permission';
  action: 'update' | 'grant' | 'revoke' | 'grant-cohost' | 'revoke-cohost';
  payload: {
    feature: 'whiteboard' | 'notes' | 'cohost';
    permissionLevel?: PermissionLevel;
    targetUserId?: string;
    senderId: string;
    timestamp: number;
  };
}

/**
 * Save status message for broadcasting save progress
 */
export interface SaveStatusMessage {
  type: 'save-status';
  payload: {
    feature: 'whiteboard' | 'notes';
    status: 'saving' | 'saved' | 'error';
    senderName: string;
    senderId: string;
    timestamp: number;
  };
}

// ============================================================================
// Combined Message Type (Requirement: 6.3)
// ============================================================================

/**
 * Union type for all collaboration messages
 */
export type CollaborationMessage =
  | WhiteboardSyncMessage
  | NotesSyncMessage
  | PresenceMessage
  | PermissionUpdateMessage
  | SaveStatusMessage;

/**
 * Message type discriminator
 */
export type CollaborationMessageType = CollaborationMessage['type'];

// ============================================================================
// Sync Hook Interfaces
// ============================================================================

/**
 * Options for the useCollaborationSync hook
 */
export interface UseCollaborationSyncOptions {
  roomId: string;
  onWhiteboardUpdate?: (message: WhiteboardSyncMessage) => void;
  onNotesUpdate?: (message: NotesSyncMessage) => void;
  onPresenceUpdate?: (presence: ParticipantPresence[]) => void;
  onPermissionUpdate?: (message: PermissionUpdateMessage) => void;
  onSaveStatus?: (message: SaveStatusMessage) => void;
}

/**
 * Return type for the useCollaborationSync hook
 */
export interface UseCollaborationSyncReturn {
  sendWhiteboardUpdate: (changes: TLRecord[], removedIds?: string[]) => void;
  sendWhiteboardSnapshot: (snapshot: TLStoreSnapshot) => void;
  sendNotesUpdate: (operations: Step[]) => void;
  sendNotesContent: (content: JSONContent) => void;
  sendPresence: (presence: LocalPresence) => void;
  sendSaveStatus: (feature: 'whiteboard' | 'notes', status: 'saving' | 'saved' | 'error') => void;
  requestSync: (feature: 'whiteboard' | 'notes') => void;
  isConnected: boolean;
}

// ============================================================================
// Permission Hook Interfaces
// ============================================================================

/**
 * Options for the useCollaborationPermissions hook
 */
export interface UseCollaborationPermissionsOptions {
  roomId: string;
  userId: string;
  isHost: boolean;
}

/**
 * Return type for the useCollaborationPermissions hook
 */
export interface UseCollaborationPermissionsReturn {
  permissions: CollaborationPermissions;
  canEditWhiteboard: boolean;
  canEditNotes: boolean;
  canViewWhiteboard: boolean;
  canViewNotes: boolean;
  // Host-only functions
  updatePermissions: (permissions: Partial<CollaborationPermissions>) => Promise<void>;
  grantWhiteboardAccess: (userId: string) => Promise<void>;
  revokeWhiteboardAccess: (userId: string) => Promise<void>;
  grantNotesAccess: (userId: string) => Promise<void>;
  revokeNotesAccess: (userId: string) => Promise<void>;
}


// ============================================================================
// Component Props Interfaces
// ============================================================================

/**
 * Props for the Whiteboard component
 */
export interface WhiteboardProps {
  roomId: string;
  onStateChange?: (snapshot: TLStoreSnapshot) => void;
  initialSnapshot?: TLStoreSnapshot;
  readOnly?: boolean;
}

/**
 * Props for the CollaborativeNotes component
 */
export interface CollaborativeNotesProps {
  roomId: string;
  onContentChange?: (content: JSONContent) => void;
  initialContent?: JSONContent;
  readOnly?: boolean;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Request body for saving collaboration state
 */
export interface SaveCollaborationRequest {
  whiteboardSnapshot?: TLStoreSnapshot;
  notesContent?: JSONContent;
}

/**
 * Response body for loading collaboration state
 */
export interface GetCollaborationResponse {
  whiteboardSnapshot?: TLStoreSnapshot;
  notesContent?: JSONContent;
}

/**
 * Request body for updating room permissions
 */
export interface UpdatePermissionsRequest {
  whiteboardPermission?: PermissionLevel;
  notesPermission?: PermissionLevel;
  whiteboardAllowedUsers?: string[];
  notesAllowedUsers?: string[];
}

// ============================================================================
// Message Serialization Utilities
// ============================================================================

/**
 * Error thrown when message validation fails
 */
export class MessageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MessageValidationError';
  }
}

/**
 * Validate that a message has the required structure for its type
 */
export function validateMessage(message: unknown): message is CollaborationMessage {
  if (!message || typeof message !== 'object') {
    return false;
  }

  const msg = message as Record<string, unknown>;
  
  if (!msg.type || typeof msg.type !== 'string') {
    return false;
  }

  switch (msg.type) {
    case 'whiteboard':
      return validateWhiteboardMessage(msg);
    case 'notes':
      return validateNotesMessage(msg);
    case 'presence':
      return validatePresenceMessage(msg);
    case 'permission':
      return validatePermissionMessage(msg);
    case 'save-status':
      return validateSaveStatusMessage(msg);
    default:
      return false;
  }
}

/**
 * Validate whiteboard message structure
 */
function validateWhiteboardMessage(msg: Record<string, unknown>): boolean {
  if (!msg.action || typeof msg.action !== 'string') {
    return false;
  }
  if (!['update', 'sync-request', 'sync-response'].includes(msg.action as string)) {
    return false;
  }
  if (!msg.payload || typeof msg.payload !== 'object') {
    return false;
  }
  const payload = msg.payload as Record<string, unknown>;
  if (typeof payload.senderId !== 'string' || typeof payload.timestamp !== 'number') {
    return false;
  }
  return true;
}

/**
 * Validate notes message structure
 */
function validateNotesMessage(msg: Record<string, unknown>): boolean {
  if (!msg.action || typeof msg.action !== 'string') {
    return false;
  }
  if (!['update', 'sync-request', 'sync-response'].includes(msg.action as string)) {
    return false;
  }
  if (!msg.payload || typeof msg.payload !== 'object') {
    return false;
  }
  const payload = msg.payload as Record<string, unknown>;
  if (typeof payload.senderId !== 'string' || typeof payload.timestamp !== 'number') {
    return false;
  }
  return true;
}

/**
 * Validate presence message structure
 */
function validatePresenceMessage(msg: Record<string, unknown>): boolean {
  if (!msg.payload || typeof msg.payload !== 'object') {
    return false;
  }
  const payload = msg.payload as Record<string, unknown>;
  if (typeof payload.participantId !== 'string') {
    return false;
  }
  if (typeof payload.participantName !== 'string') {
    return false;
  }
  if (payload.feature !== 'whiteboard' && payload.feature !== 'notes') {
    return false;
  }
  if (typeof payload.timestamp !== 'number') {
    return false;
  }
  return true;
}

/**
 * Validate permission message structure
 */
function validatePermissionMessage(msg: Record<string, unknown>): boolean {
  if (!msg.action || typeof msg.action !== 'string') {
    return false;
  }
  if (!['update', 'grant', 'revoke', 'grant-cohost', 'revoke-cohost'].includes(msg.action as string)) {
    return false;
  }
  if (!msg.payload || typeof msg.payload !== 'object') {
    return false;
  }
  const payload = msg.payload as Record<string, unknown>;
  if (payload.feature !== 'whiteboard' && payload.feature !== 'notes' && payload.feature !== 'cohost') {
    return false;
  }
  if (typeof payload.senderId !== 'string' || typeof payload.timestamp !== 'number') {
    return false;
  }
  return true;
}

/**
 * Validate save status message structure
 */
function validateSaveStatusMessage(msg: Record<string, unknown>): boolean {
  if (!msg.payload || typeof msg.payload !== 'object') {
    return false;
  }
  const payload = msg.payload as Record<string, unknown>;
  if (payload.feature !== 'whiteboard' && payload.feature !== 'notes') {
    return false;
  }
  if (payload.status !== 'saving' && payload.status !== 'saved' && payload.status !== 'error') {
    return false;
  }
  if (typeof payload.senderName !== 'string' || typeof payload.senderId !== 'string' || typeof payload.timestamp !== 'number') {
    return false;
  }
  return true;
}

/**
 * Serialize a collaboration message to Uint8Array for data channel transmission
 * 
 * Requirements: 6.1, 6.2, 6.3
 */
export function serializeMessage(message: CollaborationMessage): Uint8Array {
  const jsonString = JSON.stringify(message);
  return new TextEncoder().encode(jsonString);
}

/**
 * Deserialize a Uint8Array from data channel to a collaboration message
 * Validates the message structure before returning
 * 
 * Requirements: 6.1, 6.2, 6.3
 * @throws {MessageValidationError} if the message is invalid
 */
export function deserializeMessage(data: Uint8Array): CollaborationMessage {
  const jsonString = new TextDecoder().decode(data);
  const parsed = JSON.parse(jsonString);
  
  if (!validateMessage(parsed)) {
    throw new MessageValidationError('Invalid collaboration message structure');
  }
  
  return parsed;
}

/**
 * Route a collaboration message to the appropriate handler
 * 
 * Requirements: 6.3
 */
export function routeMessage(
  message: CollaborationMessage,
  handlers: {
    onWhiteboard?: (msg: WhiteboardSyncMessage) => void;
    onNotes?: (msg: NotesSyncMessage) => void;
    onPresence?: (msg: PresenceMessage) => void;
    onPermission?: (msg: PermissionUpdateMessage) => void;
    onSaveStatus?: (msg: SaveStatusMessage) => void;
  }
): void {
  switch (message.type) {
    case 'whiteboard':
      handlers.onWhiteboard?.(message);
      break;
    case 'notes':
      handlers.onNotes?.(message);
      break;
    case 'presence':
      handlers.onPresence?.(message);
      break;
    case 'permission':
      handlers.onPermission?.(message);
      break;
    case 'save-status':
      handlers.onSaveStatus?.(message);
      break;
  }
}

// ============================================================================
// Conflict Resolution (Requirement: 6.4)
// ============================================================================

/**
 * Represents a timestamped record for conflict resolution
 */
export interface TimestampedRecord {
  id: string;
  timestamp: number;
  record: TLRecord;
}

/**
 * Tracks the last update timestamp for each record
 */
export class ConflictResolver {
  private recordTimestamps: Map<string, number> = new Map();

  /**
   * Check if an incoming update should be applied based on timestamp
   * Uses last-write-wins strategy: only apply if incoming timestamp is newer
   * 
   * @param recordId - The ID of the record being updated
   * @param incomingTimestamp - The timestamp of the incoming update
   * @returns true if the update should be applied, false if it should be rejected
   */
  shouldApplyUpdate(recordId: string, incomingTimestamp: number): boolean {
    const existingTimestamp = this.recordTimestamps.get(recordId);
    
    // If no existing timestamp, always apply
    if (existingTimestamp === undefined) {
      return true;
    }
    
    // Apply only if incoming timestamp is newer (last-write-wins)
    return incomingTimestamp > existingTimestamp;
  }

  /**
   * Record that an update was applied for a record
   * 
   * @param recordId - The ID of the record that was updated
   * @param timestamp - The timestamp of the applied update
   */
  recordUpdate(recordId: string, timestamp: number): void {
    const existingTimestamp = this.recordTimestamps.get(recordId);
    
    // Only update if this is a newer timestamp
    if (existingTimestamp === undefined || timestamp > existingTimestamp) {
      this.recordTimestamps.set(recordId, timestamp);
    }
  }

  /**
   * Get the last known timestamp for a record
   * 
   * @param recordId - The ID of the record
   * @returns The timestamp or undefined if not tracked
   */
  getTimestamp(recordId: string): number | undefined {
    return this.recordTimestamps.get(recordId);
  }

  /**
   * Clear all tracked timestamps (e.g., when loading a new snapshot)
   */
  clear(): void {
    this.recordTimestamps.clear();
  }

  /**
   * Remove tracking for a specific record
   * 
   * @param recordId - The ID of the record to remove
   */
  removeRecord(recordId: string): void {
    this.recordTimestamps.delete(recordId);
  }
}

/**
 * Resolve conflicts between two concurrent whiteboard operations
 * Returns the operation that should win based on timestamp (last-write-wins)
 * 
 * Requirement: 6.4
 * 
 * @param operation1 - First operation with timestamp
 * @param operation2 - Second operation with timestamp
 * @returns The winning operation (the one with the later timestamp)
 */
export function resolveWhiteboardConflict<T extends { timestamp: number }>(
  operation1: T,
  operation2: T
): T {
  // Last-write-wins: return the operation with the later timestamp
  return operation1.timestamp >= operation2.timestamp ? operation1 : operation2;
}

/**
 * Filter records that should be applied based on conflict resolution
 * 
 * @param records - Array of records with their timestamps
 * @param resolver - The conflict resolver instance
 * @returns Array of records that should be applied
 */
export function filterConflictingRecords(
  records: TimestampedRecord[],
  resolver: ConflictResolver
): TLRecord[] {
  const result: TLRecord[] = [];
  
  for (const { id, timestamp, record } of records) {
    if (resolver.shouldApplyUpdate(id, timestamp)) {
      result.push(record);
      resolver.recordUpdate(id, timestamp);
    }
  }
  
  return result;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for WhiteboardSyncMessage
 */
export function isWhiteboardMessage(message: CollaborationMessage): message is WhiteboardSyncMessage {
  return message.type === 'whiteboard';
}

/**
 * Type guard for NotesSyncMessage
 */
export function isNotesMessage(message: CollaborationMessage): message is NotesSyncMessage {
  return message.type === 'notes';
}

/**
 * Type guard for PresenceMessage
 */
export function isPresenceMessage(message: CollaborationMessage): message is PresenceMessage {
  return message.type === 'presence';
}

/**
 * Type guard for PermissionUpdateMessage
 */
export function isPermissionMessage(message: CollaborationMessage): message is PermissionUpdateMessage {
  return message.type === 'permission';
}

/**
 * Type guard for SaveStatusMessage
 */
export function isSaveStatusMessage(message: CollaborationMessage): message is SaveStatusMessage {
  return message.type === 'save-status';
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Feature type for collaboration features
 */
export type CollaborationFeature = 'whiteboard' | 'notes';

/**
 * Sync action types
 */
export type SyncAction = 'update' | 'sync-request' | 'sync-response';

/**
 * Permission action types
 */
export type PermissionAction = 'update' | 'grant' | 'revoke';

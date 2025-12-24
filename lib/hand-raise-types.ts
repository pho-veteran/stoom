/**
 * Hand Raise Types for Meeting Participant Management
 * 
 * This module defines all message types and interfaces used for the hand raise
 * feature in real-time meetings via LiveKit data channels.
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * Hand raise state for a single participant
 */
export interface HandRaiseState {
  participantId: string;
  participantName: string;
  raisedAt: number; // Unix timestamp in milliseconds
}

/**
 * Hand raise action types
 */
export type HandRaiseAction = 'raise' | 'lower' | 'lower-all' | 'sync-request' | 'sync-response';

/**
 * Hand raise message for LiveKit data channel
 */
export interface HandRaiseMessage {
  type: 'hand-raise';
  action: HandRaiseAction;
  payload: {
    participantId: string;
    participantName?: string;
    timestamp: number;
    targetParticipantId?: string; // For host lowering specific participant
    senderId: string;
    handRaiseStates?: HandRaiseState[]; // For sync-response action
  };
}

// ============================================================================
// Message Validation
// ============================================================================

/**
 * Error thrown when hand raise message validation fails
 */
export class HandRaiseValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HandRaiseValidationError';
  }
}

/**
 * Validate that a message has the required structure for a hand raise message
 * 
 * @param message - The message to validate
 * @returns true if the message is a valid HandRaiseMessage
 */
export function validateHandRaiseMessage(message: unknown): message is HandRaiseMessage {
  if (!message || typeof message !== 'object') {
    return false;
  }

  const msg = message as Record<string, unknown>;
  
  // Validate type field
  if (msg.type !== 'hand-raise') {
    return false;
  }

  // Validate action field
  if (!msg.action || typeof msg.action !== 'string') {
    return false;
  }
  if (!['raise', 'lower', 'lower-all', 'sync-request', 'sync-response'].includes(msg.action as string)) {
    return false;
  }

  // Validate payload
  if (!msg.payload || typeof msg.payload !== 'object') {
    return false;
  }

  const payload = msg.payload as Record<string, unknown>;
  
  // Required fields
  if (typeof payload.participantId !== 'string') {
    return false;
  }
  if (typeof payload.timestamp !== 'number') {
    return false;
  }
  if (typeof payload.senderId !== 'string') {
    return false;
  }

  // Optional fields - validate if present
  if (payload.participantName !== undefined && typeof payload.participantName !== 'string') {
    return false;
  }
  if (payload.targetParticipantId !== undefined && typeof payload.targetParticipantId !== 'string') {
    return false;
  }

  return true;
}

// ============================================================================
// Serialization/Deserialization
// ============================================================================

/**
 * Serialize a hand raise message to Uint8Array for data channel transmission
 * 
 * @param message - The hand raise message to serialize
 * @returns Uint8Array representation of the message
 */
export function serializeHandRaiseMessage(message: HandRaiseMessage): Uint8Array {
  const jsonString = JSON.stringify(message);
  return new TextEncoder().encode(jsonString);
}

/**
 * Deserialize a Uint8Array from data channel to a hand raise message
 * Validates the message structure before returning
 * 
 * @param data - The Uint8Array data to deserialize
 * @returns The deserialized and validated HandRaiseMessage
 * @throws {HandRaiseValidationError} if the message is invalid
 */
export function deserializeHandRaiseMessage(data: Uint8Array): HandRaiseMessage {
  try {
    const jsonString = new TextDecoder().decode(data);
    const parsed = JSON.parse(jsonString);
    
    if (!validateHandRaiseMessage(parsed)) {
      throw new HandRaiseValidationError('Invalid hand raise message structure');
    }
    
    return parsed;
  } catch (error) {
    if (error instanceof HandRaiseValidationError) {
      throw error;
    }
    throw new HandRaiseValidationError(
      `Failed to deserialize hand raise message: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if a message is a hand raise message
 * 
 * @param message - The message to check
 * @returns true if the message is a HandRaiseMessage
 */
export function isHandRaiseMessage(message: unknown): message is HandRaiseMessage {
  return validateHandRaiseMessage(message);
}

/**
 * Type guard to check if an action is a raise action
 * 
 * @param action - The action to check
 * @returns true if the action is 'raise'
 */
export function isRaiseAction(action: HandRaiseAction): action is 'raise' {
  return action === 'raise';
}

/**
 * Type guard to check if an action is a lower action
 * 
 * @param action - The action to check
 * @returns true if the action is 'lower'
 */
export function isLowerAction(action: HandRaiseAction): action is 'lower' {
  return action === 'lower';
}

/**
 * Type guard to check if an action is a lower-all action
 * 
 * @param action - The action to check
 * @returns true if the action is 'lower-all'
 */
export function isLowerAllAction(action: HandRaiseAction): action is 'lower-all' {
  return action === 'lower-all';
}

// ============================================================================
// Message Factory Functions
// ============================================================================

/**
 * Create a raise hand message
 * 
 * @param participantId - The ID of the participant raising their hand
 * @param participantName - The name of the participant
 * @param senderId - The ID of the sender (should match participantId)
 * @returns A HandRaiseMessage for raising a hand
 */
export function createRaiseHandMessage(
  participantId: string,
  participantName: string,
  senderId: string
): HandRaiseMessage {
  return {
    type: 'hand-raise',
    action: 'raise',
    payload: {
      participantId,
      participantName,
      timestamp: Date.now(),
      senderId,
    },
  };
}

/**
 * Create a lower hand message (self-initiated)
 * 
 * @param participantId - The ID of the participant lowering their hand
 * @param senderId - The ID of the sender (should match participantId)
 * @returns A HandRaiseMessage for lowering a hand
 */
export function createLowerHandMessage(
  participantId: string,
  senderId: string
): HandRaiseMessage {
  return {
    type: 'hand-raise',
    action: 'lower',
    payload: {
      participantId,
      timestamp: Date.now(),
      senderId,
    },
  };
}

/**
 * Create a lower hand message (host-initiated)
 * 
 * @param targetParticipantId - The ID of the participant whose hand is being lowered
 * @param senderId - The ID of the host/co-host lowering the hand
 * @returns A HandRaiseMessage for host lowering a participant's hand
 */
export function createHostLowerHandMessage(
  targetParticipantId: string,
  senderId: string
): HandRaiseMessage {
  return {
    type: 'hand-raise',
    action: 'lower',
    payload: {
      participantId: targetParticipantId,
      targetParticipantId,
      timestamp: Date.now(),
      senderId,
    },
  };
}

/**
 * Create a lower all hands message
 * 
 * @param senderId - The ID of the host/co-host lowering all hands
 * @returns A HandRaiseMessage for lowering all hands
 */
export function createLowerAllHandsMessage(senderId: string): HandRaiseMessage {
  return {
    type: 'hand-raise',
    action: 'lower-all',
    payload: {
      participantId: senderId,
      timestamp: Date.now(),
      senderId,
    },
  };
}

/**
 * Create a sync request message (sent when joining/reconnecting)
 * 
 * @param senderId - The ID of the participant requesting sync
 * @returns A HandRaiseMessage for requesting current state
 */
export function createSyncRequestMessage(senderId: string): HandRaiseMessage {
  return {
    type: 'hand-raise',
    action: 'sync-request',
    payload: {
      participantId: senderId,
      timestamp: Date.now(),
      senderId,
    },
  };
}

/**
 * Create a sync response message (sent in response to sync-request)
 * 
 * @param senderId - The ID of the participant responding
 * @param handRaiseStates - The current hand raise states to sync
 * @returns A HandRaiseMessage containing current state
 */
export function createSyncResponseMessage(
  senderId: string,
  handRaiseStates: HandRaiseState[]
): HandRaiseMessage {
  return {
    type: 'hand-raise',
    action: 'sync-response',
    payload: {
      participantId: senderId,
      timestamp: Date.now(),
      senderId,
      handRaiseStates,
    },
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if a hand raise message is from a specific sender
 * 
 * @param message - The hand raise message
 * @param senderId - The sender ID to check
 * @returns true if the message is from the specified sender
 */
export function isMessageFromSender(message: HandRaiseMessage, senderId: string): boolean {
  return message.payload.senderId === senderId;
}

/**
 * Check if a hand raise message targets a specific participant
 * 
 * @param message - The hand raise message
 * @param participantId - The participant ID to check
 * @returns true if the message targets the specified participant
 */
export function isMessageForParticipant(message: HandRaiseMessage, participantId: string): boolean {
  return message.payload.participantId === participantId;
}

/**
 * Check if a hand raise message is a host-initiated lower action
 * 
 * @param message - The hand raise message
 * @returns true if the message is a host lowering someone else's hand
 */
export function isHostLowerAction(message: HandRaiseMessage): boolean {
  return (
    message.action === 'lower' &&
    message.payload.targetParticipantId !== undefined &&
    message.payload.senderId !== message.payload.participantId
  );
}

"use client";

/**
 * useCollaborationPermissions Hook
 * 
 * Provides permission state management for whiteboard and notes collaboration.
 * Handles grant/revoke access functions for hosts/co-hosts and syncs permission changes
 * via data channel. Persists permissions to database.
 */

import { useCallback, useState, useEffect, useRef } from "react";
import { Room } from "livekit-client";
import axios from "axios";
import {
  serializeMessage,
  type CollaborationPermissions,
  type PermissionUpdateMessage,
  type UserRole,
  type PermissionLevel,
  DEFAULT_PERMISSIONS,
} from "../lib/collaboration-types";
import { 
  canUserEdit, 
  canUserView, 
  getUserRole, 
  canManagePermissions, 
  canEndMeeting,
  canManageCoHosts,
} from "../lib/collaboration-permissions";

/**
 * Data channel topic for collaboration messages
 */
const COLLABORATION_TOPIC = "collaboration";

/**
 * Options for the useCollaborationPermissions hook
 */
export interface UseCollaborationPermissionsOptions {
  roomId: string;
  userId: string;
  isHost: boolean;
  initialPermissions?: CollaborationPermissions;
}

/**
 * Extended return type that includes the permission update handler
 */
export interface UseCollaborationPermissionsReturnExtended {
  permissions: CollaborationPermissions;
  userRole: UserRole;
  isLoading: boolean;
  canEditWhiteboard: boolean;
  canEditNotes: boolean;
  canViewWhiteboard: boolean;
  canViewNotes: boolean;
  canManagePermissions: boolean;
  canEndMeeting: boolean;
  canManageCoHosts: boolean;
  updatePermissions: (permissions: Partial<CollaborationPermissions>) => Promise<void>;
  grantWhiteboardAccess: (userId: string) => Promise<void>;
  revokeWhiteboardAccess: (userId: string) => Promise<void>;
  grantNotesAccess: (userId: string) => Promise<void>;
  revokeNotesAccess: (userId: string) => Promise<void>;
  grantCoHost: (userId: string) => Promise<void>;
  revokeCoHost: (userId: string) => Promise<void>;
  handlePermissionUpdate: (message: PermissionUpdateMessage) => void;
  refreshPermissions: () => Promise<void>;
}

export function useCollaborationPermissions(
  room: Room | null,
  options: UseCollaborationPermissionsOptions
): UseCollaborationPermissionsReturnExtended {
  const { roomId, userId, isHost, initialPermissions } = options;

  // Use a function initializer to avoid re-creating on every render
  const [permissions, setPermissions] = useState<CollaborationPermissions>(
    () => initialPermissions ?? DEFAULT_PERMISSIONS
  );
  const [isLoading, setIsLoading] = useState(true);
  const loadedRef = useRef(false);

  /**
   * Fetch permissions from database
   */
  const fetchPermissionsFromDb = useCallback(async () => {
    if (!roomId) return;

    try {
      // Load permissions and co-hosts in parallel
      const [permResponse, coHostResponse] = await Promise.all([
        axios.get(`/api/room/${roomId}/permissions`),
        axios.get(`/api/room/${roomId}/cohost`),
      ]);

      const { permissions: dbPerms } = permResponse.data;
      const { coHosts } = coHostResponse.data;

      setPermissions((prev) => ({
        ...prev,
        whiteboard: (dbPerms?.whiteboardPermission as PermissionLevel) || prev.whiteboard,
        notes: (dbPerms?.notesPermission as PermissionLevel) || prev.notes,
        whiteboardAllowedUsers: dbPerms?.whiteboardAllowedUsers || prev.whiteboardAllowedUsers,
        notesAllowedUsers: dbPerms?.notesAllowedUsers || prev.notesAllowedUsers,
        coHosts: coHosts || prev.coHosts,
      }));
    } catch (error) {
      console.error("Failed to load permissions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  /**
   * Load permissions from database on mount (only once)
   */
  useEffect(() => {
    if (loadedRef.current || !roomId) return;
    loadedRef.current = true;

    fetchPermissionsFromDb();
  }, [roomId, fetchPermissionsFromDb]);

  /**
   * Save permissions to database
   */
  const savePermissionsToDb = useCallback(
    async (newPerms: Partial<CollaborationPermissions>) => {
      if (!roomId) return;

      try {
        await axios.patch(`/api/room/${roomId}/permissions`, {
          whiteboardPermission: newPerms.whiteboard,
          notesPermission: newPerms.notes,
          whiteboardAllowedUsers: newPerms.whiteboardAllowedUsers,
          notesAllowedUsers: newPerms.notesAllowedUsers,
        });
      } catch (error) {
        console.error("Failed to save permissions:", error);
      }
    },
    [roomId]
  );

  /**
   * Broadcast a permission message to all participants
   */
  const broadcastPermissionMessage = useCallback(
    async (message: PermissionUpdateMessage) => {
      if (!room) return;

      try {
        const data = serializeMessage(message);
        await room.localParticipant.publishData(data, {
          reliable: true,
          topic: COLLABORATION_TOPIC,
        });
      } catch (error) {
        console.error("Failed to broadcast permission message:", error);
      }
    },
    [room]
  );

  // Compute if user can manage permissions (host or co-host)
  const userCanManagePermissions = canManagePermissions(userId, isHost, permissions.coHosts);

  /**
   * Update permissions (host or co-host)
   */
  const updatePermissions = useCallback(
    async (newPermissions: Partial<CollaborationPermissions>) => {
      if (!userCanManagePermissions) {
        console.warn("Only hosts and co-hosts can update permissions");
        return;
      }

      // Update local state
      setPermissions((prev) => ({
        ...prev,
        ...newPermissions,
      }));

      // Broadcast permission update for whiteboard if changed
      if (newPermissions.whiteboard !== undefined) {
        const message: PermissionUpdateMessage = {
          type: "permission",
          action: "update",
          payload: {
            feature: "whiteboard",
            permissionLevel: newPermissions.whiteboard,
            senderId: userId,
            timestamp: Date.now(),
          },
        };
        await broadcastPermissionMessage(message);
      }

      // Broadcast permission update for notes if changed
      if (newPermissions.notes !== undefined) {
        const message: PermissionUpdateMessage = {
          type: "permission",
          action: "update",
          payload: {
            feature: "notes",
            permissionLevel: newPermissions.notes,
            senderId: userId,
            timestamp: Date.now(),
          },
        };
        await broadcastPermissionMessage(message);
      }

      // Persist to database
      await savePermissionsToDb(newPermissions);
    },
    [userCanManagePermissions, userId, broadcastPermissionMessage, savePermissionsToDb]
  );

  /**
   * Grant whiteboard access to a user (host or co-host)
   */
  const grantWhiteboardAccess = useCallback(
    async (targetUserId: string) => {
      if (!userCanManagePermissions) {
        console.warn("Only hosts and co-hosts can grant whiteboard access");
        return;
      }

      // Calculate new list
      const newAllowed = permissions.whiteboardAllowedUsers.includes(targetUserId)
        ? permissions.whiteboardAllowedUsers
        : [...permissions.whiteboardAllowedUsers, targetUserId];

      // Update local state
      setPermissions((prev) => ({
        ...prev,
        whiteboardAllowedUsers: newAllowed,
      }));

      // Save to DB first
      await savePermissionsToDb({ whiteboardAllowedUsers: newAllowed });

      // Broadcast grant message
      const message: PermissionUpdateMessage = {
        type: "permission",
        action: "grant",
        payload: {
          feature: "whiteboard",
          targetUserId,
          senderId: userId,
          timestamp: Date.now(),
        },
      };
      await broadcastPermissionMessage(message);
    },
    [userCanManagePermissions, userId, permissions.whiteboardAllowedUsers, broadcastPermissionMessage, savePermissionsToDb]
  );

  /**
   * Revoke whiteboard access from a user (host or co-host)
   */
  const revokeWhiteboardAccess = useCallback(
    async (targetUserId: string) => {
      if (!userCanManagePermissions) {
        console.warn("Only hosts and co-hosts can revoke whiteboard access");
        return;
      }

      // Calculate new list
      const newAllowed = permissions.whiteboardAllowedUsers.filter((id) => id !== targetUserId);

      // Update local state
      setPermissions((prev) => ({
        ...prev,
        whiteboardAllowedUsers: newAllowed,
      }));

      // Save to DB first
      await savePermissionsToDb({ whiteboardAllowedUsers: newAllowed });

      // Broadcast revoke message
      const message: PermissionUpdateMessage = {
        type: "permission",
        action: "revoke",
        payload: {
          feature: "whiteboard",
          targetUserId,
          senderId: userId,
          timestamp: Date.now(),
        },
      };
      await broadcastPermissionMessage(message);
    },
    [userCanManagePermissions, userId, permissions.whiteboardAllowedUsers, broadcastPermissionMessage, savePermissionsToDb]
  );

  /**
   * Grant notes access to a user (host or co-host)
   */
  const grantNotesAccess = useCallback(
    async (targetUserId: string) => {
      if (!userCanManagePermissions) {
        console.warn("Only hosts and co-hosts can grant notes access");
        return;
      }

      // Update local state - add user to allowed list if not already present
      setPermissions((prev) => {
        if (prev.notesAllowedUsers.includes(targetUserId)) {
          return prev;
        }
        return {
          ...prev,
          notesAllowedUsers: [...prev.notesAllowedUsers, targetUserId],
        };
      });

      // Broadcast grant message
      const message: PermissionUpdateMessage = {
        type: "permission",
        action: "grant",
        payload: {
          feature: "notes",
          targetUserId,
          senderId: userId,
          timestamp: Date.now(),
        },
      };
      await broadcastPermissionMessage(message);
    },
    [userCanManagePermissions, userId, broadcastPermissionMessage]
  );

  /**
   * Revoke notes access from a user (host or co-host)
   */
  const revokeNotesAccess = useCallback(
    async (targetUserId: string) => {
      if (!userCanManagePermissions) {
        console.warn("Only hosts and co-hosts can revoke notes access");
        return;
      }

      // Update local state - remove user from allowed list
      setPermissions((prev) => ({
        ...prev,
        notesAllowedUsers: prev.notesAllowedUsers.filter(
          (id) => id !== targetUserId
        ),
      }));

      // Broadcast revoke message
      const message: PermissionUpdateMessage = {
        type: "permission",
        action: "revoke",
        payload: {
          feature: "notes",
          targetUserId,
          senderId: userId,
          timestamp: Date.now(),
        },
      };
      await broadcastPermissionMessage(message);
    },
    [userCanManagePermissions, userId, broadcastPermissionMessage]
  );

  /**
   * Grant co-host privileges to a user (host-only)
   */
  const grantCoHost = useCallback(
    async (targetUserId: string) => {
      if (!isHost) {
        console.warn("Only hosts can grant co-host privileges");
        return;
      }

      // Update local state
      setPermissions((prev) => {
        if (prev.coHosts.includes(targetUserId)) {
          return prev;
        }
        return {
          ...prev,
          coHosts: [...prev.coHosts, targetUserId],
        };
      });

      // Broadcast grant message
      const message: PermissionUpdateMessage = {
        type: "permission",
        action: "grant-cohost",
        payload: {
          feature: "cohost",
          targetUserId,
          senderId: userId,
          timestamp: Date.now(),
        },
      };
      await broadcastPermissionMessage(message);

      // Save to DB via cohost API
      try {
        await axios.post(`/api/room/${roomId}/cohost`, { targetUserId });
      } catch (error) {
        console.error("Failed to save co-host:", error);
      }
    },
    [isHost, userId, roomId, broadcastPermissionMessage]
  );

  /**
   * Revoke co-host privileges from a user (host-only)
   */
  const revokeCoHost = useCallback(
    async (targetUserId: string) => {
      if (!isHost) {
        console.warn("Only hosts can revoke co-host privileges");
        return;
      }

      // Update local state
      setPermissions((prev) => ({
        ...prev,
        coHosts: prev.coHosts.filter((id) => id !== targetUserId),
      }));

      // Broadcast revoke message
      const message: PermissionUpdateMessage = {
        type: "permission",
        action: "revoke-cohost",
        payload: {
          feature: "cohost",
          targetUserId,
          senderId: userId,
          timestamp: Date.now(),
        },
      };
      await broadcastPermissionMessage(message);

      // Save to DB via cohost API
      try {
        await axios.delete(`/api/room/${roomId}/cohost`, { data: { targetUserId } });
      } catch (error) {
        console.error("Failed to revoke co-host:", error);
      }
    },
    [isHost, userId, roomId, broadcastPermissionMessage]
  );

  /**
   * Handle incoming permission update messages
   * Updates local state from the broadcast message (no DB fetch needed)
   */
  const handlePermissionUpdate = useCallback(
    (message: PermissionUpdateMessage) => {
      const { action, payload } = message;
      const { feature, permissionLevel, targetUserId } = payload;

      // Update local state from the broadcast message
      setPermissions((prev) => {
        switch (action) {
          case "update":
            if (permissionLevel !== undefined && (feature === "whiteboard" || feature === "notes")) {
              return {
                ...prev,
                [feature]: permissionLevel,
              };
            }
            return prev;

          case "grant":
            if (targetUserId !== undefined && (feature === "whiteboard" || feature === "notes")) {
              const allowedUsersKey =
                feature === "whiteboard"
                  ? "whiteboardAllowedUsers"
                  : "notesAllowedUsers";
              const currentAllowed = prev[allowedUsersKey];
              if (currentAllowed.includes(targetUserId)) {
                return prev;
              }
              return {
                ...prev,
                [allowedUsersKey]: [...currentAllowed, targetUserId],
              };
            }
            return prev;

          case "revoke":
            if (targetUserId !== undefined && (feature === "whiteboard" || feature === "notes")) {
              const allowedUsersKey =
                feature === "whiteboard"
                  ? "whiteboardAllowedUsers"
                  : "notesAllowedUsers";
              return {
                ...prev,
                [allowedUsersKey]: prev[allowedUsersKey].filter(
                  (id) => id !== targetUserId
                ),
              };
            }
            return prev;

          case "grant-cohost":
            if (targetUserId !== undefined) {
              if (prev.coHosts.includes(targetUserId)) {
                return prev;
              }
              return {
                ...prev,
                coHosts: [...prev.coHosts, targetUserId],
              };
            }
            return prev;

          case "revoke-cohost":
            if (targetUserId !== undefined) {
              return {
                ...prev,
                coHosts: prev.coHosts.filter((id) => id !== targetUserId),
              };
            }
            return prev;

          default:
            return prev;
        }
      });
    },
    []
  );

  // Compute derived permission states
  const userRole = getUserRole(userId, isHost, permissions.coHosts);

  // While loading, default to restrictive permissions (false for edit)
  // This prevents showing edit UI before we know the actual permissions
  const canEditWhiteboard = isLoading
    ? false
    : canUserEdit(
        userId,
        isHost,
        permissions.whiteboard,
        permissions.whiteboardAllowedUsers,
        permissions.coHosts
      );

  const canEditNotes = isLoading
    ? false
    : canUserEdit(
        userId,
        isHost,
        permissions.notes,
        permissions.notesAllowedUsers,
        permissions.coHosts
      );

  const canViewWhiteboard = canUserView();
  const canViewNotes = canUserView();
  const userCanEndMeeting = canEndMeeting(userId, isHost, permissions.coHosts);
  const userCanManageCoHosts = canManageCoHosts(isHost);

  return {
    permissions,
    userRole,
    isLoading,
    canEditWhiteboard,
    canEditNotes,
    canViewWhiteboard,
    canViewNotes,
    canManagePermissions: userCanManagePermissions,
    canEndMeeting: userCanEndMeeting,
    canManageCoHosts: userCanManageCoHosts,
    updatePermissions,
    grantWhiteboardAccess,
    revokeWhiteboardAccess,
    grantNotesAccess,
    revokeNotesAccess,
    grantCoHost,
    revokeCoHost,
    handlePermissionUpdate,
    refreshPermissions: fetchPermissionsFromDb,
  };
}

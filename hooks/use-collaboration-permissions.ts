"use client";

/**
 * useCollaborationPermissions Hook
 * 
 * Provides permission state management for whiteboard and notes collaboration.
 * Handles grant/revoke access functions for hosts/co-hosts and syncs permission changes
 * via data channel. Persists permissions to database.
 * 
 * Requirements: 8.6, 8.7
 */

import { useCallback, useState, useEffect } from "react";
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
  const [hasLoadedFromDb, setHasLoadedFromDb] = useState(false);

  /**
   * Load permissions from database on mount
   */
  useEffect(() => {
    if (hasLoadedFromDb || !roomId) return;

    const loadPermissions = async () => {
      try {
        // Load permissions
        const permResponse = await axios.get(`/api/room/${roomId}/permissions`);
        const { permissions: dbPerms } = permResponse.data;

        // Load co-hosts
        const coHostResponse = await axios.get(`/api/room/${roomId}/cohost`);
        const { coHosts } = coHostResponse.data;

        setPermissions((prev) => ({
          ...prev,
          whiteboard: (dbPerms?.whiteboardPermission as PermissionLevel) || prev.whiteboard,
          notes: (dbPerms?.notesPermission as PermissionLevel) || prev.notes,
          whiteboardAllowedUsers: dbPerms?.whiteboardAllowedUsers || prev.whiteboardAllowedUsers,
          notesAllowedUsers: dbPerms?.notesAllowedUsers || prev.notesAllowedUsers,
          coHosts: coHosts || prev.coHosts,
        }));
        setHasLoadedFromDb(true);
      } catch (error) {
        console.error("Failed to load permissions:", error);
        setHasLoadedFromDb(true); // Mark as loaded to prevent retry loop
      }
    };

    loadPermissions();
  }, [roomId, hasLoadedFromDb]);

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
   * Requirements: 8.1, 8.2
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
   * Requirements: 8.6
   */
  const grantWhiteboardAccess = useCallback(
    async (targetUserId: string) => {
      if (!userCanManagePermissions) {
        console.warn("Only hosts and co-hosts can grant whiteboard access");
        return;
      }

      // Update local state - add user to allowed list if not already present
      setPermissions((prev) => {
        if (prev.whiteboardAllowedUsers.includes(targetUserId)) {
          return prev;
        }
        return {
          ...prev,
          whiteboardAllowedUsers: [...prev.whiteboardAllowedUsers, targetUserId],
        };
      });

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

      // Save to DB - get updated list
      setPermissions((prev) => {
        const newAllowed = prev.whiteboardAllowedUsers.includes(targetUserId)
          ? prev.whiteboardAllowedUsers
          : [...prev.whiteboardAllowedUsers, targetUserId];
        savePermissionsToDb({ whiteboardAllowedUsers: newAllowed });
        return prev;
      });
    },
    [userCanManagePermissions, userId, broadcastPermissionMessage, savePermissionsToDb]
  );

  /**
   * Revoke whiteboard access from a user (host or co-host)
   * Requirements: 8.7
   */
  const revokeWhiteboardAccess = useCallback(
    async (targetUserId: string) => {
      if (!userCanManagePermissions) {
        console.warn("Only hosts and co-hosts can revoke whiteboard access");
        return;
      }

      // Update local state - remove user from allowed list
      setPermissions((prev) => ({
        ...prev,
        whiteboardAllowedUsers: prev.whiteboardAllowedUsers.filter(
          (id) => id !== targetUserId
        ),
      }));

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

      // Save to DB - get updated list
      setPermissions((prev) => {
        const newAllowed = prev.whiteboardAllowedUsers.filter((id) => id !== targetUserId);
        savePermissionsToDb({ whiteboardAllowedUsers: newAllowed });
        return prev;
      });
    },
    [userCanManagePermissions, userId, broadcastPermissionMessage, savePermissionsToDb]
  );

  /**
   * Grant notes access to a user (host or co-host)
   * Requirements: 8.6
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
   * Requirements: 8.7
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
   */
  const handlePermissionUpdate = useCallback(
    (message: PermissionUpdateMessage) => {
      const { action, payload } = message;
      const { feature, permissionLevel, targetUserId } = payload;

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
  
  const canEditWhiteboard = canUserEdit(
    userId,
    isHost,
    permissions.whiteboard,
    permissions.whiteboardAllowedUsers,
    permissions.coHosts
  );

  const canEditNotes = canUserEdit(
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
    // Expose handler for external use (e.g., from useCollaborationSync)
    handlePermissionUpdate,
  };
}

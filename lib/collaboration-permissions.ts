/**
 * Collaboration Permission Utilities
 * 
 * This module provides utility functions for checking user permissions
 * on collaborative features (whiteboard and notes).
 */

import type { PermissionLevel, UserRole } from './collaboration-types';

/**
 * Get the role of a user in a room
 * 
 * @param userId - The ID of the user to check
 * @param isHost - Whether the user is the room host
 * @param coHosts - Array of user IDs with co-host privileges
 * @returns The user's role
 */
export function getUserRole(
  userId: string,
  isHost: boolean,
  coHosts: string[]
): UserRole {
  if (isHost) return 'host';
  if (coHosts.includes(userId)) return 'co-host';
  return 'participant';
}

/**
 * Check if a user can manage permissions (host or co-host)
 * 
 * @param userId - The ID of the user to check
 * @param isHost - Whether the user is the room host
 * @param coHosts - Array of user IDs with co-host privileges
 * @returns true if the user can manage permissions
 */
export function canManagePermissions(
  userId: string,
  isHost: boolean,
  coHosts: string[]
): boolean {
  const role = getUserRole(userId, isHost, coHosts);
  return role === 'host' || role === 'co-host';
}

/**
 * Check if a user can end the meeting (host or co-host)
 * 
 * @param userId - The ID of the user to check
 * @param isHost - Whether the user is the room host
 * @param coHosts - Array of user IDs with co-host privileges
 * @returns true if the user can end the meeting
 */
export function canEndMeeting(
  userId: string,
  isHost: boolean,
  coHosts: string[]
): boolean {
  const role = getUserRole(userId, isHost, coHosts);
  return role === 'host' || role === 'co-host';
}

/**
 * Check if a user can manage co-hosts (host only)
 * 
 * @param isHost - Whether the user is the room host
 * @returns true if the user can manage co-hosts
 */
export function canManageCoHosts(isHost: boolean): boolean {
  return isHost;
}

/**
 * Check if a user can edit a collaborative feature
 * 
 * Permission rules:
 * - 'open': Everyone can edit
 * - 'restricted': Only host, co-hosts, and users in allowedUsers list can edit
 * 
 * @param userId - The ID of the user to check
 * @param isHost - Whether the user is the room host
 * @param permissionLevel - The permission level for the feature
 * @param allowedUsers - Array of user IDs with explicit access (for restricted mode)
 * @param coHosts - Array of user IDs with co-host privileges
 * @returns true if the user can edit, false otherwise
 */
export function canUserEdit(
  userId: string,
  isHost: boolean,
  permissionLevel: PermissionLevel,
  allowedUsers: string[],
  coHosts: string[] = []
): boolean {
  // Open permission means everyone can edit
  if (permissionLevel === 'open') {
    return true;
  }

  // Restricted permission: host and co-hosts always have access, others need to be in allowedUsers
  if (permissionLevel === 'restricted') {
    if (isHost || coHosts.includes(userId)) {
      return true;
    }
    return allowedUsers.includes(userId);
  }

  // Default to no access for unknown permission levels
  return false;
}

/**
 * Check if a user can view a collaborative feature
 * 
 * Permission rules:
 * - 'open' or 'restricted': Everyone can view
 * 
 * @param permissionLevel - The permission level for the feature
 * @returns true if the feature is visible, false otherwise
 */
export function canUserView(): boolean {
  // Open and restricted both allow viewing
  // Note: We removed the 'disabled' permission level, so all features are always viewable
  return true;
}

import { RoomServiceClient } from "livekit-server-sdk"

const livekitHost = process.env.LIVEKIT_URL || "http://localhost:7880"
const apiKey = process.env.LIVEKIT_API_KEY || "devkey"
const apiSecret = process.env.LIVEKIT_API_SECRET || "secret"

// Create RoomServiceClient for server-side LiveKit operations
export const roomService = new RoomServiceClient(livekitHost, apiKey, apiSecret)

/**
 * Check if a LiveKit room exists and has participants
 * Returns: { exists: boolean, numParticipants: number }
 */
export async function checkLiveKitRoom(roomName: string): Promise<{
  exists: boolean
  numParticipants: number
}> {
  try {
    const rooms = await roomService.listRooms([roomName])
    const room = rooms.find((r) => r.name === roomName)

    if (room) {
      return {
        exists: true,
        numParticipants: room.numParticipants,
      }
    }

    return { exists: false, numParticipants: 0 }
  } catch (error) {
    console.error("Error checking LiveKit room:", error)
    // If we can't reach LiveKit, assume room doesn't exist
    return { exists: false, numParticipants: 0 }
  }
}

/**
 * Delete a LiveKit room (force disconnect all participants)
 */
export async function deleteLiveKitRoom(roomName: string): Promise<boolean> {
  try {
    await roomService.deleteRoom(roomName)
    return true
  } catch (error) {
    console.error("Error deleting LiveKit room:", error)
    return false
  }
}

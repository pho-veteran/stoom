import axios from "axios";
import {
  Room,
  RoomOptions,
  VideoPresets,
} from "livekit-client";

export interface LiveKitConfig {
  url: string;
  token: string;
}

export const defaultRoomOptions: RoomOptions = {
  adaptiveStream: true,
  dynacast: true,
  videoCaptureDefaults: {
    resolution: VideoPresets.h720.resolution,
  },
  publishDefaults: {
    simulcast: true,
    videoSimulcastLayers: [VideoPresets.h180, VideoPresets.h360],
  },
};

export async function createRoom(options?: RoomOptions): Promise<Room> {
  const room = new Room(options || defaultRoomOptions);
  return room;
}

export async function fetchToken(roomName: string): Promise<string> {
  const response = await axios.post<{ token: string }>("/api/livekit/token", {
    roomName,
  });
  return response.data.token;
}

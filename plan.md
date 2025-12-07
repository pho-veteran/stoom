# LiveKit Meeting Features + Recording + Transcription Technology Stack

## Overview

This plan outlines the implementation of real-time meeting features, recording, and transcription for the Stoom platform using a **completely free, self-hosted** solution.

## Implementation Phases

### Phase 1: LiveKit Meeting Features (Prerequisites)
**Must be completed before Phase 2**

### Phase 2: Recording & Transcription
**Depends on Phase 1**

---

## Phase 1: LiveKit Meeting Features

### Technology: LiveKit (Self-Hosted)
- **Why:** Free when self-hosted, excellent WebRTC SFU, low latency, supports all meeting features
- **Features to Implement:**
  - Real-time audio/video streaming
  - Screen sharing
  - Chat messaging
  - Participant management
  - Room creation and joining
  - Mute/unmute controls
  - Camera on/off controls

### 1.1. LiveKit Server Setup
- Deploy LiveKit server with Docker
- Deploy coturn (TURN/STUN server) with Docker
- Configure LiveKit to use coturn for NAT traversal
- Set up API keys for authentication
- Configure room management

### 1.2. Audio/Video Streaming
- Connect to LiveKit room
- Publish local audio/video tracks
- Subscribe to remote participant tracks
- Display video feeds in UI with smart layout (Google Meet style)
- Handle track events (muted, unmuted, etc.)
- **Video Display Panel:** Add video feeds panel to toggle section
  - Toggle options: Screen Share, Whiteboard, Video Feeds
  - **Constraint:** Only 2 panels can be toggled at the same time
  - Smart video feed layout optimization:
    - 1 participant: Full screen
    - 2 participants: Side by side
    - 3-4 participants: Grid 2x2
    - 5-9 participants: Grid 3x3
    - 10+ participants: Grid with scroll, highlight active speaker
    - Auto-adjust layout when participants join/leave
    - Highlight active speaker (larger or highlighted border)

### 1.3. Screen Sharing
- Capture screen using `getDisplayMedia()`
- Publish screen share track to LiveKit
- Display screen share in Main Stage
- Handle screen share start/stop events
- **Constraint:** Only 1 person can perform screen share at the same time
  - When someone starts screen share, automatically stop any existing screen share
  - Notify other participants when screen share is taken over
  - Implement screen share lock/unlock mechanism

### 1.4. Chat Messaging
- Implement real-time chat using LiveKit DataChannel or separate WebSocket
- Send/receive chat messages
- Display messages in Chat Panel
- Store messages in database

### 1.5. Participant Management
- Track participant join/leave events
- Display participant list in sidebar
- Show speaking indicators (active speaker detection)
- Show mute/video status for each participant

### 1.6. Room Management
- Create rooms via API
- Join rooms with room code
- Handle room settings (password, mute on join, etc.)
- Track room state and participants

### 1.7. Meeting Constraints & Optimizations
- **Screen Share Constraint:** Only 1 person can screen share at a time
  - Implement screen share lock mechanism
  - Auto-stop existing screen share when new one starts
  - Notify participants of screen share changes
  
- **Panel Toggle Constraint:** Only 2 panels can be visible at the same time
  - Panels: Screen Share, Whiteboard, Video Feeds
  - When toggling a third panel, automatically hide one of the existing panels
  - Remember user preference for which panel to keep
  
- **Smart Video Feed Layout:** Google Meet-style optimization
  - Dynamic grid layout based on participant count:
    - 1 participant: Full screen (100% width/height)
    - 2 participants: Side by side (50% width each)
    - 3-4 participants: Grid 2x2 (50% width, 50% height each)
    - 5-9 participants: Grid 3x3 (33.33% width, 33.33% height each)
    - 10+ participants: Grid 4x4 with scroll (25% width, 25% height each)
  - Active speaker highlighting:
    - Active speaker gets larger size (1.2x scale) or highlighted border
    - Other participants slightly dimmed
    - Smooth transition when active speaker changes
  - Smooth transitions when participants join/leave
  - Responsive layout for different screen sizes (mobile, tablet, desktop)
  - Pin/unpin participant feature (optional enhancement)

## Phase 2: Recording & Transcription

### 2.1. Meeting Recording
**Technology: LiveKit Egress (Self-Hosted)**
- **Why:** Free when self-hosted, integrated with LiveKit, records audio/video directly from SFU
- **Implementation:** 
  - Deploy LiveKit server with Egress service
  - Use LiveKit Egress API to start/stop recording
  - Records composite video (all participants) or individual tracks
  - Outputs to S3-compatible storage or local filesystem
- **Cost:** Free (self-hosted)
- **Storage:** Local filesystem storage

### 2.2. Post-Processing Transcription
**Technology: OpenAI Whisper (Self-Hosted with Docker)**
- **Why:** Free, open-source, excellent accuracy, supports multiple languages
- **Implementation:**
  - Deploy Whisper API server using Docker (e.g., `ahmetoner/whisper-asr-webservice`)
  - After meeting ends, send recorded audio file to Whisper API
  - Get full transcript with timestamps and optional speaker diarization
  - Store in your `MeetingSession.transcript` field
- **Cost:** Free (self-hosted)
- **Model:** Whisper `small` model (good balance of speed and accuracy)

### 2.3. Architecture Flow

```
LiveKit Room (Self-Hosted)
    ↓
LiveKit Egress Service
    ↓
[Recording]
    ├─→ Audio/Video Recording → Local Filesystem Storage
    └─→ Meeting Ends → Trigger Post-Processing
         ↓
    Whisper API (Docker)
         ↓
    Transcript with Timestamps → Database → Gemini API (AI Insights)
```

## Infrastructure Setup

### Docker Compose Stack
- **Phase 1:** LiveKit Server, coturn (TURN/STUN server)
- **Phase 2:** LiveKit Egress service, Whisper API service (small model)
- All services can run on same server or distributed

### Resource Requirements
- **CPU:** Multi-core recommended for Whisper processing
- **GPU:** Optional but recommended for faster Whisper transcription (CUDA support)
- **RAM:** 4GB+ for Whisper (8GB+ for larger models)
- **Storage:** Depends on recording volume (audio files are ~1MB per minute)

## Implementation Files

### Phase 1: LiveKit Meeting Features

1. **`docker-compose.yml`** - Docker setup for LiveKit Server and coturn
2. **`lib/livekit-client.ts`** - LiveKit client SDK wrapper and connection management
3. **`app/api/livekit/token/route.ts`** - API route to generate LiveKit access tokens
4. **`app/api/rooms/create/route.ts`** - API route to create LiveKit rooms
5. **`hooks/use-livekit-room.ts`** - React hook for managing LiveKit room connection
6. **`hooks/use-participants.ts`** - React hook for managing participants
7. **`hooks/use-screen-share.ts`** - React hook for screen sharing functionality with lock mechanism
8. **`hooks/use-panel-toggle.ts`** - React hook for managing panel toggle state (max 2 panels)
9. **`components/room/video-track.tsx`** - Component to display video tracks
10. **`components/room/audio-track.tsx`** - Component to handle audio tracks
11. **`components/room/screen-share-view.tsx`** - Component for displaying screen share
12. **`components/room/video-feeds-view.tsx`** - Component for smart video feed layout (Google Meet style)
13. **`lib/video-layout.ts`** - Utility functions for calculating optimal video grid layout
14. **`components/room/participants-sidebar.tsx`** - Update to use real LiveKit participants
15. **`components/room/stage.tsx`** - Update to display real video feeds, screen share, and whiteboard with toggle constraints
16. **`components/room/chat-notes-panel.tsx`** - Update chat to use LiveKit DataChannel or WebSocket
17. **`components/room/floating-dock.tsx`** - Update controls to use LiveKit track controls
18. **`components/room/room-content.tsx`** - Update to integrate LiveKit room connection
19. **`app/api/screen-share/lock/route.ts`** - API route to manage screen share lock (optional, for server-side enforcement)

### Phase 2: Recording & Transcription

16. **`docker-compose.yml`** - Add Egress and Whisper services
17. **`lib/livekit-egress.ts`** - LiveKit Egress API client for starting/stopping recordings
18. **`app/api/recording/start/route.ts`** - API route to start recording via Egress
19. **`app/api/recording/stop/route.ts`** - API route to stop recording and trigger transcription
20. **`app/api/transcription/process/route.ts`** - API route to process recording with Whisper
21. **`lib/whisper-client.ts`** - Whisper API client wrapper
22. **`components/room/floating-dock.tsx`** - Update recording button to use Egress API
23. **`components/room/transcript-panel.tsx`** - Update to show "Processing..." state, then display transcript when ready

## Recommended Stack Summary

| Component | Technology | Cost | Quality |
|-----------|-----------|------|---------|
| Real-time Meetings | LiveKit (Self-Hosted) | Free | Excellent |
| Meeting Recording | LiveKit Egress (Self-Hosted) | Free | Excellent |
| Post-processing Transcription | OpenAI Whisper (Docker) | Free | Excellent |
| Storage | Local Filesystem | Free | Good |
| AI Processing | Google Gemini API | Free tier | Excellent |

## Integration with Existing Code

Your existing `MeetingSession.transcript` field (JSON array) will store:
```json
[
  {
    "speaker": "String",
    "text": "String", 
    "timestamp": Number,
    "isActive": Boolean
  }
]
```

Whisper can provide timestamps for each segment. Speaker diarization can be added using `pyannote.audio` if needed.

## Workflow

### Phase 1: Meeting Flow
1. User creates/joins room → Generate LiveKit access token
2. User connects to LiveKit room → Establish WebRTC connection (via coturn if needed)
3. User enables mic/camera → Publish tracks to room
4. Other participants join → Subscribe to their tracks
5. Video feeds displayed with smart layout (Google Meet style) based on participant count
6. User toggles panels (Screen Share, Whiteboard, Video Feeds) → Max 2 panels visible at once
7. User shares screen → Publish screen share track (if another user is sharing, their share stops automatically)
8. Users send chat messages → Broadcast via DataChannel/WebSocket
9. Active speaker detection → Highlight active speaker in video feeds
10. Meeting proceeds with real-time collaboration

### Phase 2: Recording & Transcription Flow
1. User clicks "Start Recording" → Call LiveKit Egress API to start recording
2. Meeting proceeds → Egress records audio/video to storage
3. User clicks "Stop Recording" → Call Egress API to stop, get recording file URL
4. Background job triggered → Send audio file to Whisper API
5. Whisper processes → Returns transcript with timestamps
6. Store transcript in database → Trigger Gemini API for AI insights
7. Transcript available in Transcript Panel and Recording Detail page

## Implementation Todos

### Phase 1: LiveKit Meeting Features (Priority)

1. **Setup LiveKit Server & coturn** - Create docker-compose.yml with LiveKit Server and coturn TURN/STUN server
2. **Install LiveKit SDK** - Add `livekit-client` and `livekit-server-sdk` npm packages
3. **Create Token API** - Create API route to generate LiveKit access tokens
4. **Create Room API** - Create API routes for room creation and management
5. **Implement LiveKit Client Hook** - Create React hook for connecting to LiveKit rooms
6. **Implement Participant Hook** - Create React hook for managing participants and tracks
7. **Implement Panel Toggle Hook** - Create React hook for managing panel toggle state (max 2 panels: Screen Share, Whiteboard, Video Feeds)
8. **Implement Video Layout Utility** - Create utility functions for calculating optimal video grid layout based on participant count
9. **Implement Video Feeds Component** - Create smart video feeds component with Google Meet-style layout
10. **Update Room Content** - Integrate LiveKit connection into RoomContent component
11. **Implement Video Display** - Create components to display video tracks from participants with smart layout
12. **Implement Audio Handling** - Handle audio tracks and mute/unmute functionality
13. **Implement Screen Share with Lock** - Add screen sharing functionality with LiveKit and enforce single screen share constraint
14. **Update Stage Component** - Display real video feeds, screen share, and whiteboard with toggle constraints (max 2 panels)
15. **Update Participants Sidebar** - Display real participants from LiveKit room
16. **Implement Chat** - Add real-time chat using LiveKit DataChannel or WebSocket
17. **Update Floating Dock** - Connect controls to LiveKit track controls, add video feeds toggle
18. **Add Environment Variables** - Add LiveKit server URL, API key, secret, and coturn configuration

### Phase 2: Recording & Transcription

16. **Add Egress to Docker** - Update docker-compose.yml with LiveKit Egress service
17. **Configure LiveKit Egress** - Configure LiveKit Egress service with local filesystem storage backend
18. **Implement Egress Client** - Create LiveKit Egress API client library for starting and stopping recordings
19. **Create Recording API Routes** - Create API routes for starting/stopping recordings via Egress API
20. **Add Whisper to Docker** - Add Whisper API service to docker-compose.yml
21. **Implement Whisper Client** - Create Whisper API client wrapper for sending audio files and receiving transcripts
22. **Create Transcription Processor** - Create background job/API route to process recordings with Whisper after meeting ends
23. **Update Transcript Panel** - Update TranscriptPanel to show processing state and display transcript when ready
24. **Update Floating Dock Recording** - Update FloatingDock recording button to use Egress API
25. **Setup Storage** - Configure local filesystem storage path for recordings
26. **Add Recording Environment Variables** - Add Egress and Whisper configuration to environment variables

## Environment Variables Required

### Phase 1: LiveKit Meeting Features
```env
# LiveKit Configuration
LIVEKIT_URL=ws://localhost:7880
LIVEKIT_WS_URL=ws://localhost:7880
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret

# coturn TURN/STUN Configuration
LIVEKIT_TURN_SERVER_URL=turn://localhost:3478
LIVEKIT_TURN_USERNAME=your-turn-username
LIVEKIT_TURN_PASSWORD=your-turn-password
COTURN_REALM=stoom.local
COTURN_USERNAME=your-turn-username
COTURN_PASSWORD=your-turn-password
```

### Phase 2: Recording & Transcription
```env
# Egress Configuration
LIVEKIT_EGRESS_ENABLED=true
LIVEKIT_EGRESS_STORAGE_TYPE=file
RECORDINGS_STORAGE_PATH=/recordings

# Whisper API Configuration
WHISPER_API_URL=http://localhost:9000
WHISPER_MODEL=small
```

## Next Steps

We will implement these features in phases:

**Phase 1:** LiveKit meeting features (audio, video, screen share, chat) - **MUST BE COMPLETED FIRST**

**Phase 2:** Recording and transcription features - **DEPENDS ON PHASE 1**

Starting with Phase 1, we'll set up the LiveKit server, then integrate the client SDK, and build out all meeting features before moving to recording and transcription.

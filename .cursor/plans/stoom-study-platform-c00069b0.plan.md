<!-- c00069b0-92b6-489d-b111-f1a53452596b b9fc131a-4459-4d4e-8aee-d3c311c056ce -->
# Stoom – Study Together Platform Implementation Plan

## Architecture Overview

**Frontend**: Vite + React 18 + TailwindCSS

**Backend**: Node.js + Express.js + Socket.io server

**Database**: MongoDB Atlas with Mongoose

**Real-time**: Socket.io for signaling/whiteboard/notes sync

**WebRTC**: Simple-peer for P2P video/audio

**Auth**: JWT-based authentication with bcryptjs

**AI**: OpenAI API (GPT-4 for summarization, Whisper for speech-to-text)

**Deployment**: Vercel/Netlify (frontend) + Render/Railway (backend + Socket.io)

---

## Phase 1: Foundation & Authentication (Week 1-2)

### 1.1 Frontend Setup (Vite + React)

Create new Vite project:

```bash
npm create vite@latest stoom-frontend -- --template react-ts
cd stoom-frontend
npm install
```

Install frontend dependencies:

```bash
# Core dependencies
npm install react-router-dom axios socket.io-client
npm install simple-peer @types/simple-peer

# UI & State Management
npm install zustand react-hot-toast framer-motion
npm install react-grid-layout
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-collaboration

# shadcn/ui setup
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install class-variance-authority clsx tailwind-merge
npm install lucide-react
npm install @radix-ui/react-slot
npm install @radix-ui/react-dialog
npm install @radix-ui/react-dropdown-menu
npm install @radix-ui/react-toast
npm install @radix-ui/react-avatar
npm install @radix-ui/react-tabs
npm install @radix-ui/react-switch
npm install @radix-ui/react-select
npm install @radix-ui/react-popover
npm install @radix-ui/react-separator
```

Initialize shadcn/ui:

```bash
npx shadcn-ui@latest init
```

Configure `components.json`:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

Add shadcn/ui components:

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add switch
npx shadcn-ui@latest add select
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add popover
npx shadcn-ui@latest add skeleton
npx shadcn-ui@latest add scroll-area
```

Configure Vite (`vite.config.ts`):

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:5000',
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true
      }
    }
  }
});
```

### 1.2 Backend Setup (Node.js + Express)

Create backend project structure:

```bash
mkdir stoom-backend
cd stoom-backend
npm init -y
```

Install backend dependencies:

```bash
# Core backend
npm install express cors dotenv helmet
npm install mongoose bcryptjs jsonwebtoken
npm install socket.io

# Validation & Middleware
npm install zod express-validator
npm install express-rate-limit express-async-handler
npm install morgan cookie-parser

# AI Integration
npm install openai
npm install multer  # For file uploads (audio/images)

# Development
npm install -D nodemon typescript @types/node @types/express
npm install -D @types/bcryptjs @types/jsonwebtoken @types/cors
npx tsc --init
```

Backend folder structure:

```
stoom-backend/
├── src/
│   ├── config/
│   │   ├── db.ts           # MongoDB connection
│   │   ├── socket.ts       # Socket.io configuration
│   │   └── constants.ts    # App constants
│   ├── models/
│   │   ├── User.ts
│   │   ├── Room.ts
│   │   └── Session.ts
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── roomController.ts
│   │   ├── sessionController.ts
│   │   └── transcriptionController.ts
│   ├── services/
│   │   ├── webrtcService.ts      # WebRTC signaling logic
│   │   ├── whiteboardService.ts  # Whiteboard sync logic
│   │   ├── notesService.ts       # Collaborative notes logic
│   │   └── aiService.ts          # OpenAI integration
│   ├── middleware/
│   │   ├── auth.ts         # JWT verification
│   │   ├── errorHandler.ts # Global error handling
│   │   └── rateLimiter.ts  # Rate limiting
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── rooms.ts
│   │   ├── sessions.ts
│   │   └── transcription.ts
│   ├── socket/
│   │   ├── handlers/
│   │   │   ├── roomHandler.ts
│   │   │   ├── webrtcHandler.ts
│   │   │   ├── whiteboardHandler.ts
│   │   │   └── notesHandler.ts
│   │   └── index.ts        # Socket.io initialization
│   ├── types/
│   │   ├── express.d.ts    # Extended Express types
│   │   └── socket.d.ts     # Socket event types
│   ├── utils/
│   │   ├── logger.ts       # Winston logger
│   │   ├── validation.ts   # Zod schemas
│   │   └── helpers.ts
│   └── server.ts           # Main entry point
├── .env
├── .env.example
├── tsconfig.json
└── package.json
```

### 1.3 Database Models (Mongoose)

**User Model** (`src/models/User.ts`):

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  avatar?: string;
  createdAt: Date;
  lastActive: Date;
}

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  name: { type: String, required: true },
  avatar: { type: String },
  createdAt: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now }
});

export default mongoose.model<IUser>('User', UserSchema);
```

**Room Model** (`src/models/Room.ts`):

```typescript
export interface IRoom extends Document {
  roomId: string;
  name: string;
  description?: string;
  hostId: mongoose.Types.ObjectId;
  participants: Array<{
    userId: mongoose.Types.ObjectId;
    joinedAt: Date;
    leftAt?: Date;
  }>;
  maxParticipants: number;
  isActive: boolean;
  createdAt: Date;
  endedAt?: Date;
}
```

**Session Model** (`src/models/Session.ts`):

```typescript
export interface ISession extends Document {
  roomId: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[];
  transcript: Array<{
    userId: mongoose.Types.ObjectId;
    text: string;
    timestamp: Date;
  }>;
  whiteboardStrokes: Array<{
    strokeId: string;
    userId: mongoose.Types.ObjectId;
    type: string;
    data: Buffer; // Compressed binary data
    timestamp: Date;
  }>;
  notes: string; // Rich text content
  summary?: string;
  aiInsights?: {
    keyTopics: string[];
    actionItems: string[];
    questions: string[];
  };
  duration: number; // seconds
  startedAt: Date;
  endedAt?: Date;
}
```

### 1.4 JWT Authentication System

**Auth Middleware** (`src/middleware/auth.ts`):

```typescript
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

interface JwtPayload {
  userId: string;
  email: string;
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

**Auth Controller** (`src/controllers/authController.ts`):

```typescript
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';

export const register = async (req, res) => {
  const { email, password, name } = req.body;
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const user = await User.create({
    email,
    password: hashedPassword,
    name
  });
  
  const token = jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );
  
  res.status(201).json({ token, user: { id: user._id, email, name } });
};

export const login = async (req, res) => {
  // Similar implementation
};
```

### 1.5 Frontend Pages & Routes

Setup React Router (`src/App.tsx`):

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import Room from './pages/Room';
import Sessions from './pages/Sessions';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/room/:id" element={<ProtectedRoute><Room /></ProtectedRoute>} />
        <Route path="/sessions" element={<ProtectedRoute><Sessions /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
```

**Key Files**:

- **Frontend**: `src/App.tsx`, `src/pages/`, `src/components/`, `src/hooks/`, `src/stores/`
- **Backend**: `src/server.ts`, `src/routes/`, `src/controllers/`, `src/models/`, `src/socket/`

---

## Phase 2: Study Room Core + WebRTC (Week 3-4)

### 2.1 Room Management API

Create API routes:

- `POST /api/rooms/create` - Create new study room
- `GET /api/rooms` - List active rooms
- `GET /api/rooms/[id]` - Get room details
- `POST /api/rooms/[id]/join` - Join room (add to participants)
- `POST /api/rooms/[id]/leave` - Leave room

### 2.2 Socket.io Server Setup

Create standalone Node server (`server/index.js`):

- Initialize Socket.io server on port 3001
- Handle events: `join-room`, `leave-room`, `signal` (WebRTC), `user-connected`, `user-disconnected`
- Room management: track active connections per room

Alternative: Use Next.js custom server (not recommended for Vercel)

### 2.3 WebRTC Video/Audio Implementation

Create components:

- `components/Room/VideoGrid.tsx` - Display all participant videos
- `components/Room/VideoControls.tsx` - Mute/unmute, camera on/off
- `hooks/useWebRTC.ts` - Custom hook for WebRTC peer connections

Flow:

1. User joins room → connect to Socket.io
2. Get local media stream (getUserMedia)
3. Emit `join-room` → receive list of existing peers
4. Create peer connections using simple-peer
5. Exchange SDP offers/answers via Socket.io signaling

Install: `npm install simple-peer`

**Key Files**:

- `server/index.js` - Socket.io signaling server
- `hooks/useWebRTC.ts` - WebRTC peer management
- `components/Room/VideoRoom.tsx` - Main room container
- `lib/socket.ts` - Socket.io client wrapper

---

## Phase 3: Interactive Whiteboard with Optimization (Week 5-6)

### 3.1 Optimized Canvas Implementation

Create `components/Whiteboard/Canvas.tsx`:

- **Dual Canvas Architecture**: Separate static canvas (completed strokes) and dynamic canvas (current stroke)
  - Reduces redraw overhead by only rendering active stroke
  - Static layer cached for better performance
- HTML5 Canvas API with OffscreenCanvas for background processing
- Tools: pen, eraser, shapes (rectangle, circle, line), text, colors, highlighter
- **Request Animation Frame** for smooth 60fps rendering
- State management: Immutable stroke history for undo/redo (max 50 operations)

Performance optimizations:

```typescript
// Throttle mouse events to 60fps
const throttledDraw = useCallback(
  throttle((e) => handleDraw(e), 16), // ~60fps
  []
);

// Use offscreen canvas for complex operations
const offscreenCanvas = new OffscreenCanvas(width, height);
```

### 3.2 Optimized Real-time Synchronization

**Batching Strategy**: Collect drawing points and send in batches every 50ms instead of per-event

```typescript
const drawBuffer = [];
const flushInterval = 50; // ms

// Batch multiple points
drawBuffer.push({x, y, pressure});

// Flush batch via Socket.io
setInterval(() => {
  if (drawBuffer.length > 0) {
    socket.emit('drawing-batch', {
      strokeId,
      points: drawBuffer,
      userId
    });
    drawBuffer = [];
  }
}, flushInterval);
```

**Delta Compression**: Send only changes, not full state

- Use binary protocol (ArrayBuffer) for point coordinates
- 70% smaller payload than JSON

Socket.io events with acknowledgments:

- `drawing-start` - Initialize new stroke (with ACK)
- `drawing-batch` - Send batched point data (binary)
- `drawing-end` - Finalize stroke with metadata
- `canvas-clear` - Clear all drawings
- `undo`, `redo` - History management with conflict resolution

**Optimized Data Structure**:

```typescript
// Binary format for points (Float32Array)
// 12 bytes per point vs 50+ bytes in JSON
interface StrokeBatch {
  strokeId: string;           // UUID for stroke
  points: Float32Array;       // [x1,y1,p1, x2,y2,p2, ...]
  timestamp: number;
  userId: string;
}

// Full stroke metadata (sent once)
interface StrokeMetadata {
  strokeId: string;
  type: 'pen' | 'eraser' | 'shape' | 'highlighter';
  color: string;
  width: number;
  userId: string;
  startTime: number;
}
```

**Interpolation for Smooth Lines**:

- Use Catmull-Rom spline interpolation for smooth curves
- Handle variable network latency gracefully

**Conflict Resolution**:

- Last-write-wins for concurrent edits
- Operational transformation for undo/redo conflicts

### 3.3 Optimized Whiteboard Persistence

**Incremental Saves**:

- Don't save entire canvas; save only new strokes (append-only)
- Compress stroke data with gzip before MongoDB storage
- Background worker for async saves (doesn't block UI)

**Smart Save Strategy**:

```typescript
// Save trigger conditions
const shouldSave = 
  (strokeCount >= 10) ||           // Every 10 new strokes
  (timeSinceLastSave >= 30000) ||  // Or every 30 seconds
  (userLeftRoom);                  // Or on room exit

// Incremental save
await saveStrokesIncremental({
  roomId,
  strokes: newStrokesSinceLastSave,
  lastSaveTime: previousTimestamp
});
```

**Fast Load Strategy**:

- On join: Load only stroke metadata first (instant preview)
- Stream full stroke data progressively in background
- Use IndexedDB for client-side caching

**Canvas Snapshot**:

- Generate PNG thumbnail every 60 seconds for session preview
- Store in MongoDB GridFS or S3 for efficient retrieval
- Load thumbnail while full canvas data loads

API endpoints:

- `POST /api/rooms/[id]/whiteboard/strokes` - Append new strokes
- `GET /api/rooms/[id]/whiteboard/strokes?after=[timestamp]` - Get incremental updates
- `GET /api/rooms/[id]/whiteboard/snapshot` - Get latest PNG thumbnail

### 3.4 Additional Performance Features

**Viewport Culling**:

- Only render strokes visible in current viewport
- Use spatial indexing (R-tree) for large whiteboards

**Stroke Simplification**:

- Use Ramer-Douglas-Peucker algorithm to reduce point count
- Reduce 100+ points to 20-30 without visual quality loss

**Memory Management**:

- Limit max strokes in memory (e.g., 1000)
- Offload old strokes to IndexedDB
- Lazy load on pan/zoom

### 3.5 Whiteboard UI Toggle with Free Grid Layout

**Toggle Interface**: Add UI controls to show/hide whiteboard and arrange room layout dynamically

Create `components/Room/LayoutControls.tsx`:

- Toggle buttons for whiteboard, notes, video, transcript visibility
- Layout presets: "Focus Mode" (whiteboard only), "Balanced" (all panels), "Video Only"
- Drag handles for resizing panels

**Free Grid Layout System** using CSS Grid or React Grid Layout:

Install: `npm install react-grid-layout`

```typescript
// Flexible layout configuration
interface LayoutConfig {
  whiteboard: { show: boolean; x: number; y: number; w: number; h: number };
  video: { show: boolean; x: number; y: number; w: number; h: number };
  notes: { show: boolean; x: number; y: number; w: number; h: number };
  transcript: { show: boolean; x: number; y: number; w: number; h: number };
}

// Predefined layout presets
const LAYOUT_PRESETS = {
  default: { whiteboard: left 60%, video: top-right 40%, notes: bottom-right },
  presentation: { whiteboard: fullscreen, video: minimized floating },
  collaboration: { whiteboard: 50%, notes: 50%, video: picture-in-picture },
  custom: { user-defined positions }
};
```

**Responsive Grid Features**:

- Drag-and-drop panels to reposition
- Resize panels with drag handles
- Snap-to-grid for clean alignment
- Save user's preferred layout to localStorage
- Breakpoints for mobile/tablet (auto-stack panels)
- Minimize/maximize individual panels
- Floating video thumbnails option

**Whiteboard Toggle Behaviors**:

- When hidden: Collapse to sidebar icon, free up screen space
- When shown: Animate slide-in from configured position
- Persist toggle state across page refresh
- Keyboard shortcut: `Ctrl/Cmd + B` to toggle whiteboard
- Other shortcuts: `Ctrl + V` (video), `Ctrl + N` (notes), `Ctrl + T` (transcript)

**Layout State Management**:

```typescript
// Store in Zustand or Context
interface RoomLayoutState {
  layout: LayoutConfig;
  activePreset: 'default' | 'presentation' | 'collaboration' | 'custom';
  togglePanel: (panel: keyof LayoutConfig) => void;
  updateLayout: (newLayout: Partial<LayoutConfig>) => void;
  resetLayout: () => void;
}
```

**Key Files**:

- `components/Whiteboard/Canvas.tsx` - Optimized dual-canvas drawing
- `components/Whiteboard/Toolbar.tsx` - Drawing tools
- `components/Room/LayoutControls.tsx` - Toggle and layout preset controls
- `components/Room/GridLayout.tsx` - Free grid layout container with react-grid-layout
- `hooks/useWhiteboard.ts` - Canvas state with batching & compression
- `hooks/useRoomLayout.ts` - Layout state management and persistence
- `lib/whiteboard/interpolation.ts` - Curve smoothing utilities
- `lib/whiteboard/compression.ts` - Binary encoding/decoding
- `lib/whiteboard/spatial-index.ts` - R-tree for viewport culling
- `workers/whiteboard-save.worker.ts` - Background save worker

---

## Phase 4: Collaborative Notes (Week 7)

### 4.1 Notes Editor

Options:

- **Simple**: Textarea with conflict-free replicated data type (CRDT) logic
- **Advanced**: Integrate Tiptap or Quill editor

Recommended: Tiptap for rich text editing

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-collaboration
```

### 4.2 Real-time Sync with Y.js (Optional for advanced CRDT)

Install: `npm install yjs y-socket.io`

Or implement simpler approach:

- Socket.io events: `note-update`, `cursor-position`
- Send delta changes (not full document)
- Operational Transformation (OT) for conflict resolution

### 4.3 Notes Component

Create `components/Notes/CollaborativeEditor.tsx`:

- Rich text editor with formatting (bold, italic, lists)
- Real-time cursor indicators showing other users
- Auto-save to MongoDB every 10s

**Key Files**:

- `components/Notes/CollaborativeEditor.tsx`
- `hooks/useCollaborativeNotes.ts`
- `app/api/rooms/[id]/notes/route.ts`

---

## Phase 5: Speech-to-Text (Week 8)

### 5.1 Audio Recording

Create `components/Room/Transcription.tsx`:

- Record audio using MediaRecorder API
- Chunk audio into 30-second segments
- Send to backend for transcription

### 5.2 Whisper API Integration

Create API route: `POST /api/transcribe`

```typescript
// Use OpenAI Whisper API
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const transcription = await openai.audio.transcriptions.create({
  file: audioFile,
  model: "whisper-1",
  language: "en"
});
```

### 5.3 Transcript Display

- Real-time transcript feed in sidebar
- Show speaker labels (if multiple users)
- Save to Session model in MongoDB
- Socket.io event: `new-transcript` - Broadcast to all participants

Install: `npm install openai`

**Key Files**:

- `components/Room/Transcription.tsx`
- `app/api/transcribe/route.ts`
- `hooks/useTranscription.ts`

---

## Phase 6: AI Summarization (Week 9)

### 6.1 Session Summary Generation

Create API route: `POST /api/sessions/[id]/summarize`

Use OpenAI GPT-4:

```typescript
const completion = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [
    {
      role: "system",
      content: "You are an AI that summarizes study sessions. Extract key topics, concepts, and action items."
    },
    {
      role: "user",
      content: `Transcript: ${transcript}\n\nNotes: ${notes}\n\nSummarize this study session.`
    }
  ]
});
```

### 6.2 Summary Features

- Generate summary when session ends
- Extract key points (bullet list)
- Identify action items and questions
- Suggest follow-up topics
- Save summary to Session model

### 6.3 Summary UI

Create `components/Sessions/SummaryView.tsx`:

- Display AI-generated summary
- Show key insights, topics covered, action items
- Export options (PDF, markdown)

**Key Files**:

- `app/api/sessions/[id]/summarize/route.ts`
- `components/Sessions/SummaryView.tsx`

---

## Phase 7: Dashboard & Session History (Week 10)

### 7.1 User Dashboard

Enhanced `app/dashboard/page.tsx`:

- Active rooms (join existing)
- Create new room modal
- Recent sessions list
- User stats (total study time, sessions)

### 7.2 Session History Page

Create `app/sessions/page.tsx`:

- List all past sessions
- Filter by date, participants
- View session details (notes, transcript, whiteboard snapshot)

Create `app/sessions/[id]/page.tsx`:

- Full session replay view
- Display whiteboard (as image/video)
- Notes viewer
- Full transcript with timestamps
- AI summary

### 7.3 Session Export

API route: `GET /api/sessions/[id]/export`

- Export as PDF with notes, summary, transcript
- Use library like `jspdf` or `puppeteer`

**Key Files**:

- `app/dashboard/page.tsx`
- `app/sessions/page.tsx`
- `app/sessions/[id]/page.tsx`
- `components/Dashboard/*.tsx`

---

## Phase 8: Polish & UX Enhancements (Week 11)

### 8.1 UI/UX Improvements

- Loading states and skeleton screens
- Error boundaries and toast notifications
- Responsive design for mobile/tablet
- Dark mode support (already in TailwindCSS)
- Animations with Framer Motion

Install: `npm install framer-motion react-hot-toast`

### 8.2 Room Features

- Screen sharing (WebRTC getDisplayMedia)
- Chat sidebar (text messages via Socket.io)
- Raise hand feature
- Participant list with status indicators
- Room settings (max participants, permissions)

### 8.3 Accessibility

- Keyboard navigation
- ARIA labels
- Screen reader support
- Caption/transcript display for hearing impaired

---

## Phase 9: Testing (Week 12)

### 9.1 Unit Tests

Install: `npm install --save-dev jest @testing-library/react @testing-library/jest-dom`

Test:

- API route handlers
- Utility functions (auth, db)
- Custom hooks (useWebRTC, useWhiteboard)

### 9.2 Integration Tests

- User authentication flow
- Room creation and joining
- WebRTC connection establishment
- Real-time data sync (whiteboard, notes)

### 9.3 Manual Testing

- Cross-browser testing (Chrome, Firefox, Safari)
- Multiple users in same room
- Network conditions (slow connection, reconnection)
- Load testing with 10+ users in room

---

## Phase 10: Deployment (Week 12-13)

### 10.1 Environment Setup

Create `.env.local`:

```
MONGODB_URI=mongodb+srv://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://stoom.vercel.app
OPENAI_API_KEY=sk-...
SOCKET_SERVER_URL=https://stoom-socket.onrender.com
```

### 10.2 Frontend Deployment (Vercel)

1. Connect GitHub repo to Vercel
2. Configure environment variables
3. Deploy with automatic CI/CD
4. Custom domain setup (optional)

### 10.3 Socket.io Server Deployment (Render/Railway)

Create `server/package.json`:

```json
{
  "name": "stoom-socket-server",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "socket.io": "^4.7.0",
    "cors": "^2.8.5"
  }
}
```

Deploy on Render:

1. Create new Web Service
2. Connect GitHub repo
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variables

### 10.4 MongoDB Atlas Setup

1. Create cluster on MongoDB Atlas
2. Configure network access (allow Vercel IPs)
3. Create database user
4. Get connection string

---

## Complete File Structure

```
stoom/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── register/route.ts
│   │   ├── rooms/
│   │   │   ├── route.ts (GET all, POST create)
│   │   │   └── [id]/
│   │   │       ├── route.ts (GET, DELETE)
│   │   │       ├── join/route.ts
│   │   │       ├── leave/route.ts
│   │   │       ├── whiteboard/route.ts
│   │   │       └── notes/route.ts
│   │   ├── sessions/
│   │   │   ├── route.ts (GET all)
│   │   │   └── [id]/
│   │   │       ├── route.ts (GET)
│   │   │       ├── summarize/route.ts
│   │   │       └── export/route.ts
│   │   └── transcribe/route.ts
│   ├── dashboard/page.tsx
│   ├── room/[id]/page.tsx
│   ├── sessions/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── layout.tsx
│   ├── page.tsx (landing)
│   └── globals.css
├── components/
│   ├── Dashboard/
│   │   ├── RoomCard.tsx
│   │   ├── CreateRoomModal.tsx
│   │   └── SessionsList.tsx
│   ├── Room/
│   │   ├── VideoRoom.tsx
│   │   ├── VideoGrid.tsx
│   │   ├── VideoControls.tsx
│   │   ├── Transcription.tsx
│   │   └── ChatSidebar.tsx
│   ├── Whiteboard/
│   │   ├── Canvas.tsx
│   │   ├── Toolbar.tsx
│   │   └── ColorPicker.tsx
│   ├── Notes/
│   │   └── CollaborativeEditor.tsx
│   ├── Sessions/
│   │   ├── SummaryView.tsx
│   │   └── TranscriptView.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Modal.tsx
│       └── Toast.tsx
├── hooks/
│   ├── useWebRTC.ts
│   ├── useWhiteboard.ts
│   ├── useCollaborativeNotes.ts
│   ├── useTranscription.ts
│   └── useSocket.ts
├── lib/
│   ├── db.ts (MongoDB connection)
│   ├── auth.ts (NextAuth utilities)
│   ├── socket.ts (Socket.io client)
│   ├── openai.ts (OpenAI client)
│   ├── models/
│   │   ├── User.ts
│   │   ├── StudyRoom.ts
│   │   └── Session.ts
│   └── utils/
│       ├── validation.ts (Zod schemas)
│       └── helpers.ts
├── server/ (separate Socket.io server)
│   ├── index.js
│   ├── handlers/
│   │   ├── roomHandler.js
│   │   ├── webrtcHandler.js
│   │   ├── whiteboardHandler.js
│   │   └── notesHandler.js
│   └── package.json
├── types/
│   ├── room.ts
│   ├── session.ts
│   └── socket.ts
├── middleware.ts (route protection)
├── .env.local
└── package.json
```

---

## Key Technologies Summary

**Core Stack**:

- Next.js 16 (App Router)
- React 19
- TypeScript
- TailwindCSS 4

**Backend**:

- Next.js API Routes
- Socket.io (separate Node server)
- MongoDB Atlas + Mongoose

**Authentication**:

- NextAuth.js v5
- bcryptjs for password hashing

**Real-time Communication**:

- Socket.io (signaling, whiteboard, notes)
- simple-peer (WebRTC for video/audio)

**AI Integration**:

- OpenAI API (GPT-4 for summarization, Whisper for speech-to-text)

**Additional Libraries**:

- Zod (validation)
- Framer Motion (animations)
- react-hot-toast (notifications)
- Tiptap (rich text editor)

---

## Testing Strategy

1. **Unit Tests**: Jest + React Testing Library for components and hooks
2. **API Tests**: Test Next.js API routes with mock data
3. **E2E Tests**: Playwright for full user flows
4. **Manual Testing**: Multi-user sessions with real devices
5. **Performance**: Lighthouse scores, WebRTC metrics

---

## Deployment Checklist

- [ ] Set up MongoDB Atlas cluster and get connection string
- [ ] Configure NextAuth with production URL and secret
- [ ] Add OpenAI API key to environment variables
- [ ] Deploy Socket.io server to Render/Railway
- [ ] Deploy Next.js app to Vercel
- [ ] Configure CORS for Socket.io server
- [ ] Test WebRTC connections in production
- [ ] Set up error monitoring (Sentry)
- [ ] Configure analytics (Vercel Analytics)
- [ ] Test with multiple users across different networks

---

## Implementation Order

1. **Week 1-2**: Auth + Database setup
2. **Week 3-4**: WebRTC video/audio in study rooms
3. **Week 5-6**: Interactive whiteboard with real-time sync
4. **Week 7**: Collaborative notes editor
5. **Week 8**: Speech-to-text transcription
6. **Week 9**: AI summarization module
7. **Week 10**: Dashboard and session history
8. **Week 11**: UI polish, additional features
9. **Week 12-13**: Testing and deployment

This modular approach allows you to build and test each feature independently before integration.

### To-dos

- [ ] Install dependencies, set up MongoDB Atlas, configure NextAuth.js, create User model and authentication API routes
- [ ] Build landing page, login/register pages, dashboard, and protected route middleware
- [ ] Create room management API routes (create, join, leave) and set up Socket.io signaling server
- [ ] Implement WebRTC video/audio with simple-peer, create VideoRoom components and useWebRTC hook
- [ ] Build interactive Canvas component with drawing tools, implement real-time sync via Socket.io, add persistence to MongoDB
- [ ] Integrate Tiptap editor, implement real-time collaborative editing with Socket.io, add auto-save functionality
- [ ] Implement audio recording with MediaRecorder, integrate OpenAI Whisper API, create transcript display and storage
- [ ] Build session summarization with GPT-4, create summary generation API, implement SummaryView component
- [ ] Build session history pages, implement session replay viewer, add export functionality
- [ ] Add loading states, error handling, animations, screen sharing, chat sidebar, and accessibility features
- [ ] Write unit tests for components and hooks, test API routes, perform manual multi-user testing
- [ ] Deploy Socket.io server to Render/Railway, deploy Next.js app to Vercel, configure production environment variables
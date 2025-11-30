# UI/UX DESIGN SPECIFICATION - STOOM PLATFORM

**Project:** Stoom – Study Together Platform  
**Version:** 1.0  
**Last Updated:** 2024  
**Tech Stack:** Next.js 16 (App Router), TypeScript, Clerk Authentication, Shadcn/ui, Tailwind CSS, React Resizable Panels  
**Core Modules (Planned):** WebRTC (LiveKit), Whiteboard (tldraw), Collaborative Notes (Tiptap), AI Insight (Gemini)

---

## 1. Design System & Style Guide

### 1.1. Color Palette

**Primary Brand Colors:**
- **Light Mode:** `Violet-600` (oklch(0.488 0.243 264.376)) - Primary actions, highlights, brand elements
- **Dark Mode:** `Violet-500` (oklch(0.696 0.17 162.48)) - Adjusted for dark theme visibility

**Background Colors:**
- **Light Mode:** 
  - Main: `Slate-50` (oklch(0.99 0 0))
  - Card/Surface: `White` (oklch(1 0 0))
- **Dark Mode:**
  - Main: `Slate-950` (oklch(0.02 0 0))
  - Card/Surface: `Slate-900` (oklch(0.05 0 0))

**Functional Colors:**
- **Success:** `Emerald-500` - Active speaker indicator, connection status
- **Destructive/Error:** `Rose-500` - Leave room, mute/video off states, errors
- **Warning:** `Amber-500` - Warnings, notifications
- **Recording:** `Red-600` - Recording active state

**Border & Input:**
- **Light:** `Slate-200` (oklch(0.922 0 0))
- **Dark:** `White/10%` opacity

### 1.2. Typography

- **Font Family:** `Geist Sans` (Default Next.js 16 font)
- **Font Mono:** `Geist Mono` (for code/technical content)
- **Headings:** Bold, tight tracking, responsive sizes
- **Body Text:** Regular (400), 14px-16px for optimal readability
- **Small Text:** 12px-14px for metadata, timestamps

### 1.3. UI Library & Icons

- **Component Library:** `shadcn/ui` (built on Radix UI primitives)
- **Icon Set:** `Lucide React` (Stroke width: 1.5px - 2px)
- **Layout Engine:** `react-resizable-panels` (for room page resizable panels)
- **Authentication:** `Clerk` (handles sign-in, sign-up, user management)

### 1.4. Spacing & Layout

- **Border Radius:** 0.625rem (10px) base, with variants (sm, md, lg, xl)
- **Shadows:** Subtle shadows with violet tint on hover states
- **Transitions:** 300ms ease-in-out for smooth interactions
- **Backdrop Blur:** Used for sticky headers and floating elements

---

## 2. Route Structure (Next.js 16 App Router)

Sử dụng **Route Groups** để tổ chức layout hợp lý:

```
app/
├── layout.tsx                    # Root layout với ClerkProvider
├── globals.css                   # Global styles, color variables
├── middleware.ts                 # Clerk middleware cho route protection
│
├── (marketing)/                  # Public marketing pages
│   └── page.tsx                 # Landing page (/)
│
├── (auth)/                       # Authentication pages
│   ├── layout.tsx               # Centered layout với gradient background
│   ├── sign-in/[[...sign-in]]/
│   │   └── page.tsx             # Sign in page (/sign-in)
│   └── sign-up/[[...sign-up]]/
│       └── page.tsx             # Sign up page (/sign-up)
│
├── (dashboard)/                  # Protected dashboard routes
│   ├── layout.tsx               # Auth protection + base layout
│   ├── dashboard/
│   │   └── page.tsx             # Main dashboard (/dashboard)
│   └── recordings/
│       ├── page.tsx             # All recordings list (/recordings)
│       └── [id]/
│           └── page.tsx         # Recording detail (/recordings/[id])
│
├── (room)/                       # Protected room routes
│   ├── layout.tsx               # Fullscreen layout, auth protection
│   └── room/
│       └── [roomId]/
│           └── page.tsx        # Room page (/room/[roomId])
│
└── api/
    └── clerk/
        └── [...clerk]/
            └── route.ts         # Clerk proxy route handler
```

### 2.1. Route Protection

- **Public Routes:** `/`, `/sign-in`, `/sign-up`, `/api/clerk/*`
- **Protected Routes:** All routes under `(dashboard)` and `(room)` require authentication
- **Middleware:** Uses `clerkMiddleware()` to protect routes and redirect unauthenticated users

---

## 3. Authentication Flow

### 3.1. Sign In/Sign Up Pages

**Location:** `/sign-in`, `/sign-up`

**Layout:**
- Centered card layout with gradient background
- Grid pattern overlay for visual interest
- Clerk's `<SignIn />` and `<SignUp />` components with custom styling

**Styling:**
- Violet-themed color scheme matching brand
- Custom appearance props for Clerk components
- Smooth transitions and hover effects

**User Flow:**
1. User lands on landing page (`/`)
2. Clicks "Sign In" or "Get Started"
3. Redirected to `/sign-in` or `/sign-up`
4. After successful authentication, redirected to `/dashboard`

**Configuration:**
- `afterSignInUrl`: `/dashboard`
- `afterSignUpUrl`: `/dashboard`
- Clerk handles all authentication logic (email, social login, etc.)

---

## 4. Landing Page Flow

### 4.1. Landing Page (`/`)

**Layout Structure:**
- **Sticky Header:** Logo, Sign In, Get Started buttons
- **Hero Section:** 
  - Gradient background with grid pattern
  - AI-powered badge
  - Large heading with gradient text
  - CTA buttons (Get Started Free, Sign In)
- **Features Section:** 4 feature cards with hover effects
  - Real-time Video
  - Collaborative Whiteboard
  - Shared Notes
  - AI Insights
- **Footer:** Simple footer with logo and copyright

**Design Elements:**
- Gradient backgrounds (violet to purple)
- Hover effects on cards (border color change, shadow, gradient overlay)
- Responsive grid layout
- Modern, clean aesthetic

---

## 5. Dashboard Flow

### 5.1. Dashboard Page (`/dashboard`)

**Layout Structure:**
- **Sticky Header:**
  - Logo (links to `/`)
  - UserButton from Clerk (user profile menu)
- **Main Content:**
  - **Tabs:** Dashboard | Recordings
  - **Dashboard Tab:**
    - Heading: "Dashboard"
    - Action Buttons: "Join with Code" | "New Meeting"
    - Recent Sessions Section: Grid of session cards
  - **Recordings Tab:**
    - Heading: "All Recordings"
    - Grid of all session cards

**Components:**

#### 5.1.1. Join with Code Dialog
- **Trigger:** "Join with Code" button
- **Content:**
  - Input field for room code
  - Enter key support
  - Cancel and Join buttons
- **Action:** Navigates to `/room/[roomCode]`

#### 5.1.2. New Meeting Dialog
- **Trigger:** "New Meeting" button
- **Content:**
  - Meeting Title input (required)
  - Room Settings section:
    - Mute microphone on join (checkbox)
    - Turn off camera on join (checkbox)
    - Require password to join (checkbox with conditional password input)
  - Cancel and Create Meeting buttons
- **Action:** Generates random room ID and navigates to `/room/[roomId]`

#### 5.1.3. Session Card Component
- **Design:** Custom card (not shadcn Card component)
- **Layout:**
  - Gradient initial circle (first letter of title)
  - Title (line-clamp-2)
  - AI badge (if hasAIInsights)
  - Details with icons:
    - Calendar icon + date
    - Clock icon + time
    - Users icon + participant count
  - Footer with "View Details" text and arrow button
- **Hover Effects:**
  - Border color changes to violet
  - Shadow with violet tint
  - Gradient overlay appears
  - Arrow button expands to show "View" text
- **Navigation:** Links to `/recordings/[id]` with prefetch enabled

**State Management:**
- Tab state (dashboard/recordings)
- Dialog open/close states
- Form states for new meeting

---

## 6. Room Flow

### 6.1. Pre-Join Screen

**Location:** `/room/[roomId]` (before joining)

**Layout:**
- Fullscreen dark background (`slate-950`)
- Centered card with:
  - Back to Dashboard link
  - Room ID display
  - Video preview area (shows avatar if video on, or VideoOff icon)
  - Media controls (Mic, Video toggle buttons)
  - Join Room button

**Features:**
- Default name: "Vinh" (mock)
- Mic and video can be toggled before joining
- Video preview shows avatar circle with first letter
- Join button is always enabled

**User Flow:**
1. User clicks "Join Room" or enters room code
2. Pre-join screen appears
3. User can test/toggle media
4. User clicks "Join Room"
5. Transitions to main room view

### 6.2. Main Room Layout

**Location:** `/room/[roomId]` (after joining)

**Layout Structure:**
```
┌─────────────────────────────────────────────────────────────┐
│ Participants Sidebar │ Main Stage │ Chat/Notes │ Transcript │
│ (256px, collapsible) │ (flexible)  │ (resizable) │ (resizable)│
└─────────────────────────────────────────────────────────────┘
│                    Floating Dock (bottom center)            │
└─────────────────────────────────────────────────────────────┘
```

#### 6.2.1. Participants Sidebar

**Component:** `ParticipantsSidebar`

**Layout:**
- **Header:**
  - Meeting title (line-clamp-2)
  - Participant count
  - Collapse button
- **Participants List:**
  - Scrollable list
  - Each participant shows:
    - Avatar circle (gradient, first letter)
    - Name
    - Mic/Video status icons
    - Speaking indicator (green dot + border highlight)

**Features:**
- Collapsible (collapses to 48px width)
- Shows meeting title from props or generates from roomId
- Highlights speaking participants with violet background
- Smooth transitions

**Props:**
- `roomId?: string`
- `meetingTitle?: string`

#### 6.2.2. Main Stage Panel

**Component:** `Stage`

**Layout:**
- Full height, flexible width
- Can display:
  - Screen Share only
  - Whiteboard only
  - Both (split view: horizontal or vertical)

**Control Bar (Top Right):**
- Auto-collapses after 3 seconds of no hover
- Shows on hover or via small button
- Buttons:
  - Toggle Screen Share
  - Toggle Whiteboard
  - Toggle Layout (only when both are visible)

**Content Areas:**
- Screen Share: Placeholder with Monitor icon
- Whiteboard: Placeholder with pen icon
- Split View: Uses `react-resizable-panels` for resizable split

**Props:**
- `showScreenShare: boolean`
- `showWhiteboard: boolean`
- `layout: "horizontal" | "vertical"`
- `onToggleScreenShare: () => void`
- `onToggleWhiteboard: () => void`
- `onToggleLayout: () => void`

#### 6.2.3. Chat & Notes Panel

**Component:** `ChatNotesPanel`

**Layout:**
- Resizable panel (20% - 50% width, min 300px)
- Tabs: Chat | Notes
- **Chat Tab:**
  - Scrollable message list
  - Message input (h-12, text-base)
  - Send button
- **Notes Tab:**
  - Placeholder for Tiptap editor
  - Shows "coming soon" message

**Features:**
- Close button (X) in header
- Active tab state management
- Large input field for better UX

#### 6.2.4. Transcript Panel

**Component:** `TranscriptPanel`

**Layout:**
- Resizable panel (20% - 50% width, min 300px)
- Scrollable transcript entries
- Each entry shows:
  - Speaker name
  - Timestamp (MM:SS format)
  - Text content
  - Active state highlighting (violet background + left border)

**Features:**
- Close button (X) in header
- Active entry highlighting
- Smooth scrolling

#### 6.2.5. Floating Dock

**Component:** `FloatingDock`

**Layout:**
- Fixed position, bottom center
- Rounded pill shape with backdrop blur
- Auto-hides after 3 seconds of no hover
- Shows on hover or via small button

**Buttons (left to right):**
1. **Mic Toggle** - Mute/Unmute (default/destructive variant)
2. **Video Toggle** - Camera on/off (default/destructive variant)
3. **Screen Share Toggle** - Toggle screen share (violet when active)
4. **Divider**
5. **Record Meeting** - Start/Stop recording (red when recording)
   - Opens confirmation modal
   - Modal shows different content for start/stop
6. **Divider**
7. **Chat & Notes Toggle** - Toggle chat/notes panel (violet when visible)
8. **Transcript Toggle** - Toggle transcript panel (violet when visible)
9. **Divider**
10. **Leave Room** - Destructive button, navigates to `/dashboard`

**Recording Modal:**
- **Start Recording:**
  - Warning icon (violet)
  - Title: "Start Recording?"
  - Description: Explains recording includes audio, video, screen shares
  - Buttons: Cancel, Start Recording
- **Stop Recording:**
  - Recording icon (red, filled)
  - Title: "Stop Recording?"
  - Description: Recording will be saved
  - Buttons: Cancel, Stop Recording

**Features:**
- Auto-hide/show functionality
- Visual feedback for active states
- Smooth transitions

**Props:**
- `onToggleScreenShare: () => void`
- `onToggleChatNotes: () => void`
- `onToggleTranscript: () => void`
- `screenShareVisible: boolean`
- `chatNotesVisible: boolean`
- `transcriptVisible: boolean`

### 6.3. Room State Management

**Component:** `RoomContent`

**State:**
- `showScreenShare: boolean` (default: true)
- `showWhiteboard: boolean` (default: false)
- `layout: "horizontal" | "vertical"` (default: "horizontal")
- `showChatNotes: boolean` (default: true)
- `showTranscript: boolean` (default: false)
- `chatNotesSize: number` (default: 30%)
- `transcriptSize: number` (default: 30%)

**Persistence:**
- Panel sizes saved to `localStorage` with key `"stoom-panel-sizes"`
- Restored on mount
- Saved on layout change

**Panel Sizing:**
- Main stage calculates size based on visible panels
- Minimum 50% for main stage when panels are visible
- 100% when no panels visible

---

## 7. Recordings Flow

### 7.1. Recordings List Page (`/recordings`)

**Location:** Accessible via Dashboard "Recordings" tab

**Layout:**
- Same structure as Dashboard tab
- Grid of all session cards
- Empty state if no recordings

### 7.2. Recording Detail Page (`/recordings/[id]`)

**Layout Structure:**
- **Sticky Header:**
  - Back button (to `/dashboard`)
  - Session title
  - Metadata: Date, Time, Duration
- **Two-Column Layout:**
  - **Left Column (2/3 width):**
    - Tabs: Whiteboard | Transcript | Chat
    - Tab content in cards
  - **Right Column (1/3 width):**
    - AI Insight Overview card (if available)
    - Participants card
    - Session Statistics card

**Components:**

#### 7.2.1. Whiteboard Tab
- Placeholder for whiteboard snapshot
- Aspect-video container
- Shows "Whiteboard snapshot will be displayed here"

#### 7.2.2. Transcript Tab
- Scrollable transcript entries
- Each entry:
  - Speaker name + timestamp
  - Text content
  - Active state highlighting (violet background)

#### 7.2.3. Chat Tab
- Scrollable chat messages
- Each message:
  - User name + timestamp
  - Message content

#### 7.2.4. AI Insight Overview Card
- **Design:** Gradient background (violet-50 to violet-100)
- **Content:**
  - Header with Sparkles icon and "AI Generated" badge
  - Key Points section (bullet list)
  - Takeaways section (bullet list)
- **Visibility:** Only shown if `session.hasAIInsights === true`

#### 7.2.5. Participants Card
- List of participants
- Same design as room participants sidebar
- Shows speaking status

#### 7.2.6. Session Statistics Card
- Key metrics:
  - Duration
  - Participants count
  - Messages count
  - Transcript entries count
  - AI Insights availability (badge)

---

## 8. Component Architecture

### 8.1. Dashboard Components

**Location:** `components/dashboard/`

- **`session-card.tsx`**
  - Custom card design (not shadcn Card)
  - Gradient initial, hover effects
  - Links to recording detail page
  - Props: `id, title, date, time, participants, hasAIInsights`

### 8.2. Room Components

**Location:** `components/room/`

- **`pre-join.tsx`**
  - Pre-join screen with media controls
  - Props: `roomId, onJoin`

- **`room-content.tsx`**
  - Main room layout orchestrator
  - Manages all panel states and resizing
  - Props: `roomId`

- **`participants-sidebar.tsx`**
  - Participants list with meeting title
  - Props: `roomId?, meetingTitle?`

- **`stage.tsx`**
  - Main stage with screen share/whiteboard
  - Control bar with auto-collapse
  - Props: `showScreenShare, showWhiteboard, layout, onToggleScreenShare, onToggleWhiteboard, onToggleLayout`

- **`chat-notes-panel.tsx`**
  - Combined chat and notes panel
  - Props: `onClose`

- **`transcript-panel.tsx`**
  - Transcript display panel
  - Props: `onClose`

- **`floating-dock.tsx`**
  - Floating control bar
  - Recording confirmation modal
  - Props: `onToggleScreenShare, onToggleChatNotes, onToggleTranscript, screenShareVisible, chatNotesVisible, transcriptVisible`

### 8.3. UI Components (shadcn/ui)

**Location:** `components/ui/`

- `button.tsx` - Button component
- `card.tsx` - Card components
- `dialog.tsx` - Dialog/Modal component
- `tabs.tsx` - Tabs component
- `input.tsx` - Input component
- `badge.tsx` - Badge component
- `checkbox.tsx` - Checkbox component
- `label.tsx` - Label component
- `popover.tsx` - Popover component

---

## 9. Mock Data

**Location:** `lib/mock-data.ts`

**Data Structures:**

- **`MockSession`**
  - `id, title, date, time, participants, hasAIInsights`

- **`MockParticipant`**
  - `id, name, isSpeaking`

- **`MockMessage`**
  - `id, userId, userName, message, timestamp`

- **`MockTranscript`**
  - `id, speaker, text, timestamp, isActive`

- **`mockAISummary`**
  - `title, keyPoints[], takeaways[]`

**Usage:**
- All components use mock data for UI development
- Will be replaced with API calls when backend is implemented

---

## 10. Authentication & Security

### 10.1. Clerk Integration

**Setup:**
- `ClerkProvider` in root layout
- `clerkMiddleware()` in middleware.ts
- Proxy route handler at `/api/clerk/[...clerk]/route.ts`

**Configuration:**
- Public routes: `/`, `/sign-in`, `/sign-up`, `/api/clerk/*`
- Protected routes: All dashboard and room routes
- Redirects: Unauthenticated users → `/sign-in`

**User Management:**
- `UserButton` component in dashboard header
- Clerk handles all user profile, settings, sessions

### 10.2. Route Protection

**Dashboard Layout:**
- Uses `auth()` from Clerk
- Redirects to `/sign-in` if not authenticated

**Room Layout:**
- Uses `auth()` from Clerk
- Redirects to `/sign-in` if not authenticated

---

## 11. UI/UX Patterns & Interactions

### 11.1. Resizable Panels

**Library:** `react-resizable-panels`

**Implementation:**
- Main stage, Chat/Notes, Transcript panels are resizable
- Resize handles with hover effects (violet color)
- Minimum sizes enforced:
  - Chat/Notes: 20% - 50%, min 300px
  - Transcript: 20% - 50%, min 300px
  - Main Stage: 50% minimum when panels visible

**Persistence:**
- Sizes saved to `localStorage`
- Restored on page load
- Key: `"stoom-panel-sizes"`

### 11.2. Auto-Hide/Show Patterns

**Floating Dock:**
- Hides after 3 seconds of no hover
- Shows on hover or button click
- Smooth opacity and translate transitions

**Stage Control Bar:**
- Hides after 3 seconds of no hover
- Shows on hover or button click
- Small button appears when hidden

### 11.3. Hover Effects

**Session Cards:**
- Border color change (violet)
- Shadow with violet tint
- Gradient overlay
- Arrow button expands to show "View" text

**Feature Cards (Landing):**
- Border color change
- Shadow with violet tint
- Gradient overlay animation

### 11.4. Transitions

- **Duration:** 300ms
- **Easing:** ease-in-out
- **Properties:** opacity, transform, colors, borders

### 11.5. Visual Feedback

**Active States:**
- Violet background for active buttons
- Violet border for active panels
- Red background for recording state
- Green dot for speaking participants

**Disabled States:**
- Muted colors
- Reduced opacity
- Cursor: not-allowed

---

## 12. Responsive Design

### 12.1. Breakpoints

- **Mobile:** < 640px
- **Tablet:** 640px - 1024px
- **Desktop:** > 1024px

### 12.2. Responsive Patterns

**Dashboard:**
- Grid: 1 column (mobile) → 2 columns (tablet) → 4 columns (desktop)
- Buttons stack on mobile

**Room:**
- Panels can be collapsed on smaller screens
- Floating dock remains accessible
- Participants sidebar can be collapsed

**Landing Page:**
- Hero text scales down on mobile
- Feature cards: 1 column (mobile) → 2 columns (tablet) → 4 columns (desktop)

---

## 13. Accessibility

### 13.1. Keyboard Navigation

- All interactive elements are keyboard accessible
- Tab order follows visual flow
- Enter/Space for button activation
- Escape to close modals

### 13.2. Screen Readers

- Semantic HTML elements
- ARIA labels where needed
- Alt text for icons (via title attributes)
- Focus indicators visible

### 13.3. Color Contrast

- All text meets WCAG AA standards
- Interactive elements have clear focus states
- Icons have sufficient contrast

---

## 14. Performance Considerations

### 14.1. Code Splitting

- Route-based code splitting (Next.js automatic)
- Component lazy loading where appropriate

### 14.2. Optimizations

- `prefetch={true}` on session card links
- `localStorage` for panel size persistence
- Efficient re-renders with proper state management

### 14.3. Asset Optimization

- Next.js Image component for images (when implemented)
- Font optimization via Next.js font system

---

## 15. Future Enhancements (Planned)

### 15.1. Real-time Features

- **WebRTC Integration (LiveKit):**
  - Real video/audio streams
  - Screen sharing
  - Participant management

- **Whiteboard (tldraw):**
  - Collaborative drawing
  - Real-time cursor tracking
  - Shape tools, text, images

- **Collaborative Notes (Tiptap):**
  - Rich text editor
  - Real-time collaboration
  - Cursor tracking

### 15.2. AI Features

- **AI Insights (Gemini):**
  - Real-time transcript analysis
  - Key points extraction
  - Action items generation
  - Summary generation

### 15.3. Additional Features

- Recording playback
- Export transcripts
- Share recordings
- Room scheduling
- Participant invitations
- Room settings persistence

---

## 16. Technical Implementation Notes

### 16.1. State Management

- **Client Components:** Use React `useState`, `useEffect`
- **Server Components:** Default for static content
- **Local Storage:** Panel sizes, user preferences
- **URL State:** Room ID, recording ID in URL params

### 16.2. Data Flow

```
User Action → Component State → UI Update
                ↓
         (Future: API Call)
                ↓
         Backend Processing
                ↓
         State Update → UI Update
```

### 16.3. Error Handling

- 404 pages for invalid routes
- Error boundaries (to be implemented)
- Graceful fallbacks for missing data

### 16.4. Environment Variables

**Required:**
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard`

---

## 17. File Structure Summary

```
stoom-app/
├── app/
│   ├── layout.tsx
│   ├── globals.css
│   ├── middleware.ts
│   ├── (marketing)/
│   │   └── page.tsx
│   ├── (auth)/
│   │   ├── layout.tsx
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   └── sign-up/[[...sign-up]]/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   └── recordings/
│   │       ├── page.tsx
│   │       └── [id]/page.tsx
│   ├── (room)/
│   │   ├── layout.tsx
│   │   └── room/[roomId]/page.tsx
│   └── api/
│       └── clerk/[...clerk]/route.ts
├── components/
│   ├── dashboard/
│   │   └── session-card.tsx
│   ├── room/
│   │   ├── pre-join.tsx
│   │   ├── room-content.tsx
│   │   ├── participants-sidebar.tsx
│   │   ├── stage.tsx
│   │   ├── chat-notes-panel.tsx
│   │   ├── transcript-panel.tsx
│   │   └── floating-dock.tsx
│   └── ui/
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── tabs.tsx
│       ├── input.tsx
│       ├── badge.tsx
│       ├── checkbox.tsx
│       ├── label.tsx
│       └── popover.tsx
├── lib/
│   ├── mock-data.ts
│   └── utils.ts
└── ui-insight.md (this file)
```

---

## 18. Design Principles

### 18.1. Consistency

- Unified color palette across all pages
- Consistent spacing and typography
- Reusable component patterns
- Standardized interaction patterns

### 18.2. Clarity

- Clear visual hierarchy
- Obvious interactive elements
- Intuitive navigation
- Helpful feedback for all actions

### 18.3. Efficiency

- Minimal clicks to complete tasks
- Keyboard shortcuts where appropriate
- Quick access to common actions
- Smart defaults

### 18.4. Delight

- Smooth animations and transitions
- Polished hover effects
- Modern, clean aesthetic
- Professional appearance

---

**End of Document**

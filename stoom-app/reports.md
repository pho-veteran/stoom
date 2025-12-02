# Chapter 2: System Analysis and Design

## 2.1. System Requirements

### 2.1.1. Actors

The system employs an inheritance-based actor model (Generalization/Specialization) to define user roles and system entities. The base actor is the **User**, which represents any authenticated individual accessing the platform through Clerk authentication. Specialized actors inherit from this base class, each with distinct permissions and responsibilities.

#### Base Actor: User

The **User** actor is the fundamental entity in the system, representing any authenticated individual. All users must authenticate through Clerk before accessing protected features. The User actor has the following base attributes:
- Authentication status (managed by Clerk)
- User ID (Clerk user ID)
- Email address
- Profile information (name, avatar)

#### Specialized Actor: Room Host

The **Room Host** is a specialized User who creates a meeting room. This actor inherits all capabilities of the base User class and additionally possesses administrative privileges within the room context. The Room Host has the following specialized capabilities:
- Create new meeting rooms with custom settings (title, password, media preferences)
- Control room settings during an active session
- Mute or remove participants (future enhancement)
- End the meeting session
- Access all recordings and AI insights for rooms they created

#### Specialized Actor: Participant

The **Participant** is a specialized User who joins an existing meeting room. This actor inherits base User capabilities but has limited administrative rights. The Participant can:
- Join rooms via room code or direct link
- Participate in real-time collaboration (video, audio, whiteboard, notes)
- Send chat messages
- View transcripts and AI insights
- Leave the room at any time
- Cannot modify room settings or control other participants

#### System Actor: AI Assistant

The **AI Assistant** is a non-human system actor that operates autonomously to provide intelligent features. This actor is triggered by specific system events and interacts with external AI services (Google Gemini API). The AI Assistant:
- Processes real-time transcripts during meetings
- Generates AI summaries after session completion
- Extracts key points and takeaways from conversation content
- Provides insights and recommendations based on session data
- Operates asynchronously without direct user interaction

### 2.1.2. Functional Requirements

Functional requirements are organized into logical modules that represent distinct subsystems of the Stoom platform. Each module contains specific requirements labeled with the format **REQ-X.Y**, where X represents the module number and Y represents the requirement number within that module.

#### Module 1: Authentication and User Management

**REQ-1.1:** The system shall authenticate users through Clerk authentication service, supporting email/password and social login methods (Google, GitHub).

**REQ-1.2:** The system shall protect all routes under `(dashboard)` and `(room)` route groups using Clerk middleware, redirecting unauthenticated users to `/sign-in`.

**REQ-1.3:** The system shall provide sign-in and sign-up pages (`/sign-in`, `/sign-up`) with centered card layout, gradient background, and custom violet-themed styling matching the brand identity.

**REQ-1.4:** Upon successful authentication, the system shall redirect users to `/dashboard` automatically.

**REQ-1.5:** The system shall display a UserButton component in the dashboard header, allowing users to access their profile and account settings managed by Clerk.

#### Module 2: Room Management and Navigation

**REQ-2.1:** The system shall provide a "Join with Code" dialog on the dashboard, allowing users to enter a room code and navigate to `/room/[roomCode]`.

**REQ-2.2:** The system shall provide a "New Meeting" dialog that allows Room Hosts to:
- Set a meeting title (required field)
- Configure room settings: mute microphone on join, turn off camera on join, require password to join
- Generate a unique room ID and navigate to the room

**REQ-2.3:** The system shall display a dashboard with two tabs: "Dashboard" and "Recordings", allowing users to switch between viewing recent sessions and all recordings.

**REQ-2.4:** The system shall display session cards in a responsive grid layout (1 column mobile, 2 columns tablet, 4 columns desktop) showing:
- Gradient initial circle (first letter of title)
- Session title (line-clamp-2 for long titles)
- AI badge if `hasAIInsights` is true
- Date, time, and participant count with icons
- Hover effects: border color change to violet, shadow with violet tint, gradient overlay, arrow button expansion

**REQ-2.5:** The system shall provide a pre-join screen (`/room/[roomId]`) before entering the main room, allowing users to:
- View video preview (avatar circle if video enabled, or VideoOff icon)
- Toggle microphone and camera before joining
- See room ID information
- Navigate back to dashboard

#### Module 3: Real-time Collaboration

**REQ-3.1:** The system shall implement a 4-panel resizable layout in the room interface:
- **Participants Sidebar (Left, 256px, collapsible):** Displays meeting title, participant count, and scrollable list of participants with speaking indicators
- **Main Stage (Center, flexible width):** Displays screen share and/or whiteboard in single or split view
- **Chat/Notes Panel (Right, resizable 20%-50%, min 300px):** Tabs for Chat and Notes, can be closed
- **Transcript Panel (Right, resizable 20%-50%, min 300px):** Displays real-time transcript, can be closed

**REQ-3.2:** The system shall use `react-resizable-panels` library to enable users to resize panels by dragging resize handles, with hover effects showing violet color on handles.

**REQ-3.3:** The system shall persist panel sizes to `localStorage` with key `"stoom-panel-sizes"` and restore them when users return to the room.

**REQ-3.4:** The Participants Sidebar shall:
- Display meeting title in the header (from props or generated from roomId)
- Show participant count
- Display each participant with: avatar circle (gradient, first letter), name, mic/video status icons, speaking indicator (green dot + violet border highlight)
- Support collapse/expand functionality (collapses to 48px width)

**REQ-3.5:** The Main Stage shall:
- Support displaying screen share only, whiteboard only, or both in split view
- Provide a control bar (top-right) with auto-collapse after 3 seconds of no hover
- Allow toggling screen share, whiteboard, and layout (horizontal/vertical split) when both are visible
- Use `react-resizable-panels` for split view resizing

**REQ-3.6:** The Chat/Notes Panel shall:
- Provide tabs to switch between Chat and Notes
- Display scrollable chat messages with user name, timestamp, and message content
- Provide a chat input field (h-12, text-base) with Send button
- Show placeholder for Notes tab indicating Tiptap integration coming soon
- Include a close button (X) in the header

**REQ-3.7:** The Transcript Panel shall:
- Display scrollable transcript entries with speaker name, timestamp (MM:SS format), and text content
- Highlight active entries with violet background and left border
- Include a close button (X) in the header

**REQ-3.8:** The system shall implement a Floating Dock component at the bottom center of the room interface with:
- Auto-hide functionality (hides after 3 seconds of no hover, shows on hover or button click)
- Rounded pill shape with backdrop blur
- Buttons for: Mic toggle, Video toggle, Screen Share toggle, Record Meeting, Chat/Notes toggle, Transcript toggle, Leave Room
- Visual feedback: violet background for active states, red background for recording state

**REQ-3.9:** The Record Meeting button shall:
- Open a confirmation modal before starting or stopping recording
- Display different modal content for start (warning icon, explanation of recording scope) and stop (recording icon, save confirmation)
- Toggle recording state only after user confirmation

#### Module 4: AI Insights and Recordings

**REQ-4.1:** The system shall display real-time transcripts in the Transcript Panel during active meetings, showing speaker name, timestamp, and text content with active entry highlighting.

**REQ-4.2:** The system shall provide a recording detail page (`/recordings/[id]`) with:
- Sticky header showing session title, date, time, and duration
- Two-column layout: left (2/3 width) with tabs for Whiteboard, Transcript, Chat; right (1/3 width) with AI Insight Overview, Participants, and Session Statistics cards

**REQ-4.3:** The AI Insight Overview card shall:
- Display only when `session.hasAIInsights === true`
- Show gradient background (violet-50 to violet-100)
- Include header with Sparkles icon and "AI Generated" badge
- Display Key Points section (bullet list)
- Display Takeaways section (bullet list)

**REQ-4.4:** The Session Statistics card shall display:
- Duration (calculated from session data)
- Participant count
- Message count
- Transcript entry count
- AI Insights availability (badge)

**REQ-4.5:** The Whiteboard tab shall display a placeholder for whiteboard snapshot (aspect-video container) indicating where the final whiteboard state will be shown.

**REQ-4.6:** The Transcript and Chat tabs shall display the same content format as in-room panels, showing historical data from the completed session.

## 2.2. Use Case Diagrams

### 2.2.1. System-Level Use Case Diagram

The system-level use case diagram provides an overall view of the Stoom platform, showing the main functional areas and their relationships with actors. This high-level diagram is simplified to show the three primary use cases, which are then detailed in subsequent subsystem diagrams.

```plantuml
@startuml
left to right direction
skinparam packageStyle rectangle
skinparam monochrome true

actor User
actor "Room Host" as RoomHost
actor "Participant" as Participant
User <|-- RoomHost
User <|-- Participant

rectangle "STOOM SYSTEM" {
    usecase "Authenticate User" as UC_Auth
    usecase "Manage Account" as UC_ManageAccount
    usecase "Join Room" as UC_JoinRoom
    usecase "Manage Recordings" as UC_ManageRecordings
}

User --> UC_ManageAccount
User --> UC_JoinRoom
User --> UC_ManageRecordings

RoomHost --> UC_ManageAccount
RoomHost --> UC_JoinRoom
RoomHost --> UC_ManageRecordings

Participant --> UC_ManageAccount
Participant --> UC_JoinRoom
Participant --> UC_ManageRecordings

UC_ManageAccount ..> UC_Auth : <<include>>
UC_JoinRoom ..> UC_Auth : <<include>>
UC_ManageRecordings ..> UC_Auth : <<include>>

@enduml
```

### 2.2.2. Detailed Use Case: Manage Account

This diagram breaks down the "Manage Account" use case from the system-level diagram, showing the detailed interactions for authentication and profile management.

```plantuml
@startuml
left to right direction
skinparam packageStyle rectangle
skinparam monochrome true

actor User
actor "Room Host" as RoomHost
actor "Participant" as Participant
User <|-- RoomHost
User <|-- Participant

rectangle "MANAGE ACCOUNT SUBSYSTEM" {
    usecase "Authenticate User" as UC_Auth
    usecase "Manage Profile" as UC_Profile
    usecase "Change Password" as UC_ChangePassword
    usecase "Change Account Name" as UC_ChangeName
}

User --> UC_Profile
User --> UC_ChangePassword
User --> UC_ChangeName

RoomHost --> UC_Profile
RoomHost --> UC_ChangePassword
RoomHost --> UC_ChangeName

Participant --> UC_Profile
Participant --> UC_ChangePassword
Participant --> UC_ChangeName

UC_Profile ..> UC_Auth : <<include>>
UC_ChangePassword ..> UC_Auth : <<include>>
UC_ChangeName ..> UC_Auth : <<include>>

UC_ChangePassword ..> UC_Profile : <<extend>>
UC_ChangeName ..> UC_Profile : <<extend>>

@enduml
```

### 2.2.3. Detailed Use Case: Join Room

This diagram breaks down the "Join Room" use case from the system-level diagram, showing the detailed interactions for room creation, joining, and real-time collaboration features.

```plantuml
@startuml
left to right direction
skinparam packageStyle rectangle
skinparam monochrome true

actor User
actor "Room Host" as RoomHost
actor "Participant" as Participant
User <|-- RoomHost
User <|-- Participant

rectangle "JOIN ROOM SUBSYSTEM" {
    usecase "Authenticate User" as UC_Auth
    usecase "Create Room" as UC_CreateRoom
    usecase "Join Room" as UC_JoinRoom
    usecase "Join via Code" as UC_JoinCode
    usecase "Manage Room" as UC_ManageRoom
    usecase "Mute Participant" as UC_Mute
    usecase "Participate in Meeting" as UC_Participate
    usecase "Share Screen" as UC_ScreenShare
    usecase "Use Whiteboard" as UC_Whiteboard
    usecase "Send Chat Messages" as UC_Chat
    usecase "View Transcript" as UC_Transcript
}

RoomHost --> UC_CreateRoom
RoomHost --> UC_ManageRoom
RoomHost --> UC_JoinRoom
RoomHost --> UC_Participate

Participant --> UC_JoinRoom
Participant --> UC_Participate
Participant --> UC_ScreenShare
Participant --> UC_Whiteboard
Participant --> UC_Chat
Participant --> UC_Transcript

UC_CreateRoom ..> UC_Auth : <<include>>
UC_JoinRoom ..> UC_Auth : <<include>>
UC_ManageRoom ..> UC_Auth : <<include>>
UC_Participate ..> UC_Auth : <<include>>

UC_JoinCode ..> UC_JoinRoom : <<extend>>
UC_Mute ..> UC_ManageRoom : <<extend>>

UC_JoinRoom --> UC_Participate
UC_Participate --> UC_ScreenShare
UC_Participate --> UC_Whiteboard
UC_Participate --> UC_Chat
UC_Participate --> UC_Transcript

@enduml
```

### 2.2.4. Detailed Use Case: Manage Recordings

This diagram breaks down the "Manage Recordings" use case from the system-level diagram, showing the detailed interactions for viewing session history, recording details, and AI-generated insights.

```plantuml
@startuml
left to right direction
skinparam packageStyle rectangle
skinparam monochrome true

actor User
actor "Room Host" as RoomHost
actor "Participant" as Participant
User <|-- RoomHost
User <|-- Participant

rectangle "MANAGE RECORDINGS SUBSYSTEM" {
    usecase "Authenticate User" as UC_Auth
    usecase "View History" as UC_History
    usecase "View Recording Details" as UC_RecordingDetails
    usecase "View AI Insight" as UC_AIInsight
}

User --> UC_History
RoomHost --> UC_History
RoomHost --> UC_RecordingDetails
Participant --> UC_History
Participant --> UC_RecordingDetails

UC_History ..> UC_Auth : <<include>>
UC_RecordingDetails ..> UC_Auth : <<include>>

UC_AIInsight ..> UC_RecordingDetails : <<extend>>

@enduml
```

The actors interact with all three subsystems. The Manage Account Subsystem is accessed first for authentication, after which users can access the Join Room Subsystem to participate in collaborative sessions, and the Manage Recordings Subsystem to review past sessions and AI-generated insights.

### 2.2.5. Detailed Use Case Specifications

Four use cases are detailed below to illustrate the system's core functionality and interaction patterns, including the fundamental authentication use case.

#### Use Case 0: Authenticate User

| **Attribute** | **Description** |
|---------------|-----------------|
| **Use Case Name** | Authenticate User |
| **Actor** | User (base actor) |
| **Description** | A user authenticates with the system through Clerk authentication service, supporting email/password and social login methods (Google, GitHub). Upon successful authentication, the user gains access to protected features of the platform. |
| **Preconditions** | 1. User has a valid account or wishes to create one<br>2. User is on the sign-in or sign-up page<br>3. Clerk authentication service is accessible |
| **Postconditions** | 1. User is authenticated and has an active session<br>2. User is redirected to `/dashboard`<br>3. User can access protected routes and features<br>4. User's authentication status is maintained across the session |
| **Flow** | **Main Flow:**<br>1. User navigates to `/sign-in` or `/sign-up` page<br>2. System displays Clerk authentication interface with custom violet-themed styling<br>3. User selects authentication method (email/password or social login)<br>4. If email/password: User enters email and password, then clicks "Sign In"<br>5. If social login: User clicks social provider button (Google/GitHub) and authorizes<br>6. Clerk validates user credentials or processes social login<br>7. If credentials are valid, Clerk creates/updates user session<br>8. System receives authentication success response from Clerk<br>9. System redirects user to `/dashboard`<br>10. User's authentication status is stored in session<br><br>**Alternative Flow 6a:** If credentials are invalid:<br>6a.1. Clerk returns authentication error<br>6a.2. System displays error message "Invalid credentials"<br>6a.3. User can retry authentication or reset password<br><br>**Alternative Flow 4a:** If user selects "Sign Up" instead:<br>4a.1. User is redirected to `/sign-up` page<br>4a.2. User enters email, password, and confirms password<br>4a.3. Clerk creates new user account<br>4a.4. Continue with step 7<br><br>**Alternative Flow 7a:** If social login authorization is denied:<br>7a.1. User is returned to sign-in page<br>7a.2. User can try again or use email/password method |

#### Use Case 1: Join Room

| **Attribute** | **Description** |
|---------------|-----------------|
| **Use Case Name** | Join Room |
| **Actor** | Participant (specialized User) |
| **Description** | A user joins an existing meeting room by entering a room code or clicking a direct link. The system validates authentication, checks room existence and access permissions, displays the pre-join screen, and transitions the user to the main room interface. |
| **Preconditions** | 1. User is authenticated via Clerk<br>2. User is on the dashboard page (`/dashboard`)<br>3. Room with the provided code exists in the system<br>4. Room is not locked or user has valid password (if password required) |
| **Postconditions** | 1. User is in the active room interface (`/room/[roomId]`)<br>2. User's participant record is created in the session<br>3. User's media state (mic/video) is set according to room settings or user preferences<br>4. User can see other participants and interact with room features |
| **Flow** | **Main Flow:**<br>1. User clicks "Join with Code" button on dashboard<br>2. System displays dialog with room code input field<br>3. User enters room code and clicks "Join Room" or presses Enter<br>4. System validates user authentication status<br>5. System queries database for room with matching code<br>6. If room requires password, system prompts for password and validates<br>7. System creates or retrieves active meeting session for the room<br>8. System displays pre-join screen with video preview and media controls<br>9. User optionally toggles microphone and camera<br>10. User clicks "Join Room" button<br>11. System creates SessionParticipant record linking user to session<br>12. System initializes user's media streams (if LiveKit integrated)<br>13. System transitions to main room interface with 4-panel layout<br>14. System subscribes user to real-time updates (participants, chat, transcript)<br><br>**Alternative Flow 3a:** If room code is invalid or room does not exist:<br>3a.1. System displays error message "Room not found"<br>3a.2. User can retry or cancel<br><br>**Alternative Flow 6a:** If password is incorrect:<br>6a.1. System displays error message "Incorrect password"<br>6a.2. User can retry password entry or cancel<br><br>**Alternative Flow 4a:** If user is not authenticated:<br>4a.1. System redirects to `/sign-in`<br>4a.2. After authentication, system redirects back to join flow |

#### Use Case 2: Collaborate on Whiteboard

| **Attribute** | **Description** |
|---------------|-----------------|
| **Use Case Name** | Collaborate on Whiteboard |
| **Actor** | Participant (specialized User) |
| **Description** | A user draws, writes, or adds shapes on the collaborative whiteboard. The system updates the local canvas optimistically, synchronizes changes with other participants in real-time through a WebSocket connection, and persists the final state when the session ends. |
| **Preconditions** | 1. User is in an active room (`/room/[roomId]`)<br>2. Whiteboard panel is visible in Main Stage<br>3. User has permission to edit whiteboard (all participants have edit access)<br>4. WebSocket connection to sync engine (Liveblocks/Y.js) is established |
| **Postconditions** | 1. User's drawing appears on local canvas immediately<br>2. Other participants see the drawing within network latency time<br>3. Whiteboard state is synchronized across all clients<br>4. Final whiteboard snapshot is saved to database when session ends |
| **Flow** | **Main Flow:**<br>1. User clicks whiteboard toggle button in Floating Dock or Stage control bar<br>2. System displays whiteboard in Main Stage (if not already visible)<br>3. User selects drawing tool (pen, eraser, shape, text) from whiteboard toolbar<br>4. User performs drawing action (mouse down, drag, mouse up)<br>5. Client application (tldraw) updates local canvas optimistically<br>6. Client creates operation message containing: tool type, coordinates, color, stroke width, timestamp<br>7. Client sends operation message to Next.js server via WebSocket<br>8. Next.js server validates operation and forwards to sync engine (Liveblocks/Y.js)<br>9. Sync engine applies operation to shared document state<br>10. Sync engine broadcasts operation to all connected clients in the room<br>11. Other clients receive operation and update their local canvas<br>12. All clients display updated whiteboard state<br>13. Steps 4-12 repeat for each drawing action<br><br>**Alternative Flow 3a:** If whiteboard is not visible:<br>3a.1. System shows whiteboard in Main Stage<br>3a.2. Continue with step 3<br><br>**Alternative Flow 7a:** If WebSocket connection is lost:<br>7a.1. Client queues operations locally<br>7a.2. Client attempts to reconnect<br>7a.3. Upon reconnection, client syncs queued operations<br>7a.4. Continue with step 8<br><br>**Alternative Flow 8a:** If operation is invalid (e.g., user lost permission):<br>8a.1. Server rejects operation<br>8a.2. Server sends error message to client<br>8a.3. Client reverts optimistic update<br>8a.4. User sees error notification |

#### Use Case 3: Generate AI Summary

| **Attribute** | **Description** |
|---------------|-----------------|
| **Use Case Name** | Generate AI Summary |
| **Actor** | AI Assistant (System Actor), Room Host (triggers indirectly) |
| **Description** | After a meeting session ends, the system processes the session transcript, calls the Google Gemini API to generate intelligent insights, and saves the AI summary to the database. The summary includes key points and takeaways that are displayed on the recording detail page. |
| **Preconditions** | 1. Meeting session has ended (`endedAt` is set)<br>2. Session has transcript data (array of transcript entries)<br>3. Session has sufficient content (minimum transcript entries threshold met)<br>4. Google Gemini API is accessible and API key is valid |
| **Postconditions** | 1. `MeetingSession.hasAIInsights` is set to `true`<br>2. `MeetingSession.aiSummaryTitle`, `aiKeyPoints`, and `aiTakeaways` are populated<br>3. AI Insight Overview card is visible on recording detail page<br>4. AI badge appears on session card in dashboard |
| **Flow** | **Main Flow:**<br>1. Room Host ends the meeting session (clicks "Leave Room" or ends session)<br>2. System sets `MeetingSession.endedAt` timestamp<br>3. System calculates `durationSeconds` from `startedAt` and `endedAt`<br>4. System triggers background job to generate AI summary<br>5. Background job retrieves `MeetingSession.transcript` (JSON array)<br>6. Background job formats transcript into text prompt for Gemini API<br>7. Background job calls Google Gemini API with prompt requesting:<br>   - Summary title<br>   - List of key points (5-7 items)<br>   - List of takeaways (3-5 items)<br>8. Gemini API processes transcript and returns structured JSON response<br>9. Background job parses API response and extracts summary data<br>10. Background job updates `MeetingSession` record:<br>    - Sets `hasAIInsights = true`<br>    - Sets `aiSummaryTitle`<br>    - Sets `aiKeyPoints` (array)<br>    - Sets `aiTakeaways` (array)<br>11. System saves updated session to database<br>12. When user views recording detail page, system displays AI Insight Overview card<br><br>**Alternative Flow 7a:** If Gemini API call fails (network error, rate limit, invalid response):<br>7a.1. Background job logs error<br>7a.2. Background job retries up to 3 times with exponential backoff<br>7a.3. If all retries fail, job marks session with error flag<br>7a.4. `hasAIInsights` remains `false`<br>7a.5. User sees recording without AI insights<br><br>**Alternative Flow 3a:** If transcript is empty or has insufficient content:<br>3a.1. System skips AI summary generation<br>3a.2. `hasAIInsights` remains `false`<br>3a.3. Continue to step 11 (save session without AI data)<br><br>**Alternative Flow 9a:** If API response format is invalid:<br>9a.1. Background job attempts to parse and extract data with fallback logic<br>9a.2. If parsing fails, job logs error and marks session with error flag<br>9a.3. Continue with alternative flow 7a |

## 2.3. Activity Diagrams

Each use case specification has a corresponding activity diagram that illustrates the workflow using swimlanes (partitions) to separate activities by actor roles. All diagrams use PlantUML syntax with monochrome styling.

### 2.3.1. Use Case 0: Authenticate User

This activity diagram illustrates the authentication workflow based on the "Authenticate User" use case specification.

```plantuml
@startuml
skinparam monochrome true
skinparam activity {
    BackgroundColor #FFFFFF
    BorderColor #000000
    FontSize 10
}

|User|
start
:User navigates to /sign-in page;

|System|
:Display Clerk authentication interface;

|User|
:User selects authentication method;

if (Authentication Method?) then (Email/Password)
    :User enters credentials and clicks "Sign In";
    
    |System|
    :Clerk validates credentials;
    
    if (Credentials Valid?) then (No)
        |User|
        :System displays error message;
        :User can retry or reset password;
        stop
    else (Yes)
        |System|
        :Clerk creates user session;
        :System redirects to /dashboard;
        
        |User|
        :User is authenticated;
        stop
    endif
    
else (Social Login)
    :User clicks social provider and authorizes;
    
    |System|
    :Clerk processes social login;
    
    if (Authorization Granted?) then (No)
        |User|
        :Return to sign-in page;
        stop
    else (Yes)
        |System|
        :Clerk creates user session;
        :System redirects to /dashboard;
        
        |User|
        :User is authenticated;
        stop
    endif
endif

@enduml
```

### 2.3.2. Use Case 1: Join Room

This activity diagram illustrates the room joining workflow based on the "Join Room" use case specification.

```plantuml
@startuml
skinparam monochrome true
skinparam activity {
    BackgroundColor #FFFFFF
    BorderColor #000000
    FontSize 10
}

|Participant|
start
:User clicks "Join with Code" button\non dashboard;

|System|
:Display dialog with room code input field;

|Participant|
:User enters room code;
:User clicks "Join Room" or presses Enter;

|System|
:Validate user authentication status;

if (User Authenticated?) then (No)
    |Participant|
    :System redirects to /sign-in;
    :After authentication, system\nredirects back to join flow;
    |System|
    :Continue with room validation;
else (Yes)
endif

:Query database for room\nwith matching code;

if (Room Code Valid?) then (No)
    |Participant|
    :System displays error message\n"Room not found";
    :User can retry or cancel;
    stop
else (Yes)
    if (Room Requires Password?) then (Yes)
        |System|
        :System prompts for password;
        
        |Participant|
        :User enters password;
        
        |System|
        :System validates password;
        
        if (Password Correct?) then (No)
            |Participant|
            :System displays error message\n"Incorrect password";
            :User can retry password entry\nor cancel;
            stop
        else (Yes)
            |System|
            :Create or retrieve active\nmeeting session for the room;
        endif
    else (No)
        |System|
        :Create or retrieve active\nmeeting session for the room;
    endif
endif

:Display pre-join screen with\nvideo preview and media controls;

|Participant|
:User optionally toggles\nmicrophone and camera;
:User clicks "Join Room" button;

|System|
partition Parallel {
    :Create SessionParticipant record\nlinking user to session;
    :Initialize user's media streams\n(if LiveKit integrated);
}
:Transition to main room interface\nwith 4-panel layout;
:Subscribe user to real-time updates\n(participants, chat, transcript);

|Participant|
:User is in active room interface;
:User can see other participants\nand interact with room features;
stop

@enduml
```

### 2.3.3. Use Case 2: Collaborate on Whiteboard

This activity diagram illustrates the whiteboard collaboration workflow based on the "Collaborate on Whiteboard" use case specification.

```plantuml
@startuml
skinparam monochrome true
skinparam activity {
    BackgroundColor #FFFFFF
    BorderColor #000000
    FontSize 10
}

|Participant|
start
:User clicks whiteboard toggle button;

|System|
if (Whiteboard Visible?) then (No)
    :Show whiteboard in Main Stage;
else (Yes)
endif

|Participant|
:User selects drawing tool and performs action;

|Client App|
:Update local canvas optimistically;
:Create and send operation message\nvia WebSocket;

|Next.js Server|
:Validate operation;

if (Operation Valid?) then (No)
    |Participant|
    :Display error notification;
    stop
else (Yes)
    :Forward to sync engine;
endif

|Sync Engine|
:Apply operation to shared state;
:Broadcast to all clients;

|Client App|
:All clients update and display\nupdated whiteboard state;

|Participant|
:Drawing appears on all clients;
:Repeat for each drawing action;
stop

@enduml
```

### 2.3.4. Use Case 3: Generate AI Summary

This activity diagram illustrates the AI summary generation workflow based on the "Generate AI Summary" use case specification.

```plantuml
@startuml
skinparam monochrome true
skinparam activity {
    BackgroundColor #FFFFFF
    BorderColor #000000
    FontSize 10
}

|Room Host|
start
:Room Host ends meeting session;

|System|
:Set session end timestamp;
:Calculate duration;

if (Transcript Sufficient?) then (No)
    :Skip AI summary generation;
    :Save session without AI data;
    stop
else (Yes)
    :Trigger background job;
endif

|Background Job|
:Retrieve transcript;
:Format and call Google Gemini API;

|Google Gemini API|
:Process transcript and return response;

|Background Job|
if (API Call Successful?) then (No)
    :Retry up to 3 times;
    
    if (All Retries Failed?) then (Yes)
        :Mark session with error flag;
        :hasAIInsights remains false;
        stop
    else (No)
        :Retry API call;
    endif
else (Yes)
    :Parse response and extract data;
    :Update MeetingSession:\nhasAIInsights, aiSummaryTitle,\naiKeyPoints, aiTakeaways;
endif

|System|
:Save updated session to database;

|User|
:AI Insight Overview card displayed\non recording detail page;
stop

@enduml
```

**Swimlanes (Partitions) Used:**
- **User/Participant/Room Host:** Activities performed by human actors
- **System/Client App/Next.js Server/Sync Engine/Background Job/Google Gemini API:** Activities performed by system components

**Key Features:**
- Each diagram corresponds to a specific use case specification
- Swimlanes clearly separate actor responsibilities
- Decision points reflect alternative flows from specifications
- Parallel activities are shown using partition blocks
- All diagrams use monochrome styling for academic presentation

## 2.4. Sequence Diagrams

Sequence diagrams illustrate the technical interaction flows between system components for key use cases. All diagrams use Mermaid syntax.

### 2.4.1. Use Case 0: Authenticate User

This sequence diagram shows the authentication flow between the user, client application, Next.js server, and Clerk authentication service.

```mermaid
sequenceDiagram
    actor User
    participant Client as Client App
    participant Server as Next.js Server
    participant Clerk as Clerk Auth
    
    User->>Client: Navigate to /sign-in
    Client->>Server: Request sign-in page
    Server->>Client: Return sign-in page with Clerk component
    
    User->>Client: Enter credentials or click social login
    Client->>Clerk: Submit authentication request
    
    alt Email/Password
        Clerk->>Clerk: Validate credentials
        alt Invalid Credentials
            Clerk->>Client: Return error
            Client->>User: Display error message
        else Valid Credentials
            Clerk->>Clerk: Create/update user session
            Clerk->>Server: Return authentication token
            Server->>Server: Store session
            Server->>Client: Redirect to /dashboard
            Client->>User: Display dashboard
        end
    else Social Login
        Clerk->>Clerk: Process OAuth
        Clerk->>Server: Return authentication token
        Server->>Server: Store session
        Server->>Client: Redirect to /dashboard
        Client->>User: Display dashboard
    end
```

### 2.4.2. Use Case 1: Join Room

This sequence diagram shows the room joining flow including authentication check, room validation, and session initialization.

```mermaid
sequenceDiagram
    actor Participant
    participant Client as Client App
    participant Server as Next.js Server
    participant DB as Database
    participant LiveKit as LiveKit
    
    Participant->>Client: Click "Join with Code"
    Client->>Server: Request join dialog
    Server->>Client: Return join dialog
    
    Participant->>Client: Enter room code and submit
    Client->>Server: POST /api/rooms/join {roomCode}
    
    Server->>Server: Validate authentication
    Server->>DB: Query room by code
    
    alt Room Not Found
        DB->>Server: Return null
        Server->>Client: Return error "Room not found"
        Client->>Participant: Display error
    else Room Found
        DB->>Server: Return room data
        
        alt Room Requires Password
            Server->>Client: Request password
            Participant->>Client: Enter password
            Client->>Server: POST password
            Server->>Server: Validate password
            
            alt Invalid Password
                Server->>Client: Return error
                Client->>Participant: Display error
            else Valid Password
                Server->>DB: Create/retrieve session
                DB->>Server: Return session
                Server->>Client: Return pre-join screen
            end
        else No Password Required
            Server->>DB: Create/retrieve session
            DB->>Server: Return session
            Server->>Client: Return pre-join screen
        end
        
        Client->>Participant: Display pre-join screen
        
        Participant->>Client: Toggle media and click "Join"
        Client->>Server: POST /api/sessions/join
        
        Server->>DB: Create SessionParticipant record
        Server->>LiveKit: Initialize media streams
        LiveKit->>Client: Return stream connection
        
        Server->>Client: Return room interface
        Client->>Participant: Display main room interface
    end
```

### 2.4.3. Use Case 2: Collaborate on Whiteboard

This sequence diagram shows the simplified whiteboard collaboration flow with real-time synchronization.

```mermaid
sequenceDiagram
    actor Participant
    participant Client as Client App
    participant Server as Next.js Server
    participant Sync as Sync Engine
    participant DB as Database
    
    Participant->>Client: Select tool and draw
    Client->>Client: Update local canvas (optimistic)
    
    Client->>Server: Send operation via WebSocket
    Server->>Server: Validate operation
    Server->>Sync: Forward operation
    
    Sync->>Sync: Apply to shared state
    Sync->>Server: Broadcast to all clients
    
    par Broadcast to All Clients
        Server->>Client: Update (User's client)
        Server->>Client: Update (Other Participant 1)
        Server->>Client: Update (Other Participant 2)
    end
    
    Client->>Client: Apply operation to canvas
    Client->>Participant: Display updated whiteboard
    
    Note over Participant: Repeat for each drawing action
    
    Participant->>Server: End session
    Server->>Sync: Request snapshot
    Sync->>Server: Return whiteboard snapshot
    Server->>DB: Save snapshot to MeetingSession
    DB->>Server: Confirm save
    Server->>Participant: Redirect to dashboard
```

### 2.4.4. Use Case 3: Generate AI Summary

This sequence diagram shows the AI summary generation flow triggered after a session ends.

```mermaid
sequenceDiagram
    actor Host as Room Host
    participant Server as Next.js Server
    participant DB as Database
    participant Gemini as Google Gemini API
    
    Host->>Server: End meeting session
    Server->>DB: Update MeetingSession.endedAt
    Server->>DB: Calculate duration
    
    alt Transcript Insufficient
        Server->>DB: Save session (no AI data)
        Server->>Host: Session saved
    else Transcript Sufficient
        Server->>DB: Retrieve transcript
        Server->>Server: Format transcript into prompt
        Server->>Gemini: Call API with prompt
        
        alt API Call Failed
            Server->>Server: Retry (up to 3 times)
            alt All Retries Failed
                Server->>DB: Mark error flag
                DB->>Server: hasAIInsights = false
            else Retry Successful
                Gemini->>Server: Return summary data
                Server->>DB: Update MeetingSession with AI data
            end
        else API Call Successful
            Gemini->>Server: Return structured JSON response
            Server->>Server: Parse and extract data
            Server->>DB: Update MeetingSession:<br/>hasAIInsights, aiSummaryTitle,<br/>aiKeyPoints, aiTakeaways
        end
        
        DB->>Server: Confirm update
        Server->>Host: Session saved with AI insights
    end
    
    Host->>Server: View recording detail page
    Server->>DB: Query session with AI data
    DB->>Server: Return session data
    Server->>Host: Display AI Insight Overview card
```

**Key Interaction Patterns:**
1. **Authentication Flow:** User → Client → Server → Clerk → Server → Client → User
2. **Room Joining:** Includes validation, password check, and session initialization
3. **Real-time Collaboration:** Optimistic updates with WebSocket broadcasting
4. **AI Processing:** Asynchronous background job with retry logic and error handling

## 2.5. State Diagram

State diagrams illustrate the lifecycle of key system entities. The diagrams are broken down into separate views for better understanding and visualization.

### 2.5.1. Meeting Session Lifecycle

This diagram shows the main lifecycle of a meeting session from creation to completion.

```plantuml
@startuml
skinparam monochrome true
skinparam shadowing false
hide empty description

[*] --> Created : Room Host creates meeting

Created : Waiting for participants

Created --> Active : First participant joins

Active : Meeting in progress
Active : Real-time collaboration active

Active --> Paused : All participants leave
Paused --> Active : Participant rejoins

Active --> Ending : Room Host ends session

Ending : Saving session data
Ending : Saving whiteboard, notes, transcript

Ending --> Completed : All data saved

Completed : Session ended
Completed : Data saved

Completed --> Processed : Ready for viewing

Processed : Available for viewing
Processed : AI insights displayed (if available)

Processed --> [*] : Session archived

@enduml
```

### 2.5.2. AI Processing State

This diagram shows the AI summary generation process that occurs after a session is completed.

```plantuml
@startuml
skinparam monochrome true
skinparam shadowing false
hide empty description

[*] --> Checking : Session completed

Checking : Check transcript sufficiency

Checking --> Skipped : Transcript insufficient
Skipped : Skip AI processing
Skipped --> [*] : hasAIInsights = false

Checking --> CallingAPI : Transcript sufficient

CallingAPI : Call Google Gemini API

CallingAPI --> Successful : API call successful
CallingAPI --> Retrying : API call failed

Retrying : Retry (up to 3 times)
Retrying --> CallingAPI : Retry attempt
Retrying --> Failed : All retries failed

Successful : Parse API response
Successful : Extract summary data
Successful --> Updating : Data extracted

Updating : Update MeetingSession
Updating : Set hasAIInsights = true
Updating --> [*] : AI summary saved

Failed : Mark error flag
Failed : hasAIInsights = false
Failed --> [*] : Processing failed

@enduml
```

**State Descriptions:**

**Meeting Session Lifecycle:**
- **Created:** Initial state when a meeting room is created, waiting for participants to join.
- **Active:** Meeting is in progress with participants collaborating using real-time features.
- **Paused:** Temporary state when all participants have left but session hasn't ended.
- **Ending:** System is saving all session data (whiteboard, notes, transcript).
- **Completed:** Session has ended and all data has been saved.
- **Processed:** Final state where session is available for viewing with AI insights (if available).

**AI Processing State:**
- **Checking:** System checks if transcript has sufficient content for AI processing.
- **Skipped:** AI processing is skipped due to insufficient transcript.
- **CallingAPI:** System calls Google Gemini API to generate summary.
- **Retrying:** System retries API call after failure (up to 3 times).
- **Successful:** API call succeeded, response is being parsed.
- **Updating:** System updates MeetingSession with AI summary data.
- **Failed:** All retry attempts failed, session marked with error flag.

**State Transitions:**
- Main lifecycle transitions are triggered by user actions (join, leave, end session).
- AI processing transitions are triggered automatically after session completion.
- Error handling includes retry logic with maximum 3 attempts.

## 2.6. Class Diagram (Data Model)

The class diagram below represents the database schema based on Prisma/MongoDB structure. This diagram illustrates the entities, their attributes, and relationships within the Stoom platform.

```mermaid
classDiagram
    class User {
        +String id (PK, Clerk User ID)
        +String email (unique)
        +String? name
        +String? avatar
        +DateTime createdAt
        +Room[] hostedRooms
        +SessionParticipant[] sessions
    }
    
    class Room {
        +String id (PK, UUID)
        +String title
        +String hostId (FK)
        +Json? settings
        +DateTime createdAt
        +User host
        +MeetingSession[] sessions
    }
    
    class MeetingSession {
        +String id (PK, ObjectId)
        +String roomId (FK)
        +DateTime startedAt
        +DateTime? endedAt
        +Int? durationSeconds
        +Json? whiteboardSnapshot
        +Json? notesContent
        +Json? transcript
        +Boolean hasAIInsights
        +String? aiSummaryTitle
        +String[] aiKeyPoints
        +String[] aiTakeaways
        +Int messageCount
        +Int transcriptCount
        +Room room
        +SessionParticipant[] participants
    }
    
    class SessionParticipant {
        +String id (PK, ObjectId)
        +String userId (FK)
        +String sessionId (FK, ObjectId)
        +DateTime joinedAt
        +User user
        +MeetingSession session
    }
    
    User "1" --> "*" Room : hosts
    User "1" --> "*" SessionParticipant : participates
    Room "1" --> "*" MeetingSession : contains
    MeetingSession "1" --> "*" SessionParticipant : has
```

### Entity Descriptions

#### User Entity
The **User** entity represents authenticated users in the system. The primary key `id` uses the Clerk User ID (String) to integrate seamlessly with Clerk authentication. The entity maintains a one-to-many relationship with `Room` (as host) and a many-to-many relationship with `MeetingSession` through `SessionParticipant`.

**Key Attributes:**
- `id`: Clerk User ID, serves as primary key
- `email`: Unique email address for user identification
- `name`: Optional display name
- `avatar`: Optional avatar URL
- `createdAt`: Timestamp of account creation

#### Room Entity
The **Room** entity represents a meeting room created by a Room Host. Each room has a unique identifier, title, and optional settings stored as JSON. The room maintains a relationship with its host (User) and can have multiple meeting sessions.

**Key Attributes:**
- `id`: UUID primary key
- `title`: Meeting room title (required, set during creation)
- `hostId`: Foreign key to User who created the room
- `settings`: JSON object containing room configuration:
  - `muteOnJoin`: Boolean - mute microphone on join
  - `cameraOffOnJoin`: Boolean - turn off camera on join
  - `password`: String? - optional room password
- `createdAt`: Timestamp of room creation

#### MeetingSession Entity
The **MeetingSession** entity represents an active or completed meeting session within a room. This entity stores all session content (whiteboard, notes, transcript) and AI-generated insights. The session is linked to a room and has multiple participants.

**Key Attributes:**
- `id`: MongoDB ObjectId primary key
- `roomId`: Foreign key to Room
- `startedAt`: Session start timestamp
- `endedAt`: Optional session end timestamp (null if active)
- `durationSeconds`: Calculated duration in seconds
- `whiteboardSnapshot`: JSON object storing final whiteboard state from tldraw
- `notesContent`: JSON object storing collaborative notes from Tiptap
- `transcript`: JSON array of transcript entries:
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
- `hasAIInsights`: Boolean flag indicating if AI summary is available
- `aiSummaryTitle`: Title of AI-generated summary
- `aiKeyPoints`: Array of key point strings extracted by AI
- `aiTakeaways`: Array of takeaway strings generated by AI
- `messageCount`: Total number of chat messages in session
- `transcriptCount`: Total number of transcript entries

#### SessionParticipant Entity
The **SessionParticipant** entity represents the many-to-many relationship between Users and MeetingSessions. This junction table tracks which users participated in which sessions and when they joined.

**Key Attributes:**
- `id`: MongoDB ObjectId primary key
- `userId`: Foreign key to User
- `sessionId`: Foreign key to MeetingSession
- `joinedAt`: Timestamp when user joined the session

### Relationship Descriptions

1. **User → Room (1-to-Many):** A User can host multiple Rooms. Each Room has exactly one host (User). This relationship is represented by `hostedRooms` in User and `host` in Room.

2. **User → MeetingSession (Many-to-Many):** A User can participate in multiple MeetingSessions, and a MeetingSession can have multiple Users. This many-to-many relationship is implemented through the `SessionParticipant` junction entity.

3. **Room → MeetingSession (1-to-Many):** A Room can have multiple MeetingSessions (e.g., recurring meetings). Each MeetingSession belongs to exactly one Room.

4. **MeetingSession → SessionParticipant (1-to-Many):** A MeetingSession has multiple SessionParticipant records, each representing one user's participation in that session.

### Data Type Specifications

- **JSON Fields:** Used for flexible data structures:
  - `Room.settings`: Room configuration options
  - `MeetingSession.whiteboardSnapshot`: tldraw document state
  - `MeetingSession.notesContent`: Tiptap document state
  - `MeetingSession.transcript`: Array of transcript entries

- **Array Fields:** Used for lists:
  - `MeetingSession.aiKeyPoints`: String array
  - `MeetingSession.aiTakeaways`: String array

- **Optional Fields:** Represented with `?` in TypeScript/Prisma:
  - Fields that may not have values initially (e.g., `endedAt`, `aiSummaryTitle`)

This data model supports the functional requirements by providing structured storage for user accounts, room configurations, session content, and AI-generated insights, enabling the platform to deliver real-time collaboration and post-session analysis features.

## Chapter 3: Implementation

The Stoom platform is built using Next.js 16 App Router with route groups for logical organization. This chapter describes the user interactions and functionality available across all routes:

**Marketing Route (`/`):** Users can browse the public landing page to learn about the platform features (Real-time Video, Collaborative Whiteboard, Shared Notes, AI Insights). Users can navigate to sign-in or sign-up pages to begin using the platform. No authentication required.

**Authentication Routes:** **Sign In (`/sign-in`):** Users can authenticate using email/password credentials or social login providers (Google, GitHub). Upon successful authentication, users are automatically redirected to the dashboard. **Sign Up (`/sign-up`):** New users can create an account using email/password or social registration. After successful registration, users are redirected to the dashboard to start using the platform.

**Dashboard Route (`/dashboard`):** Users can switch between "Dashboard" and "Recordings" tabs. In the Dashboard tab, users can join existing rooms by entering a room code (opens dialog, navigates to room), create new meetings with custom settings (meeting title, mute on join, camera off, password protection), and view recent sessions in a grid. Users can click "View Details" on any session card to navigate to the recording detail page. In the Recordings tab, users can browse all their past session recordings in a grid layout and access detailed views by clicking session cards. Users can also access their profile settings via the user button in the header.

**Recordings Routes:** **List (`/recordings`):** Users can view all their past session recordings in a grid, filter and browse through their history, and navigate to detailed views by clicking on session cards. **Detail (`/recordings/[id]`):** Users can view comprehensive session information including whiteboard snapshots, full transcripts with speaker identification and timestamps, complete chat history, AI-generated insights (key points and takeaways when available), participant list with speaking indicators, and session statistics (duration, participant count, message count, transcript entries). Users can navigate back to the recordings list. Users can switch between Whiteboard, Transcript, and Chat tabs to view different aspects of the session.

**Room Route (`/room/[roomId]`):** Before joining, users can test their microphone and camera, toggle media devices on/off, and then join the room. Once in the room, users can toggle microphone on/off, toggle camera on/off, share their screen with other participants, toggle whiteboard visibility, switch between horizontal and vertical layout for screen share and whiteboard, view and interact with the participants list (see who's speaking, mute status, video status), send chat messages to all participants, view and edit collaborative notes, view real-time transcript with active entry highlighting, start/stop recording the meeting (with confirmation), resize panels (participants sidebar, chat/notes panel, transcript panel) with sizes persisted across sessions, collapse/expand the participants sidebar, show/hide chat and notes panel, show/hide transcript panel, and leave the room (returns to dashboard). The floating dock auto-hides after inactivity and reappears on hover or interaction.

**API Routes:** **Clerk Proxy (`/api/clerk/[...clerk]`):** Handles all authentication requests from Clerk service, enabling sign-in, sign-up, and session management functionality throughout the platform.

## Conclusion

This capstone project successfully developed Stoom, a comprehensive "Study Together Platform" that integrates Video Conferencing, Whiteboard, and Shared Notes into a unified interface, solving the fragmentation problem in online collaborative learning.

### 1. Obtained Results / Achievements

The project has achieved significant milestones:

* **System Completeness:** Successfully integrated Video Conferencing, Whiteboard, and Shared Notes into a single interface, eliminating the need to switch between multiple applications during study sessions.

* **Real-time Performance:** Implemented low-latency communication using **LiveKit (SFU architecture)** for media streaming and **Y.js** for collaborative drawing and editing, enabling smooth collaboration with multiple concurrent participants.

* **AI Integration:** Integrated **Google Gemini API** to automatically convert speech to text and generate intelligent summaries with key points and takeaways, transforming raw meeting data into actionable learning materials.

* **Modern Architecture:** Built a scalable, type-safe full-stack application using **Next.js 16**, **TypeScript**, **Clerk Auth**, and **Prisma/MongoDB**, ensuring maintainability and performance.

* **UX/UI:** Delivered a modern, dark-mode compatible interface with Resizable Panels and Floating Docks, providing intuitive controls and customizable workspace layouts.

### 2. Limitations and Future Development

#### Limitations

* **Dependency Risks:** Heavy reliance on third-party services (LiveKit, Clerk, Google Gemini) creates potential single points of failure if service outages occur.

* **AI Latency:** Summary generation for long sessions may experience delays depending on Gemini API response speed, affecting immediate availability of insights.

* **Mobile Experience:** Complex interactions like whiteboard drawing are optimized for Desktop/Tablet and may be difficult to use on small smartphone screens.

* **Offline Mode:** The application requires an active internet connection for all features; no offline support is currently implemented.

#### Future Development / Orientation

* **Mobile App:** Develop a native mobile version (React Native/Flutter) to improve the drawing experience on phones with better touch input handling.

* **Advanced AI Features:** Implement "Quiz Generation" (AI creates quizzes from transcripts) and "Semantic Search" (search for concepts within recorded videos) to transform the platform into a comprehensive learning management system.

* **Scheduling Integration:** Integrate with Google Calendar and Microsoft Outlook for streamlined study session planning.

* **Pro Features:** Implement cloud storage management (AWS S3) and premium plans for extended meeting durations, higher quality recordings, and priority AI processing.

The Stoom platform successfully demonstrates the integration of modern web technologies to address real-world challenges in online collaborative learning. While current limitations exist, the foundation has been established for continued development and enhancement.

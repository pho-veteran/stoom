# ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS) - CẬP NHẬT V2.0

**Dự án:** Stoom – Study Together Platform
**Phiên bản UI:** Dựa trên `ui-insight.md`
**Công nghệ lõi:** Next.js 16, Clerk, LiveKit, tldraw, Tiptap, Gemini, Shadcn/ui.

-----

## 1\. Tech Stack & Design System

### 1.1. Công nghệ (Cập nhật)

  * **Frontend:** Next.js 16 (App Router), TypeScript.
  * **Authentication:** **Clerk** (Thay thế hoàn toàn các tùy chọn khác).
  * **UI Library:** Shadcn/ui, Tailwind CSS.
  * **Layout Engine:** `react-resizable-panels` (Quản lý việc chia cột trong phòng).
  * **Real-time:** LiveKit (WebRTC), tldraw (Whiteboard), Tiptap (Notes), Gemini (AI).

### 1.2. Design System (Cụ thể hóa)

  * **Màu chủ đạo:** Violet-600 (Light) / Violet-500 (Dark).
  * **Font:** `Geist Sans` & `Geist Mono`.
  * **Trạng thái màu:**
      * Emerald-500: Active Speaker / Online.
      * Rose-500: Error / Leave Room / Recording.
      * Amber-500: Warning.

-----

## 2\. Yêu Cầu Chức Năng (Functional Requirements)

### 2.1. Authentication (Clerk Flow)

  * **FR-AUTH-01:** Sử dụng Clerk Middleware để bảo vệ toàn bộ route trong nhóm `(dashboard)` và `(room)`.
  * **FR-AUTH-02:** Trang Sign-in/Sign-up riêng biệt với giao diện căn giữa (Centered layout), nền gradient.
  * **FR-AUTH-03:** Redirect người dùng về `/dashboard` ngay sau khi đăng nhập thành công.

### 2.2. Dashboard & Quản lý phòng

  * **FR-DASH-01 (Join Room):** Dialog "Join with Code" cho phép nhập mã phòng và điều hướng tới `/room/[code]`.
  * **FR-DASH-02 (New Meeting):** Dialog tạo phòng cho phép cài đặt trước:
      * Đặt tiêu đề phòng.
      * Tùy chọn: Tắt Mic/Cam khi vào, Đặt mật khẩu.
  * **FR-DASH-03 (Session Cards):** Hiển thị danh sách buổi học với Badge "AI Generated" (nếu có), số người tham gia, thời gian.

### 2.3. Trải nghiệm trong phòng (In-Room Experience)

  * **FR-ROOM-01 (Pre-join):** Màn hình chờ cho phép xem trước Camera, tắt/bật Mic trước khi bấm "Join".
  * **FR-ROOM-02 (Layout Linh hoạt):** Hệ thống hỗ trợ 4 khu vực (Areas) chính:
    1.  **Participants Sidebar (Trái):** Danh sách người tham gia, hiển thị trạng thái đang nói (Green dot), có thể thu gọn (Collapse).
    2.  **Main Stage (Giữa):** Hiển thị Screen Share hoặc Whiteboard (hoặc Split view cả hai).
    3.  **Chat/Notes Panel (Phải):** Tab chuyển đổi giữa Chat và Ghi chú chung (Tiptap). Có thể Resize hoặc đóng.
    4.  **Transcript Panel (Phải):** Panel riêng biệt hiển thị hội thoại thời gian thực. Có thể Resize hoặc đóng.
  * **FR-ROOM-03 (Floating Dock):** Thanh điều khiển nổi ở dưới cùng, tự động ẩn sau 3 giây không di chuột. Chứa các nút:
      * Mic, Camera, Share Screen.
      * **Record Meeting** (Hiện modal xác nhận Start/Stop).
      * Toggle Chat/Notes, Toggle Transcript.
      * Leave Room (Nút đỏ).

### 2.4. Tính năng AI & Recording

  * **FR-AI-01 (Live Transcript):** Hiển thị tên người nói, timestamp và nội dung text highlight theo thời gian thực tại Transcript Panel.
  * **FR-AI-02 (Post-Session Insight):** Tại trang chi tiết buổi học `/recordings/[id]`:
      * Hiển thị **AI Insight Overview Card**: Tóm tắt Key Points, Takeaways (chỉ hiện khi có dữ liệu AI).
      * Hiển thị **Session Statistics**: Thời lượng, số tin nhắn, số người tham gia.

-----

## 3\. Cập nhật Thiết kế Database (Prisma Schema)

Dựa trên UI Insight mới, Database cần thêm các trường để phục vụ Dashboard và Recording Details.

```prisma
// schema.prisma

model User {
  id        String   @id @map("_id") // Sử dụng Clerk User ID (String) làm khóa chính
  email     String   @unique
  name      String?
  avatar    String?
  createdAt DateTime @default(now())
  
  hostedRooms Room[] @relation("Host")
  sessions    SessionParticipant[]
}

model Room {
  id        String   @id @default(uuid()) @map("_id")
  title     String   // Bắt buộc theo FR-DASH-02
  hostId    String
  settings  Json?    // Lưu settings: muteOnJoin, cameraOffOnJoin, password
  createdAt DateTime @default(now())
  
  host      User     @relation("Host", fields: [hostId], references: [id])
  sessions  MeetingSession[]
}

model MeetingSession {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  roomId          String
  startedAt       DateTime @default(now())
  endedAt         DateTime?
  durationSeconds Int?     // Cho FR-AI-02 (Statistics)
  
  // Content Data
  whiteboardSnapshot Json?
  notesContent       Json?
  transcript         Json?    // Lưu mảng object {speaker, time, text}
  
  // AI Data
  hasAIInsights      Boolean  @default(false) // Badge hiển thị trên UI
  aiSummaryTitle     String?
  aiKeyPoints        String[] // List Key Points
  aiTakeaways        String[] // List Takeaways

  // Stats
  messageCount       Int      @default(0)
  transcriptCount    Int      @default(0)

  room         Room     @relation(fields: [roomId], references: [id])
  participants SessionParticipant[]
}

model SessionParticipant {
  id        String  @id @default(auto()) @map("_id") @db.ObjectId
  userId    String
  sessionId String  @db.ObjectId
  joinedAt  DateTime @default(now())
  
  user      User           @relation(fields: [userId], references: [id])
  session   MeetingSession @relation(fields: [sessionId], references: [id])
}
```
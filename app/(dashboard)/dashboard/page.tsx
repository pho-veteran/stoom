"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Hash,
  Video,
  Settings,
  Lock,
  Calendar,
  Clock,
  Users,
  ChevronRight,
  Circle,
  MessageSquare,
  Loader2,
  PenTool,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import axios from "axios";
import { format } from "date-fns";

interface Session {
  id: string;
  code: string;
  name: string;
  status: "WAITING" | "ACTIVE" | "ENDED";
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
  participantCount: number;
  messageCount: number;
  isOwner: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [isNewMeetingDialogOpen, setIsNewMeetingDialogOpen] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);

  // New Meeting form state
  const [meetingTitle, setMeetingTitle] = useState("");
  const [requirePassword, setRequirePassword] = useState(false);
  const [roomPassword, setRoomPassword] = useState("");
  const [restrictWhiteboard, setRestrictWhiteboard] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch sessions on mount
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await axios.get("/api/sessions");
        setSessions(response.data.sessions);
      } catch (error) {
        console.error("Error fetching sessions:", error);
      } finally {
        setIsLoadingSessions(false);
      }
    };
    fetchSessions();
  }, []);

  const handleJoinRoom = () => {
    if (roomCode.trim()) {
      router.push(`/room/${roomCode.trim()}`);
      setIsJoinDialogOpen(false);
    }
  };

  const handleCreateMeeting = async () => {
    if (!meetingTitle.trim()) return;

    setIsCreating(true);
    try {
      const response = await fetch("/api/room/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: meetingTitle,
          password: requirePassword ? roomPassword : null,
          whiteboardPermission: restrictWhiteboard ? "restricted" : "open",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create room");
      }

      const data = await response.json();
      router.push(`/room/${data.room.code}`);
      setIsNewMeetingDialogOpen(false);
      setMeetingTitle("");
      setRequirePassword(false);
      setRoomPassword("");
      setRestrictWhiteboard(false);
    } catch (error) {
      console.error("Error creating meeting:", error);
      alert("Failed to create meeting. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusBadge = (status: Session["status"]) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
            <Circle className="h-2 w-2 fill-emerald-500 text-emerald-500" />
            Active
          </span>
        );
      case "ENDED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            Ended
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
            Waiting
          </span>
        );
    }
  };

  // Get recent sessions (last 6)
  const recentSessions = sessions.slice(0, 6);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-card/95 backdrop-blur-xl supports-backdrop-filter:bg-card/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white font-bold">
              S
            </div>
            <span className="text-xl font-bold bg-linear-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              Stoom
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/sessions">
              <Button variant="ghost" size="sm" className="gap-2">
                <Calendar className="h-4 w-4" />
                Sessions
              </Button>
            </Link>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-9 w-9 ring-2 ring-violet-200 dark:ring-violet-800",
                },
              }}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative flex-1">
        <div className="absolute inset-0 bg-linear-to-br from-violet-50/30 via-background to-slate-50/30 dark:from-slate-950/50 dark:via-background dark:to-slate-900/50" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]" />
        <div className="container relative z-10 mx-auto px-6 py-8 md:py-12">
          {/* Hero Section */}
          <div className="mb-12">
            <h1 className="mb-3 text-3xl font-bold tracking-tight md:text-4xl">
              Welcome back
            </h1>
            <p className="text-lg text-muted-foreground">
              Start a new meeting or join an existing session
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid gap-4 md:grid-cols-2 mb-12">
            {/* Join Room Card */}
            <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
              <DialogTrigger asChild>
                <button className="group relative cursor-pointer overflow-hidden rounded-xl border-2 border-border bg-card p-6 text-left transition-all duration-300 hover:border-violet-300 hover:shadow-xl hover:shadow-violet-500/10 dark:hover:border-violet-800">
                  <div className="absolute inset-0 bg-linear-to-br from-violet-50/0 to-violet-100/0 transition-opacity duration-300 group-hover:from-violet-50/50 group-hover:to-violet-100/30 dark:group-hover:from-violet-950/20 dark:group-hover:to-violet-900/20" />
                  <div className="relative z-10">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950/50">
                      <Hash className="h-6 w-6 text-violet-600 dark:text-violet-400" strokeWidth={2} />
                    </div>
                    <h3 className="mb-1 text-lg font-bold">Join with Code</h3>
                    <p className="text-sm text-muted-foreground">
                      Enter a room code to join an existing session
                    </p>
                  </div>
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Join Room with Code</DialogTitle>
                  <DialogDescription>
                    Enter the room code to join an existing study session
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <div className="space-y-2">
                    <Label htmlFor="room-code" className="text-sm font-medium">
                      Room Code
                    </Label>
                    <Input
                      id="room-code"
                      placeholder="Enter room code"
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && roomCode.trim()) {
                          handleJoinRoom();
                        }
                      }}
                      className="h-11"
                      autoFocus
                    />
                  </div>
                </div>
                <DialogFooter className="gap-3">
                  <Button variant="outline" onClick={() => setIsJoinDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleJoinRoom}
                    disabled={!roomCode.trim()}
                    className="bg-violet-600 hover:bg-violet-700 text-white"
                  >
                    Join Room
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* New Meeting Card */}
            <Dialog open={isNewMeetingDialogOpen} onOpenChange={setIsNewMeetingDialogOpen}>
              <DialogTrigger asChild>
                <button className="group relative cursor-pointer overflow-hidden rounded-xl border-2 border-violet-200 bg-linear-to-br from-violet-50 to-purple-50 p-6 text-left transition-all duration-300 hover:border-violet-400 hover:shadow-xl hover:shadow-violet-500/20 dark:border-violet-800 dark:from-violet-950/50 dark:to-purple-950/50 dark:hover:border-violet-600">
                  <div className="relative z-10">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-violet-600 text-white">
                      <Plus className="h-6 w-6" strokeWidth={2} />
                    </div>
                    <h3 className="mb-1 text-lg font-bold">New Meeting</h3>
                    <p className="text-sm text-muted-foreground">
                      Create a new study session and invite others
                    </p>
                  </div>
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950/50">
                      <Video className="h-5 w-5 text-violet-600 dark:text-violet-400" strokeWidth={2} />
                    </div>
                    <div>
                      <DialogTitle>Create New Meeting</DialogTitle>
                      <DialogDescription className="mt-1">
                        Set up your study session
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="meeting-title" className="text-sm font-semibold">
                      Meeting Title
                    </Label>
                    <Input
                      id="meeting-title"
                      placeholder="e.g., Math Study Group"
                      value={meetingTitle}
                      onChange={(e) => setMeetingTitle(e.target.value)}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-4 border-t border-border pt-4">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
                      <Label className="text-sm font-semibold">Settings</Label>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="require-password"
                          checked={requirePassword}
                          onCheckedChange={(checked) => setRequirePassword(checked === true)}
                        />
                        <Label htmlFor="require-password" className="text-sm cursor-pointer flex items-center gap-2">
                          <Lock className="h-4 w-4" strokeWidth={1.5} />
                          Require password
                        </Label>
                      </div>

                      {requirePassword && (
                        <Input
                          placeholder="Enter room password"
                          type="password"
                          value={roomPassword}
                          onChange={(e) => setRoomPassword(e.target.value)}
                          className="h-10 pl-6"
                        />
                      )}

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="restrict-whiteboard"
                          checked={restrictWhiteboard}
                          onCheckedChange={(checked) => setRestrictWhiteboard(checked === true)}
                        />
                        <Label htmlFor="restrict-whiteboard" className="text-sm cursor-pointer flex items-center gap-2">
                          <PenTool className="h-4 w-4" strokeWidth={1.5} />
                          Restrict whiteboard access
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter className="gap-3">
                  <Button variant="outline" onClick={() => setIsNewMeetingDialogOpen(false)} disabled={isCreating}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateMeeting}
                    disabled={!meetingTitle.trim() || isCreating}
                    className="bg-violet-600 hover:bg-violet-700 text-white"
                  >
                    {isCreating ? "Creating..." : "Create Meeting"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Recent Sessions */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Recent Sessions</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Your recent meeting history
                </p>
              </div>
              {sessions.length > 0 && (
                <Link href="/sessions">
                  <Button variant="ghost" size="sm" className="gap-1">
                    View all
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>

            {isLoadingSessions ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
              </div>
            ) : recentSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card p-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-950/50 mb-4">
                  <Video className="h-7 w-7 text-violet-600 dark:text-violet-400" />
                </div>
                <p className="mb-2 text-lg font-semibold">No sessions yet</p>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Create your first study session to get started
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentSessions.map((session) => (
                  <Link key={session.id} href={`/sessions/${session.id}`} className="block">
                    <div className="group relative overflow-hidden rounded-xl border-2 border-border bg-card p-4 transition-all duration-300 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-500/10 dark:hover:border-violet-800">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-base font-semibold truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                              {session.name}
                            </h3>
                            {getStatusBadge(session.status)}
                            {session.isOwner && (
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400">
                                Host
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-4 w-4" />
                              <span>{format(new Date(session.createdAt), "MMM d, yyyy")}</span>
                            </div>
                            {session.startedAt && (
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-4 w-4" />
                                <span>{format(new Date(session.startedAt), "h:mm a")}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5">
                              <Users className="h-4 w-4" />
                              <span>{session.participantCount}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MessageSquare className="h-4 w-4" />
                              <span>{session.messageCount}</span>
                            </div>
                          </div>
                        </div>

                        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
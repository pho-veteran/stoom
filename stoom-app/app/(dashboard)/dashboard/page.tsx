"use client";

import { useState } from "react";
import { SessionCard } from "@/components/dashboard/session-card";
import { mockSessions } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Hash, Video, Settings, Lock, Home, Video as VideoIcon2 } from "lucide-react";
// Note: Lock is still used in create meeting modal
import { useRouter } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [isNewMeetingDialogOpen, setIsNewMeetingDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // New Meeting form state
  const [meetingTitle, setMeetingTitle] = useState("");
  
  // Room settings
  const [requirePassword, setRequirePassword] = useState(false);
  const [roomPassword, setRoomPassword] = useState("");
  


  const handleJoinRoom = () => {
    if (roomCode.trim()) {
      router.push(`/room/${roomCode.trim()}`);
      setIsJoinDialogOpen(false);
    }
  };

  const [isCreating, setIsCreating] = useState(false);

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
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create room");
      }

      const data = await response.json();
      router.push(`/room/${data.room.code}`);
      setIsNewMeetingDialogOpen(false);
      // Reset form
      setMeetingTitle("");
      setRequirePassword(false);
      setRoomPassword("");
    } catch (error) {
      console.error("Error creating meeting:", error);
      alert("Failed to create meeting. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border/50 bg-card/95 backdrop-blur-xl supports-backdrop-filter:bg-card/60 px-6">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white font-bold">
            S
          </div>
          <span className="text-xl font-bold bg-linear-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
            Stoom
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-10 w-10 ring-2 ring-violet-200 dark:ring-violet-800",
                userButtonPopoverCard: "shadow-xl border-2",
              },
            }}
          />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-8 grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <Home className="h-4 w-4" strokeWidth={2} />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="recordings" className="flex items-center gap-2">
                <VideoIcon2 className="h-4 w-4" strokeWidth={2} />
                Recordings
              </TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-8 mt-0">
              <div>
                <h1 className="mb-2 text-3xl font-bold tracking-tight md:text-4xl">Dashboard</h1>
                <p className="text-lg text-muted-foreground">
                  Start a new meeting or join an existing session
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="lg" className="gap-2">
                      <Hash className="h-4 w-4" strokeWidth={2} />
                      Join with Code
                    </Button>
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
                      <Button
                        variant="outline"
                        onClick={() => setIsJoinDialogOpen(false)}
                      >
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

                <Dialog open={isNewMeetingDialogOpen} onOpenChange={setIsNewMeetingDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="gap-2 bg-violet-600 hover:bg-violet-700 text-white">
                      <Plus className="h-4 w-4" strokeWidth={2} />
                      New Meeting
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950/50">
                          <Video className="h-5 w-5 text-violet-600 dark:text-violet-400" strokeWidth={2} />
                        </div>
                        <div>
                          <DialogTitle className="text-2xl">Create New Meeting</DialogTitle>
                          <DialogDescription className="mt-1">
                            Set up your study session and configure room settings
                          </DialogDescription>
                        </div>
                      </div>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                      {/* Meeting Title */}
                      <div className="space-y-2">
                        <Label htmlFor="meeting-title" className="text-sm font-semibold">
                          Meeting Title
                        </Label>
                        <Input
                          id="meeting-title"
                          placeholder="e.g., Math Study Group - Calculus Review"
                          value={meetingTitle}
                          onChange={(e) => setMeetingTitle(e.target.value)}
                          className="h-11"
                        />
                      </div>

                      {/* Room Settings */}
                      <div className="space-y-4 border-t border-border pt-4">
                        <div className="flex items-center gap-2">
                          <Settings className="h-5 w-5 text-violet-600 dark:text-violet-400" strokeWidth={2} />
                          <Label className="text-base font-semibold">Room Settings</Label>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="require-password"
                              checked={requirePassword}
                              onCheckedChange={(checked) => setRequirePassword(checked === true)}
                            />
                            <Label
                              htmlFor="require-password"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                            >
                              <Lock className="h-4 w-4" strokeWidth={1.5} />
                              Require password to join
                            </Label>
                          </div>

                          {requirePassword && (
                            <div className="ml-6 space-y-2">
                              <Input
                                placeholder="Enter room password"
                                type="password"
                                value={roomPassword}
                                onChange={(e) => setRoomPassword(e.target.value)}
                                className="h-10"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <DialogFooter className="gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setIsNewMeetingDialogOpen(false)}
                        disabled={isCreating}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreateMeeting}
                        disabled={!meetingTitle.trim() || isCreating}
                        className="bg-violet-600 hover:bg-violet-700 text-white"
                      >
                        <Video className="mr-2 h-4 w-4" strokeWidth={2} />
                        {isCreating ? "Creating..." : "Create Meeting"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Recent Sessions Section */}
              <section className="space-y-6">
                <div>
                  <h2 className="mb-2 text-2xl font-bold tracking-tight">Recent Sessions</h2>
                  <p className="text-muted-foreground">
                    Your study sessions and recordings
                  </p>
                </div>

                {mockSessions.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {mockSessions.map((session) => (
                      <SessionCard key={session.id} {...session} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card p-12 text-center">
                    <p className="mb-2 text-lg font-semibold">No sessions yet</p>
                    <p className="mb-6 text-sm text-muted-foreground">
                      Create your first study session to get started
                    </p>
                  </div>
                )}
              </section>
            </TabsContent>

            {/* Recordings Tab */}
            <TabsContent value="recordings" className="space-y-8 mt-0">
              <div>
                <h1 className="mb-2 text-3xl font-bold tracking-tight md:text-4xl">All Recordings</h1>
                <p className="text-lg text-muted-foreground">
                  Browse all your study session recordings
                </p>
              </div>

              {mockSessions.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {mockSessions.map((session) => (
                    <SessionCard key={session.id} {...session} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card p-12 text-center">
                  <p className="mb-2 text-lg font-semibold">No recordings yet</p>
                  <p className="mb-6 text-sm text-muted-foreground">
                    Your session recordings will appear here
                  </p>
                </div>
              )}
            </TabsContent>

          </Tabs>
        </div>
      </div>
    </div>
  );
}

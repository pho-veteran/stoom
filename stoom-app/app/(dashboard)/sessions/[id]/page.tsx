"use client";

import { useEffect, useState, use } from "react";
import { useUser, useAuth, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import axios from "axios";
import { format } from "date-fns";
import {
  ArrowLeft,
  Video,
  Clock,
  Calendar,
  MessageSquare,
  Circle,
  Loader2,
  Users,
  Copy,
  Check,
  PenTool,
  FileText,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WhiteboardSnapshotViewer } from "@/components/session/whiteboard-snapshot-viewer";
import { NotesContentViewer } from "@/components/session/notes-content-viewer";
import type { TLStoreSnapshot } from "tldraw";
import type { JSONContent } from "@tiptap/react";

interface Participant {
  id: string;
  name: string;
  email: string;
  imageUrl: string | null;
  role: string;
  joinedAt: string;
  leftAt: string | null;
}

interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  user: {
    name: string;
    imageUrl: string | null;
  };
}

interface CollaborationData {
  whiteboardSnapshot: TLStoreSnapshot | null;
  notesContent: JSONContent | null;
}

interface SessionDetail {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: "WAITING" | "ACTIVE" | "ENDED";
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
  owner: {
    name: string;
    email: string;
    imageUrl: string | null;
  };
  participants: Participant[];
  messages: ChatMessage[];
  isOwner: boolean;
  collaboration: CollaborationData | null;
}

export default function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { isLoaded } = useUser();
  const { isSignedIn, getToken } = useAuth();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isCollaborationMaximized, setIsCollaborationMaximized] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        // Get fresh token to ensure auth is ready
        const token = await getToken();
        if (!token) {
          // Auth not ready yet, wait
          return;
        }
        
        // Include auth header to prevent redirect on 401
        const response = await axios.get(`/api/sessions/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setSession(response.data);
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          // Auth failed, redirect to sign-in
          window.location.href = "/sign-in";
          return;
        }
        console.error("Error fetching session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isLoaded && isSignedIn) {
      fetchSession();
    } else if (isLoaded && !isSignedIn) {
      // User is not signed in, redirect
      window.location.href = "/sign-in";
    }
  }, [isLoaded, isSignedIn, id, getToken]);

  const handleCopyCode = async () => {
    if (session?.code) {
      await navigator.clipboard.writeText(session.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <header className="sticky top-0 z-50 border-b border-border/50 bg-card/95 backdrop-blur-xl">
          <div className="container mx-auto flex h-16 items-center justify-between px-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white font-bold">
                S
              </div>
              <span className="text-xl font-bold bg-linear-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                Stoom
              </span>
            </Link>
          </div>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center">
          <p className="text-muted-foreground mb-4">Session not found</p>
          <Link href="/sessions">
            <Button variant="outline">Back to Sessions</Button>
          </Link>
        </div>
      </div>
    );
  }

  const sessionDuration =
    session.startedAt && session.endedAt
      ? Math.round(
          (new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 1000 / 60
        )
      : null;

  const getStatusBadge = () => {
    switch (session.status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
            <Circle className="h-2 w-2 fill-emerald-500 text-emerald-500" />
            Active
          </span>
        );
      case "ENDED":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            Ended
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
            Waiting
          </span>
        );
    }
  };

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
                <ArrowLeft className="h-4 w-4" />
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
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="container relative z-10 mx-auto px-6 py-8 md:py-12">
          {/* Session Header Card */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-border bg-card p-6 md:p-8 mb-8">
            <div className="absolute inset-0 bg-linear-to-br from-violet-50/50 to-purple-50/30 dark:from-violet-950/20 dark:to-purple-950/10" />
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <h1 className="text-2xl md:text-3xl font-bold">{session.name}</h1>
                    {getStatusBadge()}
                    {session.isOwner && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400">
                        Host
                      </span>
                    )}
                  </div>

                  {session.description && (
                    <p className="text-muted-foreground mb-4">{session.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950/50">
                        <Calendar className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                      </div>
                      <span>{format(new Date(session.createdAt), "MMMM d, yyyy")}</span>
                    </div>
                    {session.startedAt && (
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950/50">
                          <Clock className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                        </div>
                        <span>
                          {format(new Date(session.startedAt), "h:mm a")}
                          {session.endedAt && <> - {format(new Date(session.endedAt), "h:mm a")}</>}
                        </span>
                      </div>
                    )}
                    {sessionDuration && (
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950/50">
                          <Video className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                        </div>
                        <span>{sessionDuration} min</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Room Code & Join Button */}
                <div className="flex flex-col items-start md:items-end gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Room Code</p>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-2xl font-bold text-violet-600 dark:text-violet-400">
                        {session.code}
                      </span>
                      <Button variant="ghost" size="icon" onClick={handleCopyCode} className="h-8 w-8">
                        {copied ? (
                          <Check className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {session.status !== "ENDED" && (
                    <Link href={`/room/${session.code}`}>
                      <Button className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
                        <Video className="h-4 w-4" />
                        Join Session
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Collaboration Content - Whiteboard & Notes (Requirements: 3.3, 3.4) */}
          {session.collaboration && (
            <div className="rounded-xl border-2 border-border bg-card p-5 mb-6">
              <Tabs defaultValue="whiteboard" className="w-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold">Collaboration Content</h3>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsCollaborationMaximized(true)}
                      className="h-8 w-8"
                      title="Maximize"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                    <TabsList>
                      <TabsTrigger value="whiteboard" className="gap-2">
                        <PenTool className="h-4 w-4" />
                        Whiteboard
                      </TabsTrigger>
                      <TabsTrigger value="notes" className="gap-2">
                        <FileText className="h-4 w-4" />
                        My Notes
                      </TabsTrigger>
                    </TabsList>
                  </div>
                </div>
                <TabsContent value="whiteboard" className="mt-0">
                  <div className="rounded-lg border border-border overflow-hidden">
                    <WhiteboardSnapshotViewer
                      snapshot={session.collaboration.whiteboardSnapshot}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="notes" className="mt-0">
                  <NotesContentViewer
                    content={session.collaboration.notesContent}
                    roomId={session.id}
                  />
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Participants */}
            <div className="lg:col-span-1 space-y-6">
              {/* Host Card */}
              <div className="rounded-xl border-2 border-border bg-card p-5">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-violet-600" />
                  Host
                </h3>
                <div className="flex items-center gap-3">
                  {session.owner.imageUrl ? (
                    <Image
                      src={session.owner.imageUrl}
                      alt={session.owner.name}
                      width={48}
                      height={48}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-violet-100 dark:bg-violet-950/50 flex items-center justify-center">
                      <span className="text-lg font-semibold text-violet-600 dark:text-violet-400">
                        {session.owner.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{session.owner.name}</p>
                    <p className="text-sm text-muted-foreground">{session.owner.email}</p>
                  </div>
                </div>
              </div>

              {/* Participants Card */}
              <div className="rounded-xl border-2 border-border bg-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    Participants
                  </h3>
                  <span className="text-xs text-muted-foreground px-2 py-1 rounded-full bg-muted">
                    {session.participants.length}
                  </span>
                </div>
                {session.participants.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No participants</p>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {session.participants.map((participant) => (
                      <div key={participant.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {participant.imageUrl ? (
                            <Image
                              src={participant.imageUrl}
                              alt={participant.name}
                              width={32}
                              height={32}
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                              <span className="text-xs font-semibold">{participant.name.charAt(0)}</span>
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium">{participant.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(participant.joinedAt), "h:mm a")}
                            </p>
                          </div>
                        </div>
                        {participant.role === "HOST" && (
                          <span className="text-xs text-violet-600 dark:text-violet-400 font-medium">
                            Host
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Chat */}
            <div className="lg:col-span-2">
              <div className="rounded-xl border-2 border-border bg-card p-5 h-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    Chat History
                  </h3>
                  <span className="text-xs text-muted-foreground px-2 py-1 rounded-full bg-muted">
                    {session.messages.length} messages
                  </span>
                </div>

                {session.messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
                      <MessageSquare className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">No messages in this session</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto">
                    {session.messages.map((message) => (
                      <div key={message.id} className="flex gap-3">
                        {message.user.imageUrl ? (
                          <div className="h-9 w-9 rounded-full overflow-hidden shrink-0">
                            <Image
                              src={message.user.imageUrl}
                              alt={message.user.name}
                              width={36}
                              height={36}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <span className="text-sm font-semibold">{message.user.name.charAt(0)}</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-sm font-medium">{message.user.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(message.createdAt), "h:mm a")}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{message.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Fullscreen Collaboration Modal */}
      {isCollaborationMaximized && session.collaboration && (
        <div className="fixed inset-0 z-50 bg-background">
          <div className="h-full w-full flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
              <h2 className="text-lg font-semibold">Collaboration Content</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollaborationMaximized(false)}
                className="h-8 w-8"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 p-4 overflow-hidden">
              <Tabs defaultValue="whiteboard" className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <TabsList>
                    <TabsTrigger value="whiteboard" className="gap-2">
                      <PenTool className="h-4 w-4" />
                      Whiteboard
                    </TabsTrigger>
                    <TabsTrigger value="notes" className="gap-2">
                      <FileText className="h-4 w-4" />
                      My Notes
                    </TabsTrigger>
                  </TabsList>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCollaborationMaximized(false)}
                    className="gap-2"
                  >
                    <Minimize2 className="h-4 w-4" />
                    Exit Fullscreen
                  </Button>
                </div>
                <TabsContent value="whiteboard" className="mt-0 flex-1">
                  <div className="rounded-lg border border-border overflow-hidden h-full">
                    <WhiteboardSnapshotViewer
                      snapshot={session.collaboration.whiteboardSnapshot}
                      className="!h-full"
                    />
                  </div>
                </TabsContent>
                <TabsContent value="notes" className="mt-0 flex-1">
                  <NotesContentViewer
                    content={session.collaboration.notesContent}
                    roomId={session.id}
                    className="h-full"
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
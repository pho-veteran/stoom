"use client";

import { useEffect, useState } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import axios from "axios";
import { format } from "date-fns";
import {
  Video,
  Users,
  Clock,
  Calendar,
  ChevronRight,
  Loader2,
  Circle,
  MessageSquare,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

export default function SessionsPage() {
  const { user, isLoaded } = useUser();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "owned" | "joined">("all");

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await axios.get("/api/sessions");
        setSessions(response.data.sessions);
      } catch (error) {
        console.error("Error fetching sessions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isLoaded && user) {
      fetchSessions();
    }
  }, [isLoaded, user]);

  const filteredSessions = sessions.filter((session) => {
    if (filter === "owned") return session.isOwner;
    if (filter === "joined") return !session.isOwner;
    return true;
  });

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
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Dashboard
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
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl mb-2">Sessions</h1>
            <p className="text-lg text-muted-foreground">
              View your meeting history and session details
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 mb-8">
            {(["all", "owned", "joined"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                  filter === f
                    ? "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {f === "all" ? "All Sessions" : f === "owned" ? "Hosted" : "Joined"}
              </button>
            ))}
          </div>

          {/* Sessions List */}
          {!isLoaded || isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card p-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-950/50 mb-4">
                <Video className="h-8 w-8 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No sessions yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {filter === "owned"
                  ? "You haven't hosted any meetings yet"
                  : filter === "joined"
                  ? "You haven't joined any meetings yet"
                  : "Start or join a meeting to see it here"}
              </p>
              <Link href="/dashboard" className="mt-6">
                <Button className="bg-violet-600 hover:bg-violet-700 text-white">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSessions.map((session) => (
                <Link key={session.id} href={`/sessions/${session.id}`} className="block">
                  <div className="group relative overflow-hidden rounded-xl border-2 border-border bg-card p-5 transition-all duration-300 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-500/10 dark:hover:border-violet-800">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                            {session.name}
                          </h3>
                          {getStatusBadge(session.status)}
                          {session.isOwner && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400">
                              Host
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            <span>{format(new Date(session.createdAt), "MMM d, yyyy")}</span>
                          </div>
                          {session.startedAt && (
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-4 w-4" />
                              <span>
                                {format(new Date(session.startedAt), "h:mm a")}
                                {session.endedAt && (
                                  <> - {format(new Date(session.endedAt), "h:mm a")}</>
                                )}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <Users className="h-4 w-4" />
                            <span>{session.participantCount} participants</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MessageSquare className="h-4 w-4" />
                            <span>{session.messageCount} messages</span>
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
        </div>
      </main>
    </div>
  );
}
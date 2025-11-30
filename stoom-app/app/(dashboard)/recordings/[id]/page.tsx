import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockAISummary, mockTranscript, mockSessions, mockParticipants, mockMessages } from "@/lib/mock-data";
import { FileText, Image as ImageIcon, Sparkles, MessageSquare, Users, Clock, Calendar, ArrowLeft, Mic, MicOff } from "lucide-react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RecordingPageProps {
  params: Promise<{ id: string }>;
}

export default async function RecordingPage({ params }: RecordingPageProps) {
  const { id } = await params;
  const session = mockSessions.find((s) => s.id === id);

  if (!session) {
    notFound();
  }

  // Calculate duration from time string (mock)
  const duration = "2h 15m";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border/50 bg-card/95 backdrop-blur-xl supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" strokeWidth={2} />
                  Back
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{session.title}</h1>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" strokeWidth={1.5} />
                    {session.date}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" strokeWidth={1.5} />
                    {session.time}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" strokeWidth={1.5} />
                    Duration: {duration}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Column (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs for Whiteboard, Transcript, Chat */}
            <Tabs defaultValue="whiteboard" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="whiteboard" className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" strokeWidth={2} />
                  Whiteboard
                </TabsTrigger>
                <TabsTrigger value="transcript" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" strokeWidth={2} />
                  Transcript
                </TabsTrigger>
                <TabsTrigger value="chat" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" strokeWidth={2} />
                  Chat
                </TabsTrigger>
              </TabsList>

              <TabsContent value="whiteboard" className="mt-0">
                <Card className="border-2 shadow-lg">
                  <CardContent className="p-6">
                    <div className="aspect-video rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center border-2 border-dashed border-border">
                      <div className="text-center">
                        <ImageIcon className="h-16 w-16 mx-auto mb-3 text-muted-foreground" strokeWidth={1.5} />
                        <p className="text-sm font-medium text-muted-foreground">Whiteboard snapshot will be displayed here</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="transcript" className="mt-0">
                <Card className="border-2 shadow-lg">
                  <CardHeader>
                    <CardTitle>Full Transcript</CardTitle>
                    <CardDescription>Complete conversation from the session</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                      {mockTranscript.map((entry) => (
                        <div
                          key={entry.id}
                          className={cn(
                            "rounded-lg border-2 p-4 transition-all",
                            entry.isActive
                              ? "border-violet-300 bg-violet-50/50 dark:border-violet-800 dark:bg-violet-950/30"
                              : "border-border bg-card"
                          )}
                        >
                          <div className="mb-2 flex items-center gap-2">
                            <span className="font-semibold text-sm text-violet-700 dark:text-violet-400">{entry.speaker}:</span>
                            <span className="text-xs text-muted-foreground">
                              {Math.floor(entry.timestamp / 60)}:
                              {String(entry.timestamp % 60).padStart(2, "0")}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed">{entry.text}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="chat" className="mt-0">
                <Card className="border-2 shadow-lg">
                  <CardHeader>
                    <CardTitle>Chat Messages</CardTitle>
                    <CardDescription>All messages from the session</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                      {mockMessages.map((message) => (
                        <div
                          key={message.id}
                          className="rounded-lg bg-slate-50 dark:bg-slate-900/50 p-4 border border-border"
                        >
                          <div className="mb-2 flex items-center gap-2">
                            <span className="font-semibold text-sm">{message.userName}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed">{message.message}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - Right Column (1/3) */}
          <div className="space-y-6">
            {/* AI Insight Overview */}
            {session.hasAIInsights && (
              <Card className="border-2 border-violet-200 bg-gradient-to-br from-violet-50/80 to-violet-100/50 shadow-lg dark:border-violet-900 dark:from-violet-950/30 dark:to-violet-900/20">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600">
                      <Sparkles className="h-5 w-5 text-white" strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-violet-700 dark:text-violet-400">
                          {mockAISummary.title}
                        </CardTitle>
                        <Badge className="bg-violet-600 text-white dark:bg-violet-500">
                          AI Generated
                        </Badge>
                      </div>
                      <CardDescription className="mt-1">Key insights from your study session</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="mb-3 font-semibold text-violet-900 dark:text-violet-300">Key Points:</h3>
                    <ul className="space-y-2 text-sm">
                      {mockAISummary.keyPoints.map((point, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-600 dark:bg-violet-400" />
                          <span className="text-muted-foreground">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="mb-3 font-semibold text-violet-900 dark:text-violet-300">Takeaways:</h3>
                    <ul className="space-y-2 text-sm">
                      {mockAISummary.takeaways.map((takeaway, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-600 dark:bg-violet-400" />
                          <span className="text-muted-foreground">{takeaway}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Participants */}
            <Card className="border-2 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-violet-600 dark:text-violet-400" strokeWidth={2} />
                  <CardTitle>Participants</CardTitle>
                </div>
                <CardDescription>{mockParticipants.length} people joined</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockParticipants.map((participant) => (
                    <div
                      key={participant.id}
                      className={cn(
                        "flex items-center gap-3 rounded-lg p-3 transition-colors",
                        participant.isSpeaking
                          ? "bg-violet-100 dark:bg-violet-900/30 border border-violet-300 dark:border-violet-700"
                          : "bg-slate-50 dark:bg-slate-900/50 border border-border"
                      )}
                    >
                      <div className="relative">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-white text-sm font-bold">
                          {participant.name.charAt(0)}
                        </div>
                        {participant.isSpeaking && (
                          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{participant.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {participant.isSpeaking ? (
                            <Mic className="h-3 w-3 text-emerald-500" strokeWidth={2} />
                          ) : (
                            <MicOff className="h-3 w-3 text-muted-foreground" strokeWidth={2} />
                          )}
                          <span className="text-xs text-muted-foreground">Active</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Session Stats */}
            <Card className="border-2 shadow-lg">
              <CardHeader>
                <CardTitle>Session Statistics</CardTitle>
                <CardDescription>Key metrics from this session</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Duration</span>
                  <span className="text-sm font-semibold">{duration}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Participants</span>
                  <span className="text-sm font-semibold">{session.participants}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Messages</span>
                  <span className="text-sm font-semibold">{mockMessages.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Transcript Entries</span>
                  <span className="text-sm font-semibold">{mockTranscript.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">AI Insights</span>
                  <Badge className={session.hasAIInsights ? "bg-violet-600 text-white" : "bg-muted"}>
                    {session.hasAIInsights ? "Available" : "Not Available"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

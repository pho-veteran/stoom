import { Button } from "@/components/ui/button";
import {
  Video,
  Users,
  FileText,
  ArrowRight,
  MessageSquare,
  Monitor,
  Shield,
  Hand,
  History,
  Lock,
  Pencil,
  Crown,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-card/95 backdrop-blur-xl supports-backdrop-filter:bg-card/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <Link
            href="/"
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white font-bold">
              S
            </div>
            <span className="text-xl font-bold bg-linear-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              Stoom
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button
              asChild
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative flex flex-1 items-center justify-center overflow-hidden bg-background py-24 md:py-32">
        <div className="absolute inset-0 bg-linear-to-br from-violet-50/30 via-background to-slate-50/30 dark:from-slate-950/50 dark:via-background dark:to-slate-900/50" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]" />
        <div className="container relative z-10 mx-auto px-6">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mb-6 text-5xl font-bold tracking-tight md:text-6xl lg:text-7xl">
              Real-time{" "}
              <span className="bg-linear-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                Collaboration
              </span>{" "}
              Made Simple
            </h1>
            <p className="mb-10 text-lg text-muted-foreground md:text-xl lg:max-w-2xl lg:mx-auto">
              Video meetings with collaborative whiteboard, personal notes, and
              real-time chat. Create rooms, manage participants, and save your
              sessions for later.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                asChild
                className="h-12 px-8 text-base bg-violet-600 hover:bg-violet-700 text-white"
              >
                <Link href="/sign-up">
                  Start for Free
                  <ArrowRight className="ml-2 h-5 w-5" strokeWidth={2} />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="h-12 px-8 text-base"
              >
                <Link href="/sign-in">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="border-t border-border bg-background py-24">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                Everything for Effective Meetings
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Powerful collaboration tools designed for productive video
                meetings
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Real-time Video */}
              <FeatureCard
                icon={<Video className="h-6 w-6" />}
                title="HD Video & Audio"
                description="Crystal-clear video calls powered by LiveKit with low latency and high reliability"
              />
              {/* Collaborative Whiteboard */}
              <FeatureCard
                icon={<Pencil className="h-6 w-6" />}
                title="Collaborative Whiteboard"
                description="Draw, write, and brainstorm together in real-time with tldraw-powered canvas"
              />
              {/* Screen Sharing */}
              <FeatureCard
                icon={<Monitor className="h-6 w-6" />}
                title="Screen Sharing"
                description="Share your screen with participants for presentations and demonstrations"
              />
              {/* Real-time Chat */}
              <FeatureCard
                icon={<MessageSquare className="h-6 w-6" />}
                title="Real-time Chat"
                description="Send messages instantly during meetings with full chat history"
              />
              {/* Personal Notes */}
              <FeatureCard
                icon={<FileText className="h-6 w-6" />}
                title="Personal Notes"
                description="Take rich-text notes during meetings with formatting, lists, and headings"
              />
              {/* Session History */}
              <FeatureCard
                icon={<History className="h-6 w-6" />}
                title="Session History"
                description="Review past sessions with saved whiteboard snapshots and personal notes"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Room Management Section */}
      <section className="border-t border-border bg-muted/30 py-24">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                Full Control Over Your Meetings
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Host meetings with powerful room management and permission
                controls
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {/* Room Host */}
              <FeatureCard
                icon={<Crown className="h-6 w-6" />}
                title="Host Controls"
                description="Create rooms, manage participants, and control meeting settings"
                compact
              />
              {/* Co-Host */}
              <FeatureCard
                icon={<Users className="h-6 w-6" />}
                title="Co-Host Support"
                description="Delegate management tasks to trusted co-hosts"
                compact
              />
              {/* Permissions */}
              <FeatureCard
                icon={<Settings className="h-6 w-6" />}
                title="Permission Control"
                description="Control whiteboard and notes access for participants"
                compact
              />
              {/* Password Protection */}
              <FeatureCard
                icon={<Lock className="h-6 w-6" />}
                title="Password Protection"
                description="Secure your rooms with optional password protection"
                compact
              />
            </div>
          </div>
        </div>
      </section>

      {/* Participant Features Section */}
      <section className="border-t border-border bg-background py-24">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                Seamless Participant Experience
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Join meetings easily and collaborate with intuitive tools
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {/* Join with Code */}
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-950/50">
                  <Shield className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                </div>
                <h3 className="mb-2 text-lg font-bold">Join with Code</h3>
                <p className="text-sm text-muted-foreground">
                  Enter a 6-character room code or use a direct link to join
                  meetings instantly
                </p>
              </div>
              {/* Hand Raise */}
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-950/50">
                  <Hand className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                </div>
                <h3 className="mb-2 text-lg font-bold">Hand Raise</h3>
                <p className="text-sm text-muted-foreground">
                  Raise your hand to get attention from the host without
                  interrupting the flow
                </p>
              </div>
              {/* Pre-join Preview */}
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-950/50">
                  <Video className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                </div>
                <h3 className="mb-2 text-lg font-bold">Pre-join Preview</h3>
                <p className="text-sm text-muted-foreground">
                  Preview your camera and adjust mic settings before joining the
                  meeting
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border bg-linear-to-br from-violet-600 to-purple-700 py-20">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-white md:text-4xl">
              Ready to Start Collaborating?
            </h2>
            <p className="mb-8 text-lg text-violet-100">
              Create your first room in seconds. No credit card required.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                asChild
                className="h-12 px-8 text-base bg-white text-violet-700 hover:bg-violet-50"
              >
                <Link href="/sign-up">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" strokeWidth={2} />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white font-bold">
                S
              </div>
              <span className="text-lg font-semibold">Stoom</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Stoom. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  compact = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-xl border-2 border-border bg-card transition-all duration-300 hover:border-violet-300 hover:shadow-xl hover:shadow-violet-500/10 dark:hover:border-violet-800 dark:hover:shadow-violet-500/20 ${compact ? "p-5" : "p-6"}`}
    >
      <div className="absolute inset-0 bg-linear-to-br from-violet-50/0 via-violet-50/0 to-violet-100/0 transition-opacity duration-300 group-hover:from-violet-50/50 group-hover:via-violet-50/30 group-hover:to-violet-100/30 dark:group-hover:from-violet-950/20 dark:group-hover:via-violet-950/10 dark:group-hover:to-violet-900/20" />
      <div className="relative z-10">
        <div
          className={`mb-4 flex items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 ${compact ? "h-10 w-10" : "h-12 w-12"}`}
        >
          {icon}
        </div>
        <h3 className={`mb-2 font-bold ${compact ? "text-base" : "text-lg"}`}>
          {title}
        </h3>
        <p
          className={`text-muted-foreground ${compact ? "text-xs" : "text-sm"}`}
        >
          {description}
        </p>
      </div>
    </div>
  );
}

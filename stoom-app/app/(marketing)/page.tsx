import { Button } from "@/components/ui/button";
import { Video, Users, FileText, Sparkles, ArrowRight, Zap } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-card/95 backdrop-blur-xl supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white font-bold">
              S
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              Stoom
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button asChild className="bg-violet-600 hover:bg-violet-700 text-white">
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative flex flex-1 items-center justify-center overflow-hidden bg-background py-24 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50/30 via-background to-slate-50/30 dark:from-slate-950/50 dark:via-background dark:to-slate-900/50" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="container relative z-10 mx-auto px-6">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-sm text-violet-700 dark:border-violet-900 dark:bg-violet-950/50 dark:text-violet-400">
              <Zap className="h-4 w-4" />
              <span>AI-Powered Study Platform</span>
            </div>
            <h1 className="mb-6 text-5xl font-bold tracking-tight md:text-6xl lg:text-7xl">
              Study Together,{" "}
              <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                Learn Better
              </span>
            </h1>
            <p className="mb-10 text-lg text-muted-foreground md:text-xl lg:max-w-2xl lg:mx-auto">
              Collaborative study platform with real-time video, interactive
              whiteboard, and AI-powered insights to enhance your learning
              experience.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild className="h-12 px-8 text-base bg-violet-600 hover:bg-violet-700 text-white">
                <Link href="/sign-up">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" strokeWidth={2} />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-12 px-8 text-base">
                <Link href="/sign-in">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border bg-background py-24">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                Everything you need for collaborative learning
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Powerful features designed to make studying together more effective and engaging
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="group relative overflow-hidden rounded-xl border-2 border-border bg-card p-6 transition-all duration-300 hover:border-violet-300 hover:shadow-xl hover:shadow-violet-500/10 dark:hover:border-violet-800 dark:hover:shadow-violet-500/20">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-50/0 via-violet-50/0 to-violet-100/0 transition-opacity duration-300 group-hover:from-violet-50/50 group-hover:via-violet-50/30 group-hover:to-violet-100/30 dark:group-hover:from-violet-950/20 dark:group-hover:via-violet-950/10 dark:group-hover:to-violet-900/20" />
                <div className="relative z-10">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950/50">
                    <Video className="h-6 w-6 text-violet-600 dark:text-violet-400" strokeWidth={2} />
                  </div>
                  <h3 className="mb-2 text-lg font-bold">Real-time Video</h3>
                  <p className="text-sm text-muted-foreground">
                    High-quality video calls with screen sharing and crystal-clear audio
                  </p>
                </div>
              </div>
              <div className="group relative overflow-hidden rounded-xl border-2 border-border bg-card p-6 transition-all duration-300 hover:border-violet-300 hover:shadow-xl hover:shadow-violet-500/10 dark:hover:border-violet-800 dark:hover:shadow-violet-500/20">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-50/0 via-violet-50/0 to-violet-100/0 transition-opacity duration-300 group-hover:from-violet-50/50 group-hover:via-violet-50/30 group-hover:to-violet-100/30 dark:group-hover:from-violet-950/20 dark:group-hover:via-violet-950/10 dark:group-hover:to-violet-900/20" />
                <div className="relative z-10">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950/50">
                    <Users className="h-6 w-6 text-violet-600 dark:text-violet-400" strokeWidth={2} />
                  </div>
                  <h3 className="mb-2 text-lg font-bold">Collaborative Whiteboard</h3>
                  <p className="text-sm text-muted-foreground">
                    Draw, write, and brainstorm together in real-time with unlimited canvas
                  </p>
                </div>
              </div>
              <div className="group relative overflow-hidden rounded-xl border-2 border-border bg-card p-6 transition-all duration-300 hover:border-violet-300 hover:shadow-xl hover:shadow-violet-500/10 dark:hover:border-violet-800 dark:hover:shadow-violet-500/20">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-50/0 via-violet-50/0 to-violet-100/0 transition-opacity duration-300 group-hover:from-violet-50/50 group-hover:via-violet-50/30 group-hover:to-violet-100/30 dark:group-hover:from-violet-950/20 dark:group-hover:via-violet-950/10 dark:group-hover:to-violet-900/20" />
                <div className="relative z-10">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950/50">
                    <FileText className="h-6 w-6 text-violet-600 dark:text-violet-400" strokeWidth={2} />
                  </div>
                  <h3 className="mb-2 text-lg font-bold">Shared Notes</h3>
                  <p className="text-sm text-muted-foreground">
                    Take collaborative notes that sync in real-time across all participants
                  </p>
                </div>
              </div>
              <div className="group relative overflow-hidden rounded-xl border-2 border-border bg-card p-6 transition-all duration-300 hover:border-violet-300 hover:shadow-xl hover:shadow-violet-500/10 dark:hover:border-violet-800 dark:hover:shadow-violet-500/20">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-50/0 via-violet-50/0 to-violet-100/0 transition-opacity duration-300 group-hover:from-violet-50/50 group-hover:via-violet-50/30 group-hover:to-violet-100/30 dark:group-hover:from-violet-950/20 dark:group-hover:via-violet-950/10 dark:group-hover:to-violet-900/20" />
                <div className="relative z-10">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950/50">
                    <Sparkles className="h-6 w-6 text-violet-600 dark:text-violet-400" strokeWidth={2} />
                  </div>
                  <h3 className="mb-2 text-lg font-bold">AI Insights</h3>
                  <p className="text-sm text-muted-foreground">
                    Get AI-powered summaries, key takeaways, and intelligent session analysis
                  </p>
                </div>
              </div>
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
              © 2024 Stoom. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}


import { SessionCard } from "@/components/dashboard/session-card";
import { mockSessions } from "@/lib/mock-data";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RecordingsPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="mb-4 gap-2">
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="mb-2 text-3xl font-bold tracking-tight">All Recordings</h1>
        <p className="text-muted-foreground">
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
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-12 text-center">
          <p className="mb-2 text-lg font-semibold">No recordings yet</p>
          <p className="mb-6 text-sm text-muted-foreground">
            Your session recordings will appear here
          </p>
        </div>
      )}
    </div>
  );
}



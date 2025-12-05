import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

interface SessionCardProps {
  id: string;
  title: string;
  date: string;
  time: string;
  participants: number;
  thumbnail?: string;
  hasAIInsights?: boolean;
}

export function SessionCard({
  id,
  title,
  date,
  time,
  participants,
  hasAIInsights = false,
}: SessionCardProps) {
  return (
    <Link 
      href={`/recordings/${id}`}
      prefetch={true}
      className="block h-full"
    >
      <div className="group relative h-full cursor-pointer overflow-hidden rounded-xl border-2 border-border bg-card p-6 transition-all duration-300 hover:border-violet-300 hover:shadow-xl hover:shadow-violet-500/10 dark:hover:border-violet-800 dark:hover:shadow-violet-500/20">
        {/* Gradient Background Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50/0 via-violet-50/0 to-violet-100/0 transition-opacity duration-300 group-hover:from-violet-50/50 group-hover:via-violet-50/30 group-hover:to-violet-100/30 dark:group-hover:from-violet-950/20 dark:group-hover:via-violet-950/10 dark:group-hover:to-violet-900/20" />
        
        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="mb-4 flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 text-white text-xl font-bold shadow-lg">
                {title.charAt(0).toUpperCase()}
              </div>
              <h3 className="mb-1 line-clamp-2 text-lg font-bold leading-tight transition-colors group-hover:text-violet-600 dark:group-hover:text-violet-400">
                {title}
              </h3>
            </div>
            {hasAIInsights && (
              <Badge className="ml-2 bg-violet-600 text-white shadow-md dark:bg-violet-500">
                <Sparkles className="mr-1 h-3 w-3" strokeWidth={2} />
                AI
              </Badge>
            )}
          </div>

          {/* Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-violet-100 dark:bg-violet-950/50">
                <Calendar className="h-4 w-4 text-violet-600 dark:text-violet-400" strokeWidth={2} />
              </div>
              <span className="text-muted-foreground">{date}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-violet-100 dark:bg-violet-950/50">
                <Clock className="h-4 w-4 text-violet-600 dark:text-violet-400" strokeWidth={2} />
              </div>
              <span className="text-muted-foreground">{time}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-violet-100 dark:bg-violet-950/50">
                <Users className="h-4 w-4 text-violet-600 dark:text-violet-400" strokeWidth={2} />
              </div>
              <span className="text-muted-foreground">
                {participants} {participants === 1 ? "participant" : "participants"}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
            <span className="text-xs font-medium text-muted-foreground">View Details</span>
            <div className="flex h-8 items-center gap-0 rounded-full bg-violet-100 px-2 transition-all duration-300 group-hover:gap-2 group-hover:bg-violet-600 group-hover:px-3 group-hover:text-white dark:bg-violet-950/50 dark:group-hover:bg-violet-600">
              <span className="text-xs font-medium max-w-0 overflow-hidden transition-all duration-300 group-hover:max-w-[50px] group-hover:opacity-100 opacity-0">
                View
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={2} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

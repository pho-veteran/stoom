"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Video, Settings } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "Recordings", href: "/dashboard/recordings", icon: Video },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col border-r border-border/50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex h-16 items-center border-b border-border/50 px-6">
        <Link href="/dashboard" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white font-bold">
            S
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
            Stoom
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1.5 px-4 py-6">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-violet-100 text-violet-700 shadow-sm dark:bg-violet-900/30 dark:text-violet-400"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "text-violet-600 dark:text-violet-400")} strokeWidth={isActive ? 2 : 1.5} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border/50 p-4">
        <div className="flex items-center justify-center">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-10 w-10 ring-2 ring-violet-200 dark:ring-violet-800",
                userButtonPopoverCard: "shadow-xl border-2",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}


"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { UserMinus, Crown, Shield, Clock } from "lucide-react";
import type { ParticipantRole } from "@/hooks/use-participants";

interface ParticipantCardProps {
  participant: {
    identity: string;
    name: string;
    imageUrl: string | null;
    role: ParticipantRole;
    isLocal: boolean;
  };
  joinedAt?: Date;
  canKick: boolean;
  onKick?: () => void;
  children: React.ReactNode;
}

/**
 * Format join time as absolute time (e.g., "Joined at 2:30 PM")
 */
function formatJoinTime(joinedAt: Date): string {
  return `Joined at ${joinedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
}


export function ParticipantCard({
  participant,
  joinedAt,
  canKick,
  onKick,
  children,
}: ParticipantCardProps) {
  const { name, imageUrl, role, isLocal } = participant;
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent 
        className="w-64 p-0" 
        align="start"
        side="right"
        sideOffset={8}
      >
        <div className="p-4">
          {/* Avatar and Name */}
          <div className="flex items-center gap-3 mb-3">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={name}
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-slate-600 text-lg font-semibold">
                {name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {name}
                {isLocal && (
                  <span className="ml-1 text-xs font-normal text-slate-400">(You)</span>
                )}
              </p>
              {/* Role Badge */}
              {role === 'HOST' && (
                <Badge className="mt-1 bg-amber-100 text-amber-700 border-amber-200 text-[10px] px-1.5 py-0 gap-1">
                  <Crown className="h-3 w-3" strokeWidth={2} />
                  Host
                </Badge>
              )}
              {role === 'CO_HOST' && (
                <Badge className="mt-1 bg-violet-100 text-violet-700 border-violet-200 text-[10px] px-1.5 py-0 gap-1">
                  <Shield className="h-3 w-3" strokeWidth={2} />
                  Co-Host
                </Badge>
              )}
            </div>
          </div>
          
          {/* Join Time */}
          {joinedAt && (
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
              <Clock className="h-3.5 w-3.5" strokeWidth={2} />
              <span>{formatJoinTime(joinedAt)}</span>
            </div>
          )}
          
          {/* Kick Button - only for hosts/co-hosts viewing non-host participants */}
          {canKick && onKick && (
            <div className="pt-3 border-t border-slate-100">
              <Button
                variant="destructive"
                size="sm"
                onClick={onKick}
                className="w-full gap-2"
              >
                <UserMinus className="h-4 w-4" strokeWidth={2} />
                Remove from Meeting
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

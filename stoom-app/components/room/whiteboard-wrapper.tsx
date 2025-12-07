"use client";

/**
 * WhiteboardWrapper Component
 * 
 * A wrapper that dynamically imports the Whiteboard component to avoid
 * SSR issues and duplicate tldraw imports in Next.js.
 * 
 * See: https://tldraw.dev/docs/installation#nextjs
 */

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import type { WhiteboardProps } from "./whiteboard";

// Dynamically import the Whiteboard component with SSR disabled
const Whiteboard = dynamic(
  () => import("./whiteboard").then((mod) => mod.Whiteboard),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading whiteboard...</p>
        </div>
      </div>
    ),
  }
);

export function WhiteboardWrapper(props: WhiteboardProps) {
  return <Whiteboard {...props} />;
}

export type { WhiteboardProps };

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MeetingEndedOverlayProps {
  hostName?: string
}

export function MeetingEndedOverlay({ hostName }: MeetingEndedOverlayProps) {
  const router = useRouter()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push("/dashboard")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="mx-4 max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <XCircle className="h-8 w-8 text-red-600" strokeWidth={1.5} />
        </div>

        <h2 className="mb-2 text-2xl font-bold text-slate-900">Meeting Ended</h2>

        <p className="mb-6 text-slate-600">
          {hostName ? (
            <>
              <span className="font-semibold">{hostName}</span> has ended the meeting for everyone.
            </>
          ) : (
            "The host has ended the meeting for everyone."
          )}
        </p>

        <p className="mb-6 text-sm text-slate-500">
          Redirecting to dashboard in{" "}
          <span className="font-bold text-violet-600">{countdown}</span> seconds...
        </p>

        <Button
          onClick={() => router.push("/dashboard")}
          className="w-full bg-violet-600 hover:bg-violet-700"
        >
          Go to Dashboard Now
        </Button>
      </div>
    </div>
  )
}

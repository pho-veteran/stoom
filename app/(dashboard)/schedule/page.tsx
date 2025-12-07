"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Users, Video } from "lucide-react";
import { useState } from "react";

export default function SchedulePage() {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [participants, setParticipants] = useState("");

  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold tracking-tight">Schedule a Study Session</h1>
          <p className="text-muted-foreground">
            Create a new meeting and invite your study group
          </p>
        </div>

        <Card className="border-2 shadow-lg">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950/50">
                <Video className="h-5 w-5 text-violet-600 dark:text-violet-400" strokeWidth={2} />
              </div>
              <div>
                <CardTitle className="text-xl">Session Details</CardTitle>
                <CardDescription className="mt-1">
                  Fill in the information to schedule your study session
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Session Title</label>
              <Input
                placeholder="e.g., Math Study Group - Calculus Review"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-violet-600 dark:text-violet-400" strokeWidth={2} />
                  Date
                </label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-violet-600 dark:text-violet-400" strokeWidth={2} />
                  Time
                </label>
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-violet-600 dark:text-violet-400" strokeWidth={2} />
                Participants
              </label>
              <Input
                placeholder="email1@example.com, email2@example.com"
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                Enter email addresses separated by commas
              </p>
            </div>

            <div className="pt-4">
              <Button className="w-full h-12 text-base bg-violet-600 hover:bg-violet-700 text-white" size="lg">
                <Video className="mr-2 h-5 w-5" strokeWidth={2} />
                Create Session
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mockMessages } from "@/lib/mock-data";
import { MessageSquare, FileText, X } from "lucide-react";
import { useState } from "react";

interface ChatNotesPanelProps {
  onClose: () => void;
}

export function ChatNotesPanel({ onClose }: ChatNotesPanelProps) {
  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState("chat");

  return (
    <div className="flex h-full w-full flex-col border-l border-border bg-card">
      {/* Header */}
      <div className="flex h-12 items-center justify-between border-b border-border px-4">
        <span className="text-sm font-semibold">Chat & Notes</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8"
          title="Close Panel"
        >
          <X className="h-4 w-4" strokeWidth={1.5} />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <div className="px-4 pt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chat" className="flex items-center justify-center gap-2">
              <MessageSquare className="h-4 w-4" strokeWidth={1.5} />
              Chat
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center justify-center gap-2">
              <FileText className="h-4 w-4" strokeWidth={1.5} />
              Notes
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Chat Tab */}
        <TabsContent value="chat" className="flex flex-1 flex-col overflow-hidden mt-0">
          <div className="flex-1 space-y-2 overflow-y-auto p-4">
            {mockMessages.map((message) => (
              <div key={message.id} className="rounded-lg bg-slate-50 dark:bg-slate-900/50 p-3">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-sm font-semibold">{message.userName}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm">{message.message}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-border p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newMessage.trim()) {
                    setNewMessage("");
                  }
                }}
                className="h-12 text-base"
              />
              <Button onClick={() => setNewMessage("")} disabled={!newMessage.trim()} className="h-12">
                Send
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="flex flex-1 flex-col overflow-hidden mt-0">
          <div className="flex-1 overflow-y-auto p-4">
            <div className="min-h-full rounded-lg border border-border bg-background p-4">
              <p className="text-sm text-muted-foreground">
                Collaborative notes editor will be available here
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                (Tiptap integration coming soon)
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}


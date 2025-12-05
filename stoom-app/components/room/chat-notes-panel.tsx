"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, FileText, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "@/hooks/use-chat";

interface ChatNotesPanelProps {
  onClose: () => void;
  messages?: ChatMessage[];
  onSendMessage?: (message: string) => Promise<void>;
}

export function ChatNotesPanel({
  onClose,
  messages = [],
  onSendMessage,
}: ChatNotesPanelProps) {
  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState("chat");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !onSendMessage || isSending) return;

    setIsSending(true);
    try {
      await onSendMessage(newMessage.trim());
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-2" strokeWidth={1.5} />
                <p className="text-sm text-muted-foreground">No messages yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Start the conversation!
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="rounded-lg bg-slate-50 dark:bg-slate-900/50 p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-sm font-semibold">{message.senderName}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap wrap-break-word">{message.message}</p>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="border-t border-border p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-12 text-base"
                disabled={isSending}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || isSending}
                className="h-12"
              >
                {isSending ? "..." : "Send"}
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

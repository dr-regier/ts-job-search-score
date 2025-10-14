"use client";

import ChatAssistant from "@/components/chat/chat-assistant";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RotateCcw } from "lucide-react";
import { useChatContext } from "@/lib/context/ChatContext";

export default function Home() {
  const { clearChat } = useChatContext();

  return (
    <div className="h-screen bg-background flex flex-col max-w-4xl mx-auto overflow-hidden">
      <Header />

      {/* New Chat Button */}
      <div className="flex justify-end px-4 py-2 border-b border-border">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <RotateCcw className="w-4 h-4" />
              New Chat
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear chat history?</AlertDialogTitle>
              <AlertDialogDescription>
                This will start a fresh conversation. Your saved jobs and profile
                data will be preserved. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={clearChat}>
                Clear Chat
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="flex-1 overflow-hidden">
        <ChatAssistant />
      </div>
    </div>
  );
}

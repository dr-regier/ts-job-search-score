import ChatAssistant from "@/components/chat/chat-assistant";
import { Header } from "@/components/layout/Header";

export default function Home() {
  return (
    <div className="h-screen bg-background flex flex-col max-w-4xl mx-auto overflow-hidden">
      <Header />

      <div className="flex-1 overflow-hidden">
        <ChatAssistant />
      </div>
    </div>
  );
}

import { ChatConsole } from "@/components/chat/chat-console";
import { requireAdminPage } from "@/lib/auth";

export default async function ChatPage() {
  const session = await requireAdminPage();
  return (
    <ChatConsole
      models={{
        chat: process.env.GROK_CHAT_MODEL || "grok-3-latest",
        image: process.env.GROK_IMAGE_MODEL || "grok-2-image-latest",
        video: process.env.GROK_VIDEO_MODEL || "grok-video-latest",
      }}
      username={session.username}
    />
  );
}

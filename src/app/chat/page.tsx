import { ChatConsole } from "@/components/chat/chat-console";
import { requireAdminPage } from "@/lib/auth";

export default async function ChatPage() {
  const session = await requireAdminPage();
  return <ChatConsole username={session.username} />;
}

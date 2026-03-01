import { ChatMode, ChatRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminApi } from "@/lib/auth";
import { callGrokChat, callGrokImage, callGrokVideo } from "@/lib/grok";
import { prisma } from "@/lib/prisma";

const sendMessageSchema = z.object({
  mode: z.nativeEnum(ChatMode).default(ChatMode.CHAT),
  prompt: z.string().min(1),
  options: z.record(z.string(), z.unknown()).optional(),
});

function generateImageMarkdown(images: Array<{ url: string | null; b64_json: string | null }>) {
  return images
    .map((image, index) => {
      if (image.url) {
        return `![image-${index + 1}](${image.url})`;
      }
      if (image.b64_json) {
        return `![image-${index + 1}](data:image/png;base64,${image.b64_json})`;
      }
      return "";
    })
    .filter(Boolean)
    .join("\n\n");
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdminApi();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { id } = await params;

  const conversation = await prisma.chatConversation.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  const messages = await prisma.chatMessage.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(messages);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdminApi();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { id } = await params;
  const conversation = await prisma.chatConversation.findUnique({ where: { id } });
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  try {
    const payload = sendMessageSchema.parse(await req.json());

    const userMessage = await prisma.chatMessage.create({
      data: {
        conversationId: id,
        role: ChatRole.USER,
        mode: payload.mode,
        content: payload.prompt,
      },
    });

    let assistantContent = "";
    let assistantMetadata: unknown = null;

    if (payload.mode === ChatMode.CHAT) {
      const historyMessages = await prisma.chatMessage.findMany({
        where: { conversationId: id, mode: ChatMode.CHAT },
        orderBy: { createdAt: "asc" },
        take: 30,
      });
      const history = historyMessages
        .filter((item) => item.role === ChatRole.USER || item.role === ChatRole.ASSISTANT || item.role === ChatRole.SYSTEM)
        .map((item) => ({
          role:
            item.role === ChatRole.ASSISTANT
              ? ("assistant" as const)
              : item.role === ChatRole.SYSTEM
                ? ("system" as const)
                : ("user" as const),
          content: item.content,
        }));
      const result = await callGrokChat(history, payload.prompt, payload.options);
      assistantContent = result.answer;
      assistantMetadata = { raw: result.raw };
    } else if (payload.mode === ChatMode.IMAGE) {
      const result = await callGrokImage(payload.prompt, payload.options);
      assistantContent = generateImageMarkdown(result.images) || "图片生成完成，但未返回可展示图片。";
      assistantMetadata = { images: result.images, raw: result.raw };
    } else {
      const result = await callGrokVideo(payload.prompt, payload.options);
      assistantContent = result.videoUrl ? `视频已生成：${result.videoUrl}` : `视频任务状态：${result.status}`;
      assistantMetadata = { requestId: result.requestId, status: result.status, videoUrl: result.videoUrl, raw: result.raw };
    }

    const assistantMessage = await prisma.chatMessage.create({
      data: {
        conversationId: id,
        role: ChatRole.ASSISTANT,
        mode: payload.mode,
        content: assistantContent,
        metadata: assistantMetadata as never,
      },
    });

    if (conversation.title === "新聊天") {
      await prisma.chatConversation.update({
        where: { id },
        data: {
          title: payload.prompt.slice(0, 40),
        },
      });
    }

    return NextResponse.json({
      userMessage,
      assistantMessage,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to send message.",
      },
      { status: 500 },
    );
  }
}

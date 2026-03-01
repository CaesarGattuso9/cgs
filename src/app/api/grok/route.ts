import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminApi } from "@/lib/auth";
import { callGrokChat, callGrokImage, callGrokVideo } from "@/lib/grok";

const grokRequestSchema = z.object({
  mode: z.enum(["chat", "image", "video"]),
  prompt: z.string().min(1),
  history: z
    .array(
      z.object({
        role: z.enum(["system", "user", "assistant"]),
        content: z.string(),
      }),
    )
    .default([]),
  options: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: Request) {
  const authResult = await requireAdminApi();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const payload = grokRequestSchema.parse(await req.json());

    if (payload.mode === "chat") {
      const result = await callGrokChat(payload.history, payload.prompt, payload.options);
      return NextResponse.json({ mode: "chat", ...result });
    }

    if (payload.mode === "image") {
      const result = await callGrokImage(payload.prompt, payload.options);
      return NextResponse.json({ mode: "image", ...result });
    }

    const result = await callGrokVideo(payload.prompt, payload.options);
    return NextResponse.json({ mode: "video", ...result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Grok request failed.",
      },
      { status: 500 },
    );
  }
}

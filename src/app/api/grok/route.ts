import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminApi } from "@/lib/auth";

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
  size: z.string().optional(),
  options: z.record(z.string(), z.unknown()).optional(),
});

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function getBaseUrl() {
  return (process.env.GROK_BASE_URL || "https://api.x.ai/v1").replace(/\/$/, "");
}

function getHeaders() {
  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) {
    throw new Error("GROK_API_KEY is not configured.");
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
}

function extractVideoInfo(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return { status: "unknown" as string, requestId: null as string | null, videoUrl: null as string | null };
  }
  const data = payload as Record<string, unknown>;
  const status = typeof data.status === "string" ? data.status : "unknown";
  const requestId = typeof data.request_id === "string" ? data.request_id : typeof data.id === "string" ? data.id : null;
  const videoUrl =
    typeof data.video_url === "string"
      ? data.video_url
      : typeof data.url === "string"
        ? data.url
        : Array.isArray(data.data) && data.data[0] && typeof data.data[0] === "object" && data.data[0] !== null
          ? typeof (data.data[0] as Record<string, unknown>).url === "string"
            ? ((data.data[0] as Record<string, unknown>).url as string)
            : null
          : null;
  return { status, requestId, videoUrl };
}

export async function POST(req: Request) {
  const authResult = await requireAdminApi();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const payload = grokRequestSchema.parse(await req.json());
    const baseUrl = getBaseUrl();
    const headers = getHeaders();

    if (payload.mode === "chat") {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: process.env.GROK_CHAT_MODEL || "grok-3-latest",
          messages: [...payload.history, { role: "user", content: payload.prompt }],
          ...payload.options,
        }),
      });
      const json = await response.json();
      if (!response.ok) {
        return NextResponse.json({ error: json }, { status: response.status });
      }
      const answer = json?.choices?.[0]?.message?.content ?? "";
      return NextResponse.json({ mode: "chat", answer, raw: json });
    }

    if (payload.mode === "image") {
      const response = await fetch(`${baseUrl}/images/generations`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: process.env.GROK_IMAGE_MODEL || "grok-2-image-latest",
          prompt: payload.prompt,
          size: payload.size || "1024x1024",
          ...payload.options,
        }),
      });
      const json = await response.json();
      if (!response.ok) {
        return NextResponse.json({ error: json }, { status: response.status });
      }
      const images =
        Array.isArray(json?.data) &&
        json.data
          .map((item: Record<string, unknown>) => ({
            url: typeof item.url === "string" ? item.url : null,
            b64_json: typeof item.b64_json === "string" ? item.b64_json : null,
          }))
          .filter((item: { url: string | null; b64_json: string | null }) => item.url || item.b64_json);
      return NextResponse.json({ mode: "image", images: images || [], raw: json });
    }

    const submitResponse = await fetch(`${baseUrl}/videos/generations`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: process.env.GROK_VIDEO_MODEL || "grok-video-latest",
        prompt: payload.prompt,
        ...payload.options,
      }),
    });
    const submitJson = await submitResponse.json();
    if (!submitResponse.ok) {
      return NextResponse.json({ error: submitJson }, { status: submitResponse.status });
    }

    const submitInfo = extractVideoInfo(submitJson);
    if (!submitInfo.requestId) {
      return NextResponse.json({ mode: "video", status: submitInfo.status, raw: submitJson });
    }

    let lastStatus = submitInfo.status;
    let lastPayload: unknown = submitJson;
    let videoUrl = submitInfo.videoUrl;

    for (let i = 0; i < 30; i += 1) {
      if (videoUrl) {
        break;
      }
      await delay(2000);
      const pollResponse = await fetch(`${baseUrl}/videos/${submitInfo.requestId}`, { headers });
      const pollJson = await pollResponse.json();
      if (!pollResponse.ok) {
        return NextResponse.json({ error: pollJson }, { status: pollResponse.status });
      }
      const pollInfo = extractVideoInfo(pollJson);
      lastStatus = pollInfo.status;
      lastPayload = pollJson;
      videoUrl = pollInfo.videoUrl;
      if (lastStatus === "failed") {
        break;
      }
    }

    return NextResponse.json({
      mode: "video",
      requestId: submitInfo.requestId,
      status: lastStatus,
      videoUrl,
      raw: lastPayload,
    });
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

type GrokMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

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

export async function callGrokChat(history: GrokMessage[], prompt: string, options?: Record<string, unknown>) {
  const response = await fetch(`${getBaseUrl()}/chat/completions`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      model: process.env.GROK_CHAT_MODEL || "grok-3-latest",
      messages: [...history, { role: "user", content: prompt }],
      ...(options || {}),
    }),
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(typeof json?.error?.message === "string" ? json.error.message : "Grok chat failed.");
  }

  const answer = json?.choices?.[0]?.message?.content ?? "";
  return { answer, raw: json };
}

export async function callGrokImage(prompt: string, options?: Record<string, unknown>) {
  const response = await fetch(`${getBaseUrl()}/images/generations`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      model: process.env.GROK_IMAGE_MODEL || "grok-2-image-latest",
      prompt,
      size: "1024x1024",
      ...(options || {}),
    }),
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(typeof json?.error?.message === "string" ? json.error.message : "Grok image failed.");
  }

  const images =
    Array.isArray(json?.data) &&
    json.data
      .map((item: Record<string, unknown>) => ({
        url: typeof item.url === "string" ? item.url : null,
        b64_json: typeof item.b64_json === "string" ? item.b64_json : null,
      }))
      .filter((item: { url: string | null; b64_json: string | null }) => item.url || item.b64_json);

  return { images: images || [], raw: json };
}

export async function callGrokVideo(prompt: string, options?: Record<string, unknown>) {
  const submitResponse = await fetch(`${getBaseUrl()}/videos/generations`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      model: process.env.GROK_VIDEO_MODEL || "grok-video-latest",
      prompt,
      ...(options || {}),
    }),
  });

  const submitJson = await submitResponse.json();
  if (!submitResponse.ok) {
    throw new Error(typeof submitJson?.error?.message === "string" ? submitJson.error.message : "Grok video submit failed.");
  }

  const submitInfo = extractVideoInfo(submitJson);
  if (!submitInfo.requestId) {
    return { requestId: null, status: submitInfo.status, videoUrl: submitInfo.videoUrl, raw: submitJson };
  }

  let lastStatus = submitInfo.status;
  let lastPayload: unknown = submitJson;
  let videoUrl = submitInfo.videoUrl;

  for (let i = 0; i < 30; i += 1) {
    if (videoUrl) break;
    await delay(2000);
    const pollResponse = await fetch(`${getBaseUrl()}/videos/${submitInfo.requestId}`, { headers: getHeaders() });
    const pollJson = await pollResponse.json();
    if (!pollResponse.ok) {
      throw new Error(typeof pollJson?.error?.message === "string" ? pollJson.error.message : "Grok video poll failed.");
    }
    const pollInfo = extractVideoInfo(pollJson);
    lastStatus = pollInfo.status;
    lastPayload = pollJson;
    videoUrl = pollInfo.videoUrl;
    if (lastStatus === "failed") break;
  }

  return { requestId: submitInfo.requestId, status: lastStatus, videoUrl, raw: lastPayload };
}

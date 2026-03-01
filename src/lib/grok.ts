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

async function requestJson(url: string, init: RequestInit) {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (error) {
    const cause = error instanceof Error && "cause" in error ? (error as Error & { cause?: unknown }).cause : undefined;
    const causeMsg =
      cause && typeof cause === "object" && "message" in cause ? String((cause as { message?: unknown }).message) : undefined;
    const baseMsg = error instanceof Error ? error.message : "unknown fetch error";
    throw new Error(`Network request failed: ${baseMsg}${causeMsg ? ` | cause: ${causeMsg}` : ""} | url: ${url}`);
  }

  const text = await response.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  if (!response.ok) {
    const message =
      typeof (json as { error?: { message?: unknown } })?.error?.message === "string"
        ? (json as { error: { message: string } }).error.message
        : `HTTP ${response.status}`;
    throw new Error(`${message} | url: ${url}`);
  }

  return json;
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
  const url = `${getBaseUrl()}/chat/completions`;
  const json = (await requestJson(url, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      model: process.env.GROK_CHAT_MODEL || "grok-3-latest",
      messages: [...history, { role: "user", content: prompt }],
      ...(options || {}),
    }),
  })) as Record<string, unknown>;

  const choices = Array.isArray(json.choices) ? json.choices : [];
  const first = choices[0];
  const answer =
    first && typeof first === "object" && first !== null && "message" in first
      ? (() => {
          const msg = (first as { message?: unknown }).message;
          return msg && typeof msg === "object" && msg !== null && "content" in msg
            ? String((msg as { content?: unknown }).content ?? "")
            : "";
        })()
      : "";
  return { answer, raw: json };
}

export async function callGrokImage(prompt: string, options?: Record<string, unknown>) {
  const url = `${getBaseUrl()}/images/generations`;
  const json = (await requestJson(url, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      model: process.env.GROK_IMAGE_MODEL || "grok-2-image-latest",
      prompt,
      size: "1024x1024",
      ...(options || {}),
    }),
  })) as Record<string, unknown>;

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
  const submitUrl = `${getBaseUrl()}/videos/generations`;
  const submitJson = await requestJson(submitUrl, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      model: process.env.GROK_VIDEO_MODEL || "grok-video-latest",
      prompt,
      ...(options || {}),
    }),
  });

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
    const pollUrl = `${getBaseUrl()}/videos/${submitInfo.requestId}`;
    const pollJson = await requestJson(pollUrl, { headers: getHeaders() });
    const pollInfo = extractVideoInfo(pollJson);
    lastStatus = pollInfo.status;
    lastPayload = pollJson;
    videoUrl = pollInfo.videoUrl;
    if (lastStatus === "failed") break;
  }

  return { requestId: submitInfo.requestId, status: lastStatus, videoUrl, raw: lastPayload };
}

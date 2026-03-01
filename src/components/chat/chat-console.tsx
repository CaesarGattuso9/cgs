"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export function ChatConsole({ username }: { username: string }) {
  const router = useRouter();
  const [chatPrompt, setChatPrompt] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");
  const [videoPrompt, setVideoPrompt] = useState("");
  const [advancedOptions, setAdvancedOptions] = useState("{}");
  const [messages, setMessages] = useState<Message[]>([]);
  const [images, setImages] = useState<Array<{ url: string | null; b64_json: string | null }>>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoStatus, setVideoStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const parseOptions = () => {
    try {
      const parsed = JSON.parse(advancedOptions || "{}");
      return parsed as Record<string, unknown>;
    } catch {
      throw new Error("高级参数 JSON 格式错误");
    }
  };

  const callGrok = async (body: Record<string, unknown>) => {
    const response = await fetch("/api/grok", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await response.json();
    if (!response.ok) {
      throw new Error(typeof json?.error === "string" ? json.error : "请求失败");
    }
    return json;
  };

  const ask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!chatPrompt.trim()) return;
    setError("");
    setLoading(true);
    const newMessages = [...messages, { role: "user" as const, content: chatPrompt }];
    setMessages(newMessages);
    setChatPrompt("");
    try {
      const options = parseOptions();
      const json = await callGrok({
        mode: "chat",
        prompt: newMessages[newMessages.length - 1].content,
        history: newMessages
          .slice(0, -1)
          .map((item) => ({ role: item.role === "assistant" ? "assistant" : "user", content: item.content })),
        options,
      });
      setMessages((prev) => [...prev, { role: "assistant", content: String(json.answer || "") }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "请求失败");
    } finally {
      setLoading(false);
    }
  };

  const generateImage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!imagePrompt.trim()) return;
    setError("");
    setLoading(true);
    setImages([]);
    try {
      const options = parseOptions();
      const json = await callGrok({
        mode: "image",
        prompt: imagePrompt,
        options,
      });
      setImages(Array.isArray(json.images) ? json.images : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "请求失败");
    } finally {
      setLoading(false);
    }
  };

  const generateVideo = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!videoPrompt.trim()) return;
    setError("");
    setLoading(true);
    setVideoUrl("");
    setVideoStatus("处理中...");
    try {
      const options = parseOptions();
      const json = await callGrok({
        mode: "video",
        prompt: videoPrompt,
        options,
      });
      setVideoStatus(String(json.status || "unknown"));
      setVideoUrl(String(json.videoUrl || ""));
    } catch (e) {
      setError(e instanceof Error ? e.message : "请求失败");
      setVideoStatus("failed");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 md:px-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#09090f] p-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-cyan-300">Grok 聊天与生成</h1>
          <p className="text-sm text-zinc-400">当前登录：{username}</p>
        </div>
        <div className="flex gap-2">
          <Link className="rounded-md border border-white/10 px-3 py-2 text-sm hover:bg-white/10" href="/admin">
            返回管理后台
          </Link>
          <Button onClick={logout} variant="outline">
            退出登录
          </Button>
        </div>
      </header>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>高级参数</CardTitle>
          <CardDescription>
            这里可填写传给 xAI API 的 JSON 参数。你提到已开启 NSFW，可在这里写入你账号对应的安全策略参数。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            className="h-24 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 font-mono text-sm"
            onChange={(e) => setAdvancedOptions(e.target.value)}
            value={advancedOptions}
          />
          {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
        </CardContent>
      </Card>

      <Tabs defaultValue="chat">
        <TabsList className="w-full">
          <TabsTrigger value="chat">提问</TabsTrigger>
          <TabsTrigger value="image">生图</TabsTrigger>
          <TabsTrigger value="video">生成视频</TabsTrigger>
        </TabsList>

        <TabsContent value="chat">
          <Card>
            <CardHeader>
              <CardTitle>对话</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-96 space-y-2 overflow-auto rounded-md border border-white/10 bg-black/20 p-3">
                {messages.length === 0 ? <p className="text-sm text-zinc-500">暂无消息</p> : null}
                {messages.map((message, index) => (
                  <div key={`${message.role}-${index}`} className="rounded-md border border-white/10 p-2 text-sm">
                    <p className="mb-1 font-mono text-xs text-zinc-400">{message.role.toUpperCase()}</p>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                ))}
              </div>
              <form className="space-y-3" onSubmit={ask}>
                <textarea
                  className="h-24 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2"
                  onChange={(e) => setChatPrompt(e.target.value)}
                  placeholder="输入问题..."
                  value={chatPrompt}
                />
                <Button disabled={loading} type="submit">
                  {loading ? "处理中..." : "发送"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="image">
          <Card>
            <CardHeader>
              <CardTitle>图片生成</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form className="space-y-3" onSubmit={generateImage}>
                <textarea
                  className="h-24 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2"
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder="输入图片提示词..."
                  value={imagePrompt}
                />
                <Button disabled={loading} type="submit">
                  {loading ? "生成中..." : "生成图片"}
                </Button>
              </form>
              <div className="grid gap-3 sm:grid-cols-2">
                {images.map((image, index) =>
                  image.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt={`generated-${index}`} className="w-full rounded-md border border-white/10 object-cover" key={`${image.url}-${index}`} src={image.url} />
                  ) : image.b64_json ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt={`generated-b64-${index}`} className="w-full rounded-md border border-white/10 object-cover" key={`${index}-b64`} src={`data:image/png;base64,${image.b64_json}`} />
                  ) : null,
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="video">
          <Card>
            <CardHeader>
              <CardTitle>视频生成</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form className="space-y-3" onSubmit={generateVideo}>
                <textarea
                  className="h-24 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2"
                  onChange={(e) => setVideoPrompt(e.target.value)}
                  placeholder="输入视频提示词..."
                  value={videoPrompt}
                />
                <Button disabled={loading} type="submit">
                  {loading ? "生成中..." : "生成视频"}
                </Button>
              </form>
              {videoStatus ? <p className="text-sm text-zinc-300">状态：{videoStatus}</p> : null}
              {videoUrl ? (
                <video className="w-full rounded-md border border-white/10" controls src={videoUrl}>
                  <track kind="captions" />
                </video>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}

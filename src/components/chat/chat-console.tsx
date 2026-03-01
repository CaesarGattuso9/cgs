"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui/button";

type Conversation = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
};

type ChatModeValue = "CHAT" | "IMAGE" | "VIDEO";
type ChatRoleValue = "USER" | "ASSISTANT" | "SYSTEM";

type Message = {
  id: string;
  conversationId: string;
  role: ChatRoleValue;
  mode: ChatModeValue;
  content: string;
  metadata: unknown;
  createdAt: string;
};

type ChatModels = {
  chat: string;
  image: string;
  video: string;
};

const DRAFT_ID = "__draft__";

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function ChatConsole({ username, models }: { username: string; models: ChatModels }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState(DRAFT_ID);
  const [messages, setMessages] = useState<Message[]>([]);
  const [mode, setMode] = useState<ChatModeValue>("CHAT");
  const [prompt, setPrompt] = useState("");
  const [loadingList, setLoadingList] = useState(false);
  const [loadingSend, setLoadingSend] = useState(false);
  const [error, setError] = useState("");

  const activeConversation = useMemo(() => {
    if (activeId === DRAFT_ID) {
      return { id: DRAFT_ID, title: "新聊天", updatedAt: "", messageCount: 0 };
    }
    return conversations.find((c) => c.id === activeId) || null;
  }, [conversations, activeId]);

  const currentModel =
    mode === "CHAT" ? models.chat : mode === "IMAGE" ? models.image : models.video;

  const loadConversations = async (search = "") => {
    setLoadingList(true);
    try {
      const url = search.trim() ? `/api/chat/conversations?q=${encodeURIComponent(search.trim())}` : "/api/chat/conversations";
      const resp = await fetch(url, { cache: "no-store" });
      const json = await resp.json();
      const list: Conversation[] = Array.isArray(json) ? json : [];
      setConversations(list);

      if (activeId !== DRAFT_ID && activeId && !list.some((item) => item.id === activeId)) {
        if (list[0]) {
          setActiveId(list[0].id);
        } else {
          setActiveId(DRAFT_ID);
          setMessages([]);
        }
      }
    } finally {
      setLoadingList(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    if (conversationId === DRAFT_ID) {
      setMessages([]);
      return;
    }
    const resp = await fetch(`/api/chat/conversations/${conversationId}/messages`, { cache: "no-store" });
    const json = await resp.json();
    setMessages(Array.isArray(json) ? json : []);
  };

  useEffect(() => {
    void loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void loadMessages(activeId);
  }, [activeId]);

  const startNewChat = () => {
    setError("");
    setActiveId(DRAFT_ID);
    setMessages([]);
    setPrompt("");
  };

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await loadConversations(query);
  };

  const ensureConversationForSending = async (firstPrompt: string) => {
    if (activeId !== DRAFT_ID) {
      return activeId;
    }

    const resp = await fetch("/api/chat/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: firstPrompt.slice(0, 40) || "新聊天" }),
    });
    const json = await resp.json();
    if (!resp.ok) {
      throw new Error(typeof json?.error === "string" ? json.error : "创建会话失败");
    }

    await loadConversations(query);
    setActiveId(json.id);
    return json.id as string;
  };

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!prompt.trim()) return;

    setError("");
    setLoadingSend(true);
    try {
      const promptText = prompt;
      const targetId = await ensureConversationForSending(promptText);

      const resp = await fetch(`/api/chat/conversations/${targetId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          prompt: promptText,
        }),
      });
      const json = await resp.json();
      if (!resp.ok) {
        throw new Error(typeof json?.error === "string" ? json.error : "发送失败");
      }

      setPrompt("");
      await Promise.all([loadMessages(targetId), loadConversations(query)]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "发送失败");
    } finally {
      setLoadingSend(false);
    }
  };

  const deleteConversation = async (id: string) => {
    setError("");
    const resp = await fetch(`/api/chat/conversations/${id}`, {
      method: "DELETE",
    });
    const json = await resp.json();
    if (!resp.ok) {
      setError(typeof json?.error === "string" ? json.error : "删除失败");
      return;
    }

    if (activeId === id) {
      setActiveId(DRAFT_ID);
      setMessages([]);
    }
    await loadConversations(query);
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <main className="flex min-h-screen bg-[#07070b] text-zinc-100">
      <aside className="w-full max-w-xs border-r border-white/10 bg-[#09090f] p-4">
        <div className="mb-4">
          <p className="font-display text-xl font-bold text-cyan-300">AI 聊天</p>
          <p className="text-xs text-zinc-500">登录用户：{username}</p>
        </div>

        <div className="mb-3 flex gap-2">
          <Button className="flex-1" onClick={startNewChat} size="sm">
            + 新聊天
          </Button>
          <Button onClick={logout} size="sm" variant="outline">
            退出
          </Button>
        </div>

        <form className="mb-3 flex gap-2" onSubmit={handleSearch}>
          <input
            className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none ring-cyan-400/40 focus:ring-2"
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索聊天历史"
            value={query}
          />
          <Button size="sm" type="submit" variant="outline">
            搜索
          </Button>
        </form>

        <div className="max-h-[calc(100vh-240px)] space-y-2 overflow-auto pr-1">
          {loadingList ? <p className="text-xs text-zinc-500">加载中...</p> : null}
          {conversations.map((item) => (
            <div
              className={`w-full rounded-md border px-2 py-2 transition ${item.id === activeId ? "border-cyan-400/50 bg-cyan-500/10" : "border-white/10 bg-black/20 hover:border-white/20"}`}
              key={item.id}
            >
              <div className="flex items-start gap-2">
                <button className="min-w-0 flex-1 cursor-pointer text-left" onClick={() => setActiveId(item.id)} type="button">
                  <p className="line-clamp-1 text-sm font-medium">{item.title}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {formatTime(item.updatedAt)} · {item.messageCount} 条
                  </p>
                </button>
                <button
                  className="rounded border border-red-400/40 px-2 py-1 text-[11px] text-red-300 hover:bg-red-500/10"
                  onClick={() => void deleteConversation(item.id)}
                  type="button"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-white/10 bg-[#09090f] px-4 py-3">
          <div>
            <p className="font-display text-lg font-bold">{activeConversation?.title || "新聊天"}</p>
            <p className="text-xs text-zinc-500">当前模型：{currentModel}</p>
          </div>
          <div className="flex gap-2">
            <Link className="rounded-md border border-white/10 px-3 py-1.5 text-xs hover:bg-white/10" href="/admin">
              管理后台
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-3">
            {messages.length === 0 ? <p className="text-sm text-zinc-500">暂无消息，开始提问吧。</p> : null}
            {messages.map((message) => (
              <div
                className={`rounded-lg border p-3 ${message.role === "USER" ? "ml-12 border-cyan-400/30 bg-cyan-500/10" : "mr-12 border-white/10 bg-black/20"}`}
                key={message.id}
              >
                <p className="mb-1 font-mono text-[11px] uppercase tracking-wide text-zinc-500">
                  {message.role} · {message.mode} · {formatTime(message.createdAt)}
                </p>
                <article className="prose prose-invert max-w-none prose-img:rounded-md prose-pre:overflow-x-auto prose-pre:rounded-md prose-pre:border prose-pre:border-white/10 prose-pre:bg-[#0a0a12]">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                </article>
              </div>
            ))}
          </div>
        </div>

        <footer className="border-t border-white/10 bg-[#09090f] p-4">
          <div className="mx-auto w-full max-w-4xl space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                className={`rounded-md border px-3 py-1 text-xs ${mode === "CHAT" ? "border-cyan-400/50 bg-cyan-500/10" : "border-white/10 bg-black/20"}`}
                onClick={() => setMode("CHAT")}
                type="button"
              >
                聊天
              </button>
              <button
                className={`rounded-md border px-3 py-1 text-xs ${mode === "IMAGE" ? "border-cyan-400/50 bg-cyan-500/10" : "border-white/10 bg-black/20"}`}
                onClick={() => setMode("IMAGE")}
                type="button"
              >
                生图
              </button>
              <button
                className={`rounded-md border px-3 py-1 text-xs ${mode === "VIDEO" ? "border-cyan-400/50 bg-cyan-500/10" : "border-white/10 bg-black/20"}`}
                onClick={() => setMode("VIDEO")}
                type="button"
              >
                视频
              </button>
            </div>

            <form className="flex gap-2" onSubmit={sendMessage}>
              <textarea
                className="h-24 flex-1 rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none ring-cyan-400/40 focus:ring-2"
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={mode === "CHAT" ? "输入你的问题..." : mode === "IMAGE" ? "输入生图提示词..." : "输入视频提示词..."}
                value={prompt}
              />
              <Button disabled={loadingSend} type="submit">
                {loadingSend ? "发送中..." : "发送"}
              </Button>
            </form>
            {error ? <p className="text-sm text-red-300">{error}</p> : null}
          </div>
        </footer>
      </section>
    </main>
  );
}

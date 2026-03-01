"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const json = await response.json();
      if (!response.ok) {
        setError(typeof json?.error === "string" ? json.error : "登录失败");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("网络错误，请稍后重试。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>管理员登录</CardTitle>
        <CardDescription>登录后可写博客、添加旅游记录、健身打卡、食物记录和理财账户管理。</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <label className="text-sm text-zinc-300" htmlFor="username">
              用户名
            </label>
            <input
              className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none ring-cyan-500/50 focus:ring-2"
              id="username"
              onChange={(e) => setUsername(e.target.value)}
              required
              value={username}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-zinc-300" htmlFor="password">
              密码
            </label>
            <input
              className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none ring-cyan-500/50 focus:ring-2"
              id="password"
              onChange={(e) => setPassword(e.target.value)}
              required
              type="password"
              value={password}
            />
          </div>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <Button className="w-full" disabled={loading} type="submit">
            {loading ? "登录中..." : "登录"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

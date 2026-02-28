"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import "highlight.js/styles/github-dark.css";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { BookOpenText, CandlestickChart, Dumbbell, MapPinned, Upload } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const KLineChart = dynamic(() => import("@/components/studio/kline-chart").then((m) => m.KLineChart), {
  ssr: false,
});

const TravelMap = dynamic(() => import("@/components/studio/travel-map").then((m) => m.TravelMap), {
  ssr: false,
});

const defaultMarkdown = `# Rust + Next.js 全栈笔记

今天把博客系统升级为 **Next.js 15 + React 19**，并接入 Prisma + PostgreSQL。

## 核心改造

\`\`\`ts
const weekCompletionRate = doneDays / plannedDays
const monthCompletionRate = monthDone / monthPlan
const yearCompletionRate = yearDone / yearPlan
\`\`\`

## 视频记录

- YouTube: https://www.youtube.com/watch?v=dQw4w9WgXcQ
- Bilibili: https://www.bilibili.com/video/BV1xx411c7mD
`;

const travelSpots = [
  { name: "Bali", lat: -8.4095, lng: 115.1889, note: "海边冲浪与日落摄影" },
  { name: "Kyoto", lat: 35.0116, lng: 135.7681, note: "寺院与街拍" },
  { name: "Zhangjiajie", lat: 29.1171, lng: 110.4792, note: "徒步与山地航拍" },
];

const pieData = [
  { name: "已完成", value: 19, color: "#39ff88" },
  { name: "未完成", value: 5, color: "#ff6b35" },
];

const klineData = [
  { time: "2026-02-01", value: 1.032 },
  { time: "2026-02-05", value: 1.044 },
  { time: "2026-02-10", value: 1.026 },
  { time: "2026-02-15", value: 1.051 },
  { time: "2026-02-20", value: 1.068 },
  { time: "2026-02-25", value: 1.074 },
];

function getVideoEmbedUrl(url: string) {
  const youtubeMatch =
    url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/i) ||
    url.match(/youtube\.com\/embed\/([^&?/]+)/i);
  if (youtubeMatch?.[1]) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  }

  const bilibiliMatch = url.match(/bilibili\.com\/video\/(BV[0-9A-Za-z]+)/i);
  if (bilibiliMatch?.[1]) {
    return `https://player.bilibili.com/player.html?bvid=${bilibiliMatch[1]}&page=1`;
  }

  return null;
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
}

export default function StudioPage() {
  const [markdown, setMarkdown] = useState(defaultMarkdown);

  const completion = useMemo(() => {
    const weekDone = 4;
    const weekPlan = 5;
    const monthDone = 19;
    const monthPlan = 24;
    const yearDone = 45;
    const yearPlan = 60;
    return {
      week: clampPercent((weekDone / weekPlan) * 100),
      month: clampPercent((monthDone / monthPlan) * 100),
      year: clampPercent((yearDone / yearPlan) * 100),
    };
  }, []);

  const loadMarkdownFile = async (file?: File | null) => {
    if (!file) {
      return;
    }
    const text = await file.text();
    setMarkdown(text);
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-10 md:px-8">
      <header className="mb-8 rounded-xl border border-white/10 bg-[#09090f] p-6">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-cyan-300">LIFELOG.SYS · Studio</h1>
        <p className="mt-2 text-sm text-zinc-400">
          主站按你提供的设计稿直出在 <code>/blog.html</code>，这里是 Next.js 15 全栈功能工作台。
        </p>
      </header>

      <Tabs defaultValue="tech">
        <TabsList className="w-full overflow-x-auto">
          <TabsTrigger value="tech">
            <BookOpenText className="mr-2 h-4 w-4" />
            技术分享
          </TabsTrigger>
          <TabsTrigger value="travel">
            <MapPinned className="mr-2 h-4 w-4" />
            旅游照片
          </TabsTrigger>
          <TabsTrigger value="fitness">
            <Dumbbell className="mr-2 h-4 w-4" />
            健身计划
          </TabsTrigger>
          <TabsTrigger value="finance">
            <CandlestickChart className="mr-2 h-4 w-4" />
            理财模块
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tech">
          <Card>
            <CardHeader>
              <CardTitle>Markdown 编辑与预览</CardTitle>
              <CardDescription>支持拖拽/选择 .md 文件，自动渲染代码高亮并识别 YouTube/Bilibili 链接。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label
                className="flex min-h-24 cursor-pointer items-center justify-center rounded-lg border border-dashed border-cyan-500/40 bg-cyan-500/5 p-4 text-center text-sm text-cyan-200"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  void loadMarkdownFile(e.dataTransfer.files?.[0]);
                }}
              >
                <input
                  accept=".md,text/markdown"
                  className="hidden"
                  onChange={(e) => {
                    void loadMarkdownFile(e.target.files?.[0]);
                  }}
                  type="file"
                />
                <span className="inline-flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  拖拽 .md 文件到这里，或点击上传
                </span>
              </label>

              <textarea
                className="h-44 w-full rounded-lg border border-white/10 bg-black/20 p-3 font-mono text-sm text-zinc-200 outline-none ring-cyan-500/50 focus:ring-2"
                onChange={(e) => setMarkdown(e.target.value)}
                value={markdown}
              />

              <article className="prose prose-invert max-w-none rounded-lg border border-white/10 bg-black/20 p-4 prose-headings:font-semibold prose-a:text-cyan-300">
                <ReactMarkdown
                  components={{
                    a: (props) => {
                      const href = String(props.href || "");
                      const embedUrl = getVideoEmbedUrl(href);
                      if (embedUrl) {
                        return (
                          <div className="my-4 overflow-hidden rounded-lg border border-white/10">
                            <iframe
                              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="aspect-video w-full"
                              src={embedUrl}
                              title="embedded-video"
                            />
                          </div>
                        );
                      }
                      return (
                        <a href={href} rel="noreferrer" target="_blank">
                          {props.children}
                        </a>
                      );
                    },
                  }}
                  rehypePlugins={[rehypeRaw, rehypeHighlight]}
                  remarkPlugins={[remarkGfm]}
                >
                  {markdown}
                </ReactMarkdown>
              </article>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="travel">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>足迹地图（Leaflet）</CardTitle>
                <CardDescription>地点点击可查看对应旅行备注，后续可联动相册查询。</CardDescription>
              </CardHeader>
              <CardContent>
                <TravelMap spots={travelSpots} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>旅行相册</CardTitle>
                <CardDescription>使用 Next.js Image 组件，后端上传后存储到 MinIO。</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <Image
                  alt="travel photo"
                  className="h-36 w-full rounded-lg object-cover"
                  height={280}
                  src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80"
                  width={420}
                />
                <Image
                  alt="travel photo"
                  className="h-36 w-full rounded-lg object-cover"
                  height={280}
                  src="https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1400&q=80"
                  width={420}
                />
                <Image
                  alt="travel photo"
                  className="h-36 w-full rounded-lg object-cover"
                  height={280}
                  src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1400&q=80"
                  width={420}
                />
                <Image
                  alt="travel photo"
                  className="h-36 w-full rounded-lg object-cover"
                  height={280}
                  src="https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=1400&q=80"
                  width={420}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="fitness">
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>完成率统计</CardTitle>
                <CardDescription>周/月/年计算公式均按你提供的方案执行。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>周完成率</span>
                    <span>{completion.week.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full bg-orange-400" style={{ width: `${completion.week}%` }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>月完成率</span>
                    <span>{completion.month.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full bg-cyan-400" style={{ width: `${completion.month}%` }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>年完成率</span>
                    <span>{completion.year.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full bg-purple-400" style={{ width: `${completion.year}%` }} />
                  </div>
                </div>
                <p className="font-mono text-xs text-zinc-400">
                  周完成率 = 本周完成天数 / 本周计划天数；月完成率 = 本月完成天数 / 本月计划天数；年完成率 = 全年完成天数 / 全年计划天数
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>训练分布</CardTitle>
                <CardDescription>可替换为真实打卡数据进行实时统计。</CardDescription>
              </CardHeader>
              <CardContent className="h-[260px]">
                <ResponsiveContainer height="100%" width="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" innerRadius={56} outerRadius={94}>
                      {pieData.map((item) => (
                        <Cell fill={item.color} key={item.name} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="finance">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>基金净值走势（Lightweight Charts）</CardTitle>
                <CardDescription>支付宝无官方 API，建议手动录入或 Cookie 爬虫后入库。</CardDescription>
              </CardHeader>
              <CardContent>
                <KLineChart data={klineData} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>持仓快照</CardTitle>
                <CardDescription>展示收益率、持仓成本，支持后端 API 实时计算。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-lg border border-white/10 p-3">
                  <span>沪深300ETF</span>
                  <span className="font-mono text-green-300">+6.42%</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-white/10 p-3">
                  <span>黄金ETF</span>
                  <span className="font-mono text-green-300">+3.12%</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-white/10 p-3">
                  <span>纳指100联接</span>
                  <span className="font-mono text-red-300">-1.48%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}

"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type FitnessPlan = {
  id: string;
  name: string;
};

type FundAccount = {
  id: string;
  name: string;
  platform: string;
};

type SubmitState = {
  ok: boolean;
  message: string;
};

const defaultState: SubmitState = { ok: true, message: "" };

async function postJson(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await response.json();
  if (!response.ok) {
    const msg = typeof json?.error === "string" ? json.error : "提交失败";
    throw new Error(msg);
  }
  return json;
}

function StatusView({ status }: { status: SubmitState }) {
  if (!status.message) {
    return null;
  }
  return <p className={`text-sm ${status.ok ? "text-green-300" : "text-red-300"}`}>{status.message}</p>;
}

export function AdminPanel({ username }: { username: string }) {
  const router = useRouter();
  const [plans, setPlans] = useState<FitnessPlan[]>([]);
  const [accounts, setAccounts] = useState<FundAccount[]>([]);
  const [status, setStatus] = useState<SubmitState>(defaultState);

  const [postTitle, setPostTitle] = useState("");
  const [postSlug, setPostSlug] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postTags, setPostTags] = useState("");

  const [travelName, setTravelName] = useState("");
  const [travelCountry, setTravelCountry] = useState("");
  const [travelLat, setTravelLat] = useState("");
  const [travelLng, setTravelLng] = useState("");
  const [travelDesc, setTravelDesc] = useState("");

  const [planName, setPlanName] = useState("");
  const [planStart, setPlanStart] = useState("");
  const [recordPlanId, setRecordPlanId] = useState("");
  const [recordType, setRecordType] = useState("力量训练");
  const [recordDate, setRecordDate] = useState("");
  const [recordDuration, setRecordDuration] = useState("45");
  const [recordCalories, setRecordCalories] = useState("350");
  const [foodName, setFoodName] = useState("");
  const [foodProtein, setFoodProtein] = useState("30");
  const [foodCarbs, setFoodCarbs] = useState("20");
  const [foodFat, setFoodFat] = useState("10");
  const [foodCalories, setFoodCalories] = useState("280");

  const [accountName, setAccountName] = useState("");
  const [accountPlatform, setAccountPlatform] = useState("支付宝");
  const [transactionAccountId, setTransactionAccountId] = useState("");
  const [transactionSymbol, setTransactionSymbol] = useState("510300");
  const [transactionType, setTransactionType] = useState("BUY");
  const [transactionUnits, setTransactionUnits] = useState("1000");
  const [transactionPrice, setTransactionPrice] = useState("1.23");
  const [transactionAmount, setTransactionAmount] = useState("1230");

  const initialDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    setPlanStart(initialDate);
    setRecordDate(initialDate);
  }, [initialDate]);

  useEffect(() => {
    const loadMeta = async () => {
      const [planResp, accountResp] = await Promise.all([fetch("/api/fitness-plans"), fetch("/api/fund-accounts")]);
      const [planJson, accountJson] = await Promise.all([planResp.json(), accountResp.json()]);
      const loadedPlans: FitnessPlan[] = Array.isArray(planJson) ? planJson : [];
      const loadedAccounts: FundAccount[] = Array.isArray(accountJson) ? accountJson : [];
      setPlans(loadedPlans);
      setAccounts(loadedAccounts);
      if (loadedPlans[0]) {
        setRecordPlanId(loadedPlans[0].id);
      }
      if (loadedAccounts[0]) {
        setTransactionAccountId(loadedAccounts[0].id);
      }
    };
    void loadMeta();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const submitWithFeedback = async (run: () => Promise<void>) => {
    setStatus(defaultState);
    try {
      await run();
      setStatus({ ok: true, message: "保存成功。" });
    } catch (error) {
      setStatus({ ok: false, message: error instanceof Error ? error.message : "提交失败" });
    }
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 md:px-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#09090f] p-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-cyan-300">管理后台</h1>
          <p className="text-sm text-zinc-400">当前登录：{username}</p>
        </div>
        <div className="flex gap-2">
          <Link className="rounded-md border border-white/10 px-3 py-2 text-sm hover:bg-white/10" href="/chat">
            打开 AI 聊天
          </Link>
          <Button onClick={handleLogout} variant="outline">
            退出登录
          </Button>
        </div>
      </header>

      <Tabs defaultValue="blog">
        <TabsList className="w-full overflow-x-auto">
          <TabsTrigger value="blog">写博客</TabsTrigger>
          <TabsTrigger value="travel">旅游记录</TabsTrigger>
          <TabsTrigger value="fitness">健身与食物</TabsTrigger>
          <TabsTrigger value="finance">理财账户</TabsTrigger>
        </TabsList>

        <TabsContent value="blog">
          <Card>
            <CardHeader>
              <CardTitle>新增博客文章</CardTitle>
              <CardDescription>登录后可写入 posts 表。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <input className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2" onChange={(e) => setPostTitle(e.target.value)} placeholder="标题" value={postTitle} />
              <input className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2" onChange={(e) => setPostSlug(e.target.value)} placeholder="slug，如 rust-note" value={postSlug} />
              <input className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2" onChange={(e) => setPostTags(e.target.value)} placeholder="标签，逗号分隔" value={postTags} />
              <textarea className="h-44 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2" onChange={(e) => setPostContent(e.target.value)} placeholder="Markdown 内容" value={postContent} />
              <Button
                onClick={() =>
                  submitWithFeedback(async () => {
                    await postJson("/api/posts", {
                      title: postTitle,
                      slug: postSlug,
                      content: postContent,
                      tags: postTags
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter(Boolean),
                    });
                    setPostTitle("");
                    setPostSlug("");
                    setPostContent("");
                    setPostTags("");
                  })
                }
              >
                保存文章
              </Button>
              <StatusView status={status} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="travel">
          <Card>
            <CardHeader>
              <CardTitle>新增旅游地点</CardTitle>
              <CardDescription>可继续在 `/api/travel-photos` 绑定图片。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <input className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2" onChange={(e) => setTravelName(e.target.value)} placeholder="地点名" value={travelName} />
              <input className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2" onChange={(e) => setTravelCountry(e.target.value)} placeholder="国家/地区" value={travelCountry} />
              <div className="grid gap-3 sm:grid-cols-2">
                <input className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2" onChange={(e) => setTravelLat(e.target.value)} placeholder="纬度" value={travelLat} />
                <input className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2" onChange={(e) => setTravelLng(e.target.value)} placeholder="经度" value={travelLng} />
              </div>
              <textarea className="h-24 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2" onChange={(e) => setTravelDesc(e.target.value)} placeholder="描述" value={travelDesc} />
              <Button
                onClick={() =>
                  submitWithFeedback(async () => {
                    await postJson("/api/travel-locations", {
                      name: travelName,
                      country: travelCountry,
                      latitude: Number(travelLat),
                      longitude: Number(travelLng),
                      description: travelDesc,
                    });
                    setTravelName("");
                    setTravelCountry("");
                    setTravelLat("");
                    setTravelLng("");
                    setTravelDesc("");
                  })
                }
              >
                保存地点
              </Button>
              <StatusView status={status} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fitness">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>创建健身计划与打卡</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <form
                  className="space-y-3 rounded-lg border border-white/10 p-3"
                  onSubmit={(e: FormEvent<HTMLFormElement>) => {
                    e.preventDefault();
                    void submitWithFeedback(async () => {
                      await postJson("/api/fitness-plans", {
                        name: planName,
                        startDate: planStart,
                      });
                      setPlanName("");
                      const planResp = await fetch("/api/fitness-plans");
                      const planJson = await planResp.json();
                      const loadedPlans: FitnessPlan[] = Array.isArray(planJson) ? planJson : [];
                      setPlans(loadedPlans);
                      if (loadedPlans[0]) {
                        setRecordPlanId(loadedPlans[0].id);
                      }
                    });
                  }}
                >
                  <input className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2" onChange={(e) => setPlanName(e.target.value)} placeholder="计划名：2026增肌计划" required value={planName} />
                  <input className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2" onChange={(e) => setPlanStart(e.target.value)} required type="date" value={planStart} />
                  <Button type="submit">创建计划</Button>
                </form>

                <form
                  className="space-y-3 rounded-lg border border-white/10 p-3"
                  onSubmit={(e: FormEvent<HTMLFormElement>) => {
                    e.preventDefault();
                    void submitWithFeedback(async () => {
                      await postJson("/api/fitness-records", {
                        planId: recordPlanId,
                        trainingDate: recordDate,
                        workoutType: recordType,
                        durationMin: Number(recordDuration),
                        caloriesBurned: Number(recordCalories),
                        isCompleted: true,
                      });
                    });
                  }}
                >
                  <select className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2" onChange={(e) => setRecordPlanId(e.target.value)} required value={recordPlanId}>
                    <option value="">选择计划</option>
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name}
                      </option>
                    ))}
                  </select>
                  <input className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2" onChange={(e) => setRecordType(e.target.value)} placeholder="训练类型" required value={recordType} />
                  <input className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2" onChange={(e) => setRecordDate(e.target.value)} required type="date" value={recordDate} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2" onChange={(e) => setRecordDuration(e.target.value)} placeholder="时长(分钟)" required type="number" value={recordDuration} />
                    <input className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2" onChange={(e) => setRecordCalories(e.target.value)} placeholder="消耗(kcal)" required type="number" value={recordCalories} />
                  </div>
                  <Button type="submit">保存打卡</Button>
                </form>
                <StatusView status={status} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>添加食物记录</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <input className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2" onChange={(e) => setFoodName(e.target.value)} placeholder="食物名：鸡胸肉+西兰花" value={foodName} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2" onChange={(e) => setFoodProtein(e.target.value)} placeholder="蛋白(g)" type="number" value={foodProtein} />
                  <input className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2" onChange={(e) => setFoodCarbs(e.target.value)} placeholder="碳水(g)" type="number" value={foodCarbs} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2" onChange={(e) => setFoodFat(e.target.value)} placeholder="脂肪(g)" type="number" value={foodFat} />
                  <input className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2" onChange={(e) => setFoodCalories(e.target.value)} placeholder="热量(kcal)" type="number" value={foodCalories} />
                </div>
                <Button
                  onClick={() =>
                    submitWithFeedback(async () => {
                      await postJson("/api/food-records", {
                        name: foodName,
                        proteinG: Number(foodProtein),
                        carbsG: Number(foodCarbs),
                        fatG: Number(foodFat),
                        calories: Number(foodCalories),
                      });
                      setFoodName("");
                    })
                  }
                >
                  保存食物
                </Button>
                <StatusView status={status} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="finance">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>管理理财账户</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <form
                  className="space-y-3 rounded-lg border border-white/10 p-3"
                  onSubmit={(e: FormEvent<HTMLFormElement>) => {
                    e.preventDefault();
                    void submitWithFeedback(async () => {
                      await postJson("/api/fund-accounts", {
                        name: accountName,
                        platform: accountPlatform,
                        baseCurrency: "CNY",
                      });
                      setAccountName("");
                      const accountResp = await fetch("/api/fund-accounts");
                      const accountJson = await accountResp.json();
                      const loadedAccounts: FundAccount[] = Array.isArray(accountJson) ? accountJson : [];
                      setAccounts(loadedAccounts);
                      if (loadedAccounts[0]) {
                        setTransactionAccountId(loadedAccounts[0].id);
                      }
                    });
                  }}
                >
                  <input className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2" onChange={(e) => setAccountName(e.target.value)} placeholder="账户名：长期投资账户" required value={accountName} />
                  <input className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2" onChange={(e) => setAccountPlatform(e.target.value)} placeholder="平台：支付宝/天天基金" required value={accountPlatform} />
                  <Button type="submit">新增账户</Button>
                </form>
                <StatusView status={status} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>新增基金交易</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <form
                  className="space-y-3 rounded-lg border border-white/10 p-3"
                  onSubmit={(e: FormEvent<HTMLFormElement>) => {
                    e.preventDefault();
                    void submitWithFeedback(async () => {
                      await postJson("/api/fund-transactions", {
                        accountId: transactionAccountId,
                        symbol: transactionSymbol,
                        transactionType: transactionType,
                        units: Number(transactionUnits),
                        price: Number(transactionPrice),
                        amount: Number(transactionAmount),
                        fee: 0,
                        transactionAt: new Date().toISOString(),
                      });
                    });
                  }}
                >
                  <select className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2" onChange={(e) => setTransactionAccountId(e.target.value)} required value={transactionAccountId}>
                    <option value="">选择账户</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} ({account.platform})
                      </option>
                    ))}
                  </select>
                  <input className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2" onChange={(e) => setTransactionSymbol(e.target.value)} placeholder="基金代码" required value={transactionSymbol} />
                  <select className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2" onChange={(e) => setTransactionType(e.target.value)} value={transactionType}>
                    <option value="BUY">BUY</option>
                    <option value="SELL">SELL</option>
                    <option value="DIVIDEND">DIVIDEND</option>
                    <option value="FEE">FEE</option>
                  </select>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <input className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2" onChange={(e) => setTransactionUnits(e.target.value)} placeholder="份额" required type="number" value={transactionUnits} />
                    <input className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2" onChange={(e) => setTransactionPrice(e.target.value)} placeholder="单价" required type="number" value={transactionPrice} />
                    <input className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2" onChange={(e) => setTransactionAmount(e.target.value)} placeholder="金额" required type="number" value={transactionAmount} />
                  </div>
                  <Button type="submit">保存交易</Button>
                </form>
                <StatusView status={status} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}

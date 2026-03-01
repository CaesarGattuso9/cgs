import { endOfMonth, endOfWeek, endOfYear, startOfMonth, startOfWeek, startOfYear } from "date-fns";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createFitnessRecordSchema = z.object({
  planId: z.string().min(1),
  trainingDate: z.coerce.date(),
  workoutType: z.string().min(1),
  durationMin: z.number().int().nonnegative().default(0),
  caloriesBurned: z.number().int().nonnegative().default(0),
  notes: z.string().optional(),
  isCompleted: z.boolean().default(true),
});

function calcRate(done: number, planned: number) {
  if (planned <= 0) {
    return 0;
  }
  return Number(((done / planned) * 100).toFixed(2));
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const planId = searchParams.get("planId");

  if (!planId) {
    return NextResponse.json({ error: "planId is required." }, { status: 400 });
  }

  const plan = await prisma.fitnessPlan.findUnique({
    where: { id: planId },
  });

  if (!plan) {
    return NextResponse.json({ error: "Plan not found." }, { status: 404 });
  }

  const now = new Date();
  const [weekDone, monthDone, yearDone, records] = await Promise.all([
    prisma.fitnessRecord.count({
      where: {
        planId,
        isCompleted: true,
        trainingDate: { gte: startOfWeek(now, { weekStartsOn: 1 }), lte: endOfWeek(now, { weekStartsOn: 1 }) },
      },
    }),
    prisma.fitnessRecord.count({
      where: {
        planId,
        isCompleted: true,
        trainingDate: { gte: startOfMonth(now), lte: endOfMonth(now) },
      },
    }),
    prisma.fitnessRecord.count({
      where: {
        planId,
        isCompleted: true,
        trainingDate: { gte: startOfYear(now), lte: endOfYear(now) },
      },
    }),
    prisma.fitnessRecord.findMany({
      where: { planId },
      orderBy: { trainingDate: "desc" },
      take: 60,
    }),
  ]);

  return NextResponse.json({
    records,
    stats: {
      weekCompletionRate: calcRate(weekDone, plan.weeklyPlanDays),
      monthCompletionRate: calcRate(monthDone, plan.monthlyPlanDays),
      yearCompletionRate: calcRate(yearDone, plan.yearlyPlanDays),
      formula: {
        week: "本周完成天数 / 本周计划天数",
        month: "本月完成天数 / 本月计划天数",
        year: "全年完成天数 / 全年计划天数",
      },
    },
  });
}

export async function POST(req: Request) {
  const authResult = await requireAdminApi();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const payload = createFitnessRecordSchema.parse(await req.json());
    const created = await prisma.fitnessRecord.create({ data: payload });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create fitness record." }, { status: 500 });
  }
}

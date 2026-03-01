import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createFitnessPlanSchema = z.object({
  name: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  weeklyPlanDays: z.number().int().positive().default(5),
  monthlyPlanDays: z.number().int().positive().default(20),
  yearlyPlanDays: z.number().int().positive().default(240),
});

export async function GET() {
  const plans = await prisma.fitnessPlan.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(plans);
}

export async function POST(req: Request) {
  const authResult = await requireAdminApi();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const payload = createFitnessPlanSchema.parse(await req.json());
    const created = await prisma.fitnessPlan.create({ data: payload });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create fitness plan." }, { status: 500 });
  }
}

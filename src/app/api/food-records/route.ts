import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createFoodRecordSchema = z.object({
  fitnessRecordId: z.string().optional(),
  name: z.string().min(1),
  proteinG: z.number().nonnegative().default(0),
  carbsG: z.number().nonnegative().default(0),
  fatG: z.number().nonnegative().default(0),
  calories: z.number().int().nonnegative().default(0),
  notes: z.string().optional(),
  recordedAt: z.coerce.date().default(() => new Date()),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const fitnessRecordId = searchParams.get("fitnessRecordId");

  const records = await prisma.foodRecord.findMany({
    where: fitnessRecordId ? { fitnessRecordId } : undefined,
    orderBy: { recordedAt: "desc" },
    take: 100,
  });

  return NextResponse.json(records);
}

export async function POST(req: Request) {
  const authResult = await requireAdminApi();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const payload = createFoodRecordSchema.parse(await req.json());
    const created = await prisma.foodRecord.create({ data: payload });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create food record." }, { status: 500 });
  }
}

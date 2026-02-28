import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const createFundAccountSchema = z.object({
  name: z.string().min(1),
  platform: z.string().min(1),
  baseCurrency: z.string().default("CNY"),
});

export async function GET() {
  const accounts = await prisma.fundAccount.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(accounts);
}

export async function POST(req: Request) {
  try {
    const payload = createFundAccountSchema.parse(await req.json());
    const created = await prisma.fundAccount.create({ data: payload });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create fund account." }, { status: 500 });
  }
}

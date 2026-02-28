import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const createTravelLocationSchema = z.object({
  name: z.string().min(1),
  country: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  description: z.string().optional(),
  visitedAt: z.coerce.date().optional(),
});

export async function GET() {
  const locations = await prisma.travelLocation.findMany({
    orderBy: { createdAt: "desc" },
    include: { photos: true },
  });
  return NextResponse.json(locations);
}

export async function POST(req: Request) {
  try {
    const payload = createTravelLocationSchema.parse(await req.json());
    const created = await prisma.travelLocation.create({ data: payload });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create travel location." }, { status: 500 });
  }
}

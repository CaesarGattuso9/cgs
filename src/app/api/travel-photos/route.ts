import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createTravelPhotoSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  thumbnail: z.string().url().optional(),
  medium: z.string().url().optional(),
  large: z.string().url().optional(),
  locationId: z.string().optional(),
  capturedAt: z.coerce.date().optional(),
});

export async function GET() {
  const photos = await prisma.travelPhoto.findMany({
    include: {
      location: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  });

  return NextResponse.json(photos);
}

export async function POST(req: Request) {
  const authResult = await requireAdminApi();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const payload = createTravelPhotoSchema.parse(await req.json());
    const created = await prisma.travelPhoto.create({ data: payload });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create travel photo." }, { status: 500 });
  }
}

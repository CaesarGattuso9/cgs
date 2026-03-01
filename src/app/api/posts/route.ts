import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createPostSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  excerpt: z.string().optional(),
  content: z.string().min(1),
  coverUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
  tags: z.array(z.string()).default([]),
});

export async function GET() {
  const posts = await prisma.post.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  });

  return NextResponse.json(posts);
}

export async function POST(req: Request) {
  const authResult = await requireAdminApi();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const payload = createPostSchema.parse(await req.json());
    const created = await prisma.post.create({ data: payload });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create post." }, { status: 500 });
  }
}

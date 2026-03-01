import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdminApi();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { id } = await params;

  const conversation = await prisma.chatConversation.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  await prisma.chatConversation.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true });
}

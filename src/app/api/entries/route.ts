import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tagId = searchParams.get("tagId");

  const where: Record<string, unknown> = {
    project: { userId: session.user.id },
  };

  if (tagId) {
    where.tags = { some: { tagId } };
  }

  const entries = await prisma.entry.findMany({
    where,
    include: {
      project: { select: { id: true, name: true, icon: true } },
      tags: { include: { tag: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(entries);
}

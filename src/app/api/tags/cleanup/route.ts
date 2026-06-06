import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const tags = await prisma.tag.findMany({
    where: { userId: session.user.id },
    include: { _count: { select: { entries: true } } },
  });

  const emptyTagIds = tags.filter((t) => t._count.entries === 0).map((t) => t.id);

  if (emptyTagIds.length > 0) {
    await prisma.tag.deleteMany({ where: { id: { in: emptyTagIds } } });
  }

  return NextResponse.json({ deleted: emptyTagIds.length });
}

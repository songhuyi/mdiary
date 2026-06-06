import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const emptyTags = await prisma.tag.findMany({
    where: { userId: session.user.id },
    include: { _count: { select: { entries: true } } },
  });
  const emptyIds = emptyTags.filter((t) => t._count.entries === 0).map((t) => t.id);
  if (emptyIds.length > 0) {
    await prisma.tag.deleteMany({ where: { id: { in: emptyIds } } });
  }

  const tags = await prisma.tag.findMany({
    where: { userId: session.user.id },
    include: { _count: { select: { entries: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(tags);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { name } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "标签名不能为空" }, { status: 400 });
  }

  const existing = await prisma.tag.findUnique({
    where: { name_userId: { name: name.trim(), userId: session.user.id } },
  });

  if (existing) {
    return NextResponse.json(existing);
  }

  const tag = await prisma.tag.create({
    data: { name: name.trim(), userId: session.user.id },
  });

  return NextResponse.json(tag);
}

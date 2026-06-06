import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ entryId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { entryId } = await params;
  const { tagIds } = await req.json();

  const entry = await prisma.entry.findFirst({
    where: { id: entryId, project: { userId: session.user.id } },
  });

  if (!entry) {
    return NextResponse.json({ error: "文章不存在" }, { status: 404 });
  }

  await prisma.entryTag.deleteMany({ where: { entryId } });

  if (tagIds?.length) {
    await prisma.entryTag.createMany({
      data: tagIds.map((tagId: string) => ({ entryId, tagId })),
    });
  }

  const emptyTags = await prisma.tag.findMany({
    where: { userId: session.user.id },
    include: { _count: { select: { entries: true } } },
  });
  const emptyTagIds = emptyTags.filter((t) => t._count.entries === 0).map((t) => t.id);
  if (emptyTagIds.length > 0) {
    await prisma.tag.deleteMany({ where: { id: { in: emptyTagIds } } });
  }

  const updated = await prisma.entry.findUnique({
    where: { id: entryId },
    include: { tags: { include: { tag: true } } },
  });

  return NextResponse.json(updated?.tags.map((et) => et.tag) || []);
}

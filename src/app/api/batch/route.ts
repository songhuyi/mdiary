import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function cleanupEmptyTags(userId: string) {
  const tags = await prisma.tag.findMany({
    where: { userId },
    include: { _count: { select: { entries: true } } },
  });
  const emptyTagIds = tags.filter((t) => t._count.entries === 0).map((t) => t.id);
  if (emptyTagIds.length > 0) {
    await prisma.tag.deleteMany({ where: { id: { in: emptyTagIds } } });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { action, entryIds, targetProjectId } = await req.json();

  if (!entryIds?.length) {
    return NextResponse.json({ error: "未选择文章" }, { status: 400 });
  }

  const entries = await prisma.entry.findMany({
    where: {
      id: { in: entryIds },
      project: { userId: session.user.id },
    },
    include: { tags: { include: { tag: true } } },
  });

  if (action === "delete") {
    await prisma.entry.deleteMany({
      where: { id: { in: entryIds }, project: { userId: session.user.id } },
    });
    await cleanupEmptyTags(session.user.id);
    return NextResponse.json({ success: true, count: entries.length });
  }

  if (action === "move" && targetProjectId) {
    const targetProject = await prisma.project.findFirst({
      where: { id: targetProjectId, userId: session.user.id },
    });
    if (!targetProject) return NextResponse.json({ error: "目标项目不存在" }, { status: 404 });

    await prisma.entryTag.deleteMany({ where: { entryId: { in: entryIds } } });
    await prisma.entry.updateMany({
      where: { id: { in: entryIds } },
      data: { projectId: targetProjectId },
    });
    await cleanupEmptyTags(session.user.id);
    return NextResponse.json({ success: true, count: entries.length });
  }

  if (action === "copy" && targetProjectId) {
    const targetProject = await prisma.project.findFirst({
      where: { id: targetProjectId, userId: session.user.id },
    });
    if (!targetProject) return NextResponse.json({ error: "目标项目不存在" }, { status: 404 });

    for (const entry of entries) {
      const newEntry = await prisma.entry.create({
        data: {
          title: entry.title,
          content: entry.content,
          weather: entry.weather,
          temperature: entry.temperature,
          weatherIcon: entry.weatherIcon,
          lunarDate: entry.lunarDate,
          dayOfWeek: entry.dayOfWeek,
          location: entry.location,
          projectId: targetProjectId,
        },
      });

      if (entry.tags.length > 0) {
        await prisma.entryTag.createMany({
          data: entry.tags.map((et) => ({ entryId: newEntry.id, tagId: et.tagId })),
        });
      }
    }

    return NextResponse.json({ success: true, count: entries.length });
  }

  return NextResponse.json({ error: "未知操作" }, { status: 400 });
}

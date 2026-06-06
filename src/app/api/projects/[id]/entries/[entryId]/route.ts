import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id, entryId } = await params;
  const entry = await prisma.entry.findFirst({
    where: { id: entryId, projectId: id, project: { userId: session.user.id } },
    include: { tags: { include: { tag: true } } },
  });

  if (!entry) {
    return NextResponse.json({ error: "文章不存在" }, { status: 404 });
  }

  return NextResponse.json({
    ...entry,
    tags: entry.tags.map((et) => ({ id: et.tag.id, name: et.tag.name })),
  });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id, entryId } = await params;
  const { title, content, weather, temperature, weatherIcon, lunarDate, dayOfWeek, location } = await req.json();

  const existing = await prisma.entry.findFirst({
    where: { id: entryId, projectId: id, project: { userId: session.user.id } },
  });

  if (existing) {
    await prisma.editHistory.create({
      data: {
        entryId,
        weather: existing.weather,
        temperature: existing.temperature,
        weatherIcon: existing.weatherIcon,
        lunarDate: existing.lunarDate,
        dayOfWeek: existing.dayOfWeek,
        location: existing.location,
      },
    });
  }

  await prisma.entry.updateMany({
    where: { id: entryId, projectId: id, project: { userId: session.user.id } },
    data: { title, content, weather, temperature, weatherIcon, lunarDate, dayOfWeek, location },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id, entryId } = await params;
  await prisma.entry.deleteMany({
    where: { id: entryId, projectId: id, project: { userId: session.user.id } },
  });

  const tags = await prisma.tag.findMany({
    where: { userId: session.user.id },
    include: { _count: { select: { entries: true } } },
  });
  const emptyTagIds = tags.filter((t) => t._count.entries === 0).map((t) => t.id);
  if (emptyTagIds.length > 0) {
    await prisma.tag.deleteMany({ where: { id: { in: emptyTagIds } } });
  }

  return NextResponse.json({ success: true });
}

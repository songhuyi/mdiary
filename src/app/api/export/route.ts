import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { entryIds } = await req.json();

  if (!entryIds?.length) {
    return NextResponse.json({ error: "未选择文章" }, { status: 400 });
  }

  const entries = await prisma.entry.findMany({
    where: {
      id: { in: entryIds },
      project: { userId: session.user.id },
    },
    include: {
      project: { select: { name: true } },
      tags: { include: { tag: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const data = entries.map((e) => ({
    id: e.id,
    title: e.title,
    content: e.content,
    weather: e.weather,
    temperature: e.temperature,
    weatherIcon: e.weatherIcon,
    lunarDate: e.lunarDate,
    dayOfWeek: e.dayOfWeek,
    location: e.location,
    projectName: e.project.name,
    tags: e.tags.map((et) => et.tag.name),
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  }));

  return NextResponse.json(data);
}

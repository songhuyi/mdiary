import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const rules = await prisma.rule.findMany({
    where: { userId: session.user.id },
    include: { project: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(rules);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { name, prompt, projectId, isDefault } = await req.json();
  if (!name?.trim() || !prompt?.trim()) {
    return NextResponse.json({ error: "名称和规则内容不能为空" }, { status: 400 });
  }

  if (isDefault) {
    await prisma.rule.updateMany({
      where: { userId: session.user.id, isDefault: true, projectId: projectId || null },
      data: { isDefault: false },
    });
  }

  const rule = await prisma.rule.create({
    data: {
      name: name.trim(),
      prompt: prompt.trim(),
      isDefault: isDefault || false,
      projectId: projectId || null,
      userId: session.user.id,
    },
  });

  return NextResponse.json(rule);
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { id, name, prompt, projectId, isDefault } = await req.json();

  if (isDefault) {
    await prisma.rule.updateMany({
      where: { userId: session.user.id, isDefault: true, projectId: projectId || null, id: { not: id } },
      data: { isDefault: false },
    });
  }

  const rule = await prisma.rule.update({
    where: { id },
    data: { name, prompt, projectId: projectId || null, isDefault: isDefault || false },
  });

  return NextResponse.json(rule);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { id } = await req.json();
  await prisma.rule.deleteMany({ where: { id, userId: session.user.id } });

  return NextResponse.json({ success: true });
}

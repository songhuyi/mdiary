import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { name, email, password, inviteCode } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "请填写所有字段" }, { status: 400 });
    }

    // Validate invite code
    const validInviteCode = process.env.INVITE_CODE;
    if (!validInviteCode) {
      return NextResponse.json({ error: "服务器未配置邀请码" }, { status: 500 });
    }
    if (inviteCode !== validInviteCode) {
      return NextResponse.json({ error: "邀请码错误" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "邮箱已被注册" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch {
    return NextResponse.json({ error: "注册失败" }, { status: 500 });
  }
}

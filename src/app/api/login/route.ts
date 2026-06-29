import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCredentials } from "@/lib/auth";
import { getSession } from "@/lib/session";

export async function POST(req: Request) {
  const { username, password } = await req.json();
  const user = await verifyCredentials(prisma, username ?? "", password ?? "");
  if (!user) return NextResponse.json({ error: "Login gagal" }, { status: 401 });
  const session = await getSession();
  session.userId = user.id;
  session.username = user.username;
  await session.save();
  return NextResponse.json({ ok: true });
}

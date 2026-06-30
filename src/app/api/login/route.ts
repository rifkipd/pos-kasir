import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCredentials } from "@/lib/auth";
import { getSession } from "@/lib/session";

export async function POST(req: Request) {
  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }
  const user = await verifyCredentials(prisma, body.username ?? "", body.password ?? "");
  if (!user) return NextResponse.json({ error: "Login gagal" }, { status: 401 });
  const session = await getSession();
  session.userId = user.id;
  session.username = user.username;
  session.role = user.role;
  await session.save();
  return NextResponse.json({ ok: true });
}

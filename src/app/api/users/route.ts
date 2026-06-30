import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { listUsers, createUser } from "@/lib/users";
import { requireAdmin } from "@/lib/session";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  return NextResponse.json(await listUsers(prisma));
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  try {
    return NextResponse.json(await createUser(prisma, await req.json()));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

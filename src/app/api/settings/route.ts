import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSettings, updateSettings } from "@/lib/settings";
import { requireAdmin } from "@/lib/session";

export async function GET() {
  return NextResponse.json(await getSettings(prisma));
}

export async function PUT(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }
  try {
    return NextResponse.json(await updateSettings(prisma, await req.json()));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

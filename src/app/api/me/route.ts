import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET() {
  const s = await getSession();
  return NextResponse.json({ username: s.username ?? null, role: s.role ?? null });
}

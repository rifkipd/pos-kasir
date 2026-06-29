import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSummary, getDailySales } from "@/lib/reports";

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const from = sp.get("from") ? new Date(sp.get("from")!) : undefined;
  const to = sp.get("to") ? new Date(sp.get("to")!) : undefined;
  const range = { from, to };
  return NextResponse.json({
    summary: await getSummary(prisma, range),
    daily: await getDailySales(prisma, range),
  });
}

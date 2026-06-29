import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSummary, getDailySales, listTransactions, getBestSellers, getInventoryStatus } from "@/lib/reports";

// Hitung awal hari ini & 7 hari lalu dalam zona Asia/Jakarta (UTC+7), dikembalikan sebagai Date UTC.
function wibDayStart(daysAgo = 0): Date {
  const now = Date.now();
  const wib = new Date(now + 7 * 3600 * 1000);
  const startWibMidnightUtcFields = Date.UTC(wib.getUTCFullYear(), wib.getUTCMonth(), wib.getUTCDate(), 0, 0, 0);
  return new Date(startWibMidnightUtcFields - 7 * 3600 * 1000 - daysAgo * 86400000);
}

export async function GET() {
  try {
    const todayRange = { from: wibDayStart(0), to: new Date() };
    const weekRange = { from: wibDayStart(6), to: new Date() };
    const [today, daily, recentAll, bestSellers, inventory] = await Promise.all([
      getSummary(prisma, todayRange),
      getDailySales(prisma, weekRange),
      listTransactions(prisma),
      getBestSellers(prisma, undefined, 5),
      getInventoryStatus(prisma),
    ]);
    return NextResponse.json({
      today,
      daily,
      recent: recentAll.slice(0, 5),
      bestSellers,
      inventory,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

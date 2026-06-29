import type { PrismaClient } from "@prisma/client";
import type { TransactionWithItems } from "@/lib/transactions";

type Range = { from?: Date; to?: Date };

function where(range?: Range) {
  if (!range?.from && !range?.to) return undefined;
  return { createdAt: { gte: range?.from, lte: range?.to } };
}

export async function getSummary(db: PrismaClient, range?: Range) {
  const rows = await db.transaction.findMany({ where: where(range), select: { totalAmount: true } });
  return {
    totalSales: rows.reduce((a, r) => a + r.totalAmount, 0),
    transactionCount: rows.length,
  };
}

export async function getDailySales(db: PrismaClient, range?: Range) {
  const rows = await db.transaction.findMany({
    where: where(range),
    select: { createdAt: true, totalAmount: true },
  });
  const byDay = new Map<string, number>();
  // Group by local date in Asia/Jakarta (WIB, UTC+7) — Indonesian POS assumption
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" });
  for (const r of rows) {
    const key = fmt.format(r.createdAt); // YYYY-MM-DD in WIB
    byDay.set(key, (byDay.get(key) ?? 0) + r.totalAmount);
  }
  return [...byDay.entries()]
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function listTransactions(db: PrismaClient, range?: Range): Promise<TransactionWithItems[]> {
  return db.transaction.findMany({
    where: where(range),
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
}

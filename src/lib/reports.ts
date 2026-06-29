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

export const LOW_STOCK_THRESHOLD = 10;

export async function getBestSellers(
  db: PrismaClient,
  range?: Range,
  limit = 5,
): Promise<{ productId: number; name: string; price: number; qtySold: number }[]> {
  const items = await db.transactionItem.findMany({
    where: range && (range.from || range.to)
      ? { transaction: { createdAt: { gte: range.from, lte: range.to } } }
      : undefined,
    select: { productId: true, quantity: true, product: { select: { name: true, price: true } } },
  });
  const agg = new Map<number, { name: string; price: number; qtySold: number }>();
  for (const it of items) {
    const cur = agg.get(it.productId) ?? { name: it.product.name, price: it.product.price, qtySold: 0 };
    cur.qtySold += it.quantity;
    agg.set(it.productId, cur);
  }
  return [...agg.entries()]
    .map(([productId, v]) => ({ productId, ...v }))
    .sort((a, b) => b.qtySold - a.qtySold)
    .slice(0, limit);
}

export async function getInventoryStatus(
  db: PrismaClient,
  lowStockThreshold = LOW_STOCK_THRESHOLD,
): Promise<{ available: number; low: number; out: number; total: number }> {
  const products = await db.product.findMany({ where: { isActive: true }, select: { stock: true } });
  let available = 0, low = 0, out = 0;
  for (const p of products) {
    if (p.stock <= 0) out++;
    else if (p.stock <= lowStockThreshold) low++;
    else available++;
  }
  return { available, low, out, total: products.length };
}

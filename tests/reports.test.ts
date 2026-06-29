import { afterAll, beforeAll, expect, test } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { freshDb } from "./helpers/db";
import { createProduct } from "@/lib/products";
import { createTransaction } from "@/lib/transactions";
import { getSummary, getDailySales, listTransactions } from "@/lib/reports";

let db: PrismaClient;
let tx1Id: number;
let tx2Id: number;

beforeAll(async () => {
  db = freshDb("test-reports.db");
  const kopi = await createProduct(db, { name: "Kopi", price: 10000, stock: 100 });
  const tx1 = await createTransaction(db, { lines: [{ productId: kopi.id, quantity: 2 }], paidAmount: 20000 });
  const tx2 = await createTransaction(db, { lines: [{ productId: kopi.id, quantity: 1 }], paidAmount: 10000 });
  tx1Id = tx1.id;
  tx2Id = tx2.id;

  // Set explicit createdAt timestamps (unambiguous WIB dates):
  //   tx1 → 2026-06-20T03:00:00Z = 10:00 WIB on 2026-06-20
  //   tx2 → 2026-06-22T03:00:00Z = 10:00 WIB on 2026-06-22
  await db.transaction.update({ where: { id: tx1Id }, data: { createdAt: new Date("2026-06-20T03:00:00Z") } });
  await db.transaction.update({ where: { id: tx2Id }, data: { createdAt: new Date("2026-06-22T03:00:00Z") } });
});

afterAll(async () => { await db.$disconnect(); });

test("getSummary menjumlah penjualan & menghitung transaksi", async () => {
  const s = await getSummary(db);
  expect(s.totalSales).toBe(30000);
  expect(s.transactionCount).toBe(2);
});

test("getDailySales mengelompokkan per tanggal", async () => {
  const rows = await getDailySales(db);
  expect(rows.length).toBeGreaterThanOrEqual(1);
  const sum = rows.reduce((a, r) => a + r.total, 0);
  expect(sum).toBe(30000);
});

test("getDailySales: ascending date order, YYYY-MM-DD format, and correct WIB buckets", async () => {
  const rows = await getDailySales(db);
  // Should produce exactly two buckets for the two explicit dates
  expect(rows).toHaveLength(2);
  // Each date must match YYYY-MM-DD format
  for (const row of rows) {
    expect(row.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  }
  // Results must be in ascending date order
  expect(rows[0].date.localeCompare(rows[1].date)).toBeLessThan(0);
  // Verify the exact WIB bucket dates (2026-06-20T03:00:00Z = 10:00 WIB 2026-06-20)
  expect(rows[0].date).toBe("2026-06-20");
  expect(rows[0].total).toBe(20000);
  expect(rows[1].date).toBe("2026-06-22");
  expect(rows[1].total).toBe(10000);
});

test("listTransactions mengembalikan terbaru dulu dengan items", async () => {
  const list = await listTransactions(db);
  expect(list).toHaveLength(2);
  expect(list[0].items.length).toBeGreaterThan(0);
});

test("listTransactions: newest-first ordering", async () => {
  const list = await listTransactions(db);
  expect(list).toHaveLength(2);
  // tx2 has createdAt 2026-06-22 (newer) and should appear first
  expect(list[0].id).toBe(tx2Id);
  expect(list[1].id).toBe(tx1Id);
  // Confirm createdAt ordering: first item must be newer than second
  expect(list[0].createdAt.getTime()).toBeGreaterThan(list[1].createdAt.getTime());
});

test("getSummary: range filter excludes out-of-range transactions", async () => {
  // Range only covers the first transaction (2026-06-20)
  const from = new Date("2026-06-20T00:00:00Z");
  const to = new Date("2026-06-21T00:00:00Z");
  const s = await getSummary(db, { from, to });
  // Only tx1 (20000) is in range; tx2 (2026-06-22) is excluded
  expect(s.totalSales).toBe(20000);
  expect(s.transactionCount).toBe(1);
});

test("getDailySales: range filter excludes out-of-range transactions", async () => {
  const from = new Date("2026-06-21T00:00:00Z");
  const to = new Date("2026-06-23T00:00:00Z");
  const rows = await getDailySales(db, { from, to });
  // Only tx2 (2026-06-22) is in range
  expect(rows).toHaveLength(1);
  expect(rows[0].date).toBe("2026-06-22");
  expect(rows[0].total).toBe(10000);
});

test("listTransactions: range filter excludes out-of-range transactions", async () => {
  const from = new Date("2026-06-21T00:00:00Z");
  const to = new Date("2026-06-23T00:00:00Z");
  const list = await listTransactions(db, { from, to });
  // Only tx2 is in range
  expect(list).toHaveLength(1);
  expect(list[0].id).toBe(tx2Id);
});

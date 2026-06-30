import { afterAll, beforeAll, expect, test } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { freshDb } from "./helpers/db";
import { createProduct } from "@/lib/products";
import { createTransaction } from "@/lib/transactions";
import { getSummary, getDailySales, listTransactions, getBestSellers, getInventoryStatus } from "@/lib/reports";

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

test("getBestSellers mengurutkan berdasarkan qty terjual", async () => {
  const db2 = freshDb("test-bestsellers.db");
  const kopi = await createProduct(db2, { name: "Kopi", price: 10000, stock: 100 });
  const teh = await createProduct(db2, { name: "Teh", price: 8000, stock: 100 });
  await createTransaction(db2, { lines: [{ productId: kopi.id, quantity: 2 }], paidAmount: 20000 });
  await createTransaction(db2, { lines: [{ productId: teh.id, quantity: 5 }], paidAmount: 40000 });
  const top = await getBestSellers(db2);
  expect(top[0].name).toBe("Teh");
  expect(top[0].qtySold).toBe(5);
  expect(top[1].name).toBe("Kopi");
  expect(top[1].qtySold).toBe(2);
  await db2.$disconnect();
});

test("listTransactions: limit returns at most N rows (newest first)", async () => {
  const db4 = freshDb("test-limit.db");
  const prod = await createProduct(db4, { name: "Item", price: 5000, stock: 100 });
  const t1 = await createTransaction(db4, { lines: [{ productId: prod.id, quantity: 1 }], paidAmount: 5000 });
  const t2 = await createTransaction(db4, { lines: [{ productId: prod.id, quantity: 2 }], paidAmount: 10000 });
  // Make t2 newer
  await db4.transaction.update({ where: { id: t1.id }, data: { createdAt: new Date("2026-06-20T03:00:00Z") } });
  await db4.transaction.update({ where: { id: t2.id }, data: { createdAt: new Date("2026-06-22T03:00:00Z") } });
  const list = await listTransactions(db4, undefined, 1);
  expect(list).toHaveLength(1);
  expect(list[0].id).toBe(t2.id); // newest should be returned
  await db4.$disconnect();
});

test("getBestSellers: range filter only counts transactions within range", async () => {
  const db5 = freshDb("test-bestsellers-range.db");
  const prod = await createProduct(db5, { name: "Barang", price: 3000, stock: 100 });
  const t1 = await createTransaction(db5, { lines: [{ productId: prod.id, quantity: 3 }], paidAmount: 9000 });
  const t2 = await createTransaction(db5, { lines: [{ productId: prod.id, quantity: 7 }], paidAmount: 21000 });
  // t1 → before range, t2 → inside range
  await db5.transaction.update({ where: { id: t1.id }, data: { createdAt: new Date("2026-06-20T03:00:00Z") } });
  await db5.transaction.update({ where: { id: t2.id }, data: { createdAt: new Date("2026-06-22T03:00:00Z") } });
  const top = await getBestSellers(db5, { from: new Date("2026-06-21T00:00:00Z") });
  expect(top).toHaveLength(1);
  expect(top[0].productId).toBe(prod.id);
  expect(top[0].qtySold).toBe(7); // only t2's qty; t1 is out of range
  await db5.$disconnect();
});

test("getInventoryStatus mengklasifikasi stok pada batas ambang", async () => {
  const db3 = freshDb("test-inventory.db");
  await createProduct(db3, { name: "Habis", price: 1000, stock: 0 });
  await createProduct(db3, { name: "Menipis", price: 1000, stock: 10 });
  await createProduct(db3, { name: "Aman", price: 1000, stock: 11 });
  const inv = await getInventoryStatus(db3, 10);
  expect(inv.out).toBe(1);
  expect(inv.low).toBe(1);
  expect(inv.available).toBe(1);
  expect(inv.total).toBe(3);
  await db3.$disconnect();
});

test("getSummary menghitung laba = pendapatan - modal", async () => {
  const db5 = freshDb("test-profit.db");
  const p = await createProduct(db5, { name: "Kopi", price: 10000, stock: 10, costPrice: 4000 });
  await createTransaction(db5, { lines: [{ productId: p.id, quantity: 2 }], paidAmount: 20000 });
  // pendapatan 20000, modal 4000*2=8000 -> laba 12000
  const s = await getSummary(db5);
  expect(s.totalSales).toBe(20000);
  expect(s.totalProfit).toBe(12000);
  await db5.$disconnect();
});

test("getSummary: laba memperhitungkan diskon", async () => {
  const db6 = freshDb("test-profit-disc.db");
  const p = await createProduct(db6, { name: "Kopi", price: 10000, stock: 10, costPrice: 4000 });
  await createTransaction(db6, { lines: [{ productId: p.id, quantity: 1 }], paidAmount: 10000, discount: { type: "amount", value: 2000 } });
  // total final 8000, modal 4000 -> laba 4000
  const s = await getSummary(db6);
  expect(s.totalSales).toBe(8000);
  expect(s.totalProfit).toBe(4000);
  await db6.$disconnect();
});

import { afterAll, beforeAll, expect, test } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { freshDb } from "./helpers/db";
import { createProduct } from "@/lib/products";
import { createTransaction } from "@/lib/transactions";
import { getSummary, getDailySales, listTransactions } from "@/lib/reports";

let db: PrismaClient;
beforeAll(async () => {
  db = freshDb("test-reports.db");
  const kopi = await createProduct(db, { name: "Kopi", price: 10000, stock: 100 });
  await createTransaction(db, { lines: [{ productId: kopi.id, quantity: 2 }], paidAmount: 20000 });
  await createTransaction(db, { lines: [{ productId: kopi.id, quantity: 1 }], paidAmount: 10000 });
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

test("listTransactions mengembalikan terbaru dulu dengan items", async () => {
  const list = await listTransactions(db);
  expect(list).toHaveLength(2);
  expect(list[0].items.length).toBeGreaterThan(0);
});

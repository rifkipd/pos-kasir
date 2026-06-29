import { afterAll, beforeAll, expect, test } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { freshDb } from "./helpers/db";
import { createProduct } from "@/lib/products";
import { createTransaction } from "@/lib/transactions";

let db: PrismaClient;
let kopiId: number;
beforeAll(async () => {
  db = freshDb("test-tx.db");
  const kopi = await createProduct(db, { name: "Kopi", price: 10000, stock: 5 });
  kopiId = kopi.id;
});
afterAll(async () => { await db.$disconnect(); });

test("createTransaction menghitung total & kembalian, mengurangi stok", async () => {
  const tx = await createTransaction(db, {
    lines: [{ productId: kopiId, quantity: 2 }],
    paidAmount: 50000,
  });
  expect(tx.totalAmount).toBe(20000);
  expect(tx.changeAmount).toBe(30000);
  expect(tx.items).toHaveLength(1);
  expect(tx.items[0].priceAtSale).toBe(10000);
  const kopi = await db.product.findUnique({ where: { id: kopiId } });
  expect(kopi?.stock).toBe(3);
});

test("menolak keranjang kosong", async () => {
  await expect(createTransaction(db, { lines: [], paidAmount: 0 })).rejects.toThrow("Keranjang kosong");
});

test("menolak uang kurang tanpa mengubah stok", async () => {
  const before = (await db.product.findUnique({ where: { id: kopiId } }))!.stock;
  await expect(
    createTransaction(db, { lines: [{ productId: kopiId, quantity: 1 }], paidAmount: 1 }),
  ).rejects.toThrow("Uang bayar kurang dari total");
  const after = (await db.product.findUnique({ where: { id: kopiId } }))!.stock;
  expect(after).toBe(before);
});

test("menolak stok tidak cukup", async () => {
  await expect(
    createTransaction(db, { lines: [{ productId: kopiId, quantity: 999 }], paidAmount: 99999999 }),
  ).rejects.toThrow("Stok");
});

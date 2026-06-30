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

test("menolak jumlah pecahan (non-integer)", async () => {
  await expect(
    createTransaction(db, { lines: [{ productId: kopiId, quantity: 1.5 }], paidAmount: 99999999 }),
  ).rejects.toThrow("Jumlah harus bilangan bulat positif");
});

test("diskon nominal mengurangi total & menyimpan subtotal/diskon", async () => {
  const db2 = freshDb("test-tx-disc.db");
  const kopi = await createProduct(db2, { name: "Kopi", price: 10000, stock: 10, costPrice: 4000 });
  const tx = await createTransaction(db2, {
    lines: [{ productId: kopi.id, quantity: 2 }],
    paidAmount: 20000,
    paymentMethod: "cash",
    discount: { type: "amount", value: 5000 },
  });
  expect(tx.subtotalAmount).toBe(20000);
  expect(tx.discountAmount).toBe(5000);
  expect(tx.totalAmount).toBe(15000);
  expect(tx.changeAmount).toBe(5000);
  expect(tx.paymentMethod).toBe("cash");
  expect(tx.items[0].costAtSale).toBe(4000);
  await db2.$disconnect();
});

test("diskon persen dibulatkan", async () => {
  const db3 = freshDb("test-tx-pct.db");
  const p = await createProduct(db3, { name: "A", price: 9999, stock: 10 });
  const tx = await createTransaction(db3, {
    lines: [{ productId: p.id, quantity: 1 }],
    paidAmount: 9999,
    discount: { type: "percent", value: 10 },
  });
  expect(tx.discountAmount).toBe(1000); // round(9999*0.1)=1000
  expect(tx.totalAmount).toBe(8999);
  await db3.$disconnect();
});

test("metode non-tunai (qris) tanpa kembalian", async () => {
  const db4 = freshDb("test-tx-qris.db");
  const p = await createProduct(db4, { name: "B", price: 5000, stock: 10 });
  const tx = await createTransaction(db4, {
    lines: [{ productId: p.id, quantity: 1 }],
    paidAmount: 5000,
    paymentMethod: "qris",
  });
  expect(tx.paymentMethod).toBe("qris");
  expect(tx.changeAmount).toBe(0);
  await db4.$disconnect();
});

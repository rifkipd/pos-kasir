import { afterAll, beforeAll, expect, test } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { freshDb } from "./helpers/db";
import { createProduct, listProducts, updateProduct, deleteProduct } from "@/lib/products";

let db: PrismaClient;
beforeAll(() => { db = freshDb("test-products.db"); });
afterAll(async () => { await db.$disconnect(); });

test("createProduct lalu listProducts", async () => {
  const p = await createProduct(db, { name: "Kopi", price: 10000, stock: 5 });
  expect(p.id).toBeGreaterThan(0);
  const all = await listProducts(db);
  expect(all.find((x) => x.id === p.id)?.name).toBe("Kopi");
});

test("createProduct menyimpan imageUrl", async () => {
  const p = await createProduct(db, { name: "Roti", price: 5000, imageUrl: "https://example.com/roti.jpg" });
  expect(p.imageUrl).toBe("https://example.com/roti.jpg");
  const blank = await createProduct(db, { name: "Tanpa Gambar", price: 5000 });
  expect(blank.imageUrl).toBeNull();
});

test("createProduct menolak harga negatif", async () => {
  await expect(createProduct(db, { name: "X", price: -1 })).rejects.toThrow("Harga tidak boleh negatif");
});

test("createProduct menolak nama kosong", async () => {
  await expect(createProduct(db, { name: "", price: 1 })).rejects.toThrow("Nama wajib diisi");
});

test("updateProduct mengubah harga", async () => {
  const p = await createProduct(db, { name: "Teh", price: 8000 });
  const u = await updateProduct(db, p.id, { price: 9000 });
  expect(u.price).toBe(9000);
});

test("createProduct menolak stok negatif", async () => {
  await expect(createProduct(db, { name: "X", price: 1, stock: -1 })).rejects.toThrow("Stok tidak boleh negatif");
});

test("deleteProduct = soft delete (activeOnly menyembunyikan)", async () => {
  const p = await createProduct(db, { name: "Roti", price: 8000 });
  await deleteProduct(db, p.id);
  const active = await listProducts(db, { activeOnly: true });
  expect(active.find((x) => x.id === p.id)).toBeUndefined();
});

import { afterAll, beforeAll, expect, test } from "vitest";
import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { freshDb } from "./helpers/db";
import { verifyCredentials } from "@/lib/auth";

let db: PrismaClient;
beforeAll(async () => {
  db = freshDb("test-auth.db");
  await db.user.create({ data: { username: "admin", passwordHash: bcrypt.hashSync("admin123", 10) } });
});
afterAll(async () => { await db.$disconnect(); });

test("verifyCredentials menerima password benar", async () => {
  const u = await verifyCredentials(db, "admin", "admin123");
  expect(u?.username).toBe("admin");
});

test("verifyCredentials menolak password salah", async () => {
  expect(await verifyCredentials(db, "admin", "salah")).toBeNull();
});

test("verifyCredentials menolak user tidak ada", async () => {
  expect(await verifyCredentials(db, "nobody", "x")).toBeNull();
});

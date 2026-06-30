import { afterAll, beforeAll, expect, test } from "vitest";
import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { freshDb } from "./helpers/db";
import { listUsers, createUser, updateUser, deleteUser } from "@/lib/users";

let db: PrismaClient;
beforeAll(async () => {
  db = freshDb("test-users.db");
  await db.user.create({ data: { username: "admin", passwordHash: bcrypt.hashSync("admin123", 10), role: "admin" } });
});
afterAll(async () => { await db.$disconnect(); });

test("createUser menambah kasir (password ter-hash, tidak dikembalikan)", async () => {
  const u = await createUser(db, { username: "kasir1", password: "rahasia", role: "kasir" });
  expect(u.username).toBe("kasir1");
  expect(u.role).toBe("kasir");
  expect((u as Record<string, unknown>).passwordHash).toBeUndefined();
  const list = await listUsers(db);
  expect(list.find((x) => x.username === "kasir1")).toBeTruthy();
});

test("createUser menolak password terlalu pendek", async () => {
  await expect(createUser(db, { username: "x", password: "12", role: "kasir" })).rejects.toThrow();
});

test("updateUser bisa ganti peran & password", async () => {
  const u = await createUser(db, { username: "kasir2", password: "rahasia", role: "kasir" });
  const upd = await updateUser(db, u.id, { role: "admin", password: "barubaru" });
  expect(upd.role).toBe("admin");
  const fresh = await db.user.findUnique({ where: { id: u.id } });
  expect(bcrypt.compareSync("barubaru", fresh!.passwordHash)).toBe(true);
});

test("deleteUser menolak menghapus admin terakhir", async () => {
  const dbx = freshDb("test-users-last.db");
  const a = await dbx.user.create({ data: { username: "only", passwordHash: bcrypt.hashSync("x", 10), role: "admin" } });
  await expect(deleteUser(dbx, a.id)).rejects.toThrow("Tidak bisa menghapus admin terakhir");
  await dbx.$disconnect();
});

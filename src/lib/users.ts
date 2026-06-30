import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

export type SafeUser = { id: number; username: string; role: string };

const select = { id: true, username: true, role: true } as const;

function validate(username?: string, password?: string) {
  if (username !== undefined && username.trim() === "") throw new Error("Username wajib diisi");
  if (password !== undefined && password.length < 4) throw new Error("Password minimal 4 karakter");
}

export function listUsers(db: PrismaClient): Promise<SafeUser[]> {
  return db.user.findMany({ select, orderBy: { username: "asc" } });
}

export async function createUser(
  db: PrismaClient,
  input: { username: string; password: string; role?: string }
): Promise<SafeUser> {
  validate(input.username, input.password);
  return db.user.create({
    data: {
      username: input.username.trim(),
      passwordHash: bcrypt.hashSync(input.password, 10),
      role: input.role === "admin" ? "admin" : "kasir",
    },
    select,
  });
}

export async function updateUser(
  db: PrismaClient,
  id: number,
  input: { username?: string; password?: string; role?: string }
): Promise<SafeUser> {
  validate(input.username, input.password);
  const data: Record<string, unknown> = {};
  if (input.username !== undefined) data.username = input.username.trim();
  if (input.role !== undefined) data.role = input.role === "admin" ? "admin" : "kasir";
  if (input.password) data.passwordHash = bcrypt.hashSync(input.password, 10);
  return db.user.update({ where: { id }, data, select });
}

export async function deleteUser(db: PrismaClient, id: number): Promise<void> {
  const target = await db.user.findUnique({ where: { id } });
  if (!target) return;
  if (target.role === "admin") {
    const adminCount = await db.user.count({ where: { role: "admin" } });
    if (adminCount <= 1) throw new Error("Tidak bisa menghapus admin terakhir");
  }
  await db.user.delete({ where: { id } });
}

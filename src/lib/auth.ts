import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { SessionOptions } from "iron-session";

export type SessionData = { userId?: number; username?: string; role?: string };

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_PASSWORD as string,
  cookieName: "pos_session",
  cookieOptions: { secure: process.env.NODE_ENV === "production" },
};

export async function verifyCredentials(db: PrismaClient, username: string, password: string) {
  const user = await db.user.findUnique({ where: { username } });
  if (!user) return null;
  if (!bcrypt.compareSync(password, user.passwordHash)) return null;
  return { id: user.id, username: user.username, role: user.role };
}

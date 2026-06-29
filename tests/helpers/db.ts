import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";

export function freshDb(file: string): PrismaClient {
  const url = `file:./${file}`;
  if (existsSync(file)) rmSync(file);
  execSync(`npx prisma db push --url "${url}"`, {
    stdio: "ignore",
  });
  const adapter = new PrismaBetterSqlite3({ url });
  return new PrismaClient({ adapter });
}

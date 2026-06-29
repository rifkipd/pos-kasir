import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL ?? "file:./dev.db";
const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: { username: "admin", passwordHash: bcrypt.hashSync("admin123", 10) },
  });
  const products = [
    { name: "Kopi", sku: "KP01", price: 10000, stock: 100, category: "Minuman" },
    { name: "Teh", sku: "TH01", price: 8000, stock: 100, category: "Minuman" },
    { name: "Roti", sku: "RT01", price: 8000, stock: 50, category: "Makanan" },
  ];
  for (const p of products) {
    await prisma.product.upsert({ where: { sku: p.sku }, update: {}, create: p });
  }
}

main().finally(() => prisma.$disconnect());

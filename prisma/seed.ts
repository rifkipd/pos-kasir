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
    { name: "Kopi Susu", sku: "KP01", price: 18000, stock: 100, category: "Minuman", imageUrl: "https://picsum.photos/seed/kopisusu/400/400" },
    { name: "Es Teh Manis", sku: "TH01", price: 8000, stock: 100, category: "Minuman", imageUrl: "https://picsum.photos/seed/esteh/400/400" },
    { name: "Cold Brew", sku: "CB01", price: 25000, stock: 60, category: "Minuman", imageUrl: "https://picsum.photos/seed/coldbrew/400/400" },
    { name: "Matcha Latte", sku: "MT01", price: 24000, stock: 50, category: "Minuman", imageUrl: "https://picsum.photos/seed/matcha/400/400" },
    { name: "Roti Bakar", sku: "RT01", price: 15000, stock: 50, category: "Makanan", imageUrl: "https://picsum.photos/seed/rotibakar/400/400" },
    { name: "Croissant", sku: "CR01", price: 18000, stock: 40, category: "Makanan", imageUrl: "https://picsum.photos/seed/croissant/400/400" },
    { name: "Sandwich", sku: "SW01", price: 22000, stock: 35, category: "Makanan", imageUrl: "https://picsum.photos/seed/sandwich/400/400" },
    { name: "Cokelat Bar", sku: "CK01", price: 12000, stock: 80, category: "Lainnya", imageUrl: "https://picsum.photos/seed/cokelat/400/400" },
  ];
  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: { imageUrl: p.imageUrl, category: p.category },
      create: p,
    });
  }
}

main().finally(() => prisma.$disconnect());

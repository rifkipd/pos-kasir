import type { PrismaClient, Product } from "@prisma/client";

type CreateInput = { name: string; price: number; stock?: number; sku?: string; category?: string };
type UpdateInput = Partial<{ name: string; price: number; stock: number; sku: string; category: string; isActive: boolean }>;

function validate(input: { name?: string; price?: number }) {
  if (input.name !== undefined && input.name.trim() === "") throw new Error("Nama wajib diisi");
  if (input.price !== undefined && input.price < 0) throw new Error("Harga tidak boleh negatif");
}

export function listProducts(db: PrismaClient, opts?: { activeOnly?: boolean }): Promise<Product[]> {
  return db.product.findMany({
    where: opts?.activeOnly ? { isActive: true } : undefined,
    orderBy: { name: "asc" },
  });
}

export async function createProduct(db: PrismaClient, input: CreateInput): Promise<Product> {
  validate(input);
  return db.product.create({
    data: {
      name: input.name.trim(),
      price: input.price,
      stock: input.stock ?? 0,
      sku: input.sku || null,
      category: input.category || null,
    },
  });
}

export async function updateProduct(db: PrismaClient, id: number, input: UpdateInput): Promise<Product> {
  validate(input);
  const data = input.name !== undefined ? { ...input, name: input.name.trim() } : input;
  return db.product.update({ where: { id }, data });
}

export async function deleteProduct(db: PrismaClient, id: number): Promise<void> {
  await db.product.update({ where: { id }, data: { isActive: false } });
}

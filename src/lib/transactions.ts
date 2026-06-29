import type { PrismaClient, Transaction, TransactionItem } from "@prisma/client";

export type TransactionWithItems = Transaction & { items: TransactionItem[] };

type Input = {
  lines: { productId: number; quantity: number }[];
  paidAmount: number;
  paymentMethod?: string;
};

export async function createTransaction(db: PrismaClient, input: Input): Promise<TransactionWithItems> {
  if (input.lines.length === 0) throw new Error("Keranjang kosong");

  return db.$transaction(async (tx) => {
    let total = 0;
    const itemData: { productId: number; quantity: number; priceAtSale: number; subtotal: number }[] = [];

    for (const line of input.lines) {
      const product = await tx.product.findUnique({ where: { id: line.productId } });
      if (!product) throw new Error(`Produk ${line.productId} tidak ditemukan`);
      if (line.quantity <= 0) throw new Error("Jumlah harus lebih dari 0");
      if (product.stock < line.quantity) throw new Error(`Stok ${product.name} tidak cukup`);
      const subtotal = product.price * line.quantity;
      total += subtotal;
      itemData.push({ productId: product.id, quantity: line.quantity, priceAtSale: product.price, subtotal });
    }

    if (input.paidAmount < total) throw new Error("Uang bayar kurang dari total");

    for (const item of itemData) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    return tx.transaction.create({
      data: {
        invoiceNo: `INV-${Date.now()}`,
        totalAmount: total,
        paidAmount: input.paidAmount,
        changeAmount: input.paidAmount - total,
        paymentMethod: input.paymentMethod ?? "cash",
        items: { create: itemData },
      },
      include: { items: true },
    });
  });
}

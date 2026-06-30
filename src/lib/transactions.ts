import type { PrismaClient, Transaction, TransactionItem } from "@prisma/client";

export type TransactionWithItems = Transaction & { items: TransactionItem[] };

export type Discount = { type: "amount" | "percent"; value: number };

type Input = {
  lines: { productId: number; quantity: number }[];
  paidAmount: number;
  paymentMethod?: string;
  discount?: Discount;
};

export async function createTransaction(db: PrismaClient, input: Input): Promise<TransactionWithItems> {
  if (input.lines.length === 0) throw new Error("Keranjang kosong");

  return db.$transaction(async (tx) => {
    let subtotal = 0;
    const itemData: { productId: number; quantity: number; priceAtSale: number; costAtSale: number; subtotal: number }[] = [];

    for (const line of input.lines) {
      const product = await tx.product.findUnique({ where: { id: line.productId } });
      if (!product) throw new Error(`Produk ${line.productId} tidak ditemukan`);
      if (!Number.isInteger(line.quantity) || line.quantity <= 0) throw new Error("Jumlah harus bilangan bulat positif");
      if (product.stock < line.quantity) throw new Error(`Stok ${product.name} tidak cukup`);
      const lineSubtotal = product.price * line.quantity;
      subtotal += lineSubtotal;
      itemData.push({
        productId: product.id,
        quantity: line.quantity,
        priceAtSale: product.price,
        costAtSale: product.costPrice,
        subtotal: lineSubtotal,
      });
    }

    let discountAmount = 0;
    if (input.discount && input.discount.value > 0) {
      discountAmount =
        input.discount.type === "percent"
          ? Math.round((subtotal * input.discount.value) / 100)
          : input.discount.value;
      if (discountAmount > subtotal) discountAmount = subtotal;
    }
    const total = subtotal - discountAmount;

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
        subtotalAmount: subtotal,
        discountAmount,
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

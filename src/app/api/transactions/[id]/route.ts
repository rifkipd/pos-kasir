import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tx = await prisma.transaction.findUnique({
    where: { id: Number(id) },
    include: { items: { include: { product: true } } },
  });
  if (!tx) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  return NextResponse.json(tx);
}

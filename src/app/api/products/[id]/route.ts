import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateProduct, deleteProduct } from "@/lib/products";
import { requireAdmin } from "@/lib/session";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  const { id } = await params;
  try {
    return NextResponse.json(await updateProduct(prisma, Number(id), await req.json()));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  const { id } = await params;
  try {
    await deleteProduct(prisma, Number(id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

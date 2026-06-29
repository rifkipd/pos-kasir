import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { listProducts, createProduct } from "@/lib/products";

export async function GET(req: Request) {
  const activeOnly = new URL(req.url).searchParams.get("activeOnly") === "1";
  return NextResponse.json(await listProducts(prisma, { activeOnly }));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    return NextResponse.json(await createProduct(prisma, body));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

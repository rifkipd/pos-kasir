import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTransaction } from "@/lib/transactions";
import { listTransactions } from "@/lib/reports";

export async function GET() {
  return NextResponse.json(await listTransactions(prisma));
}

export async function POST(req: Request) {
  try {
    return NextResponse.json(await createTransaction(prisma, await req.json()));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

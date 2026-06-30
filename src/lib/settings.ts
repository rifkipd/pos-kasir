import type { PrismaClient, Settings } from "@prisma/client";

export type SettingsInput = Partial<{
  storeName: string;
  address: string;
  phone: string;
  receiptFooter: string;
  logoUrl: string;
  qrisImageUrl: string;
}>;

export async function getSettings(db: PrismaClient): Promise<Settings> {
  const existing = await db.settings.findUnique({ where: { id: 1 } });
  if (existing) return existing;
  return db.settings.create({ data: { id: 1 } });
}

export async function updateSettings(db: PrismaClient, input: SettingsInput): Promise<Settings> {
  return db.settings.upsert({
    where: { id: 1 },
    update: input,
    create: { id: 1, ...input },
  });
}

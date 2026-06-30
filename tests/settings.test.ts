import { afterAll, beforeAll, expect, test } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { freshDb } from "./helpers/db";
import { getSettings, updateSettings } from "@/lib/settings";

let db: PrismaClient;
beforeAll(() => { db = freshDb("test-settings.db"); });
afterAll(async () => { await db.$disconnect(); });

test("getSettings membuat baris default", async () => {
  const s = await getSettings(db);
  expect(s.id).toBe(1);
});

test("updateSettings menyimpan nilai", async () => {
  await updateSettings(db, { storeName: "Warung Maju", phone: "0811" });
  const s = await getSettings(db);
  expect(s.storeName).toBe("Warung Maju");
  expect(s.phone).toBe("0811");
});

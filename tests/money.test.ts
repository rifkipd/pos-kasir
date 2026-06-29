import { expect, test } from "vitest";
import { formatRupiah, parseRupiah } from "@/lib/money";

test("formatRupiah memberi pemisah ribuan", () => {
  expect(formatRupiah(10000)).toBe("Rp 10.000");
  expect(formatRupiah(0)).toBe("Rp 0");
  expect(formatRupiah(1500000)).toBe("Rp 1.500.000");
});

test("parseRupiah membuang karakter non-digit", () => {
  expect(parseRupiah("Rp 10.000")).toBe(10000);
  expect(parseRupiah("50000")).toBe(50000);
  expect(parseRupiah("")).toBe(0);
});

import { expect, test } from "vitest";
import { calcSubtotal, calcTotal, calcChange, type CartLine } from "@/lib/cart";

const lines: CartLine[] = [
  { productId: 1, name: "Kopi", price: 10000, quantity: 2 },
  { productId: 3, name: "Roti", price: 8000, quantity: 1 },
];

test("calcSubtotal = harga * qty", () => {
  expect(calcSubtotal(lines[0])).toBe(20000);
});

test("calcTotal menjumlah semua subtotal", () => {
  expect(calcTotal(lines)).toBe(28000);
  expect(calcTotal([])).toBe(0);
});

test("calcChange menghitung kembalian", () => {
  expect(calcChange(28000, 50000)).toBe(22000);
  expect(calcChange(28000, 28000)).toBe(0);
});

test("calcChange menolak uang kurang", () => {
  expect(() => calcChange(28000, 20000)).toThrow("Uang bayar kurang dari total");
});

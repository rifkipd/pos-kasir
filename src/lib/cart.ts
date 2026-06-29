export type CartLine = {
  productId: number;
  name: string;
  price: number;
  quantity: number;
};

export function calcSubtotal(line: CartLine): number {
  return line.price * line.quantity;
}

export function calcTotal(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + calcSubtotal(l), 0);
}

export function calcChange(total: number, paid: number): number {
  if (paid < total) throw new Error("Uang bayar kurang dari total");
  return paid - total;
}

export function formatRupiah(n: number): string {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

export function parseRupiah(s: string): number {
  const digits = s.replace(/[^0-9]/g, "");
  return digits === "" ? 0 : parseInt(digits, 10);
}

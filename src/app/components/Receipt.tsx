import { formatRupiah } from "@/lib/money";
import type { CartLine } from "@/lib/cart";

export type ReceiptData = {
  lines: CartLine[];
  subtotal: number;
  discount: number;
  total: number;
  paid: number;
  change: number;
  paymentMethod: string;
  invoiceNo: string;
  createdAt?: string;
  store?: { name?: string | null; address?: string | null; phone?: string | null; footer?: string | null };
};

const methodLabel: Record<string, string> = { cash: "Tunai", qris: "QRIS", transfer: "Transfer" };

export function Receipt({ data }: { data: ReceiptData | null }) {
  if (!data) return <div id="receipt" style={{ display: "none" }} />;
  const { lines, subtotal, discount, total, paid, change, paymentMethod, invoiceNo, createdAt, store } = data;
  const row = { display: "flex", justifyContent: "space-between" } as const;

  return (
    <div id="receipt" style={{ display: "none", width: "80mm", padding: "4mm", fontSize: "12px", fontFamily: "monospace" }}>
      <div style={{ textAlign: "center", fontWeight: 700 }}>{store?.name || "TOKO SAYA"}</div>
      {store?.address && <div style={{ textAlign: "center" }}>{store.address}</div>}
      {store?.phone && <div style={{ textAlign: "center" }}>{store.phone}</div>}
      <div style={{ textAlign: "center" }}>
        {createdAt ? new Date(createdAt).toLocaleString("id-ID") : new Date().toLocaleString("id-ID")}
      </div>
      <div>{invoiceNo}</div>
      <hr />
      {lines.map((l) => (
        <div key={l.productId} style={row}>
          <span>{l.name} x{l.quantity}</span>
          <span>{formatRupiah(l.price * l.quantity)}</span>
        </div>
      ))}
      <hr />
      <div style={row}><span>Subtotal</span><span>{formatRupiah(subtotal)}</span></div>
      {discount > 0 && <div style={row}><span>Diskon</span><span>-{formatRupiah(discount)}</span></div>}
      <div style={{ ...row, fontWeight: 700 }}><span>Total</span><span>{formatRupiah(total)}</span></div>
      <div style={row}><span>Metode</span><span>{methodLabel[paymentMethod] ?? paymentMethod}</span></div>
      <div style={row}><span>Bayar</span><span>{formatRupiah(paid)}</span></div>
      <div style={row}><span>Kembali</span><span>{formatRupiah(change)}</span></div>
      <div style={{ textAlign: "center", marginTop: "8px" }}>{store?.footer || "Terima kasih"}</div>
    </div>
  );
}

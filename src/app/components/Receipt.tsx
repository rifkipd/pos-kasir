import { formatRupiah } from "@/lib/money";
import type { CartLine } from "@/lib/cart";

export type ReceiptData = {
  lines: CartLine[];
  total: number;
  paid: number;
  change: number;
  invoiceNo: string;
  createdAt?: string;
};

export function Receipt({ data }: { data: ReceiptData | null }) {
  if (!data) return <div id="receipt" style={{ display: "none" }} />;

  const { lines, total, paid, change, invoiceNo, createdAt } = data;

  return (
    <div
      id="receipt"
      style={{
        display: "none",
        width: "80mm",
        padding: "4mm",
        fontSize: "12px",
        fontFamily: "monospace",
      }}
    >
      <div style={{ textAlign: "center", fontWeight: 700 }}>TOKO SAYA</div>
      <div style={{ textAlign: "center" }}>
        {createdAt ? new Date(createdAt).toLocaleString("id-ID") : new Date().toLocaleString("id-ID")}
      </div>
      <div>{invoiceNo}</div>
      <hr />
      {lines.map((l) => (
        <div
          key={l.productId}
          style={{ display: "flex", justifyContent: "space-between" }}
        >
          <span>
            {l.name} x{l.quantity}
          </span>
          <span>{formatRupiah(l.price * l.quantity)}</span>
        </div>
      ))}
      <hr />
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span>Total</span>
        <span>{formatRupiah(total)}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span>Bayar</span>
        <span>{formatRupiah(paid)}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span>Kembali</span>
        <span>{formatRupiah(change)}</span>
      </div>
      <div style={{ textAlign: "center", marginTop: "8px" }}>Terima kasih</div>
    </div>
  );
}

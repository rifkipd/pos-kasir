"use client";
import { useEffect, useState } from "react";
import { Receipt, type ReceiptData } from "@/app/components/Receipt";
import { calcTotal, calcChange, type CartLine } from "@/lib/cart";
import { formatRupiah, parseRupiah } from "@/lib/money";

type Product = { id: number; name: string; price: number; stock: number };

export default function KasirPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [paidText, setPaidText] = useState("");
  const [printData, setPrintData] = useState<ReceiptData | null>(null);

  function loadProducts() {
    fetch("/api/products?activeOnly=1")
      .then((r) => r.json())
      .then(setProducts);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  // Trigger window.print() AFTER printData has been committed to the DOM.
  // useEffect runs after React has flushed DOM updates, so the Receipt will
  // have its snapshot content rendered before the print dialog opens.
  useEffect(() => {
    if (printData !== null) {
      window.print();
    }
  }, [printData]);

  function addToCart(p: Product) {
    setLines((prev) => {
      const found = prev.find((l) => l.productId === p.id);
      if (found) {
        return prev.map((l) =>
          l.productId === p.id ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      return [...prev, { productId: p.id, name: p.name, price: p.price, quantity: 1 }];
    });
  }

  function removeFromCart(productId: number) {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  }

  const total = calcTotal(lines);
  const paid = parseRupiah(paidText);
  let change = 0;
  try {
    change = calcChange(total, paid);
  } catch {
    change = 0;
  }

  const canPay = lines.length > 0 && paid >= total && total > 0;

  async function pay() {
    if (!canPay) return;

    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lines: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        paidAmount: paid,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      alert((body as { error?: string }).error ?? "Terjadi kesalahan.");
      return;
    }

    const tx = await res.json();

    // Capture snapshot BEFORE clearing cart. The Receipt renders from this
    // snapshot, so even after setLines([]) the print dialog will show the
    // completed sale. The useEffect on printData fires after React commits
    // the snapshot to DOM, guaranteeing content at print time.
    const snapshot: ReceiptData = {
      lines: [...lines],
      total,
      paid,
      change,
      invoiceNo: tx.invoiceNo as string,
      createdAt: tx.createdAt as string | undefined,
    };

    setPrintData(snapshot);  // commit snapshot → triggers useEffect → print
    setLines([]);            // clear cart (does NOT affect printData)
    setPaidText("");

    // Refresh stock counts after sale
    loadProducts();
  }

  return (
    <main>
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_360px] gap-6">

          {/* Product grid */}
          <section>
            <h1 className="text-[22px] font-semibold tracking-tight text-[var(--ink)] mb-5">
              Kasir
            </h1>

            {products.length === 0 && (
              <p className="text-sm text-[var(--muted)]">Memuat produk...</p>
            )}

            <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
              {products.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  disabled={p.stock <= 0}
                  className="rounded-xl border border-[var(--line)] bg-[var(--card)] p-4 elev-1 text-left transition-colors hover:border-[var(--primary)] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <div className="font-medium text-[var(--ink)] mb-1 text-sm">
                    {p.name}
                  </div>
                  <div className="text-[13px] text-[var(--muted)]">
                    {formatRupiah(p.price)}
                  </div>
                  <div className="text-xs text-[var(--muted)] mt-0.5">
                    Stok: {p.stock}
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Cart aside */}
          <aside className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 elev-1 self-start">
            <h2 className="font-semibold text-[var(--ink)] mb-3 text-[15px]">
              Keranjang
            </h2>

            {lines.length === 0 && (
              <p className="text-[13px] text-[var(--muted)]">Belum ada item</p>
            )}

            {lines.map((l) => (
              <div
                key={l.productId}
                className="flex justify-between items-center py-1.5 text-[13px] text-[var(--ink)]"
              >
                <span className="flex-1">
                  {l.name} x{l.quantity}
                </span>
                <span className="mr-2">
                  {formatRupiah(l.price * l.quantity)}
                </span>
                <button
                  onClick={() => removeFromCart(l.productId)}
                  className="text-[var(--error)] text-xs px-0.5 bg-transparent border-none cursor-pointer hover:opacity-70 transition-opacity"
                >
                  X
                </button>
              </div>
            ))}

            {/* Total */}
            <div className="flex justify-between border-t border-[var(--line)] pt-3 mt-2 font-semibold text-sm text-[var(--ink)]">
              <span>Total</span>
              <span>{formatRupiah(total)}</span>
            </div>

            {/* Paid input */}
            <label className="block text-xs text-[var(--muted)] mt-4 mb-1">
              Bayar
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={paidText}
              onChange={(e) => setPaidText(e.target.value)}
              placeholder="0"
              className="w-full rounded-lg border border-[var(--line)] focus:border-[var(--primary)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] outline-none transition-colors box-border"
            />

            {/* Change */}
            <div className="flex justify-between mt-2 text-[13px] text-[var(--muted)]">
              <span>Kembali</span>
              <span>{formatRupiah(change)}</span>
            </div>

            {/* Pay button */}
            <button
              onClick={pay}
              disabled={!canPay}
              className="mt-4 w-full bg-[var(--secondary)] text-white rounded-lg py-2.5 text-sm font-medium cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            >
              Bayar & Cetak
            </button>
          </aside>
        </div>
      </div>

      {/* Receipt renders from printData snapshot, not live cart state */}
      <Receipt data={printData} />
    </main>
  );
}

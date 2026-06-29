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
    <>
      <main
        style={{
          maxWidth: "1152px",
          margin: "0 auto",
          padding: "32px 24px",
          display: "grid",
          gap: "24px",
        }}
        className="grid-cols-1 md:grid-cols-[1fr_360px]"
      >
        {/* Product grid */}
        <section>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "var(--ink)",
              marginBottom: "20px",
            }}
          >
            Kasir
          </h1>

          {products.length === 0 && (
            <p style={{ color: "var(--muted)", fontSize: "14px" }}>
              Memuat produk...
            </p>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: "12px",
            }}
          >
            {products.map((p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                disabled={p.stock <= 0}
                className="product-btn"
                style={{
                  border: "1px solid var(--line)",
                  borderRadius: "8px",
                  background: "var(--surface)",
                  padding: "16px",
                  textAlign: "left",
                  cursor: p.stock <= 0 ? "not-allowed" : "pointer",
                  opacity: p.stock <= 0 ? 0.4 : 1,
                  transition: "border-color 0.15s",
                }}
              >
                <div
                  style={{
                    fontWeight: 500,
                    color: "var(--ink)",
                    marginBottom: "4px",
                    fontSize: "14px",
                  }}
                >
                  {p.name}
                </div>
                <div style={{ fontSize: "13px", color: "var(--muted)" }}>
                  {formatRupiah(p.price)}
                </div>
                <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>
                  Stok: {p.stock}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Cart aside */}
        <aside
          style={{
            border: "1px solid var(--line)",
            borderRadius: "10px",
            background: "var(--surface)",
            padding: "20px",
            alignSelf: "start",
          }}
        >
          <h2
            style={{
              fontWeight: 600,
              fontSize: "15px",
              color: "var(--ink)",
              marginBottom: "12px",
            }}
          >
            Keranjang
          </h2>

          {lines.length === 0 && (
            <p style={{ fontSize: "13px", color: "var(--muted)" }}>
              Belum ada item
            </p>
          )}

          {lines.map((l) => (
            <div
              key={l.productId}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "6px 0",
                fontSize: "13px",
                color: "var(--ink)",
              }}
            >
              <span style={{ flex: 1 }}>
                {l.name} x{l.quantity}
              </span>
              <span style={{ marginRight: "8px" }}>
                {formatRupiah(l.price * l.quantity)}
              </span>
              <button
                onClick={() => removeFromCart(l.productId)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#b91c1c",
                  cursor: "pointer",
                  fontSize: "12px",
                  padding: "0 2px",
                }}
              >
                X
              </button>
            </div>
          ))}

          {/* Total */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              borderTop: "1px solid var(--line)",
              paddingTop: "12px",
              marginTop: "8px",
              fontWeight: 600,
              fontSize: "14px",
              color: "var(--ink)",
            }}
          >
            <span>Total</span>
            <span>{formatRupiah(total)}</span>
          </div>

          {/* Paid input */}
          <label
            style={{
              display: "block",
              fontSize: "12px",
              color: "var(--muted)",
              marginTop: "16px",
              marginBottom: "4px",
            }}
          >
            Bayar
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={paidText}
            onChange={(e) => setPaidText(e.target.value)}
            placeholder="0"
            style={{
              width: "100%",
              border: "1px solid var(--line)",
              borderRadius: "6px",
              padding: "8px 12px",
              fontSize: "14px",
              color: "var(--ink)",
              background: "var(--surface)",
              boxSizing: "border-box",
              outline: "none",
            }}
          />

          {/* Change */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "8px",
              fontSize: "13px",
              color: "var(--muted)",
            }}
          >
            <span>Kembali</span>
            <span>{formatRupiah(change)}</span>
          </div>

          {/* Pay button */}
          <button
            onClick={pay}
            disabled={!canPay}
            style={{
              marginTop: "16px",
              width: "100%",
              background: canPay ? "var(--accent)" : "var(--line)",
              color: canPay ? "#ffffff" : "var(--muted)",
              border: "none",
              borderRadius: "6px",
              padding: "10px 0",
              fontSize: "14px",
              fontWeight: 500,
              cursor: canPay ? "pointer" : "not-allowed",
              transition: "background 0.15s",
            }}
          >
            Bayar & Cetak
          </button>
        </aside>
      </main>

      {/* Receipt renders from printData snapshot, not live cart state */}
      <Receipt data={printData} />
    </>
  );
}

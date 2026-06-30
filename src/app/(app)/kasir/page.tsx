"use client";
import { useEffect, useMemo, useState } from "react";
import { Receipt, type ReceiptData } from "@/app/components/Receipt";
import { Icon } from "@/app/components/ui/Icon";
import { calcTotal, calcChange, type CartLine } from "@/lib/cart";
import { formatRupiah, parseRupiah } from "@/lib/money";

type Product = {
  id: number;
  name: string;
  price: number;
  stock: number;
  sku?: string | null;
  category?: string | null;
  imageUrl?: string | null;
};

const ALL = "Semua";

// Pastel badge palette keyed deterministically by category name.
const badgeVariants = [
  "bg-emerald-50 text-emerald-700",
  "bg-indigo-50 text-indigo-700",
  "bg-amber-50 text-amber-700",
  "bg-sky-50 text-sky-700",
  "bg-rose-50 text-rose-700",
];
function badgeClass(category: string): string {
  let h = 0;
  for (let i = 0; i < category.length; i++) h = (h + category.charCodeAt(i)) % badgeVariants.length;
  return badgeVariants[h];
}

export default function KasirPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [paidText, setPaidText] = useState("");
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>(ALL);
  const [printData, setPrintData] = useState<ReceiptData | null>(null);
  const [method, setMethod] = useState<"cash" | "qris" | "transfer">("cash");
  const [discType, setDiscType] = useState<"amount" | "percent">("amount");
  const [discValue, setDiscValue] = useState("");
  const [settings, setSettings] = useState<{
    storeName?: string | null;
    address?: string | null;
    phone?: string | null;
    receiptFooter?: string | null;
    qrisImageUrl?: string | null;
  } | null>(null);

  function loadProducts() {
    fetch("/api/products?activeOnly=1")
      .then((r) => r.json())
      .then(setProducts);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then(setSettings).catch(() => {});
  }, []);

  // Trigger window.print() AFTER printData has been committed to the DOM.
  // useEffect runs after React has flushed DOM updates, so the Receipt will
  // have its snapshot content rendered before the print dialog opens.
  useEffect(() => {
    if (printData !== null) {
      window.print();
    }
  }, [printData]);

  // Category chips derived from real product categories.
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) if (p.category) set.add(p.category);
    return [ALL, ...[...set].sort((a, b) => a.localeCompare(b))];
  }, [products]);

  const visibleProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const catOk = activeCat === ALL || p.category === activeCat;
      const qOk = q === "" || p.name.toLowerCase().includes(q);
      return catOk && qOk;
    });
  }, [products, activeCat, query]);

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

  function changeQty(productId: number, delta: number) {
    setLines((prev) =>
      prev
        .map((l) => (l.productId === productId ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0)
    );
  }

  function removeFromCart(productId: number) {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  }

  function clearCart() {
    setLines([]);
    setPaidText("");
  }

  const productById = useMemo(() => {
    const m = new Map<number, Product>();
    for (const p of products) m.set(p.id, p);
    return m;
  }, [products]);

  const subtotal = calcTotal(lines);
  const discVal = Number(discValue) || 0;
  const discountAmount = Math.min(
    discType === "percent" ? Math.round((subtotal * discVal) / 100) : discVal,
    subtotal
  );
  const total = subtotal - discountAmount;
  const paid = method === "cash" ? parseRupiah(paidText) : total;
  let change = 0;
  try {
    change = calcChange(total, paid);
  } catch {
    change = 0;
  }

  const canPay = lines.length > 0 && total > 0 && (method !== "cash" || paid >= total);

  async function pay() {
    if (!canPay) return;

    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lines: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        paidAmount: paid,
        paymentMethod: method,
        discount: discountAmount > 0 ? { type: discType, value: discVal } : undefined,
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
      subtotal,
      discount: discountAmount,
      total,
      paid,
      change,
      paymentMethod: method,
      invoiceNo: tx.invoiceNo as string,
      createdAt: tx.createdAt as string | undefined,
      store: {
        name: settings?.storeName,
        address: settings?.address,
        phone: settings?.phone,
        footer: settings?.receiptFooter,
      },
    };

    setPrintData(snapshot);  // commit snapshot → triggers useEffect → print
    setLines([]);            // clear cart (does NOT affect printData)
    setPaidText("");
    setDiscValue("");

    // Refresh stock counts after sale
    loadProducts();
  }

  return (
    <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
      {/* Catalog */}
      <section className="min-w-0">
        {/* Search */}
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 elev-1">
          <Icon name="search" size={20} className="text-[var(--muted)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const q = query.trim().toLowerCase();
                const hit = products.find((p) => (p.sku ?? "").toLowerCase() === q);
                if (hit && hit.stock > 0) {
                  addToCart(hit);
                  setQuery("");
                }
              }
            }}
            placeholder="Cari produk (nama)..."
            className="w-full bg-transparent text-sm text-[var(--ink)] outline-none"
          />
        </div>

        {/* Category chips */}
        <div className="mb-5 flex flex-wrap gap-2">
          {categories.map((c) => {
            const active = c === activeCat;
            return (
              <button
                key={c}
                onClick={() => setActiveCat(c)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-[var(--primary)] text-white"
                    : "border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--primary)]"
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>

        {products.length === 0 && (
          <p className="text-sm text-[var(--muted)]">Memuat produk...</p>
        )}
        {products.length > 0 && visibleProducts.length === 0 && (
          <p className="text-sm text-[var(--muted)]">Tidak ada produk yang cocok.</p>
        )}

        {/* Product grid */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
          {visibleProducts.map((p) => {
            const out = p.stock <= 0;
            return (
              <div
                key={p.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--card)] elev-1"
              >
                <div className="relative aspect-square bg-[var(--surface-container)]">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[var(--primary)]">
                      <Icon name="inventory_2" size={40} />
                    </div>
                  )}
                  {p.category && (
                    <span
                      className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badgeClass(
                        p.category
                      )}`}
                    >
                      {p.category}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-3">
                  <div className="text-sm font-semibold leading-snug text-[var(--ink)]">
                    {p.name}
                  </div>
                  <div className="text-xs text-[var(--muted)]">Stok: {p.stock}</div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-mono text-base font-bold text-[var(--primary)]">
                      {formatRupiah(p.price)}
                    </span>
                    <button
                      onClick={() => addToCart(p)}
                      disabled={out}
                      aria-label={`Tambah ${p.name}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)] text-white transition-colors hover:bg-[var(--primary-container)] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Icon name="add" size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Order panel */}
      <aside className="flex h-full flex-col rounded-2xl border border-[var(--line)] bg-[var(--card)] elev-1">
        <div className="flex items-center justify-between border-b border-[var(--line)] p-5">
          <div>
            <h2 className="text-lg font-bold text-[var(--ink)]">Pesanan</h2>
            <p className="text-xs text-[var(--muted)]">Transaksi</p>
          </div>
          {lines.length > 0 && (
            <button
              onClick={clearCart}
              aria-label="Kosongkan pesanan"
              className="rounded-lg p-1.5 text-[var(--error)] hover:bg-[var(--surface-container)]"
            >
              <Icon name="delete_sweep" size={20} />
            </button>
          )}
        </div>

        {/* Items */}
        <div className="flex-1 overflow-auto p-5">
          {lines.length === 0 && (
            <p className="text-sm text-[var(--muted)]">Belum ada item</p>
          )}
          <div className="space-y-4">
            {lines.map((l) => {
              const img = productById.get(l.productId)?.imageUrl;
              return (
                <div key={l.productId} className="flex items-center gap-3">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt={l.name} className="h-12 w-12 rounded-lg object-cover border border-[var(--line)]" />
                  ) : (
                    <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--surface-container)] text-[var(--primary)]">
                      <Icon name="inventory_2" size={20} />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-[var(--ink)]">{l.name}</div>
                    <div className="mt-1 flex items-center gap-2">
                      <button
                        onClick={() => changeQty(l.productId, -1)}
                        aria-label="Kurangi"
                        className="flex h-6 w-6 items-center justify-center rounded-md border border-[var(--line)] text-[var(--muted)] hover:border-[var(--primary)]"
                      >
                        <Icon name="remove" size={14} />
                      </button>
                      <span className="w-6 text-center text-sm font-medium text-[var(--ink)]">{l.quantity}</span>
                      <button
                        onClick={() => changeQty(l.productId, 1)}
                        aria-label="Tambah"
                        className="flex h-6 w-6 items-center justify-center rounded-md border border-[var(--line)] text-[var(--muted)] hover:border-[var(--primary)]"
                      >
                        <Icon name="add" size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm font-semibold text-[var(--ink)]">
                      {formatRupiah(l.price * l.quantity)}
                    </div>
                    <button
                      onClick={() => removeFromCart(l.productId)}
                      aria-label={`Hapus ${l.name}`}
                      className="mt-1 text-[var(--muted)] hover:text-[var(--error)]"
                    >
                      <Icon name="delete" size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary + payment */}
        <div className="border-t border-[var(--line)] p-5">
          {/* Subtotal & diskon */}
          <div className="mb-1 flex items-center justify-between text-sm text-[var(--muted)]">
            <span>Subtotal</span>
            <span className="font-mono">{formatRupiah(subtotal)}</span>
          </div>
          <div className="mb-2 flex items-center gap-2">
            <select value={discType} onChange={(e) => setDiscType(e.target.value as "amount" | "percent")}
              className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2 py-1.5 text-xs text-[var(--ink)] outline-none">
              <option value="amount">Rp</option>
              <option value="percent">%</option>
            </select>
            <input value={discValue} onChange={(e) => setDiscValue(e.target.value)} inputMode="numeric" placeholder="Diskon"
              className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--primary)]" />
          </div>

          {/* Total */}
          <div className="mb-3 flex items-center justify-between">
            <span className="text-base font-bold text-[var(--ink)]">Total</span>
            <span className="font-mono text-xl font-bold text-[var(--primary)]">{formatRupiah(total)}</span>
          </div>

          {/* Metode bayar */}
          <div className="mb-3 grid grid-cols-3 gap-2">
            {(["cash", "qris", "transfer"] as const).map((m) => (
              <button key={m} type="button" onClick={() => setMethod(m)}
                className={`rounded-lg border px-2 py-1.5 text-xs font-medium ${
                  method === m ? "border-[var(--primary)] bg-[var(--surface-container)] text-[var(--primary)]" : "border-[var(--line)] text-[var(--muted)]"
                }`}>
                {m === "cash" ? "Tunai" : m === "qris" ? "QRIS" : "Transfer"}
              </button>
            ))}
          </div>

          {method === "cash" && (
            <>
              <label className="mb-1 block text-xs text-[var(--muted)]">Uang Bayar</label>
              <input type="text" inputMode="numeric" value={paidText} onChange={(e) => setPaidText(e.target.value)} placeholder="0"
                className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--primary)] box-border" />
              <div className="mt-2 flex items-center justify-between text-sm text-[var(--muted)]">
                <span>Kembali</span><span className="font-mono">{formatRupiah(change)}</span>
              </div>
            </>
          )}

          {method === "qris" && (
            <div className="rounded-lg border border-[var(--line)] p-3 text-center">
              {settings?.qrisImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={settings.qrisImageUrl} alt="QRIS" className="mx-auto h-40 w-40 object-contain" />
              ) : (
                <p className="text-xs text-[var(--muted)]">QRIS belum diatur (atur di Pengaturan).</p>
              )}
              <p className="mt-1 text-xs text-[var(--muted)]">Scan untuk bayar {formatRupiah(total)}</p>
            </div>
          )}

          {method === "transfer" && (
            <p className="rounded-lg border border-[var(--line)] p-3 text-xs text-[var(--muted)]">
              Konfirmasi transfer sebesar {formatRupiah(total)} sebelum menyelesaikan.
            </p>
          )}

          <button
            onClick={pay}
            disabled={!canPay}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-container)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Icon name="point_of_sale" size={18} /> {method === "cash" ? "Bayar & Cetak" : "Selesai & Cetak"}
          </button>
        </div>
      </aside>

      {/* Receipt renders from printData snapshot, not live cart state */}
      <Receipt data={printData} />
    </div>
  );
}

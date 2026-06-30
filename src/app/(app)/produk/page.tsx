"use client";
import { useEffect, useMemo, useState } from "react";
import { ProductForm, type ProductInput } from "@/app/components/ProductForm";
import { Modal } from "@/app/components/ui/Modal";
import { Icon } from "@/app/components/ui/Icon";
import { StatCard } from "@/app/components/ui/StatCard";
import { StatusChip } from "@/app/components/ui/StatusChip";
import { formatRupiah } from "@/lib/money";

type Product = {
  id: number;
  name: string;
  price: number;
  stock: number;
  sku?: string | null;
  category?: string | null;
  imageUrl?: string | null;
};

const LOW_STOCK_THRESHOLD = 10;
const ALL = "Semua";
const PAGE_SIZE = 8;

function stockChip(stock: number) {
  if (stock <= 0) return <StatusChip variant="error">Habis ({stock})</StatusChip>;
  if (stock <= LOW_STOCK_THRESHOLD) return <StatusChip variant="warning">Menipis ({stock})</StatusChip>;
  return <StatusChip variant="success">Tersedia ({stock})</StatusChip>;
}

export default function ProdukPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cat, setCat] = useState<string>(ALL);
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  async function load() {
    const res = await fetch("/api/products?activeOnly=1");
    if (res.ok) setProducts(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) if (p.category) set.add(p.category);
    return [ALL, ...[...set].sort((a, b) => a.localeCompare(b))];
  }, [products]);

  const filtered = useMemo(
    () => products.filter((p) => cat === ALL || p.category === cat),
    [products, cat]
  );

  // Stats from real data.
  const totalItems = products.length;
  const outOfStock = products.filter((p) => p.stock <= 0).length;
  const inventoryValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);

  // Pagination.
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(start, start + PAGE_SIZE);

  async function addProduct(p: ProductInput): Promise<string | null> {
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return (data as { error?: string }).error ?? "Gagal menyimpan produk.";
    }
    await load();
    return null;
  }

  async function editProduct(id: number, p: ProductInput): Promise<string | null> {
    const res = await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return (data as { error?: string }).error ?? "Gagal memperbarui produk.";
    }
    await load();
    return null;
  }

  async function remove(id: number) {
    if (!confirm("Hapus produk ini?")) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) await load();
  }

  function exportCsv() {
    const header = ["Nama", "SKU", "Kategori", "Harga", "Stok"];
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = filtered.map((p) =>
      [p.name, p.sku ?? "", p.category ?? "", String(p.price), String(p.stock)].map(escape).join(",")
    );
    const csv = [header.map(escape).join(","), ...rows].join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "produk.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Produk" value={String(totalItems)} icon="inventory_2" />
        <StatCard label="Stok Habis" value={String(outOfStock)} icon="error" sub="perlu restock" />
        <StatCard label="Nilai Inventaris" value={formatRupiah(inventoryValue)} icon="account_balance_wallet" sub="harga × stok" />
      </div>

      {/* Heading + toolbar */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--ink)]">Manajemen Inventaris</h1>
          <p className="text-sm text-[var(--muted)]">Pantau dan kelola stok produk di semua kategori.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={cat}
            onChange={(e) => {
              setCat(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--primary)]"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === ALL ? "Semua kategori" : c}
              </option>
            ))}
          </select>
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--ink)] hover:border-[var(--primary)]"
          >
            <Icon name="download" size={18} /> Export
          </button>
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-container)]"
          >
            <Icon name="add" size={18} /> Tambah Produk
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--card)] elev-1">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] text-left">
                {["Produk", "SKU", "Kategori", "Harga", "Stok", ""].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[var(--muted)]">
                    Belum ada produk.
                  </td>
                </tr>
              )}
              {pageRows.map((p) => (
                <tr key={p.id} className="border-t border-[var(--line)] hover:bg-[var(--surface-container)]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imageUrl} alt={p.name} className="h-10 w-10 rounded-lg border border-[var(--line)] object-cover" />
                      ) : (
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--surface-container)] text-[var(--primary)]">
                          <Icon name="inventory_2" size={18} />
                        </span>
                      )}
                      <span className="font-medium text-[var(--ink)]">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--muted)]">{p.sku ?? "-"}</td>
                  <td className="px-4 py-3">
                    {p.category ? (
                      <span className="rounded-full bg-[var(--surface-container)] px-2.5 py-0.5 text-xs font-medium text-[var(--primary)]">
                        {p.category}
                      </span>
                    ) : (
                      <span className="text-[var(--muted)]">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-[var(--ink)]">{formatRupiah(p.price)}</td>
                  <td className="px-4 py-3">{stockChip(p.stock)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditing(p)}
                        aria-label={`Edit ${p.name}`}
                        className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--primary)]"
                      >
                        <Icon name="edit" size={18} />
                      </button>
                      <button
                        onClick={() => remove(p.id)}
                        aria-label={`Hapus ${p.name}`}
                        className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--error)]"
                      >
                        <Icon name="delete" size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="flex items-center justify-between border-t border-[var(--line)] px-4 py-3 text-sm text-[var(--muted)]">
          <span>
            {filtered.length === 0
              ? "0 produk"
              : `Menampilkan ${start + 1}–${Math.min(start + PAGE_SIZE, filtered.length)} dari ${filtered.length} produk`}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              aria-label="Sebelumnya"
              className="rounded-lg border border-[var(--line)] p-1.5 disabled:opacity-40 hover:border-[var(--primary)]"
            >
              <Icon name="chevron_left" size={16} />
            </button>
            <span className="px-2 text-[var(--ink)]">
              {currentPage} / {pageCount}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={currentPage >= pageCount}
              aria-label="Berikutnya"
              className="rounded-lg border border-[var(--line)] p-1.5 disabled:opacity-40 hover:border-[var(--primary)]"
            >
              <Icon name="chevron_right" size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Add modal */}
      <Modal open={adding} title="Tambah Produk" onClose={() => setAdding(false)}>
        <ProductForm onSubmit={addProduct} onSuccess={() => setAdding(false)} submitLabel="Tambah" />
      </Modal>

      {/* Edit modal */}
      <Modal open={editing !== null} title="Edit Produk" onClose={() => setEditing(null)}>
        {editing && (
          <ProductForm
            initial={{
              name: editing.name,
              price: editing.price,
              stock: editing.stock,
              sku: editing.sku ?? undefined,
              category: editing.category ?? undefined,
              imageUrl: editing.imageUrl ?? undefined,
            }}
            submitLabel="Simpan Perubahan"
            onSubmit={(p) => editProduct(editing.id, p)}
            onSuccess={() => setEditing(null)}
          />
        )}
      </Modal>
    </div>
  );
}

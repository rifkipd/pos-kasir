"use client";
import { useEffect, useState } from "react";
import { ProductForm, type ProductInput } from "@/app/components/ProductForm";
import { formatRupiah } from "@/lib/money";

type Product = {
  id: number;
  name: string;
  price: number;
  stock: number;
  category?: string | null;
};

export default function ProdukPage() {
  const [products, setProducts] = useState<Product[]>([]);

  async function load() {
    const res = await fetch("/api/products?activeOnly=1");
    if (res.ok) setProducts(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function add(p: ProductInput): Promise<string | null> {
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

  async function remove(id: number) {
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) await load();
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <h1 className="text-2xl font-bold text-[var(--ink)]">Produk</h1>

      <ProductForm onSubmit={add} />

      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--card)] elev-1">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left border-b border-[var(--line)]">
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Nama</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Harga</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Stok</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-[var(--muted)]"></th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-6 text-center text-[var(--muted)]"
                >
                  Belum ada produk.
                </td>
              </tr>
            )}
            {products.map((p) => (
              <tr key={p.id} className="border-t border-[var(--line)]">
                <td className="px-4 py-3 text-[var(--ink)]">{p.name}</td>
                <td className="px-4 py-3 text-[var(--ink)]">
                  {formatRupiah(p.price)}
                </td>
                <td className="px-4 py-3 text-[var(--ink)]">{p.stock}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => remove(p.id)}
                    className="text-[var(--error)] hover:underline text-sm cursor-pointer bg-transparent border-none p-0"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

"use client";
import { useState } from "react";

export type ProductInput = {
  name: string;
  price: number;
  stock: number;
  sku?: string;
  category?: string;
  imageUrl?: string;
  costPrice?: number;
};

const inputCls =
  "w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm text-[var(--ink)] bg-[var(--surface)] outline-none focus:border-[var(--primary)]";
const labelCls = "mb-1 block text-xs font-medium text-[var(--muted)]";

export function ProductForm({
  onSubmit,
  onSuccess,
  initial,
  submitLabel = "Simpan",
}: {
  onSubmit: (p: ProductInput) => Promise<string | null>;
  onSuccess?: () => void;
  initial?: Partial<ProductInput>;
  submitLabel?: string;
}) {
  const isEdit = initial !== undefined;
  const [name, setName] = useState(initial?.name ?? "");
  const [price, setPrice] = useState(initial?.price != null ? String(initial.price) : "");
  const [stock, setStock] = useState(initial?.stock != null ? String(initial.stock) : "");
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [costPrice, setCostPrice] = useState(initial?.costPrice != null ? String(initial.costPrice) : "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const err = await onSubmit({
        name,
        price: Number(price) || 0,
        stock: Number(stock) || 0,
        sku: sku.trim() || undefined,
        category: category.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        costPrice: Number(costPrice) || 0,
      });
      if (err) {
        setError(err);
        return;
      }
      if (!isEdit) {
        setName("");
        setPrice("");
        setStock("");
        setSku("");
        setCategory("");
        setImageUrl("");
        setCostPrice("");
      }
      onSuccess?.();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className={labelCls}>Nama produk</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required className={inputCls} placeholder="mis. Kopi Susu" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>Harga (Rp)</label>
          <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" min="0" className={inputCls} placeholder="0" />
        </div>
        <div>
          <label className={labelCls}>Harga Modal (Rp)</label>
          <input value={costPrice} onChange={(e) => setCostPrice(e.target.value)} type="number" min="0" className={inputCls} placeholder="0" />
        </div>
        <div>
          <label className={labelCls}>Stok</label>
          <input value={stock} onChange={(e) => setStock(e.target.value)} type="number" min="0" className={inputCls} placeholder="0" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>SKU (opsional)</label>
          <input value={sku} onChange={(e) => setSku(e.target.value)} className={`${inputCls} font-mono`} placeholder="mis. KP01" />
        </div>
        <div>
          <label className={labelCls}>Kategori</label>
          <input value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls} placeholder="mis. Minuman" />
        </div>
      </div>
      <div>
        <label className={labelCls}>URL Gambar (opsional)</label>
        <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} type="url" className={inputCls} placeholder="https://..." />
      </div>

      {error && <p className="text-sm text-[var(--error)]">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--primary-container)] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? "Menyimpan..." : submitLabel}
      </button>
    </form>
  );
}

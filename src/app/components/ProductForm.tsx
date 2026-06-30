"use client";
import { useState } from "react";

export type ProductInput = {
  name: string;
  price: number;
  stock: number;
  sku?: string;
  category?: string;
  imageUrl?: string;
};

export function ProductForm({
  onSubmit,
}: {
  onSubmit: (p: ProductInput) => Promise<string | null>;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");
  const [imageUrl, setImageUrl] = useState("");
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
        category: category.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
      });
      if (err) {
        setError(err);
      } else {
        setName("");
        setPrice("");
        setStock("");
        setCategory("");
        setImageUrl("");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form
        onSubmit={submit}
        className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 elev-1 flex flex-wrap gap-3"
      >
        <input
          placeholder="Nama"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="flex-[1_1_180px] rounded-lg border border-[var(--line)] px-3 py-2 text-sm text-[var(--ink)] bg-[var(--bg)] outline-none focus:border-[var(--primary)]"
        />
        <input
          placeholder="Harga"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          type="number"
          min="0"
          className="w-32 rounded-lg border border-[var(--line)] px-3 py-2 text-sm text-[var(--ink)] bg-[var(--bg)] outline-none focus:border-[var(--primary)]"
        />
        <input
          placeholder="Stok"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          type="number"
          min="0"
          className="w-24 rounded-lg border border-[var(--line)] px-3 py-2 text-sm text-[var(--ink)] bg-[var(--bg)] outline-none focus:border-[var(--primary)]"
        />
        <input
          placeholder="Kategori (mis. Makanan)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-44 rounded-lg border border-[var(--line)] px-3 py-2 text-sm text-[var(--ink)] bg-[var(--bg)] outline-none focus:border-[var(--primary)]"
        />
        <input
          placeholder="URL Gambar (opsional)"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          type="url"
          className="flex-[1_1_220px] rounded-lg border border-[var(--line)] px-3 py-2 text-sm text-[var(--ink)] bg-[var(--bg)] outline-none focus:border-[var(--primary)]"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--primary-container)] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
        >
          {loading ? "Menyimpan..." : "Tambah"}
        </button>
      </form>
      {error && (
        <p className="mt-2 text-sm text-[var(--error)] pl-1">
          {error}
        </p>
      )}
    </div>
  );
}

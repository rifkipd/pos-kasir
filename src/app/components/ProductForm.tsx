"use client";
import { useState } from "react";

export type ProductInput = {
  name: string;
  price: number;
  stock: number;
  sku?: string;
  category?: string;
};

export function ProductForm({
  onSubmit,
}: {
  onSubmit: (p: ProductInput) => Promise<string | null>;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
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
      });
      if (err) {
        setError(err);
      } else {
        setName("");
        setPrice("");
        setStock("");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form
        onSubmit={submit}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          border: "1px solid var(--line)",
          borderRadius: "10px",
          background: "var(--surface)",
          padding: "16px",
        }}
      >
        <input
          placeholder="Nama"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{
            flex: "1 1 180px",
            border: "1px solid var(--line)",
            borderRadius: "8px",
            padding: "8px 12px",
            fontSize: "14px",
            color: "var(--ink)",
            background: "var(--bg)",
            outline: "none",
          }}
        />
        <input
          placeholder="Harga"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          type="number"
          min="0"
          style={{
            width: "128px",
            border: "1px solid var(--line)",
            borderRadius: "8px",
            padding: "8px 12px",
            fontSize: "14px",
            color: "var(--ink)",
            background: "var(--bg)",
            outline: "none",
          }}
        />
        <input
          placeholder="Stok"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          type="number"
          min="0"
          style={{
            width: "96px",
            border: "1px solid var(--line)",
            borderRadius: "8px",
            padding: "8px 12px",
            fontSize: "14px",
            color: "var(--ink)",
            background: "var(--bg)",
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            background: "var(--accent)",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "8px 20px",
            fontSize: "14px",
            fontWeight: 500,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Menyimpan..." : "Tambah"}
        </button>
      </form>
      {error && (
        <p
          style={{
            marginTop: "8px",
            fontSize: "13px",
            color: "#b91c1c",
            paddingLeft: "4px",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

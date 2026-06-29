"use client";
import { useEffect, useState } from "react";
import { AppNav } from "@/app/components/AppNav";
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
    <>
      <AppNav />
      <main
        style={{
          maxWidth: "896px",
          margin: "0 auto",
          padding: "32px 24px",
        }}
      >
        <h1
          style={{
            fontSize: "22px",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "var(--ink)",
            marginBottom: "20px",
          }}
        >
          Produk
        </h1>

        <div style={{ marginBottom: "24px" }}>
          <ProductForm onSubmit={add} />
        </div>

        <div
          style={{
            border: "1px solid var(--line)",
            borderRadius: "10px",
            background: "var(--surface)",
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--line)",
                  textAlign: "left",
                  color: "var(--muted)",
                }}
              >
                <th style={{ padding: "10px 14px", fontWeight: 500 }}>Nama</th>
                <th style={{ padding: "10px 14px", fontWeight: 500 }}>Harga</th>
                <th style={{ padding: "10px 14px", fontWeight: 500 }}>Stok</th>
                <th style={{ padding: "10px 14px", fontWeight: 500 }}></th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      padding: "24px 14px",
                      textAlign: "center",
                      color: "var(--muted)",
                    }}
                  >
                    Belum ada produk.
                  </td>
                </tr>
              )}
              {products.map((p) => (
                <tr
                  key={p.id}
                  style={{ borderBottom: "1px solid var(--line)" }}
                >
                  <td style={{ padding: "10px 14px", color: "var(--ink)" }}>{p.name}</td>
                  <td style={{ padding: "10px 14px", color: "var(--ink)" }}>
                    {formatRupiah(p.price)}
                  </td>
                  <td style={{ padding: "10px 14px", color: "var(--ink)" }}>{p.stock}</td>
                  <td style={{ padding: "10px 14px", textAlign: "right" }}>
                    <button
                      onClick={() => remove(p.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#b91c1c",
                        fontSize: "13px",
                        cursor: "pointer",
                        padding: "2px 4px",
                      }}
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
    </>
  );
}

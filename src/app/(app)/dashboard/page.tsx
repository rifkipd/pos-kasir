"use client";
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { StatCard } from "@/app/components/ui/StatCard";
import { StatusChip } from "@/app/components/ui/StatusChip";
import { formatRupiah } from "@/lib/money";

type Dash = {
  today: { totalSales: number; transactionCount: number };
  daily: { date: string; total: number }[];
  recent: {
    id: number;
    invoiceNo: string;
    createdAt: string;
    totalAmount: number;
  }[];
  bestSellers: {
    productId: number;
    name: string;
    price: number;
    qtySold: number;
  }[];
  inventory: { available: number; low: number; out: number; total: number };
};

export default function DashboardPage() {
  const [d, setD] = useState<Dash | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setD)
      .catch(() => setD(null));
  }, []);

  const today = d?.today ?? { totalSales: 0, transactionCount: 0 };
  const inv = d?.inventory ?? { available: 0, low: 0, out: 0, total: 0 };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)]">
        Ringkasan Bisnis
      </h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Pendapatan Hari Ini"
          value={formatRupiah(today.totalSales)}
          icon="payments"
        />
        <StatCard
          label="Transaksi Hari Ini"
          value={String(today.transactionCount)}
          icon="receipt_long"
        />
        <StatCard
          label="Produk Aktif"
          value={String(inv.total)}
          icon="inventory_2"
        />
        <StatCard
          label="Stok Tipis"
          value={String(inv.low + inv.out)}
          icon="warning"
          sub="perlu perhatian"
        />
      </div>

      {/* Revenue Chart + Best Sellers */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 elev-1">
          <div className="mb-4 font-semibold text-[var(--ink)]">
            Pendapatan 7 Hari
          </div>
          {(d?.daily?.length ?? 0) === 0 ? (
            <div
              className="flex items-center justify-center text-sm text-[var(--muted)]"
              style={{ height: "16rem" }}
            >
              Belum ada data pendapatan.
            </div>
          ) : (
            <div style={{ height: "16rem" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d?.daily ?? []}>
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip formatter={(v) => formatRupiah(Number(v))} />
                  <Bar dataKey="total" fill="#24389c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 elev-1">
          <div className="mb-4 font-semibold text-[var(--ink)]">
            Produk Terlaris
          </div>
          <div className="space-y-3">
            {(d?.bestSellers ?? []).map((p) => (
              <div
                key={p.productId}
                className="flex items-center justify-between text-sm"
              >
                <span className="font-medium text-[var(--ink)]">{p.name}</span>
                <span className="text-[var(--muted)]">{p.qtySold} terjual</span>
              </div>
            ))}
            {(d?.bestSellers?.length ?? 0) === 0 && (
              <div className="text-sm text-[var(--muted)]">
                Belum ada penjualan.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions + Inventory Status */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--card)] elev-1">
          <div className="border-b border-[var(--line)] p-5 font-semibold text-[var(--ink)]">
            Transaksi Terakhir
          </div>
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-[var(--muted)]">
              <tr>
                <th className="px-5 py-3">Invoice</th>
                <th className="px-5 py-3">Tanggal</th>
                <th className="px-5 py-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {(d?.recent ?? []).map((t) => (
                <tr key={t.id} className="border-t border-[var(--line)]">
                  <td className="px-5 py-3 font-mono text-[var(--primary)]">
                    {t.invoiceNo}
                  </td>
                  <td className="px-5 py-3 text-[var(--muted)]">
                    {new Date(t.createdAt).toLocaleString("id-ID")}
                  </td>
                  <td className="px-5 py-3">{formatRupiah(t.totalAmount)}</td>
                </tr>
              ))}
              {(d?.recent?.length ?? 0) === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-5 py-6 text-center text-[var(--muted)]"
                  >
                    Belum ada transaksi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 elev-1">
          <div className="mb-4 font-semibold text-[var(--ink)]">
            Status Inventaris
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Aman</span>
              <StatusChip variant="success">{inv.available}</StatusChip>
            </div>
            <div className="flex items-center justify-between">
              <span>Menipis</span>
              <StatusChip variant="warning">{inv.low}</StatusChip>
            </div>
            <div className="flex items-center justify-between">
              <span>Habis</span>
              <StatusChip variant="error">{inv.out}</StatusChip>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

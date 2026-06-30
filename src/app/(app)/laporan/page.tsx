"use client";
import { useEffect, useState } from "react";
import { formatRupiah } from "@/lib/money";
import { StatCard } from "@/app/components/ui/StatCard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Summary = { totalSales: number; transactionCount: number; totalProfit: number };
type Daily = { date: string; total: number };
type Tx = { id: number; invoiceNo: string; createdAt: string; totalAmount: number };

export default function LaporanPage() {
  const [summary, setSummary] = useState<Summary>({ totalSales: 0, transactionCount: 0, totalProfit: 0 });
  const [daily, setDaily] = useState<Daily[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);

  useEffect(() => {
    fetch("/api/reports/summary")
      .then((r) => r.json())
      .then((d) => {
        setSummary(d.summary);
        setDaily(d.daily);
      });
    fetch("/api/transactions")
      .then((r) => r.json())
      .then(setTxs);
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <h1 className="text-2xl font-bold text-[var(--ink)]">Laporan</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Penjualan"
          value={formatRupiah(summary.totalSales)}
          icon="payments"
        />
        <StatCard
          label="Laba"
          value={formatRupiah(summary.totalProfit ?? 0)}
          icon="trending_up"
        />
        <StatCard
          label="Jumlah Transaksi"
          value={String(summary.transactionCount)}
          icon="receipt_long"
        />
      </div>

      {/* Bar chart */}
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 elev-1">
        <div style={{ height: "16rem" }}>
          {daily.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-[var(--muted)]">
              Belum ada data penjualan harian.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily}>
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(v) => formatRupiah(Number(v))} width={100} />
                <Tooltip formatter={(v) => formatRupiah(Number(v))} />
                <Bar dataKey="total" fill="#24389c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Transactions table */}
      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--card)] elev-1">
        <table className="w-full text-sm">
          <thead className="text-left">
            <tr>
              <th className="p-3 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                Invoice
              </th>
              <th className="p-3 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                Tanggal
              </th>
              <th className="p-3 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {txs.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="p-6 text-center text-sm text-[var(--muted)]"
                >
                  Belum ada transaksi.
                </td>
              </tr>
            ) : (
              txs.map((t) => (
                <tr
                  key={t.id}
                  className="border-t border-[var(--line)] hover:bg-[var(--surface-container)]"
                >
                  <td className="p-3 font-mono text-[var(--primary)]">{t.invoiceNo}</td>
                  <td className="p-3">{new Date(t.createdAt).toLocaleString("id-ID")}</td>
                  <td className="p-3">{formatRupiah(t.totalAmount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { AppNav } from "@/app/components/AppNav";
import { formatRupiah } from "@/lib/money";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Summary = { totalSales: number; transactionCount: number };
type Daily = { date: string; total: number };
type Tx = { id: number; invoiceNo: string; createdAt: string; totalAmount: number };

export default function LaporanPage() {
  const [summary, setSummary] = useState<Summary>({ totalSales: 0, transactionCount: 0 });
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
    <>
      <AppNav />
      <main className="mx-auto max-w-5xl p-6">
        <h1 className="mb-4 text-2xl font-semibold tracking-tight">Laporan</h1>

        {/* Summary cards */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div
            className="rounded-lg p-5"
            style={{
              border: "1px solid var(--line)",
              background: "var(--surface)",
            }}
          >
            <div className="text-sm" style={{ color: "var(--muted)" }}>
              Total Penjualan
            </div>
            <div className="mt-1 text-2xl font-semibold">
              {formatRupiah(summary.totalSales)}
            </div>
          </div>
          <div
            className="rounded-lg p-5"
            style={{
              border: "1px solid var(--line)",
              background: "var(--surface)",
            }}
          >
            <div className="text-sm" style={{ color: "var(--muted)" }}>
              Jumlah Transaksi
            </div>
            <div className="mt-1 text-2xl font-semibold">
              {summary.transactionCount}
            </div>
          </div>
        </div>

        {/* Bar chart */}
        <div
          className="mb-6 rounded-lg p-4"
          style={{
            border: "1px solid var(--line)",
            background: "var(--surface)",
            height: "16rem",
          }}
        >
          {daily.length === 0 ? (
            <div
              className="flex h-full items-center justify-center text-sm"
              style={{ color: "var(--muted)" }}
            >
              Belum ada data penjualan harian.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily}>
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(v) => formatRupiah(Number(v))} width={100} />
                <Tooltip formatter={(v) => formatRupiah(Number(v))} />
                <Bar dataKey="total" fill="#2f6f4f" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Transactions table */}
        <div
          className="overflow-hidden rounded-lg"
          style={{ border: "1px solid var(--line)", background: "var(--surface)" }}
        >
          <table className="w-full text-sm">
            <thead
              className="text-left"
              style={{
                borderBottom: "1px solid var(--line)",
                color: "var(--muted)",
              }}
            >
              <tr>
                <th className="p-3 font-medium">Invoice</th>
                <th className="p-3 font-medium">Tanggal</th>
                <th className="p-3 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {txs.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="p-6 text-center text-sm"
                    style={{ color: "var(--muted)" }}
                  >
                    Belum ada transaksi.
                  </td>
                </tr>
              ) : (
                txs.map((t) => (
                  <tr
                    key={t.id}
                    style={{ borderBottom: "1px solid var(--line)" }}
                    className="last:border-0"
                  >
                    <td className="p-3">{t.invoiceNo}</td>
                    <td className="p-3">
                      {new Date(t.createdAt).toLocaleString("id-ID")}
                    </td>
                    <td className="p-3">{formatRupiah(t.totalAmount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}

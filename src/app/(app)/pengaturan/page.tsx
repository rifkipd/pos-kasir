"use client";
import { useEffect, useState } from "react";

type Settings = {
  storeName: string | null; address: string | null; phone: string | null;
  receiptFooter: string | null; logoUrl: string | null; qrisImageUrl: string | null;
};

const fields: { key: keyof Settings; label: string; type?: string }[] = [
  { key: "storeName", label: "Nama Toko" },
  { key: "address", label: "Alamat" },
  { key: "phone", label: "Telepon" },
  { key: "receiptFooter", label: "Footer Struk" },
  { key: "logoUrl", label: "URL Logo", type: "url" },
  { key: "qrisImageUrl", label: "URL Gambar QRIS", type: "url" },
];

export default function PengaturanPage() {
  const [s, setS] = useState<Settings | null>(null);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then(setS);
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false); setErr(null);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(s),
    });
    if (res.ok) setSaved(true);
    else setErr((await res.json().catch(() => ({}))).error ?? "Gagal menyimpan");
  }

  if (!s) return <div className="text-sm text-[var(--muted)]">Memuat...</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-[var(--ink)]">Pengaturan Toko</h1>
      <form onSubmit={save} className="space-y-4 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 elev-1">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">{f.label}</label>
            <input
              type={f.type ?? "text"}
              value={s[f.key] ?? ""}
              onChange={(e) => setS({ ...s, [f.key]: e.target.value })}
              className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--primary)]"
            />
          </div>
        ))}
        {err && <p className="text-sm text-[var(--error)]">{err}</p>}
        {saved && <p className="text-sm text-[var(--secondary)]">Tersimpan.</p>}
        <button className="rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--primary-container)]">
          Simpan
        </button>
      </form>
    </div>
  );
}

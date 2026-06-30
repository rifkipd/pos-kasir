"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "./ui/Icon";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard", adminOnly: true },
  { href: "/kasir", label: "Kasir", icon: "point_of_sale", adminOnly: false },
  { href: "/produk", label: "Produk", icon: "inventory_2", adminOnly: true },
  { href: "/laporan", label: "Laporan", icon: "bar_chart", adminOnly: true },
  { href: "/pengaturan", label: "Pengaturan", icon: "settings", adminOnly: true },
  { href: "/pengguna", label: "Pengguna", icon: "group", adminOnly: true },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((d) => setRole(d.role)).catch(() => setRole(null));
  }, []);
  const isAdmin = role === "admin";
  const items = nav.filter((it) => !it.adminOnly || isAdmin);

  return (
    <div className="flex h-full w-64 flex-col bg-[var(--surface)] border-r border-[var(--line)] p-4">
      <div className="px-2 py-3">
        <div className="text-xl font-extrabold tracking-tight text-[var(--ink)]">POS</div>
        <div className="text-xs text-[var(--muted)]">{isAdmin ? "Admin" : "Kasir"}</div>
      </div>
      <Link
        href="/kasir"
        onClick={onNavigate}
        className="my-3 flex items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white elev-1 hover:bg-[var(--primary-container)]"
      >
        <Icon name="add" size={18} /> Transaksi Baru
      </Link>
      <nav className="flex flex-col gap-1">
        {items.map((it) => {
          const active = pathname === it.href || pathname?.startsWith(it.href + "/");
          return (
            <Link
              key={it.href}
              href={it.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                active ? "bg-[var(--surface-container)] text-[var(--primary)]" : "text-[var(--muted)] hover:bg-[var(--surface-container)]"
              }`}
            >
              <Icon name={it.icon} size={20} /> {it.label}
            </Link>
          );
        })}
      </nav>
      <form action="/api/logout" method="post" className="mt-auto">
        <button type="submit" className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-container)]">
          <Icon name="logout" size={20} /> Keluar
        </button>
      </form>
    </div>
  );
}

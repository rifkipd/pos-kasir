"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/kasir", label: "Kasir" },
  { href: "/produk", label: "Produk" },
  { href: "/laporan", label: "Laporan" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex items-center gap-1 px-6 py-3"
      style={{
        borderBottom: "1px solid var(--line)",
        background: "var(--surface)",
      }}
    >
      <span
        className="mr-6 text-lg font-semibold tracking-tight"
        style={{ color: "var(--ink)" }}
      >
        POS
      </span>
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className="rounded px-3 py-1.5 text-sm transition-colors"
            style={{
              borderRadius: "6px",
              color: isActive ? "var(--ink)" : "var(--muted)",
              background: isActive ? "var(--bg)" : "transparent",
              fontWeight: isActive ? 500 : 400,
            }}
          >
            {item.label}
          </Link>
        );
      })}
      <form action="/api/logout" method="post" className="ml-auto">
        <button
          type="submit"
          className="text-sm transition-colors hover:text-[var(--ink)] text-[var(--muted)]"
        >
          Keluar
        </button>
      </form>
    </nav>
  );
}

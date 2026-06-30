"use client";
import { Icon } from "./ui/Icon";

export function Topbar({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="flex items-center gap-3 border-b border-[var(--line)] bg-[var(--surface)] px-4 py-3 md:px-6">
      <button onClick={onMenu} className="md:hidden rounded-lg p-2 hover:bg-[var(--surface-container)]" aria-label="Menu">
        <Icon name="menu" />
      </button>
      <div className="ml-auto flex items-center gap-3 text-sm text-[var(--muted)]">
        <Icon name="account_circle" size={28} className="text-[var(--primary)]" />
        <span className="hidden sm:inline font-medium text-[var(--ink)]">Admin</span>
      </div>
    </header>
  );
}

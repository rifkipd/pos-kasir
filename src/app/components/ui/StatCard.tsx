import { Icon } from "./Icon";

export function StatCard({
  label,
  value,
  icon,
  sub,
}: {
  label: string;
  value: string;
  icon: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 elev-1">
      <div className="flex items-start justify-between">
        <div className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
          {label}
        </div>
        <span className="rounded-lg bg-[var(--surface-container)] p-1.5 text-[var(--primary)]">
          <Icon name={icon} size={18} />
        </span>
      </div>
      <div className="mt-3 text-2xl font-bold text-[var(--ink)]">{value}</div>
      {sub && <div className="mt-1 text-xs text-[var(--muted)]">{sub}</div>}
    </div>
  );
}

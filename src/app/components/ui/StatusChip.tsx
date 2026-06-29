import React from "react";

const styles: Record<string, string> = {
  success: "bg-emerald-50 text-emerald-700",
  info: "bg-indigo-50 text-indigo-700",
  warning: "bg-amber-50 text-amber-700",
  error: "bg-red-50 text-red-700",
};

export function StatusChip({
  variant = "info",
  children,
}: {
  variant?: keyof typeof styles;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[variant]}`}
    >
      {children}
    </span>
  );
}

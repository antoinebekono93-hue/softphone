import * as React from "react";
import type { LucideIcon } from "lucide-react";

export type StatAccent = "brand" | "success" | "danger" | "none";

export interface StatCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: LucideIcon;
  accent?: StatAccent;
  className?: string;
}

const accentText: Record<Exclude<StatAccent, "none">, string> = {
  brand: "text-[var(--brand)]",
  success: "text-[var(--success)]",
  danger: "text-[var(--danger)]",
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent = "none",
  className,
}: StatCardProps) {
  const accentCls = accent === "none" ? "" : accentText[accent];
  return (
    <div
      className={`rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-panel)] ${className || ""}`}
    >
      <div className="flex flex-row items-center justify-between space-y-0 pb-2 p-6">
        <h3 className="tracking-tight text-sm font-medium">{title}</h3>
        {Icon && <Icon className={`h-4 w-4 text-[var(--text-secondary)] ${accentCls}`} />}
      </div>
      <div className="p-6 pt-0">
        <div className={`text-2xl font-bold ${accentCls}`}>{value}</div>
        {subtitle && (
          <p className={`text-xs mt-1 ${accent !== "none" ? accentCls : "text-[var(--text-secondary)]"} opacity-90`}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
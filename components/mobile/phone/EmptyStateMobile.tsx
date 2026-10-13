"use client";

import type { LucideIcon } from "lucide-react";

/**
 * État vide premium, sobre et centré — remplace les anciens états vides
 * « encadrés » par une composition typographique type app native.
 */
export function EmptyStateMobile({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
      <span className="mb-5 grid h-20 w-20 place-items-center rounded-full bg-[var(--bg-surface-hover)] text-[var(--text-muted)]">
        <Icon className="h-9 w-9" strokeWidth={1.5} aria-hidden="true" />
      </span>
      <p className="text-[17px] font-semibold text-[var(--text-primary)]">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-[260px] text-[14px] leading-relaxed text-[var(--text-secondary)]">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

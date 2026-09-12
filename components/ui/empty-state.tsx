import * as React from "react";
import type { LucideIcon } from "lucide-react";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center px-6 py-12 text-center ${className || ""}`}
    >
      {Icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-surface-hover)]">
          <Icon className="h-6 w-6 text-[var(--text-secondary)]" />
        </div>
      )}
      <h3 className="mb-1 text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
      {description && (
        <p className="max-w-sm text-sm text-[var(--text-secondary)]">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
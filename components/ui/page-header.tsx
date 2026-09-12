import * as React from "react";

export interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div
      className={`mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className || ""}`}
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">{title}</h1>
        {description && <p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
import * as React from "react";

export interface TabItem {
  id: string;
  label: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  value: string;
  onValueChange: (id: string) => void;
  variant?: "underline" | "pills";
  className?: string;
  "aria-label"?: string;
}

export function Tabs({
  tabs,
  value,
  onValueChange,
  variant = "pills",
  className,
  ...props
}: TabsProps) {
  if (variant === "underline") {
    return (
      <div
        role="tablist"
        className={`flex items-center gap-1 border-b border-[var(--border-subtle)] ${className || ""}`}
        {...props}
      >
        {tabs.map((tab) => {
          const selected = tab.id === value;
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={selected}
              onClick={() => onValueChange(tab.id)}
              className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                selected
                  ? "border-[var(--accent-primary)] text-[var(--text-primary)]"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      role="tablist"
      className={`inline-flex items-center gap-1 rounded-full bg-[var(--bg-surface-hover)] p-1 ${className || ""}`}
      {...props}
    >
      {tabs.map((tab) => {
        const selected = tab.id === value;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={selected}
            onClick={() => onValueChange(tab.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              selected
                ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
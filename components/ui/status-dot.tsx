import * as React from "react";

export type StatusDotTone = "success" | "warning" | "danger" | "info" | "neutral";

export interface StatusDotProps {
  tone?: StatusDotTone;
  pulse?: boolean;
  className?: string;
}

const toneClass: Record<StatusDotTone, string> = {
  success: "bg-[var(--success)]",
  warning: "bg-[var(--warning)]",
  danger: "bg-[var(--danger)]",
  info: "bg-[var(--brand)]",
  neutral: "bg-[var(--text-muted)]",
};

export function StatusDot({ tone = "neutral", pulse = false, className }: StatusDotProps) {
  return (
    <span
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${toneClass[tone]} ${
        pulse ? "animate-signal-pulse" : ""
      } ${className || ""}`}
      aria-hidden="true"
    />
  );
}
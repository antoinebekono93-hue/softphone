import * as React from "react";

export type BadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "destructive"
  | "success"
  | "danger"
  | "info"
  | "neutral"
  | "warning";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

const variantClass: Record<BadgeVariant, string> = {
  default: "",
  secondary: "badge-glass-gray",
  neutral: "badge-glass-gray",
  success: "badge-glass-green",
  info: "badge-glass-blue",
  danger: "badge-glass-red",
  destructive: "badge-glass-red",
  outline: "bg-transparent border-[var(--border-subtle)] text-[var(--text-secondary)]",
  warning: "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400",
};

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={`inline-flex items-center rounded-full border border-[var(--border-subtle)] px-2.5 py-0.5 text-xs font-semibold transition-colors ${variantClass[variant]} ${className || ""}`}
      {...props}
    />
  )
);
Badge.displayName = "Badge";

export { Badge };
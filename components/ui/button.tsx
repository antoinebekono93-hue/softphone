import * as React from "react";

export type ButtonVariant =
  | "default"
  | "primary"
  | "gradient"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive"
  | "icon";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
}

const baseClass =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none";

const variantClass: Record<ButtonVariant, string> = {
  default: "bg-primary text-primary-foreground hover:opacity-90 shadow-sm active:scale-[0.98]",
  primary: "bg-primary text-primary-foreground hover:opacity-90 shadow-sm active:scale-[0.98]",
  gradient: "n8n-gradient-bg shadow-sm active:scale-[0.98]",
  secondary:
    "bg-secondary text-secondary-foreground border border-[var(--border-subtle)] hover:bg-[var(--bg-surface)]",
  outline:
    "border border-[var(--border-subtle)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]",
  ghost: "bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]",
  destructive: "bg-destructive text-white hover:opacity-90 active:scale-[0.98]",
  icon: "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-6 text-base",
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={`${baseClass} ${variantClass[variant]} ${sizeClass[size]} ${className || ""}`}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
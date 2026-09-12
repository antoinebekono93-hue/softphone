import { Loader2 } from "lucide-react";

export type SpinnerSize = "sm" | "md" | "lg";

const sizeClass: Record<SpinnerSize, string> = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-7 h-7",
};

export interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
}

export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <Loader2
      aria-label="Chargement"
      className={`animate-spin text-[var(--text-secondary)] ${sizeClass[size]} ${className || ""}`}
    />
  );
}
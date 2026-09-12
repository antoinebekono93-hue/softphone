import * as React from "react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-[var(--bg-surface-hover)] ${className || ""}`}
      {...props}
    />
  );
}
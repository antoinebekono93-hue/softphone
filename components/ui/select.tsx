import * as React from "react";

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={`flex h-10 w-full appearance-none rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 pr-8 text-sm text-[var(--text-primary)] shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none ${className || ""}`}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = "Select";

export { Select };
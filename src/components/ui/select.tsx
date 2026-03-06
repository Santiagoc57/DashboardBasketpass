import * as React from "react";

import { cn } from "@/lib/utils";

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-xl border border-[var(--border)] bg-[var(--background-soft)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:bg-[var(--surface)] focus:ring-4 focus:ring-[rgba(230,18,56,0.08)]",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

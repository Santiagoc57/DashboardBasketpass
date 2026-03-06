import { cn } from "@/lib/utils";

export function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--background-soft)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]",
        className,
      )}
    >
      {children}
    </span>
  );
}

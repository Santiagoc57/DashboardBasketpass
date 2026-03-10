import { cn } from "@/lib/utils";

export const badgeBaseClassName =
  "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em]";

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
        badgeBaseClassName,
        "border border-[var(--border)] bg-[var(--background-soft)] text-[var(--muted)]",
        className,
      )}
    >
      {children}
    </span>
  );
}

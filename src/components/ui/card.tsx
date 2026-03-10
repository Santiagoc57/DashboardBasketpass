import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "panel-surface border border-[var(--border)] bg-[var(--surface)] p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

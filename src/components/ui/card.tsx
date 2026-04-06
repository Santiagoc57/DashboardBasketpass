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
        "panel-surface border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5 2xl:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

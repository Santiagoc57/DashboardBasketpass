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
        "rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_6px_18px_rgba(28,13,16,0.04)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

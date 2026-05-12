import { cn } from "@/lib/utils";

export function BasketMark({
  className,
  iconClassName,
}: {
  className?: string;
  iconClassName?: string;
}) {
  return (
    <div
      className={cn(
        "flex size-10 items-center justify-center rounded-2xl bg-[var(--accent)] text-white shadow-[0_12px_28px_rgba(230,18,56,0.22)]",
        className,
      )}
    >
      <svg
        viewBox="0 0 32 32"
        aria-hidden="true"
        className={cn("size-5", iconClassName)}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      >
        <circle cx="16" cy="16" r="11.5" />
        <path d="M16 4.5v23" />
        <path d="M5.5 16h21" />
        <path d="M9.5 7.5c2.6 2.2 4 5.1 4 8.5s-1.4 6.3-4 8.5" />
        <path d="M22.5 7.5c-2.6 2.2-4 5.1-4 8.5s1.4 6.3 4 8.5" />
      </svg>
    </div>
  );
}

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function SectionTableCard({
  title,
  icon: Icon,
  badge,
  footer,
  children,
  className,
  headerClassName,
  footerClassName,
  titleClassName,
  iconClassName,
}: {
  title: string;
  icon?: LucideIcon;
  badge?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  footerClassName?: string;
  titleClassName?: string;
  iconClassName?: string;
}) {
  return (
    <section
      className={cn(
        "panel-surface overflow-hidden border border-[var(--border)] bg-[var(--surface)]",
        className,
      )}
    >
      <div
        className={cn(
          "flex flex-wrap items-start justify-between gap-3 border-b border-[#edf1f6] px-5 py-5 sm:items-center xl:px-6 2xl:flex-nowrap 2xl:px-8",
          headerClassName,
        )}
      >
        <h3
          className={cn(
            "flex min-w-0 items-center gap-2 text-lg font-bold text-[var(--foreground)] xl:text-xl",
            titleClassName,
          )}
        >
          {Icon ? <Icon className={cn("size-5 text-[var(--accent)]", iconClassName)} /> : null}
          {title}
        </h3>
        {badge ? badge : null}
      </div>
      {children}
      {footer ? (
        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-4 bg-[#fafbfd] px-5 py-4 xl:px-6 2xl:px-8",
            footerClassName,
          )}
        >
          {footer}
        </div>
      ) : null}
    </section>
  );
}

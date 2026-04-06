import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function SectionPageHeader({
  title,
  description,
  actions,
  className,
  contentClassName,
  descriptionClassName,
  actionsClassName,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
  contentClassName?: string;
  descriptionClassName?: string;
  actionsClassName?: string;
}) {
  return (
    <section
      className={cn(
        "flex min-w-0 flex-col gap-6 xl:flex-row xl:items-end xl:justify-between",
        className,
      )}
    >
      <div className={cn("min-w-0 max-w-3xl space-y-2", contentClassName)}>
        <h2 className="text-[1.95rem] font-black leading-[0.96] tracking-tight text-[var(--foreground)] sm:text-[2.35rem] 2xl:text-4xl">
          {title}
        </h2>
        {description ? (
          <p
            className={cn(
              "max-w-2xl text-sm font-medium text-[#617187]",
              descriptionClassName,
            )}
          >
            {description}
          </p>
        ) : null}
      </div>

      {actions ? (
        <div
          className={cn(
            "flex w-full flex-wrap items-stretch gap-3 xl:w-auto xl:items-center xl:justify-end",
            actionsClassName,
          )}
        >
          {actions}
        </div>
      ) : null}
    </section>
  );
}

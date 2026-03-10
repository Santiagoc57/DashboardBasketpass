import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function SectionPageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex flex-col gap-8 md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className="space-y-2">
        <h2 className="text-4xl font-black tracking-tight text-[var(--foreground)]">
          {title}
        </h2>
        {description ? (
          <p className="max-w-2xl text-sm font-medium text-[#617187]">
            {description}
          </p>
        ) : null}
      </div>

      {actions ? (
        <div className="flex flex-wrap items-center gap-3">{actions}</div>
      ) : null}
    </section>
  );
}

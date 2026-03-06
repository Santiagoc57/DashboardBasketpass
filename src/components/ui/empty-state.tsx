import { AlertCircle } from "lucide-react";

import { Card } from "@/components/ui/card";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="flex flex-col items-start gap-3 border-dashed">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-soft)] p-3 text-[var(--muted)]">
        <AlertCircle className="size-5" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-[var(--foreground)]">{title}</h3>
        <p className="mt-1 max-w-xl text-sm text-[var(--muted)]">{description}</p>
      </div>
    </Card>
  );
}

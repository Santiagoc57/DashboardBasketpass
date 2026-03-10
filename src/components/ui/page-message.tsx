import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";

export function PageMessage({
  intent,
  message,
}: {
  intent?: string | null;
  message?: string | null;
}) {
  if (!message) {
    return null;
  }

  const success = intent === "success";
  const Icon = success ? CheckCircle2 : AlertTriangle;

  return (
    <div
      className={cn(
        "panel-surface flex items-center gap-3 border px-4 py-3 text-sm",
        success
          ? "border-[#cce8db] bg-[#effaf4] text-[#17654d]"
          : "border-[#f2d8ae] bg-[#fff8ea] text-[#9a5a0f]",
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

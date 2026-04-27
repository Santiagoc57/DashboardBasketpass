"use client";

import { cn } from "@/lib/utils";

function getInitials(value: string) {
  return (
    value
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "BP"
  );
}

export function PersonRoleStack({
  label,
  value,
  initials,
  muted = false,
  size = "sm",
  tone = "neutral",
  className,
  labelClassName,
  valueClassName,
}: {
  label: string;
  value: string;
  initials?: string;
  muted?: boolean;
  size?: "xs" | "sm" | "md";
  tone?: "mint" | "neutral";
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
}) {
  const isExtraSmall = size === "xs";
  const isSmall = size === "sm";
  const toneClassName =
    tone === "neutral"
      ? "border-[var(--border)] bg-[#eef2f6] text-[#64748b]"
      : "border-[#cde8d6] bg-[#edf9f1] text-[#3c8a5f]";

  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full border font-black shadow-sm",
          toneClassName,
          isExtraSmall ? "size-8 text-[10px]" : isSmall ? "size-9 text-[11px]" : "size-10 text-xs",
        )}
      >
        {initials ?? getInitials(value)}
      </span>
      <div className="min-w-0">
        <p
          className={cn(
            "font-black uppercase tracking-[0.18em] text-[#8ea0bb]",
            isExtraSmall ? "text-[8.5px]" : isSmall ? "text-[9px]" : "text-[10px]",
            labelClassName,
          )}
        >
          {label}
        </p>
        <p
          className={cn(
            "mt-1 truncate leading-tight text-[var(--foreground)]",
            isExtraSmall ? "text-[12px] font-black" : isSmall ? "text-[13px] font-black" : "text-sm font-black",
            muted && "font-semibold italic text-[var(--muted)]",
            valueClassName,
          )}
          title={value}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

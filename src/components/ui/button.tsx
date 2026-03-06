import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-[var(--accent)] text-white shadow-[0_10px_24px_rgba(230,18,56,0.18)] hover:bg-[var(--accent-strong)]",
  secondary:
    "border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--background-soft)]",
  ghost:
    "border border-transparent bg-transparent text-[var(--muted)] hover:bg-[var(--background-soft)] hover:text-[var(--foreground)]",
  danger:
    "border border-[#f0c8d1] bg-[#fff4f6] text-[#ad1d39] hover:bg-[#ffe9ee]",
};

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

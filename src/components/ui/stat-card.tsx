import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: "neutral" | "accent" | "danger" | "info";
}) {
  const toneClassName =
    tone === "accent"
      ? "border-[#d9efe3] bg-[#f4fbf7] text-[#177245]"
      : tone === "danger"
        ? "border-[#f1d3da] bg-[#fff5f7] text-[#b42343]"
        : tone === "info"
          ? "border-[#dbe6f6] bg-[#f7faff] text-[#315e9d]"
          : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]";

  const iconToneClassName =
    tone === "accent"
      ? "bg-[#e6f6ed] text-[#179a56]"
      : tone === "danger"
        ? "bg-[#fff0f3] text-[var(--accent)]"
        : tone === "info"
          ? "bg-[#eef4ff] text-[#315e9d]"
          : "bg-[var(--background-soft)] text-[#6b7a90]";

  return (
    <div className={`rounded-[var(--panel-radius)] border px-4 py-4 xl:px-5 ${toneClassName}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#95a3ba]">
            {label}
          </p>
          <p className="mt-3 text-[1.75rem] font-black leading-none sm:text-[1.9rem] 2xl:text-[2rem]">
            {value}
          </p>
        </div>
        <span
          className={`inline-flex size-10 items-center justify-center rounded-2xl 2xl:size-11 ${iconToneClassName}`}
        >
          <Icon className="size-5" />
        </span>
      </div>
    </div>
  );
}

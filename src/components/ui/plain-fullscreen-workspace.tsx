"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Maximize2, X } from "lucide-react";

type PlainFullscreenWorkspaceProps = {
  title: string;
  eyebrow: string;
  periodLabel: string;
  countLabel: string;
  disabled?: boolean;
  children: React.ReactNode;
};

export function PlainFullscreenWorkspace({
  title,
  eyebrow,
  periodLabel,
  countLabel,
  disabled,
  children,
}: PlainFullscreenWorkspaceProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="panel-surface inline-flex size-[52px] items-center justify-center rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--surface)] text-[#607089] transition hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={`Abrir ${title}`}
        title={`Abrir ${title}`}
      >
        <Maximize2 className="size-5" />
      </button>

      {open && typeof document !== "undefined" ? createPortal(
        <div className="fixed inset-0 z-[80] flex flex-col bg-[#f8fafc] text-[#1f2937]">
          <div className="flex min-h-[4.25rem] items-center justify-between border-b border-[#d8dee8] bg-white px-5">
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#94a3b8]">
                {eyebrow}
              </p>
              <h2 className="truncate text-xl font-black tracking-[-0.03em] text-[#14161b]">
                {title}
              </h2>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="hidden rounded-full border border-[#d8e0eb] bg-[#f8fafc] px-3 py-1.5 text-xs font-bold text-[#64748b] sm:inline-flex">
                {periodLabel} · {countLabel}
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex size-10 items-center justify-center rounded-[var(--panel-radius)] border border-[#d8e0eb] bg-white text-[#64748b] hover:border-[#f3b5c2] hover:text-[var(--accent)]"
                aria-label={`Cerrar ${title}`}
                title={`Cerrar ${title}`}
              >
                <X className="size-5" />
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1 p-3">{children}</div>
        </div>,
        document.body,
      ) : null}
    </>
  );
}

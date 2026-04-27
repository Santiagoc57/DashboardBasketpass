"use client";

import { Eye, X } from "lucide-react";
import { createPortal } from "react-dom";
import type { MouseEvent } from "react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PreviewState = {
  body: string;
  dismissLabel: string;
  title: string;
};

function readFormValue(form: HTMLFormElement | null, name: string) {
  if (!form) {
    return "";
  }

  const field = form.elements.namedItem(name);

  if (!field) {
    return "";
  }

  if (field instanceof RadioNodeList) {
    return field.value;
  }

  if ("value" in field && typeof field.value === "string") {
    return field.value;
  }

  return "";
}

export function AnnouncementPreviewButton({
  titleFieldName = "announcementTitle",
  bodyFieldName = "announcementBody",
  dismissFieldName = "announcementDismissLabel",
}: {
  titleFieldName?: string;
  bodyFieldName?: string;
  dismissFieldName?: string;
}) {
  const [preview, setPreview] = useState<PreviewState | null>(null);

  const portalTarget = typeof document !== "undefined" ? document.body : null;

  useEffect(() => {
    if (!preview) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPreview(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [preview]);

  const openPreview = (event: MouseEvent<HTMLButtonElement>) => {
    const form = event.currentTarget.closest("form");

    setPreview({
      title:
        readFormValue(form, titleFieldName).trim() ||
        "Comunicado general",
      body:
        readFormValue(form, bodyFieldName).trim() ||
        "Escribe aquí el comunicado que verán todos al iniciar sesión.",
      dismissLabel:
        readFormValue(form, dismissFieldName).trim() || "Entendido",
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        onClick={openPreview}
        className="h-10 rounded-xl px-3 text-xs font-bold"
      >
        <Eye className="mr-2 size-4" />
        Vista previa
      </Button>

      {portalTarget && preview
        ? createPortal(
            <div
              className="fixed inset-0 z-[220] flex items-start justify-center overflow-y-auto bg-[#101828]/60 p-4 backdrop-blur-sm sm:items-center"
              onClick={() => setPreview(null)}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="announcement-preview-title"
                className={cn(
                  "relative my-auto flex w-full max-w-xl flex-col overflow-hidden rounded-[1.6rem] border border-[var(--border)] bg-[var(--surface)] shadow-[0_24px_64px_rgba(15,23,42,0.22)]",
                )}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-5 py-4">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--accent)]">
                      Vista previa
                    </p>
                    <h3
                      id="announcement-preview-title"
                      className="mt-2 text-xl font-extrabold text-[var(--foreground)]"
                    >
                      {preview.title}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPreview(null)}
                    className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--background-soft)] text-[#94a3b8] transition hover:bg-[#eef2f6] hover:text-[#52627a]"
                    aria-label="Cerrar vista previa"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <div className="space-y-5 px-5 py-5">
                  <div className="rounded-[1.4rem] border border-[var(--border)] bg-[var(--background-soft)] p-5">
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--accent)]">
                      PERSONAL
                    </p>
                    <p className="mt-3 text-sm leading-7 text-[#334155]">
                      {preview.body}
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={() => setPreview(null)}
                      className="rounded-xl px-5 py-2.5"
                    >
                      {preview.dismissLabel}
                    </Button>
                  </div>
                </div>
              </div>
            </div>,
            portalTarget,
          )
        : null}
    </>
  );
}

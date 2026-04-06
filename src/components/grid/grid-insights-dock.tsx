"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { PanelRightClose, PanelRightOpen, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function GridInsightsDock({
  children,
}: {
  children: ReactNode;
}) {
  const [isXlOnlyViewport, setIsXlOnlyViewport] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Always enter Production with the dock collapsed; opening it is a user action.
    const resetFrame = window.requestAnimationFrame(() => {
      setIsOpen(false);
    });

    const mediaQuery = window.matchMedia(
      "(min-width: 1280px) and (max-width: 1535px)",
    );

    const syncViewport = () => {
      const matches = mediaQuery.matches;
      setIsXlOnlyViewport(matches);

      if (!matches) {
        setIsOpen(false);
        return;
      }
    };

    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);

    return () => {
      window.cancelAnimationFrame(resetFrame);
      mediaQuery.removeEventListener("change", syncViewport);
    };
  }, []);

  if (!isXlOnlyViewport) {
    return null;
  }

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-30 hidden bg-[rgba(7,18,43,0.14)] backdrop-blur-[1px] xl:block 2xl:hidden transition",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {!isOpen ? (
        <div className="fixed right-5 top-24 z-40 hidden xl:flex 2xl:hidden">
          <Button
            variant="secondary"
            onClick={() => setIsOpen(true)}
            className="gap-2 rounded-full border-[#d7dde7] bg-[rgba(255,255,255,0.94)] px-4 py-3 shadow-[0_18px_36px_rgba(15,23,42,0.12)] backdrop-blur-md"
          >
            <PanelRightOpen className="size-4" />
            Resumen
          </Button>
        </div>
      ) : null}

      <div
        className={cn(
          "fixed right-4 top-24 bottom-4 z-40 hidden w-[20.5rem] max-w-[calc(100vw-2rem)] xl:block 2xl:hidden transition duration-200",
          isOpen
            ? "translate-x-0 opacity-100"
            : "pointer-events-none translate-x-[calc(100%+1rem)] opacity-0",
        )}
      >
        <div className="relative h-full overflow-y-auto">
          <Button
            variant="secondary"
            onClick={() => setIsOpen(false)}
            className="absolute top-3 right-3 z-10 size-10 rounded-full border-[#d7dde7] bg-[rgba(255,255,255,0.92)] px-0 shadow-sm"
            aria-label="Cerrar resumen"
          >
            <X className="size-4" />
          </Button>
          <div className="pr-1">{children}</div>
        </div>
      </div>

      {isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label="Contraer resumen"
          className="fixed top-1/2 right-[20.75rem] z-40 hidden -translate-y-1/2 rounded-l-2xl border border-r-0 border-[#d7dde7] bg-[rgba(255,255,255,0.94)] px-2 py-4 text-[#617187] shadow-[0_14px_28px_rgba(15,23,42,0.12)] backdrop-blur-md transition hover:text-[var(--accent)] xl:flex 2xl:hidden"
        >
          <PanelRightClose className="size-4" />
        </button>
      ) : null}
    </>
  );
}

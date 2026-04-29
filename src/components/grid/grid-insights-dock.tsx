"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { PanelRightClose, PanelRightOpen, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type GridInsightsDockContextValue = {
  isOpen: boolean;
  isXlOnlyViewport: boolean;
  close: () => void;
  toggle: () => void;
};

const GridInsightsDockContext =
  createContext<GridInsightsDockContextValue | null>(null);

export function useGridInsightsDock() {
  const context = useContext(GridInsightsDockContext);

  if (!context) {
    throw new Error("GridInsightsDock must be used within its provider.");
  }

  return context;
}

export function GridInsightsDockProvider({
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

  const value = {
    isOpen,
    isXlOnlyViewport,
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((current) => !current),
  };

  return (
    <GridInsightsDockContext.Provider value={value}>
      {children}
    </GridInsightsDockContext.Provider>
  );
}

export function GridInsightsDockTrigger() {
  const { isOpen, toggle, isXlOnlyViewport } = useGridInsightsDock();
  const label = isOpen ? "Cerrar resumen de producción" : "Abrir resumen de producción";

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={toggle}
      aria-expanded={isOpen}
      aria-label={label}
      aria-pressed={isOpen}
      className={cn(
        "hidden h-[52px] shrink-0 gap-2 rounded-full border-transparent bg-[#7f8a9d] px-4 text-white shadow-none backdrop-blur-md transition hover:bg-[#717d91] xl:inline-flex 2xl:hidden",
        isXlOnlyViewport && isOpen && "bg-[#616d80]",
      )}
    >
      <PanelRightOpen className="size-4 text-white" />
      Resumen
    </Button>
  );
}

export function GridInsightsDock({
  children,
}: {
  children: ReactNode;
}) {
  const { isOpen, isXlOnlyViewport, close } = useGridInsightsDock();

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
        onClick={close}
        aria-hidden="true"
      />

      <div
        className={cn(
          "fixed right-2 top-3 bottom-3 z-40 hidden w-[20.5rem] max-w-[calc(100vw-1rem)] xl:block 2xl:hidden transition duration-200",
          isOpen
            ? "translate-x-0 opacity-100"
            : "pointer-events-none translate-x-[calc(100%+1rem)] opacity-0",
        )}
      >
        <div className="relative h-full overflow-hidden">
          <Button
            variant="secondary"
            onClick={close}
            className="absolute top-3 right-3 z-20 size-10 rounded-full border-[#d7dde7] bg-[rgba(255,255,255,0.92)] px-0 shadow-sm"
            aria-label="Cerrar resumen"
          >
            <X className="size-4" />
          </Button>
          <div className="h-full">{children}</div>
        </div>
      </div>

      {isOpen ? (
        <button
          type="button"
          onClick={close}
          aria-label="Contraer resumen"
          className="fixed top-1/2 right-[20.75rem] z-40 hidden -translate-y-1/2 rounded-l-2xl border border-r-0 border-[#d7dde7] bg-[rgba(255,255,255,0.94)] px-2 py-4 text-[#617187] shadow-[0_14px_28px_rgba(15,23,42,0.12)] backdrop-blur-md transition hover:text-[var(--accent)] xl:flex 2xl:hidden"
        >
          <PanelRightClose className="size-4" />
        </button>
      ) : null}
    </>
  );
}

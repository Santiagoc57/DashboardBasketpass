"use client";

import { useEffect } from "react";

export function PageCanvasTone({
  tone,
}: {
  tone?: string | null;
}) {
  useEffect(() => {
    const root = document.documentElement;

    if (tone) {
      root.style.setProperty("--page-canvas", tone);
      root.style.setProperty("--page-footer-bg", tone);
    } else {
      root.style.removeProperty("--page-canvas");
      root.style.removeProperty("--page-footer-bg");
    }

    return () => {
      root.style.removeProperty("--page-canvas");
      root.style.removeProperty("--page-footer-bg");
    };
  }, [tone]);

  return null;
}

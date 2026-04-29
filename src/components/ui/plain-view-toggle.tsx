"use client";

import type React from "react";
import { useSyncExternalStore } from "react";

import { SegmentedControl } from "@/components/ui/segmented-control";

type PlainViewMode = "visual" | "plain";

export function PlainViewToggle({
  storageKey,
  visual,
  plain,
  className,
}: {
  storageKey: string;
  visual: React.ReactNode;
  plain: React.ReactNode;
  className?: string;
}) {
  const mode = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("storage", onStoreChange);
      window.addEventListener(`${storageKey}:change`, onStoreChange);

      return () => {
        window.removeEventListener("storage", onStoreChange);
        window.removeEventListener(`${storageKey}:change`, onStoreChange);
      };
    },
    () => getStoredMode(storageKey),
    () => "visual",
  );

  function updateMode(nextMode: PlainViewMode) {
    window.localStorage.setItem(storageKey, nextMode);
    window.dispatchEvent(new Event(`${storageKey}:change`));
  }

  return (
    <div className={className}>
      <div className="mb-4 flex justify-end">
        <SegmentedControl
          size="sm"
          items={[
            {
              key: "visual",
              label: "Visual",
              active: mode === "visual",
              onClick: () => updateMode("visual"),
            },
            {
              key: "plain",
              label: "Plano",
              active: mode === "plain",
              onClick: () => updateMode("plain"),
            },
          ]}
        />
      </div>
      {mode === "plain" ? plain : visual}
    </div>
  );
}

function getStoredMode(storageKey: string): PlainViewMode {
    if (typeof window === "undefined") {
      return "visual";
    }

    const storedMode = window.localStorage.getItem(storageKey);
    return storedMode === "plain" || storedMode === "visual"
      ? storedMode
      : "visual";
}

"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

export function CopyButton({
  value,
  label = "Copiar",
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();

  return (
    <Button
      variant="secondary"
      onClick={() => {
        startTransition(async () => {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        });
      }}
    >
      {copied ? "Copiado" : label}
    </Button>
  );
}

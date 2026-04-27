"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function BackButton({ ariaLabel }: { ariaLabel?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border-0 bg-white/20 text-white transition hover:bg-white/30"
      onClick={() => router.back()}
      aria-label={ariaLabel ?? "Volver"}
    >
      <ArrowLeft className="size-4.5" />
    </button>
  );
}

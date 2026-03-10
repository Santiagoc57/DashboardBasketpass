"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Gauge,
  ShieldAlert,
} from "lucide-react";

import { badgeBaseClassName } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function getSeverityStyle(severity: string) {
  switch (severity) {
    case "Crítica":
      return {
        className: "bg-[#fbf2ff] text-[#a12ad6]",
        icon: ShieldAlert,
      };
    case "Alta":
      return {
        className: "bg-[#fff1f3] text-[#cf2246]",
        icon: AlertTriangle,
      };
    case "Media":
      return {
        className: "bg-[#fff8db] text-[#b78611]",
        icon: Gauge,
      };
    case "Baja":
      return {
        className: "bg-[#f1f5f9] text-[#70819b]",
        icon: Circle,
      };
    default:
      return {
        className: "bg-[#eefbf2] text-[#1b7d43]",
        icon: CheckCircle2,
      };
  }
}

export function SeverityBadge({
  severity,
  className,
}: {
  severity: string;
  className?: string;
}) {
  const { className: toneClassName, icon: Icon } = getSeverityStyle(severity);

  return (
    <span
      className={cn(
        badgeBaseClassName,
        "gap-1.5",
        toneClassName,
        className,
      )}
    >
      <Icon className="size-3.5" />
      {severity}
    </span>
  );
}

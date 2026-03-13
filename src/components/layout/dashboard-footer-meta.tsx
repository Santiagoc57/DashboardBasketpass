"use client";

import { useEffect, useMemo, useState } from "react";

function formatDateTimeParts(date: Date) {
  const dateLabel = new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);

  const timeLabel = new Intl.DateTimeFormat("es-CO", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

  return { dateLabel, timeLabel };
}

export function DashboardFooterMeta({ userName }: { userName: string }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 30_000);

    return () => window.clearInterval(intervalId);
  }, []);

  const { dateLabel, timeLabel } = useMemo(() => formatDateTimeParts(now), [now]);

  return (
    <div className="flex flex-col items-center justify-center gap-1 text-center">
      <p className="text-sm font-black tracking-tight text-[var(--foreground)]">
        {userName}
      </p>
      <p className="text-xs font-medium text-[#7b8aa1]">
        {dateLabel} · {timeLabel}
      </p>
    </div>
  );
}

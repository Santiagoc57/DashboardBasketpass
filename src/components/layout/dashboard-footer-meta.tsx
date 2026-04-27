"use client";

export function DashboardFooterMeta({ userName }: { userName: string }) {
  return (
    <div className="flex items-center justify-center text-center">
      <p className="text-sm font-black tracking-tight text-[var(--foreground)]">
        {userName}
      </p>
    </div>
  );
}

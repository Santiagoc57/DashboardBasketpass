import { LogOut } from "lucide-react";

import { signOutAction } from "@/app/actions/auth";
import { DashboardFooterMeta } from "@/components/layout/dashboard-footer-meta";
import { DashboardNav } from "@/components/layout/dashboard-nav";
import { UserProfileChip } from "@/components/layout/user-profile-chip";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  APP_NAME,
  APP_PORTAL_LABEL,
} from "@/lib/constants";
import { PRODUCT_COPY } from "@/lib/copy";
import type { AnnouncementSummary } from "@/lib/data/announcements";
import { getAppRoleDisplayName } from "@/lib/display";
import type { UserContext } from "@/lib/types";

function BasketMark() {
  return (
    <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--accent)] text-white shadow-[0_12px_28px_rgba(230,18,56,0.22)]">
      <svg
        viewBox="0 0 32 32"
        aria-hidden="true"
        className="size-6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      >
        <circle cx="16" cy="16" r="11.5" />
        <path d="M16 4.5v23" />
        <path d="M5.5 16h21" />
        <path d="M9.5 7.5c2.6 2.2 4 5.1 4 8.5s-1.4 6.3-4 8.5" />
        <path d="M22.5 7.5c-2.6 2.2-4 5.1-4 8.5s1.4 6.3 4 8.5" />
      </svg>
    </div>
  );
}

function getInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2) || "U";
}

export function DashboardShell(props: {
  children: React.ReactNode;
  user: UserContext | null;
  announcement: AnnouncementSummary | null;
}) {
  const { children, user } = props;
  const displayName =
    user?.profile?.full_name?.trim() ||
    user?.email?.split("@")[0] ||
    "Usuario";
  const roleLabel = getAppRoleDisplayName(user?.role).toUpperCase();

  return (
    <div className="min-h-screen bg-[var(--page-canvas)]">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-[var(--dashboard-sidebar-width)] shrink-0 flex-col overflow-y-auto border-r border-[#10203f] bg-[#07122b] lg:flex">
          <div className="border-b border-[#10203f] px-4 py-6 xl:px-5 xl:py-7 2xl:px-6">
            <div className="flex items-center justify-center gap-3 xl:justify-start 2xl:gap-4">
              <BasketMark />
              <div className="hidden min-w-0 xl:block">
                <p className="text-[1.2rem] font-extrabold leading-[0.92] tracking-[-0.04em] text-white 2xl:text-[1.5rem]">
                  {PRODUCT_COPY.collaboratorWordmark.line1}
                </p>
                <p className="mt-1 text-[1.2rem] font-extrabold leading-[0.92] tracking-[-0.04em] text-white 2xl:text-[1.5rem]">
                  {PRODUCT_COPY.collaboratorWordmark.line2}
                </p>
                {APP_PORTAL_LABEL ? (
                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#9eb0cc] 2xl:text-[11px] 2xl:tracking-[0.28em]">
                    {APP_PORTAL_LABEL}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-1 flex-col justify-between px-3 py-5 xl:px-4 xl:py-6 2xl:px-5">
            <DashboardNav role={user?.role ?? null} />

            {user?.userId ? (
              <div className="mt-6 flex flex-col items-center gap-3 rounded-[var(--panel-radius)] border border-[#10203f] bg-[#0d1731] px-2.5 py-3 text-center xl:flex-row xl:items-center xl:text-left 2xl:px-4">
                <div
                  title={displayName}
                  className="flex min-w-0 flex-col items-center gap-2 xl:flex-1 xl:flex-row xl:gap-3"
                >
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-full border border-[#203053] bg-[#d8e3e2] text-[#324b53]">
                    <span className="text-sm font-extrabold">
                      {getInitials(displayName)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#9eb0cc] xl:truncate xl:text-[10px] xl:tracking-[0.18em]">
                      {roleLabel}
                    </p>
                  </div>
                </div>

                <form action={signOutAction} className="shrink-0">
                  <SubmitButton
                    variant="ghost"
                    pendingLabel="..."
                    title="Cerrar sesión"
                    aria-label="Cerrar sesión"
                    className="size-10 rounded-[var(--panel-radius)] border border-[#203053] bg-[#07122b] px-0 text-[#d8e2f2] hover:bg-[#132347] hover:text-white"
                  >
                    <LogOut className="size-4" />
                  </SubmitButton>
                </form>
              </div>
            ) : null}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[rgba(255,255,255,0.88)] backdrop-blur-md lg:hidden">
            <div className="flex h-[4.5rem] items-center gap-3 pr-[var(--dashboard-shell-padding)] pl-[calc(var(--dashboard-shell-padding)+var(--dashboard-content-leading-space))] xl:h-[4.75rem] 2xl:h-20">
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div className="flex items-center gap-3 lg:hidden">
                  <BasketMark />
                  <p className="text-sm font-extrabold tracking-[-0.03em] text-[var(--foreground)]">
                    {APP_NAME}
                  </p>
                </div>
              </div>

              <div className="ml-auto flex items-center gap-4 sm:gap-5">
                <UserProfileChip
                  userId={user?.userId ?? null}
                  fullName={displayName}
                  email={user?.email ?? null}
                  roleLabel={roleLabel}
                  role={user?.role ?? null}
                  mobileMenu
                  className="sm:hidden"
                />
                <UserProfileChip
                  userId={user?.userId ?? null}
                  fullName={displayName}
                  email={user?.email ?? null}
                  roleLabel={roleLabel}
                  role={user?.role ?? null}
                  className="hidden sm:flex"
                />
                {user?.userId ? (
                  <form action={signOutAction} className="hidden sm:block">
                    <SubmitButton
                      variant="ghost"
                      pendingLabel="Saliendo..."
                      className="size-11 rounded-2xl px-0"
                    >
                      <LogOut className="size-4" />
                    </SubmitButton>
                  </form>
                ) : null}
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 bg-[var(--page-canvas)] pr-[var(--dashboard-shell-padding)] pl-[calc(var(--dashboard-shell-padding)+var(--dashboard-content-leading-space))] py-4 sm:py-5">
            {children}
          </main>

          <footer className="border-t border-[var(--border)] bg-[var(--page-footer-bg)] pr-[var(--dashboard-shell-padding)] pl-[calc(var(--dashboard-shell-padding)+var(--dashboard-content-leading-space))] py-3 backdrop-blur-sm sm:py-3.5">
            <DashboardFooterMeta userName={displayName} />
          </footer>
        </div>
      </div>
    </div>
  );
}

import {
  Bell,
  Headset,
  LogOut,
  Search,
  Settings,
  Waves,
} from "lucide-react";

import { signOutAction } from "@/app/actions/auth";
import { DashboardNav } from "@/components/layout/dashboard-nav";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { APP_NAME } from "@/lib/constants";
import type { UserContext } from "@/lib/types";

export function DashboardShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: UserContext | null;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[rgba(255,255,255,0.96)] backdrop-blur">
        <div className="flex flex-wrap items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="flex size-8 items-center justify-center text-[var(--accent)]">
              <Waves className="size-5" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-[var(--foreground)]">
              {APP_NAME}
            </h1>
          </div>

          <div className="hidden min-w-[280px] max-w-xl flex-1 md:block">
            <label className="flex h-11 items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--background-soft)] px-4">
              <Search className="size-4 text-[var(--muted)]" />
              <input
                aria-label="Buscar"
                placeholder="Buscar partidos, personas o ligas..."
                className="w-full bg-transparent text-sm font-medium text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
              />
            </label>
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <button className="flex size-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--background-soft)] text-[var(--muted)] transition hover:bg-[#ece7e8] hover:text-[var(--foreground)]">
              <Bell className="size-4" />
            </button>
            <button className="hidden size-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--background-soft)] text-[var(--muted)] transition hover:bg-[#ece7e8] hover:text-[var(--foreground)] sm:flex">
              <Settings className="size-4" />
            </button>
            <div className="hidden h-8 w-px bg-[var(--border)] sm:block" />
            <div className="hidden text-right sm:block">
              <p className="text-sm font-extrabold text-[var(--foreground)]">
                {user?.profile?.full_name ?? user?.email ?? "Usuario"}
              </p>
              <p className="text-xs font-medium text-[var(--muted)]">
                {user?.role ?? "viewer"}
              </p>
            </div>
            {user?.profile?.full_name ? (
              <Badge className="border-[#cde8d9] bg-[#f2fbf6] text-[#2ea866]">
                {user.role}
              </Badge>
            ) : null}
            {user?.userId ? (
              <form action={signOutAction}>
                <SubmitButton
                  variant="secondary"
                  pendingLabel="Saliendo..."
                  className="gap-2"
                >
                  <LogOut className="size-4" />
                  Salir
                </SubmitButton>
              </form>
            ) : null}
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-76px)] flex-1">
        <aside className="hidden w-64 shrink-0 flex-col justify-between border-r border-[var(--border)] bg-[var(--surface)] px-4 py-6 lg:flex">
          <DashboardNav />
          <div className="rounded-[18px] border border-[var(--border)] bg-[var(--background-soft)] p-4">
            <div className="mb-3 flex size-10 items-center justify-center rounded-2xl bg-[var(--surface)] text-[var(--accent)]">
              <Headset className="size-4" />
            </div>
            <p className="text-sm font-extrabold text-[var(--foreground)]">
              Soporte técnico
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Si la operación cambia sobre la marcha, deja este bloque como punto
              de ayuda rápida.
            </p>
            <button className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-[var(--accent-soft)] px-4 py-2.5 text-sm font-bold text-[var(--accent)] transition hover:bg-[#ffe7ec]">
              Contactar
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 bg-[var(--background)] px-4 py-5 sm:px-6 lg:px-8">
          <div className="mb-4 lg:hidden">
            <DashboardNav mobile />
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}

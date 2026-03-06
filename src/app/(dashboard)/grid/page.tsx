import Link from "next/link";
import { format, parse } from "date-fns";
import { es } from "date-fns/locale";
import { Plus } from "lucide-react";

import { CreateMatchForm } from "@/components/grid/create-match-form";
import { MatchCard } from "@/components/grid/match-card";
import { SetupPanel } from "@/components/layout/setup-panel";
import { EmptyState } from "@/components/ui/empty-state";
import { PageMessage } from "@/components/ui/page-message";
import { formatMatchDate, getDateInputValue, getMonthInputValue } from "@/lib/date";
import { getGridData } from "@/lib/data/dashboard";
import { requireUserContext } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { parseGridSearchParams, parseNotice } from "@/lib/search-params";
import { cn } from "@/lib/utils";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function serializeSearchParams(params: Record<string, string | string[] | undefined>) {
  const search = new URLSearchParams();

  for (const [key, rawValue] of Object.entries(params)) {
    if (typeof rawValue === "string" && rawValue) {
      search.set(key, rawValue);
    }
  }

  const query = search.toString();
  return query ? `/grid?${query}` : "/grid";
}

function buildGridHref(
  params: Record<string, string | string[] | undefined>,
  updates: Record<string, string | undefined>,
) {
  const search = new URLSearchParams();

  for (const [key, rawValue] of Object.entries(params)) {
    if (typeof rawValue === "string" && rawValue) {
      search.set(key, rawValue);
    }
  }

  for (const [key, value] of Object.entries(updates)) {
    if (!value) {
      search.delete(key);
      continue;
    }

    search.set(key, value);
  }

  search.delete("intent");
  search.delete("notice");

  const query = search.toString();
  return query ? `/grid?${query}` : "/grid";
}

function getGridTitleDate(filters: {
  view: "day" | "month";
  date: string;
}) {
  if (filters.view === "month") {
    return format(
      parse(`${filters.date}-01`, "yyyy-MM-dd", new Date()),
      "MMMM yyyy",
      { locale: es },
    );
  }

  return format(
    parse(filters.date, "yyyy-MM-dd", new Date()),
    "EEEE, d 'de' MMMM yyyy",
    { locale: es },
  );
}

export default async function GridPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const { intent, notice } = parseNotice(resolvedSearchParams);

  if (!isSupabaseConfigured) {
    return <SetupPanel />;
  }

  const user = await requireUserContext();
  const filters = parseGridSearchParams(resolvedSearchParams);
  const { dayGroups, owners } = await getGridData(filters);
  const redirectTo = serializeSearchParams(resolvedSearchParams);
  const titleDate = getGridTitleDate(filters);
  const todayHref = buildGridHref(resolvedSearchParams, {
    view: "day",
    date: getDateInputValue(),
  });
  const monthHref = buildGridHref(resolvedSearchParams, {
    view: "month",
    date: getMonthInputValue(),
  });

  return (
    <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_23rem]">
      <div className="min-w-0 space-y-6">
        <section className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)]">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] px-6 py-6">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-[var(--foreground)]">
                Grilla Principal
              </h2>
              <p className="mt-1 text-sm font-medium capitalize text-[var(--muted)]">
                {titleDate}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex rounded-xl border border-[var(--border)] bg-[var(--background-soft)] p-1">
                <Link
                  href={todayHref}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-semibold transition",
                    filters.view === "day"
                      ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
                      : "text-[var(--muted)] hover:text-[var(--foreground)]",
                  )}
                >
                  Hoy
                </Link>
                <Link
                  href={monthHref}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-semibold transition",
                    filters.view === "month"
                      ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
                      : "text-[var(--muted)] hover:text-[var(--foreground)]",
                  )}
                >
                  Mes
                </Link>
              </div>
              <a
                href="#alta-rapida"
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(230,18,56,0.18)] transition hover:bg-[var(--accent-strong)]"
              >
                <Plus className="size-4" />
                Nueva operacion
              </a>
            </div>
          </div>
        </section>

        <PageMessage intent={intent} message={notice} />

        <section className="space-y-6">
          {dayGroups.length ? (
            dayGroups.map((group) => (
              <div key={group.key} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--muted)]">
                      Jornada
                    </p>
                    <h3 className="mt-2 text-2xl font-extrabold capitalize text-[var(--foreground)]">
                      {formatMatchDate(
                        group.items[0].kickoff_at,
                        group.items[0].timezone,
                        "EEEE d 'de' MMMM",
                      )}
                    </h3>
                  </div>
                  <span className="text-sm font-medium text-[var(--muted)]">
                    {group.items.length} partidos
                  </span>
                </div>
                <div className="grid gap-4">
                  {group.items.map((match) => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title="No hay partidos para este filtro"
              description="Ajusta la fecha, la liga o el responsable. Tambien podes crear un partido desde el panel lateral."
            />
          )}
        </section>
      </div>

      <aside id="alta-rapida" className="self-start 2xl:sticky 2xl:top-24">
        <CreateMatchForm
          owners={owners}
          redirectTo={redirectTo}
          canEdit={user.canEdit}
        />
      </aside>
    </div>
  );
}

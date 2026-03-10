import Link from "next/link";

import { SectionAiAssistant } from "@/components/ai/section-ai-assistant";
import { CreateMatchModal } from "@/components/grid/create-match-modal";
import { GridCalendarPicker } from "@/components/grid/grid-calendar-picker";
import { MatchCard } from "@/components/grid/match-card";
import { ProductionInsightsPanel } from "@/components/grid/production-insights-panel";
import { SectionPageHeader } from "@/components/layout/section-page-header";
import { SetupPanel } from "@/components/layout/setup-panel";
import { EmptyState } from "@/components/ui/empty-state";
import { PageMessage } from "@/components/ui/page-message";
import { formatMatchDate, getDateInputValue, getMonthInputValue } from "@/lib/date";
import { getGridCalendarData, getGridData } from "@/lib/data/dashboard";
import { requireUserContext } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { parseGridSearchParams, parseNotice } from "@/lib/search-params";
import { getSettingsSnapshot } from "@/lib/settings";
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

function toStringSearchParams(
  params: Record<string, string | string[] | undefined>,
) {
  const result: Record<string, string> = {};

  for (const [key, rawValue] of Object.entries(params)) {
    if (typeof rawValue === "string" && rawValue) {
      result[key] = rawValue;
    }
  }

  return result;
}

function getInitialCalendarMonth(
  params: Record<string, string | string[] | undefined>,
  filters: {
    view: "day" | "month";
    date: string;
  },
) {
  const rawMonth = typeof params.calendarMonth === "string" ? params.calendarMonth : "";

  if (/^\d{4}-\d{2}$/.test(rawMonth)) {
    return rawMonth;
  }

  return filters.view === "month" ? filters.date : filters.date.slice(0, 7);
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

function formatDayHeading(kickoffAt: string, timezone: string) {
  const label = formatMatchDate(kickoffAt, timezone, "EEEE d 'de' MMMM");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default async function GridPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const { intent, notice } = parseNotice(resolvedSearchParams);

  if (!isSupabaseConfigured) {
    return <SetupPanel />;
  }

  const user = await requireUserContext();
  const filters = parseGridSearchParams(resolvedSearchParams);
  const initialCalendarMonth = getInitialCalendarMonth(
    resolvedSearchParams,
    filters,
  );
  const [{ dayGroups, owners }, initialCalendarSummary] = await Promise.all([
    getGridData(filters),
    getGridCalendarData({
      month: initialCalendarMonth,
      q: filters.q,
      league: filters.league,
      mode: filters.mode,
      status: filters.status,
      owner: filters.owner,
      timezone: filters.timezone,
    }),
  ]);
  const settings = await getSettingsSnapshot();
  const redirectTo = serializeSearchParams(resolvedSearchParams);
  const baseSearchParams = toStringSearchParams(resolvedSearchParams);
  const calendarPickerKey = [
    initialCalendarMonth,
    filters.view,
    filters.date,
    filters.q ?? "",
    filters.league ?? "",
    filters.mode ?? "",
    filters.status ?? "",
    filters.owner ?? "",
  ].join("|");
  const todayHref = buildGridHref(resolvedSearchParams, {
    view: "day",
    date: getDateInputValue(),
  });
  const monthHref = buildGridHref(resolvedSearchParams, {
    view: "month",
    date: getMonthInputValue(),
  });
  const aiContext = dayGroups.flatMap((group) =>
    group.items.map((match) => ({
      partido: `${match.home_team} vs ${match.away_team}`,
      liga: match.competition,
      modo: match.production_mode,
      estado: match.status,
      responsable: match.owner?.full_name ?? "Sin responsable",
      fecha: formatMatchDate(match.kickoff_at, match.timezone, "dd/MM/yyyy"),
      hora: formatMatchDate(match.kickoff_at, match.timezone, "HH:mm"),
      sede: match.venue ?? "",
      asignaciones_confirmadas: match.assignments.filter(
        (assignment) => assignment.person && assignment.confirmed,
      ).length,
    })),
  );

  return (
    <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_23rem]">
      <div className="min-w-0 space-y-10">
        <SectionPageHeader
          title="Producción"
          actions={
            <>
              <div className="flex h-[52px] rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--background-soft)] p-1">
                <Link
                  href={todayHref}
                  className={cn(
                    "inline-flex h-full items-center rounded-[calc(var(--panel-radius)-4px)] px-4 text-sm font-semibold transition",
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
                    "inline-flex h-full items-center rounded-[calc(var(--panel-radius)-4px)] px-4 text-sm font-semibold transition",
                    filters.view === "month"
                      ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
                      : "text-[var(--muted)] hover:text-[var(--foreground)]",
                  )}
                >
                  Mes
                </Link>
              </div>
              <GridCalendarPicker
                key={calendarPickerKey}
                selectedDate={filters.view === "day" ? filters.date : null}
                initialMonth={initialCalendarMonth}
                initialSummary={initialCalendarSummary}
                baseSearchParams={baseSearchParams}
              />
              <SectionAiAssistant
                section="Producción"
                title="Consulta la producción visible"
                description="Pregunta por partidos, responsables, modos de producción o cargas visibles en esta jornada."
                placeholder="Ej. ¿Qué partidos de Liga Nacional están hoy y quién es el responsable?"
                contextLabel="Partidos visibles en Producción"
                context={aiContext}
                guidance="Prioriza partido, liga, modo, estado, responsable, fecha, hora, sede y cantidad de asignaciones confirmadas."
                examples={[
                  "¿Qué partidos hay hoy?",
                  "¿Quién lleva Bochas Sport Club vs River Plate?",
                  "¿Qué producciones están en modo Encoder?",
                ]}
                hasGeminiKey={settings.hasGeminiKey}
                buttonVariant="icon"
              />
              <CreateMatchModal
                people={owners}
                redirectTo={redirectTo}
                canEdit={user.canEdit}
                initialDate={
                  filters.view === "day" ? filters.date : getDateInputValue()
                }
              />
            </>
          }
        />

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
                    <h3 className="mt-2 text-2xl font-extrabold text-[var(--accent)]">
                      {formatDayHeading(
                        group.items[0].kickoff_at,
                        group.items[0].timezone,
                      )}
                    </h3>
                  </div>
                  <span className="text-sm font-medium text-[var(--muted)]">
                    {group.items.length} partidos
                  </span>
                </div>
                <div className="grid gap-4">
                  {group.items.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      redirectTo={redirectTo}
                      canEdit={user.canEdit}
                      people={owners}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title="No hay partidos cargados para esta vista"
              description="Crea un partido desde Nuevo partido o cambia entre Hoy y Mes para revisar otra jornada."
            />
          )}
        </section>
      </div>

      <aside className="self-start 2xl:sticky 2xl:top-24">
        <ProductionInsightsPanel
          matches={dayGroups.flatMap((group) => group.items)}
          timezone={filters.timezone}
        />
      </aside>
    </div>
  );
}

import Link from "next/link";
import { addDays, addMonths } from "date-fns";
import { Search } from "lucide-react";

import { SectionAiAssistant } from "@/components/ai/section-ai-assistant";
import { CreateMatchModal } from "@/components/grid/create-match-modal";
import { GridCalendarPicker } from "@/components/grid/grid-calendar-picker";
import { GridExportButton } from "@/components/grid/grid-export-button";
import { MatchCard } from "@/components/grid/match-card";
import { ProductionInsightsPanel } from "@/components/grid/production-insights-panel";
import { SectionPageHeader } from "@/components/layout/section-page-header";
import { SetupPanel } from "@/components/layout/setup-panel";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageMessage } from "@/components/ui/page-message";
import {
  buildKickoffAt,
  formatMatchDate,
  getDateInputValue,
  getMonthInputValue,
} from "@/lib/date";
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

function buildGridDateShift(params: {
  date: string;
  view: "day" | "month";
  amount: number;
}) {
  const baseDate =
    params.view === "month"
      ? new Date(`${params.date}-01T12:00:00`)
      : new Date(`${params.date}T12:00:00`);
  const shiftedDate =
    params.view === "month"
      ? addMonths(baseDate, params.amount)
      : addDays(baseDate, params.amount);

  return params.view === "month"
    ? getMonthInputValue(shiftedDate)
    : getDateInputValue(shiftedDate);
}

function formatSummaryDateLabel(params: {
  date: string;
  view: "day" | "month";
  timezone: string;
}) {
  const referenceDate =
    params.view === "month" ? `${params.date}-01` : params.date;
  const referenceKickoff = buildKickoffAt({
    date: referenceDate,
    time: "12:00",
    timezone: params.timezone,
  });
  const label = formatMatchDate(
    referenceKickoff,
    params.timezone,
    params.view === "month" ? "MMM yyyy" : "EEEE, d 'de' MMM",
  );

  return label.replaceAll(".", "").toUpperCase();
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
  const previousDateHref = buildGridHref(resolvedSearchParams, {
    date: buildGridDateShift({
      date: filters.date,
      view: filters.view,
      amount: -1,
    }),
  });
  const nextDateHref = buildGridHref(resolvedSearchParams, {
    date: buildGridDateShift({
      date: filters.date,
      view: filters.view,
      amount: 1,
    }),
  });
  const summaryDateLabel = formatSummaryDateLabel({
    date: filters.date,
    view: filters.view,
    timezone: filters.timezone,
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
  const visibleMatches = dayGroups.flatMap((group) => group.items);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="min-w-0 space-y-10">
        <SectionPageHeader
          title="Producción"
          description="Organiza la jornada, asigna roles y supervisa la carga operativa del día."
          actions={
            <>
              <form
                action="/grid"
                className="flex min-w-[320px] flex-1 items-center rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-sm"
              >
                <input type="hidden" name="view" value={filters.view} />
                <input type="hidden" name="date" value={filters.date} />
                {filters.league ? (
                  <input type="hidden" name="league" value={filters.league} />
                ) : null}
                {filters.mode ? (
                  <input type="hidden" name="mode" value={filters.mode} />
                ) : null}
                {filters.status ? (
                  <input type="hidden" name="status" value={filters.status} />
                ) : null}
                {filters.owner ? (
                  <input type="hidden" name="owner" value={filters.owner} />
                ) : null}
                {filters.timezone ? (
                  <input type="hidden" name="timezone" value={filters.timezone} />
                ) : null}
                <div className="flex min-w-0 flex-1 items-center gap-2 rounded-[var(--panel-radius)] bg-[var(--background-soft)] px-3">
                  <Search className="size-4 text-[var(--accent)]" />
                  <Input
                    name="q"
                    defaultValue={filters.q}
                    placeholder="Buscar partido, ID, liga o responsable..."
                    className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                  />
                </div>
              </form>
              {visibleMatches.length ? (
                <GridExportButton
                  matches={visibleMatches}
                  periodLabel={summaryDateLabel}
                />
              ) : null}
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

        <section className="min-w-0 space-y-6">
          {dayGroups.length ? (
            dayGroups.map((group, groupIndex) => (
              <div key={group.key} className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-extrabold text-[var(--accent)]">
                      {formatDayHeading(
                        group.items[0].kickoff_at,
                        group.items[0].timezone,
                      )}
                    </h3>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-3">
                    <span className="text-sm font-medium text-[var(--muted)]">
                      {group.items.length} partidos
                    </span>
                    {groupIndex === 0 ? (
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
                      </>
                    ) : null}
                  </div>
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

      <aside className="min-w-0 self-start xl:sticky xl:top-24">
        <ProductionInsightsPanel
          matches={dayGroups.flatMap((group) => group.items)}
          timezone={filters.timezone}
          currentDateLabel={summaryDateLabel}
          previousDateHref={previousDateHref}
          nextDateHref={nextDateHref}
        />
      </aside>
    </div>
  );
}

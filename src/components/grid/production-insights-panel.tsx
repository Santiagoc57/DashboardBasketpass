import {
  BadgeAlert,
  CalendarClock,
  Clapperboard,
  Hash,
  MapPin,
  Mic2,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatMatchDate, formatMatchTime } from "@/lib/date";
import type { MatchListItem } from "@/lib/types";

type ProductionInsightsPanelProps = {
  matches: MatchListItem[];
  timezone: string;
};

const COVERAGE_ROLES = [
  {
    label: "Responsable",
    roleNames: ["Responsable"],
    icon: UserRound,
  },
  {
    label: "Realizador",
    roleNames: ["Realizador"],
    icon: Clapperboard,
  },
  {
    label: "Operador de gráfica",
    roleNames: ["Operador de Grafica"],
    icon: BadgeAlert,
  },
  {
    label: "Relator",
    roleNames: ["Relator"],
    icon: Mic2,
  },
  {
    label: "Operador de control",
    roleNames: ["Operador de Control"],
    icon: ShieldCheck,
  },
] satisfies ReadonlyArray<{
  label: string;
  roleNames: readonly string[];
  icon: React.ComponentType<{ className?: string }>;
}>;

function buildCoverage(matches: MatchListItem[]) {
  return COVERAGE_ROLES.map((item) => {
    const total = matches.length;
    const covered = matches.filter((match) =>
      match.assignments.some(
        (assignment) =>
          item.roleNames.includes(assignment.role.name) && assignment.person,
      ),
    ).length;

    const ratio = total ? Math.round((covered / total) * 100) : 0;

    return {
      ...item,
      covered,
      total,
      ratio,
    };
  });
}

function buildMissingHighlights(matches: MatchListItem[]) {
  const missingVenue = matches.filter((match) => !match.venue?.trim()).length;
  const missingResponsible = matches.filter(
    (match) =>
      !match.assignments.some(
        (assignment) =>
          assignment.role.name === "Responsable" && assignment.person,
      ),
  ).length;
  const missingProductionCode = matches.filter(
    (match) => !match.production_code?.trim(),
  ).length;
  const missingExternalId = matches.filter(
    (match) => !match.external_match_id?.trim(),
  ).length;

  return [
    {
      label: "Sin sede definida",
      value: missingVenue,
      icon: MapPin,
      tone:
        missingVenue > 0
          ? "border-[#f4d3d9] bg-[#fff5f7] text-[#bc3556]"
          : "border-[var(--border)] bg-[var(--background-soft)] text-[var(--muted)]",
    },
    {
      label: "Sin responsable",
      value: missingResponsible,
      icon: UserRound,
      tone:
        missingResponsible > 0
          ? "border-[#f4d3d9] bg-[#fff5f7] text-[#bc3556]"
          : "border-[var(--border)] bg-[var(--background-soft)] text-[var(--muted)]",
    },
    {
      label: "Sin código producción",
      value: missingProductionCode,
      icon: Hash,
      tone:
        missingProductionCode > 0
          ? "border-[#f7e3c0] bg-[#fff8eb] text-[#b97712]"
          : "border-[var(--border)] bg-[var(--background-soft)] text-[var(--muted)]",
    },
    {
      label: "Sin ID externo",
      value: missingExternalId,
      icon: CalendarClock,
      tone:
        missingExternalId > 0
          ? "border-[#f7e3c0] bg-[#fff8eb] text-[#b97712]"
          : "border-[var(--border)] bg-[var(--background-soft)] text-[var(--muted)]",
    },
  ];
}

export function ProductionInsightsPanel({
  matches,
  timezone,
}: ProductionInsightsPanelProps) {
  const competitions = [
    ...new Set(
      matches
        .map((match) => match.competition?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  ];
  const startWindow = matches[0]
    ? formatMatchTime(matches[0].kickoff_at, matches[0].timezone || timezone)
    : "--:--";
  const endWindow = matches.at(-1)
    ? formatMatchTime(
        matches[matches.length - 1].kickoff_at,
        matches[matches.length - 1].timezone || timezone,
      )
    : "--:--";
  const coverage = buildCoverage(matches);
  const missingHighlights = buildMissingHighlights(matches);
  const nextMatch = matches[0] ?? null;

  return (
    <div className="space-y-5 self-start 2xl:sticky 2xl:top-24">
      <Card className="space-y-5 p-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--accent)]">
            <BadgeAlert className="size-3.5" />
            Insights del día
          </div>
          <div>
            <h3 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
              Resumen operativo
            </h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Métricas e insights del día para detectar huecos antes de crear
              un partido nuevo.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-[18px] border border-[var(--border)] bg-[var(--background-soft)] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--muted)]">
              Partidos visibles
            </p>
            <p className="mt-3 text-3xl font-black text-[var(--foreground)]">
              {matches.length}
            </p>
          </div>
          <div className="rounded-[18px] border border-[var(--border)] bg-[var(--background-soft)] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--muted)]">
              Ligas activas
            </p>
            <p className="mt-3 text-3xl font-black text-[var(--foreground)]">
              {competitions.length}
            </p>
          </div>
          <div className="rounded-[18px] border border-[var(--border)] bg-[var(--background-soft)] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--muted)]">
              Ventana diaria
            </p>
            <p className="mt-3 text-xl font-black text-[var(--foreground)]">
              {startWindow}
              <span className="px-2 text-[var(--muted)]">·</span>
              {endWindow}
            </p>
          </div>
        </div>

        {nextMatch ? (
          <div className="rounded-[20px] border border-[var(--border)] bg-[var(--background-soft)] p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--muted)]">
                  Próximo bloque
                </p>
                <h4 className="mt-2 text-lg font-extrabold text-[var(--foreground)]">
                  {nextMatch.home_team} vs {nextMatch.away_team}
                </h4>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {formatMatchDate(
                    nextMatch.kickoff_at,
                    nextMatch.timezone || timezone,
                    "EEEE d 'de' MMMM",
                  )}
                  {" · "}
                  {formatMatchTime(
                    nextMatch.kickoff_at,
                    nextMatch.timezone || timezone,
                  )}
                </p>
              </div>
              {nextMatch.production_code ? (
                <Badge className="border-[#f2c8d1] bg-[#fff3f6] text-[var(--accent)]">
                  {nextMatch.production_code}
                </Badge>
              ) : null}
            </div>
          </div>
        ) : null}
      </Card>

      <Card className="space-y-4 p-6">
        <div>
          <h4 className="text-lg font-extrabold text-[var(--foreground)]">
            Cobertura clave
          </h4>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Qué tan completo está el staff indispensable en la jornada visible.
          </p>
        </div>
        <div className="space-y-4">
          {coverage.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-[var(--foreground)]">
                    <Icon className="size-4 text-[var(--accent)]" />
                    {item.label}
                  </div>
                  <span className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--muted)]">
                    {item.covered}/{item.total}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--background-soft)]">
                  <div
                    className="h-full rounded-full bg-[var(--accent)] transition-[width]"
                    style={{ width: `${item.ratio}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <div>
          <h4 className="text-lg font-extrabold text-[var(--foreground)]">
            Focos de atención
          </h4>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Campos que hoy obligan a completar datos o revisar la carga.
          </p>
        </div>
        <div className="grid gap-3">
          {missingHighlights.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className={`flex items-center justify-between gap-3 rounded-[16px] border px-4 py-3 ${item.tone}`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-full bg-white/70">
                    <Icon className="size-4" />
                  </div>
                  <span className="text-sm font-bold">{item.label}</span>
                </div>
                <span className="text-lg font-black">{item.value}</span>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <div>
          <h4 className="text-lg font-extrabold text-[var(--foreground)]">
            Insights rápidos
          </h4>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Métricas simples para entender en qué está fuerte o floja la jornada.
          </p>
        </div>
        <div className="grid gap-3">
          <div className="rounded-[16px] border border-[var(--border)] bg-[var(--background-soft)] px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--muted)]">
              Códigos completos
            </p>
            <p className="mt-2 text-lg font-black text-[var(--foreground)]">
              {matches.filter((match) => match.production_code?.trim()).length}
            </p>
          </div>
          <div className="rounded-[16px] border border-[var(--border)] bg-[var(--background-soft)] px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--muted)]">
              IDs externos listos
            </p>
            <p className="mt-2 text-lg font-black text-[var(--foreground)]">
              {matches.filter((match) => match.external_match_id?.trim()).length}
            </p>
          </div>
          <div className="rounded-[16px] border border-[var(--border)] bg-[var(--background-soft)] px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--muted)]">
              Sedes confirmadas
            </p>
            <p className="mt-2 text-lg font-black text-[var(--foreground)]">
              {matches.filter((match) => match.venue?.trim()).length}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

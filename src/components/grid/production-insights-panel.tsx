"use client";

import { useState } from "react";

import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Hash,
  MapPin,
  UserRound,
} from "lucide-react";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { ExpandDivider } from "@/components/ui/expand-divider";
import { DEFAULT_MATCH_DURATION_MINUTES } from "@/lib/constants";
import { formatMatchTime } from "@/lib/date";
import { getRoleDisplayName } from "@/lib/display";
import type { MatchListItem } from "@/lib/types";
import { getInitials } from "@/components/people/people-view-helpers";
import { normalizeText } from "@/lib/utils";

type ProductionInsightsPanelProps = {
  matches: MatchListItem[];
  timezone: string;
  currentDateLabel: string;
  previousDateHref: string;
  nextDateHref: string;
};

const NAME_CONNECTORS = new Set([
  "de",
  "del",
  "la",
  "las",
  "los",
  "da",
  "das",
  "do",
  "dos",
  "van",
  "von",
  "y",
]);

function capitalizeSentence(value: string) {
  return value
    .toLocaleLowerCase("es")
    .replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase("es"));
}

function abbreviatePersonName(value: string | null | undefined) {
  if (!value?.trim()) {
    return "Sin asignar";
  }

  const parts = value.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return capitalizeSentence(parts[0]);
  }

  const surname =
    parts
      .slice(1)
      .find((part) => !NAME_CONNECTORS.has(normalizeText(part))) ?? parts[1];

  return `${parts[0][0]?.toUpperCase() ?? ""}. ${capitalizeSentence(surname)}`;
}

function buildTopPeople(matches: MatchListItem[]) {
  const peopleMap = new Map<
    string,
    {
      id: string;
      fullName: string;
      matchIds: Set<string>;
      roleCounts: Map<string, number>;
    }
  >();

  matches.forEach((match) => {
    match.assignments.forEach((assignment) => {
      if (!assignment.person) {
        return;
      }

      const key = assignment.person.id;
      const current = peopleMap.get(key) ?? {
        id: assignment.person.id,
        fullName: assignment.person.full_name,
        matchIds: new Set<string>(),
        roleCounts: new Map<string, number>(),
      };

      current.matchIds.add(match.id);
      current.roleCounts.set(
        assignment.role.name,
        (current.roleCounts.get(assignment.role.name) ?? 0) + 1,
      );
      peopleMap.set(key, current);
    });
  });

  return [...peopleMap.values()]
    .map((person) => {
      const primaryRole =
        [...person.roleCounts.entries()].sort((left, right) => {
          if (right[1] !== left[1]) {
            return right[1] - left[1];
          }

          return left[0].localeCompare(right[0], "es");
        })[0]?.[0] ?? null;

      return {
        id: person.id,
        fullName: person.fullName,
        totalMatches: person.matchIds.size,
        roleLabel: getRoleDisplayName(primaryRole),
      };
    })
    .sort((left, right) => {
      if (right.totalMatches !== left.totalMatches) {
        return right.totalMatches - left.totalMatches;
      }

      return left.fullName.localeCompare(right.fullName, "es");
    })
    .slice(0, 10);
}

function countAssignedPeople(matches: MatchListItem[]) {
  return new Set(
    matches.flatMap((match) =>
      match.assignments
        .map((assignment) => assignment.person?.id)
        .filter((value): value is string => Boolean(value)),
    ),
  ).size;
}

function getAssignmentLoadTone(totalMatches: number) {
  if (totalMatches >= 3) {
    return {
      avatarClassName: "border-[#c9ead8] bg-[#eefbf3] text-[#1b8b56]",
      badgeClassName: "border-[#c9ead8] bg-[#eefbf3] text-[#1b8b56]",
    };
  }

  return {
    avatarClassName: "border-[#f2ddb1] bg-[#fff7e8] text-[#b7791f]",
    badgeClassName: "border-[#f2ddb1] bg-[#fff7e8] text-[#b7791f]",
  };
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
      emphasis: "critical" as const,
    },
    {
      label: "Sin responsable",
      value: missingResponsible,
      icon: UserRound,
      emphasis: "critical" as const,
    },
    {
      label: "Sin código producción",
      value: missingProductionCode,
      icon: Hash,
      emphasis: "warning" as const,
    },
    {
      label: "Sin ID externo",
      value: missingExternalId,
      icon: CalendarClock,
      emphasis: "warning" as const,
    },
  ];
}

const REQUIRED_GRID_ROLES = ["Responsable", "Realizador", "Operador de Control"] as const;

function hasAssignedRole(match: MatchListItem, roleName: string) {
  const targetRole = normalizeText(roleName);

  return match.assignments.some(
    (assignment) =>
      normalizeText(assignment.role.name) === targetRole && Boolean(assignment.person),
  );
}

function isRejectedConfirmation(status: string | null | undefined) {
  const normalized = normalizeText(status ?? "");
  return (
    normalized === "rechazado" ||
    normalized === "rechazada" ||
    normalized === "rejected" ||
    normalized === "declined"
  );
}

function buildOperationalQuality(matches: MatchListItem[]) {
  const missingCoreFields = matches.filter(
    (match) =>
      !match.competition?.trim() ||
      !match.venue?.trim() ||
      !match.production_code?.trim() ||
      !match.external_match_id?.trim(),
  ).length;
  const missingKeyAssignments = matches.filter((match) =>
    REQUIRED_GRID_ROLES.some((roleName) => !hasAssignedRole(match, roleName)),
  ).length;
  const assignments = matches.flatMap((match) =>
    match.assignments
      .filter((assignment) => assignment.person)
      .map((assignment) => ({ match, assignment })),
  );
  const pendingConfirmations = assignments.filter(
    ({ assignment }) =>
      !assignment.confirmed && !isRejectedConfirmation(assignment.confirmation_status),
  ).length;
  const rejectedConfirmations = assignments.filter(({ assignment }) =>
    isRejectedConfirmation(assignment.confirmation_status),
  ).length;
  const matchesByPerson = new Map<
    string,
    Array<{ start: number; end: number; label: string }>
  >();
  const loadByPerson = new Map<string, { name: string; total: number }>();

  assignments.forEach(({ match, assignment }) => {
    const person = assignment.person;
    if (!person) return;

    const currentLoad = loadByPerson.get(person.id) ?? {
      name: person.full_name,
      total: 0,
    };
    currentLoad.total += 1;
    loadByPerson.set(person.id, currentLoad);

    const start = new Date(match.kickoff_at).getTime();
    const duration = match.duration_minutes ?? DEFAULT_MATCH_DURATION_MINUTES;
    const end = start + duration * 60_000;
    const bucket = matchesByPerson.get(person.id) ?? [];
    bucket.push({
      start,
      end,
      label: `${match.home_team} vs ${match.away_team}`,
    });
    matchesByPerson.set(person.id, bucket);
  });

  const overloadedPeople = [...loadByPerson.values()].filter((person) => person.total >= 4);
  let overlapCount = 0;

  matchesByPerson.forEach((items) => {
    const ordered = [...items].sort((left, right) => left.start - right.start);
    for (let index = 1; index < ordered.length; index += 1) {
      if (ordered[index].start < ordered[index - 1].end) {
        overlapCount += 1;
      }
    }
  });

  return {
    missingCoreFields,
    missingKeyAssignments,
    pendingConfirmations,
    rejectedConfirmations,
    overloadedPeopleCount: overloadedPeople.length,
    overlapCount,
  };
}

function getAttentionTone(emphasis: "critical" | "warning", value: number) {
  if (value <= 0) {
    return {
      avatarClassName: "border-[var(--border)] bg-[var(--background-soft)] text-[var(--muted)]",
      badgeClassName: "border-[var(--border)] bg-[var(--background-soft)] text-[var(--muted)]",
    };
  }

  if (emphasis === "critical") {
    return {
      avatarClassName: "border-[#f4d3d9] bg-[#fff5f7] text-[#bc3556]",
      badgeClassName: "border-[#f4d3d9] bg-[#fff5f7] text-[#bc3556]",
    };
  }

  return {
    avatarClassName: "border-[#f7e3c0] bg-[#fff8eb] text-[#b97712]",
    badgeClassName: "border-[#f7e3c0] bg-[#fff8eb] text-[#b97712]",
  };
}

function formatOperationalHourLabel(time: string) {
  if (time === "--:--") {
    return "--";
  }

  const [hours] = time.split(":");
  return `${hours} HS`;
}

function AssignmentPlaceholderRow({ withBorder }: { withBorder: boolean }) {
  return (
    <div
      className={
        withBorder
          ? "flex items-center justify-between gap-3 border-b border-[var(--border)] pb-3"
          : "flex items-center justify-between gap-3"
      }
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="inline-flex size-10 shrink-0 rounded-full bg-[#f0f3f8]" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-2 w-24 rounded-full bg-[#edf1f6]" />
          <div className="h-3 w-32 rounded-full bg-[#edf1f6]" />
        </div>
      </div>
      <div className="h-7 w-[4.5rem] shrink-0 rounded-full bg-[#f6f8fb]" />
    </div>
  );
}

function QualityChecklistRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "ok" | "warning" | "critical" | "neutral";
}) {
  const toneClassName =
    tone === "ok"
      ? "border-[#c9ead8] bg-[#eefbf3] text-[#1b8b56]"
      : tone === "critical"
        ? "border-[#f4d3d9] bg-[#fff5f7] text-[#bc3556]"
        : tone === "warning"
          ? "border-[#f7e3c0] bg-[#fff8eb] text-[#b97712]"
          : "border-[var(--border)] bg-[var(--background-soft)] text-[var(--muted)]";

  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-3 last:border-b-0 last:pb-0">
      <span className="min-w-0 truncate text-[0.86rem] font-bold text-[var(--foreground)]">
        {label}
      </span>
      <span
        className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] ${toneClassName}`}
      >
        {value}
      </span>
    </div>
  );
}

export function ProductionInsightsPanel({
  matches,
  timezone,
  currentDateLabel,
  previousDateHref,
  nextDateHref,
}: ProductionInsightsPanelProps) {
  const orderedMatches = [...matches].sort(
    (left, right) =>
      new Date(left.kickoff_at).getTime() - new Date(right.kickoff_at).getTime(),
  );
  const competitions = [
    ...new Set(
      matches
        .map((match) => match.competition?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  ];
  const startWindow = orderedMatches[0]
    ? formatMatchTime(orderedMatches[0].kickoff_at, orderedMatches[0].timezone || timezone)
    : "--:--";
  const endWindow = orderedMatches.at(-1)
    ? formatMatchTime(
        orderedMatches[orderedMatches.length - 1].kickoff_at,
        orderedMatches[orderedMatches.length - 1].timezone || timezone,
      )
    : "--:--";
  const topPeople = buildTopPeople(matches);
  const [showAllPeople, setShowAllPeople] = useState(false);
  const assignedPeopleCount = countAssignedPeople(matches);
  const visibleTopPeople = topPeople.slice(0, showAllPeople ? 10 : 5);
  const canExpandPeople = topPeople.length > 5;
  const assignmentPlaceholderCount = showAllPeople
    ? 0
    : Math.max(0, 5 - visibleTopPeople.length);
  const missingHighlights = buildMissingHighlights(matches);
  const operationalQuality = buildOperationalQuality(matches);
  const startWindowLabel = formatOperationalHourLabel(startWindow);
  const endWindowLabel = formatOperationalHourLabel(endWindow);
  return (
    <Card className="flex h-full flex-col overflow-hidden p-0 sm:p-0 2xl:p-0">
      <section className="shrink-0 space-y-3 px-6 py-6">
        <div className="flex items-start gap-3 pr-24">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
                Resumen
              </h3>
              <div className="flex items-center gap-1.5">
                <Link
                  href={previousDateHref}
                  aria-label="Ir a la fecha anterior"
                  className="inline-flex size-[26px] shrink-0 items-center justify-center rounded-full border border-[#d7dde7] bg-[#f4f6fa] text-[#6b7280] transition hover:border-[rgba(230,18,56,0.24)] hover:bg-[#fff3f6] hover:text-[var(--accent)]"
                >
                  <ChevronLeft className="size-[10px]" />
                </Link>
                <Link
                  href={nextDateHref}
                  aria-label="Ir a la fecha siguiente"
                  className="inline-flex size-[26px] shrink-0 items-center justify-center rounded-full border border-[#d7dde7] bg-[#f4f6fa] text-[#6b7280] transition hover:border-[rgba(230,18,56,0.24)] hover:bg-[#fff3f6] hover:text-[var(--accent)]"
                >
                  <ChevronRight className="size-[10px]" />
                </Link>
              </div>
            </div>
            <p className="mt-2 text-[11px] font-extrabold uppercase tracking-[0.26em] text-[var(--accent)]">
              {currentDateLabel}
            </p>
          </div>
        </div>
      </section>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
        <div className="grid grid-cols-3 gap-2">
          <div className="flex min-h-[9rem] flex-col items-center justify-center rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--background-soft)] px-4 py-3 text-center">
            <div className="grid h-full w-full max-w-[8.5rem] place-content-center justify-items-center gap-3">
              <p className="text-[11px] font-bold uppercase leading-[1.45] tracking-[0.24em] text-[var(--muted)]">
                Partidos de hoy
              </p>
              <p className="text-[2.6rem] font-black leading-none text-[var(--foreground)]">
                {matches.length}
              </p>
            </div>
          </div>
          <div className="flex min-h-[9rem] flex-col items-center justify-center rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--background-soft)] px-4 py-3 text-center">
            <div className="grid h-full w-full max-w-[8.5rem] place-content-center justify-items-center gap-3">
              <p className="text-[11px] font-bold uppercase leading-[1.45] tracking-[0.24em] text-[var(--muted)]">
                Ligas activas
              </p>
              <p className="text-[2.6rem] font-black leading-none text-[var(--foreground)]">
                {competitions.length}
              </p>
            </div>
          </div>
          <div className="flex min-h-[9rem] flex-col items-center justify-center rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--background-soft)] px-4 py-3 text-center">
            <div className="flex w-full max-w-[8.5rem] flex-col items-center justify-center gap-2.5">
              <p className="text-[11px] font-bold uppercase leading-[1.45] tracking-[0.24em] text-[var(--muted)]">
                Presión operativa
              </p>
              <div className="grid w-[5.75rem] justify-items-center gap-1.5 text-center">
                <p className="text-[1.6rem] font-black leading-none tabular-nums tracking-tight text-[var(--foreground)]">
                  {startWindowLabel}
                </p>
                <p className="text-[1.6rem] font-black leading-none tabular-nums tracking-tight text-[var(--foreground)]">
                  {endWindowLabel}
                </p>
              </div>
            </div>
          </div>
        </div>

        {!matches.length ? (
          <div className="mt-4 rounded-[var(--panel-radius)] border border-dashed border-[var(--border)] bg-[var(--background-soft)] px-4 py-4">
            <p className="text-sm font-extrabold text-[var(--foreground)]">
              No hay partidos visibles
            </p>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
              Ajusta fecha o filtros para reconstruir el resumen operativo.
            </p>
          </div>
        ) : null}

      <section className="mt-4 space-y-3">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
          <h4 className="text-[11px] font-extrabold uppercase tracking-[0.28em] text-[var(--foreground)]">
            Asignaciones
          </h4>
          {assignedPeopleCount > 0 ? (
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8da0bb]">
              {assignedPeopleCount}
            </span>
          ) : null}
        </div>
        <div className="space-y-3">
          {visibleTopPeople.map((person, index) => {
              const tone = getAssignmentLoadTone(person.totalMatches);
              const hasFollowingPlaceholder = assignmentPlaceholderCount > 0;
              const isLastVisibleRealRow =
                index === visibleTopPeople.length - 1 && !hasFollowingPlaceholder;

              return (
                <div
                  key={person.id}
                  className={
                    isLastVisibleRealRow
                      ? "flex items-center justify-between gap-3"
                      : "flex items-center justify-between gap-3 border-b border-[var(--border)] pb-3"
                  }
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`inline-flex size-10 shrink-0 items-center justify-center rounded-full border text-[0.82rem] font-black ${tone.avatarClassName}`}
                    >
                      {getInitials(person.fullName)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[9px] font-bold uppercase tracking-[0.14em] text-[#7587a1]">
                        {person.roleLabel}
                      </p>
                      <p
                        title={person.fullName}
                        className="mt-1 truncate text-[0.92rem] font-bold text-[var(--foreground)]"
                      >
                        {abbreviatePersonName(person.fullName)}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`shrink-0 rounded-full border px-6 py-1 text-xs font-extrabold uppercase tracking-[0.18em] ${tone.badgeClassName}`}
                  >
                    {person.totalMatches}
                  </div>
                </div>
              );
            })}
          {Array.from({ length: assignmentPlaceholderCount }, (_, index) => (
            <AssignmentPlaceholderRow
              key={`assignment-placeholder-${index}`}
              withBorder={index < assignmentPlaceholderCount - 1}
            />
          ))}
          {canExpandPeople ? (
            <ExpandDivider
              expanded={showAllPeople}
              onToggle={() => setShowAllPeople((current) => !current)}
              collapsedLabel="Mostrar más personal"
              expandedLabel="Mostrar menos personal"
              className="py-[0.55rem]"
              lineClassName="border-[var(--border)]"
              buttonClassName="border-[#d9e1eb] text-[#7d8ca1] hover:border-[#efc2cb] hover:bg-[#fff6f8] hover:text-[var(--accent)]"
            />
          ) : null}
        </div>
      </section>

      <section className="mt-4 space-y-3">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
          <h4 className="text-[11px] font-extrabold uppercase tracking-[0.28em] text-[var(--foreground)]">
            Focos de atención
          </h4>
        </div>
        <div className="space-y-3">
          {missingHighlights.map((item, index) => {
            const Icon = item.icon;
            const tone = getAttentionTone(item.emphasis, item.value);

            return (
              <div
                key={item.label}
                className={
                  index === missingHighlights.length - 1
                    ? "flex items-center justify-between gap-3"
                    : "flex items-center justify-between gap-3 border-b border-[var(--border)] pb-3"
                }
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={`inline-flex size-10 shrink-0 items-center justify-center rounded-full border ${tone.avatarClassName}`}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[0.92rem] font-bold text-[var(--foreground)]">
                      {item.label}
                    </p>
                  </div>
                </div>
                <div
                  className={`shrink-0 rounded-full border px-6 py-1 text-xs font-extrabold uppercase tracking-[0.18em] ${tone.badgeClassName}`}
                >
                  {item.value}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-5 space-y-3 border-t border-[var(--border)] pt-4">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="size-4 text-[#617187]" />
          <h4 className="text-[11px] font-extrabold uppercase tracking-[0.28em] text-[var(--foreground)]">
            Calidad de datos
          </h4>
        </div>
        <div className="space-y-3 rounded-[var(--panel-radius)] border border-[var(--border)] bg-white px-4 py-4">
          <QualityChecklistRow
            label="Campos críticos incompletos"
            value={`${operationalQuality.missingCoreFields}`}
            tone={
              matches.length === 0
                ? "neutral"
                : operationalQuality.missingCoreFields > 0
                  ? "critical"
                  : "ok"
            }
          />
          <QualityChecklistRow
            label="Sin asignaciones clave"
            value={`${operationalQuality.missingKeyAssignments}`}
            tone={
              matches.length === 0
                ? "neutral"
                : operationalQuality.missingKeyAssignments > 0
                  ? "critical"
                  : "ok"
            }
          />
          <QualityChecklistRow
            label="Confirmaciones pendientes"
            value={`${operationalQuality.pendingConfirmations}`}
            tone={
              operationalQuality.pendingConfirmations > 0
                ? "warning"
                : matches.length
                  ? "ok"
                  : "neutral"
            }
          />
          <QualityChecklistRow
            label="Rechazos reportados"
            value={`${operationalQuality.rejectedConfirmations}`}
            tone={operationalQuality.rejectedConfirmations > 0 ? "critical" : "neutral"}
          />
        </div>
      </section>

      <section className="mt-5 space-y-3 border-t border-[var(--border)] pt-4">
        <div className="flex items-center gap-2">
          <Clock3 className="size-4 text-[#617187]" />
          <h4 className="text-[11px] font-extrabold uppercase tracking-[0.28em] text-[var(--foreground)]">
            Presión operativa
          </h4>
        </div>
        <div className="space-y-3 rounded-[var(--panel-radius)] border border-[var(--border)] bg-white px-4 py-4">
          <QualityChecklistRow
            label="Personas con 4+ partidos"
            value={`${operationalQuality.overloadedPeopleCount}`}
            tone={operationalQuality.overloadedPeopleCount > 0 ? "warning" : matches.length ? "ok" : "neutral"}
          />
          <QualityChecklistRow
            label="Solapes de horarios"
            value={`${operationalQuality.overlapCount}`}
            tone={operationalQuality.overlapCount > 0 ? "critical" : matches.length ? "ok" : "neutral"}
          />
          <QualityChecklistRow
            label="Checklist diario"
            value={
              operationalQuality.missingCoreFields +
                operationalQuality.missingKeyAssignments +
                operationalQuality.pendingConfirmations +
                operationalQuality.overlapCount ===
              0
                ? "OK"
                : "Revisar"
            }
            tone={
              matches.length === 0
                ? "neutral"
                : operationalQuality.missingCoreFields +
                    operationalQuality.missingKeyAssignments +
                    operationalQuality.pendingConfirmations +
                    operationalQuality.overlapCount ===
                  0
                  ? "ok"
                  : "warning"
            }
          />
        </div>
      </section>

      <section className="mt-5 space-y-3 border-t border-[var(--border)] pt-4">
        <div>
          <h4 className="text-lg font-extrabold text-[var(--foreground)]">
            Insights rápidos
          </h4>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Métricas simples para entender en qué está fuerte o floja la jornada.
          </p>
        </div>
        <div className="grid gap-3">
          <div className="rounded-[16px] border border-[var(--border)] bg-[var(--background-soft)] px-8 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--muted)]">
              Códigos completos
            </p>
            <p className="mt-2 text-lg font-black text-[var(--foreground)]">
              {matches.filter((match) => match.production_code?.trim()).length}
            </p>
          </div>
          <div className="rounded-[16px] border border-[var(--border)] bg-[var(--background-soft)] px-8 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--muted)]">
              IDs externos listos
            </p>
            <p className="mt-2 text-lg font-black text-[var(--foreground)]">
              {matches.filter((match) => match.external_match_id?.trim()).length}
            </p>
          </div>
          <div className="rounded-[16px] border border-[var(--border)] bg-[var(--background-soft)] px-8 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--muted)]">
              Sedes confirmadas
            </p>
            <p className="mt-2 text-lg font-black text-[var(--foreground)]">
              {matches.filter((match) => match.venue?.trim()).length}
            </p>
          </div>
        </div>
      </section>
      </div>
    </Card>
  );
}

import Link from "next/link";
import {
  CalendarDays,
  Camera,
  Clock3,
  type LucideIcon,
  Mic2,
  PencilLine,
  ShieldUser,
  SlidersHorizontal,
} from "lucide-react";

import { TeamLogoMark } from "@/components/team-logo-mark";
import { Card } from "@/components/ui/card";
import { formatMatchTime } from "@/lib/date";
import type { MatchListItem } from "@/lib/types";
import { cn } from "@/lib/utils";

type SectionRow = {
  label: string;
  value: string;
  muted?: boolean;
};

const statusStyles = {
  Pendiente:
    "border-[#f0d28d] bg-[#fff8e9] text-[#a6670e] [&>span]:bg-[#e6a934]",
  Confirmado:
    "border-[#cfe6d8] bg-[#eff9f3] text-[#1f7453] [&>span]:bg-[#2db574]",
  Realizado:
    "border-[#d7dce8] bg-[#f5f7fb] text-[#4d628a] [&>span]:bg-[#7a8eaf]",
} as const;

function formatGridDate(kickoffAt: string, timezone: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: timezone,
  }).format(new Date(kickoffAt));
}

function buildProductionId(id: string) {
  const compact = id.replaceAll("-", "").toUpperCase();
  return `PRD-${compact.slice(0, 4)}-${compact.slice(4, 8)}`;
}

function getAssignmentValue(
  match: MatchListItem,
  roleName: string,
  fallback?: string | null,
) {
  const assignment = match.assignments.find((item) => item.role.name === roleName);
  const value = assignment?.person?.full_name ?? fallback ?? "TBD";

  return {
    value,
    muted: !assignment?.person?.full_name && !fallback,
  };
}

function buildProductionRows(match: MatchListItem): SectionRow[] {
  const responsible = getAssignmentValue(
    match,
    "Responsable",
    match.owner?.full_name ?? null,
  );
  const producer = getAssignmentValue(match, "Productor");
  const director = getAssignmentValue(match, "Realizador");

  return [
    {
      label: "Responsable en cancha",
      value: responsible.value,
      muted: responsible.muted,
    },
    {
      label: "Productor",
      value: producer.value,
      muted: producer.muted,
    },
    {
      label: "Realizador",
      value: director.value,
      muted: director.muted,
    },
  ];
}

function buildCategoryRows(
  match: MatchListItem,
  category: string,
  limit = 4,
): SectionRow[] {
  return match.assignments
    .filter((assignment) => assignment.role.category === category)
    .sort((left, right) => left.role.sort_order - right.role.sort_order)
    .slice(0, limit)
    .map((assignment) => ({
      label: assignment.role.name,
      value: assignment.person?.full_name ?? "TBD",
      muted: !assignment.person?.full_name,
    }));
}

function buildNamedRows(
  match: MatchListItem,
  roleNames: string[],
): SectionRow[] {
  return roleNames.map((roleName) => {
    const item = getAssignmentValue(match, roleName);

    return {
      label: roleName,
      value: item.value,
      muted: item.muted,
    };
  });
}

function Section({
  title,
  icon: Icon,
  rows,
  actionHref,
}: {
  title: string;
  icon: LucideIcon;
  rows: SectionRow[];
  actionHref?: string;
}) {
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2">
        <Icon className="size-4 text-[var(--accent)]" />
        <h4 className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--accent)]">
          {title}
        </h4>
      </div>

      <div className="flex flex-1 flex-col gap-3">
        {rows.map((row) => (
          <div key={row.label} className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a08f91]">
              {row.label}
            </p>
            <p
              className={cn(
                "text-sm font-bold text-[var(--foreground)]",
                row.muted && "text-[var(--muted)] italic font-semibold",
              )}
            >
              {row.value}
            </p>
          </div>
        ))}
      </div>

      {actionHref ? (
        <Link
          href={actionHref}
          className="mt-auto inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[#f4f6f8] px-4 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#5f6874] transition hover:border-[#d9dde4] hover:bg-[#eceff4] hover:text-[var(--foreground)]"
        >
          <PencilLine className="size-3.5" />
          Editar asignaciones
        </Link>
      ) : null}
    </div>
  );
}

export function MatchCard({ match }: { match: MatchListItem }) {
  const cameraRows = buildCategoryRows(match, "Camaras");
  const talentRows = buildNamedRows(match, [
    "Relator",
    "Comentario 1",
    "Comentario 2",
    "Campo",
  ]);
  const controlRows = buildNamedRows(match, [
    "Operador de Control",
    "Soporte tecnico",
    "Encoder",
    "Ingenieria",
  ]);

  return (
    <Card className="overflow-hidden border-t-[4px] border-t-[var(--accent)] p-0 shadow-[0_8px_24px_rgba(28,13,16,0.05)] transition hover:shadow-[0_16px_34px_rgba(28,13,16,0.08)]">
      <div className="flex flex-col gap-5 border-b border-[var(--border)] bg-[#fafafa] px-5 py-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-5 xl:flex-row xl:items-center xl:gap-8">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4 xl:min-w-[21rem]">
            <TeamLogoMark
              teamName={match.home_team}
              competition={match.competition}
              className="size-11 rounded-md"
            />
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[var(--muted)]">
                Partido
              </p>
              <h3 className="mt-1 flex flex-wrap items-center gap-2 text-lg font-black uppercase tracking-[-0.025em] text-[var(--foreground)] sm:text-xl">
                <span className="truncate">{match.home_team}</span>
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                  vs
                </span>
                <span className="truncate">{match.away_team}</span>
              </h3>
            </div>
            <TeamLogoMark
              teamName={match.away_team}
              competition={match.competition}
              className="size-11 rounded-md"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-8 xl:border-l xl:border-[var(--border)] xl:pl-8">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a08f91]">
                Dia
              </p>
              <p className="text-sm font-bold text-[var(--foreground)]">
                {formatGridDate(match.kickoff_at, match.timezone)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a08f91]">
                Hora
              </p>
              <p className="text-sm font-black text-[var(--accent)]">
                {formatMatchTime(match.kickoff_at, match.timezone)} LOC
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a08f91]">
                Liga
              </p>
              <p className="text-sm font-bold text-[var(--foreground)]">
                {match.competition ?? "Sin liga"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a08f91]">
                Produccion ID
              </p>
              <p className="font-mono text-sm font-bold text-[#66606a]">
                {buildProductionId(match.id)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-start xl:justify-end">
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em]",
              statusStyles[match.status],
            )}
          >
            <span className="size-2 rounded-full" />
            {match.status}
          </span>
        </div>
      </div>

      <div className="grid gap-x-8 gap-y-6 px-5 py-5 md:grid-cols-2 xl:grid-cols-4">
        <Section
          title="Produccion & Direccion"
          icon={ShieldUser}
          rows={buildProductionRows(match)}
        />
        <Section title="Camaras" icon={Camera} rows={cameraRows} />
        <Section
          title="Relatos & Comentarios"
          icon={Mic2}
          rows={talentRows}
        />
        <Section
          title="Control & Soporte"
          icon={SlidersHorizontal}
          rows={controlRows}
          actionHref={`/match/${match.id}#operativa`}
        />
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-[var(--border)] bg-[#fcfcfc] px-5 py-3 text-xs font-semibold text-[var(--muted)]">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="size-3.5" />
          {formatGridDate(match.kickoff_at, match.timezone)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock3 className="size-3.5" />
          {formatMatchTime(match.kickoff_at, match.timezone)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Camera className="size-3.5" />
          {cameraRows.filter((row) => !row.muted).length}/{cameraRows.length} camaras
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Mic2 className="size-3.5" />
          {talentRows.filter((row) => !row.muted).length}/{talentRows.length} talento
        </span>
      </div>
    </Card>
  );
}

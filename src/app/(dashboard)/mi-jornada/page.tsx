import Link from "next/link";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  CalendarDays,
  ChevronRight,
  Hash,
  MessageCircleMore,
  Mic2,
  Radio,
  ShieldUser,
  Sparkles,
  UserRound,
  Video,
} from "lucide-react";

import { SetupPanel } from "@/components/layout/setup-panel";
import { TeamLogoMark } from "@/components/team-logo-mark";
import { Card } from "@/components/ui/card";
import { requireUserContext } from "@/lib/auth";
import { getRoleDisplayName } from "@/lib/display";
import { isSupabaseConfigured } from "@/lib/env";
import {
  type CollaboratorAssignmentItem,
  getCollaboratorDayData,
} from "@/lib/data/collaborators";
import { buildWhatsAppUrl, cn, normalizeText } from "@/lib/utils";

type PageProps = {
  searchParams: Promise<{ date?: string }>;
};

function capitalizeSentence(value: string) {
  if (!value) {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatSelectedDate(dateValue: string) {
  return capitalizeSentence(
    format(parseISO(`${dateValue}T00:00:00`), "EEEE d 'de' MMMM", {
      locale: es,
    }),
  );
}

function formatCompactMatchDate(dateValue: string) {
  return format(parseISO(`${dateValue}T00:00:00`), "dd MMM, yyyy", {
    locale: es,
  }).toUpperCase();
}

function buildProductionId(matchId: string) {
  const compact = matchId.replaceAll("-", "").toUpperCase();
  return `PRD-${compact.slice(0, 4)}-${compact.slice(4, 8)}`;
}

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

function abbreviateNameList(value: string | null | undefined) {
  if (!value?.trim()) {
    return "Sin asignar";
  }

  return value
    .split("/")
    .map((item) => abbreviatePersonName(item.trim()))
    .join(" / ");
}

function AssignmentInfoItem({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3",
        className,
      )}
    >
      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#95a3ba]">
        <Icon className="size-4 text-[var(--accent)]" />
        {label}
      </div>
      <p className="mt-2 text-sm font-semibold leading-snug text-[var(--foreground)]">
        {value}
      </p>
    </div>
  );
}

function AssignmentCard({ assignment }: { assignment: CollaboratorAssignmentItem }) {
  const groupHref = buildWhatsAppUrl(assignment.ownerPhone);
  const canOpenGroup = Boolean(groupHref);
  const compactDate = formatCompactMatchDate(assignment.kickoffAt.slice(0, 10));
  const leagueLabel = assignment.competition ?? "Sin liga";
  const roleLabel = getRoleDisplayName(assignment.roleName) || "Sin rol";
  const productionCode = buildProductionId(assignment.matchId);
  const responsibleLabel = abbreviatePersonName(
    assignment.responsibleName ?? assignment.ownerName,
  );

  return (
    <Card className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-0 shadow-[0_16px_36px_rgba(28,13,16,0.06)]">
      <div className="space-y-5 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-[10px] bg-[var(--accent-soft)] px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">
              {leagueLabel}
            </span>
            {assignment.productionMode ? (
              <span className="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#617187]">
                {assignment.productionMode}
              </span>
            ) : null}
          </div>

          <div className="rounded-[14px] border border-[var(--border)] bg-[var(--background-soft)] px-4 py-2 text-center shadow-[0_10px_18px_rgba(31,41,55,0.05)]">
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#7d8da6]">
              <CalendarDays className="size-3.5 text-[var(--accent)]" />
              {compactDate}
            </div>
            <p className="mt-1 text-[28px] font-black leading-none text-[var(--accent)]">
              {assignment.timeLabel}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <TeamLogoMark
              teamName={assignment.homeTeam}
              competition={assignment.competition}
              className="size-11 rounded-full"
              imageClassName="p-1.5"
            />
            <div className="flex-1">
              <h2 className="text-[22px] font-black leading-tight tracking-tight text-[var(--foreground)]">
                {assignment.homeTeam}{" "}
                <span className="text-[var(--accent)]">vs</span>{" "}
                {assignment.awayTeam}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm font-semibold text-[#7c5f18]">
            <ShieldUser className="size-4 text-[#f3a623]" />
            Responsable: {responsibleLabel}
          </div>
        </div>

        <div className="grid gap-4 border-t border-[var(--border)] pt-5 sm:grid-cols-2">
          <AssignmentInfoItem
            icon={Video}
            label="Realizador"
            value={abbreviatePersonName(assignment.realizerName)}
          />
          <AssignmentInfoItem
            icon={Hash}
            label="ID evento"
            value={productionCode}
          />
          <AssignmentInfoItem
            icon={Mic2}
            label="Talento"
            value={abbreviateNameList(assignment.talentLabel)}
          />
          <AssignmentInfoItem
            icon={ShieldUser}
            label="Tu rol"
            value={roleLabel}
          />
          <AssignmentInfoItem
            icon={Radio}
            label="Sede"
            value={assignment.venue ?? "Por definir"}
            className="sm:col-span-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-[var(--border)] bg-[var(--background-soft)] p-4">
        {canOpenGroup ? (
          <Link
            href={groupHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[18px] bg-[#1faa52] px-4 text-sm font-black text-white shadow-[0_14px_28px_rgba(31,170,82,0.18)] transition hover:brightness-105"
          >
            <MessageCircleMore className="size-4" />
            Grupo WhatsApp
          </Link>
        ) : (
          <span className="inline-flex h-12 items-center justify-center gap-2 rounded-[18px] border border-[var(--border)] bg-[#eef7f0] px-4 text-sm font-black text-[#7ca488]">
            <MessageCircleMore className="size-4" />
            Grupo WhatsApp
          </span>
        )}

        <Link
          href={`/mi-jornada/${assignment.matchId}/reportar`}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-[18px] bg-[var(--accent)] px-4 text-sm font-black text-white shadow-[0_14px_28px_rgba(230,18,56,0.18)] transition hover:bg-[var(--accent-strong)]"
        >
          <Sparkles className="size-4" />
          Reportar
        </Link>
      </div>
    </Card>
  );
}

function buildDemoAssignment(params: {
  date: string;
  collaboratorName: string;
}): CollaboratorAssignmentItem {
  return {
    assignmentId: "demo-assignment",
    matchId: "demo-match-boca-atenas",
    confirmed: false,
    notes: "Vista demo para validar la tarjeta móvil de Mi jornada.",
    roleName: "Realizador",
    roleCategory: "Produccion",
    competition: "Liga Nacional",
    productionMode: "Encoder",
    status: "Pendiente",
    homeTeam: "Boca Juniors",
    awayTeam: "Atenas de Córdoba",
    venue: "Luis Conde, Buenos Aires",
    kickoffAt: `${params.date}T19:30:00-05:00`,
    durationMinutes: 150,
    timezone: "America/Bogota",
    ownerName: params.collaboratorName,
    ownerPhone: "573000000000",
    ownerEmail: null,
    responsibleName: params.collaboratorName,
    realizerName: params.collaboratorName,
    producerName: "M. Casella",
    talentLabel: "L. Montero / G. Pérez",
    dateLabel: formatCompactMatchDate(params.date),
    timeLabel: "19:30",
  };
}

export default async function CollaboratorDayPage({ searchParams }: PageProps) {
  if (!isSupabaseConfigured) {
    return <SetupPanel />;
  }

  const { date } = await searchParams;
  const user = await requireUserContext();
  const data = await getCollaboratorDayData({
    email: user.email,
    profileName: user.profile?.full_name ?? null,
    selectedDate: date,
  });

  const selectedDate = date ?? new Date().toISOString().slice(0, 10);
  const showDemoToday =
    Boolean(data.person) && data.todayAssignments.length === 0;
  const todayAssignments = showDemoToday
    ? [
        buildDemoAssignment({
          date: selectedDate,
          collaboratorName: data.person?.full_name ?? "Santiago Cordoba",
        }),
      ]
    : data.todayAssignments;
  const totalToday = showDemoToday ? todayAssignments.length : data.summary.totalToday;
  const pendingToday = showDemoToday ? 1 : data.summary.pendingToday;

  if (!data.person) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-6 pb-10">
        <Card className="space-y-4 rounded-[22px] border-[#f2d8ae] bg-[#fffaf0] p-6">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#9a5a0f]">
            Colaborador sin vínculo
          </p>
          <h1 className="text-3xl font-black tracking-tight text-[var(--foreground)]">
            No encontramos tu persona operativa
          </h1>
          <p className="text-sm leading-7 text-[#7a6546]">
            Para usar el portal móvil, tu usuario debe estar vinculado por correo o
            nombre a la tabla `Personal`.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/people"
              className="inline-flex h-11 items-center justify-center rounded-[18px] bg-[var(--accent)] px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(230,18,56,0.18)] transition hover:bg-[var(--accent-strong)]"
            >
              Revisar Personal
            </Link>
            <Link
              href="/grid"
              className="inline-flex h-11 items-center justify-center rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--background-soft)]"
            >
              Abrir Producción
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 pb-10">
      <section className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_20px_40px_rgba(28,13,16,0.06)] sm:p-6">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[var(--accent)]">
                Portal colaborador
              </p>
              <h1 className="text-[30px] font-black tracking-tight leading-[1.02] text-[var(--foreground)]">
                Mi jornada
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-[#617187]">
                Revisa tus partidos del día, abre el grupo y reporta conexión,
                pago, incidencias y speedtest desde el celular.
              </p>
            </div>

            <form className="flex items-center gap-3" method="get">
              <label className="flex min-w-[176px] items-center gap-3 rounded-[18px] border border-[var(--border)] bg-[var(--background-soft)] px-4 py-3 text-sm font-semibold text-[var(--foreground)]">
                <CalendarDays className="size-4 text-[var(--accent)]" />
                <input
                  type="date"
                  name="date"
                  defaultValue={selectedDate}
                  className="min-w-0 bg-transparent text-sm font-semibold outline-none"
                />
              </label>
              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center rounded-[18px] bg-[var(--accent)] px-4 text-sm font-black text-white shadow-[0_14px_28px_rgba(230,18,56,0.18)] transition hover:bg-[var(--accent-strong)]"
              >
                Ver día
              </button>
            </form>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-[18px] border border-[var(--border)] bg-[var(--background-soft)] px-4 py-3">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#95a3ba]">
                Colaborador
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">
                {abbreviatePersonName(data.person.full_name)}
              </p>
            </div>
            <div className="rounded-[18px] border border-[var(--border)] bg-[var(--background-soft)] px-4 py-3">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#95a3ba]">
                Día activo
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">
                {formatSelectedDate(selectedDate)}
              </p>
            </div>
            <div className="rounded-[18px] border border-[var(--border)] bg-[var(--background-soft)] px-4 py-3">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#95a3ba]">
                Hoy
              </p>
              <p className="mt-2 text-[28px] font-black leading-none text-[var(--foreground)]">
                {totalToday}
              </p>
            </div>
            <div className="rounded-[18px] border border-[var(--border)] bg-[var(--background-soft)] px-4 py-3">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#95a3ba]">
                Pendientes
              </p>
              <p className="mt-2 text-[28px] font-black leading-none text-[var(--accent)]">
                {pendingToday}
              </p>
            </div>
          </div>

          {showDemoToday ? (
            <div className="rounded-[18px] border border-[#d9dff2] bg-[#f7f9ff] px-4 py-3 text-sm font-semibold text-[#5e6f8c]">
              No encontramos partidos reales para esta fecha. Te dejamos una{" "}
              <span className="font-black text-[var(--accent)]">vista demo</span>{" "}
              para que valides cómo se ve `Mi jornada`.
            </div>
          ) : null}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-[var(--foreground)]">
              Hoy
            </h2>
            <p className="mt-1 text-sm text-[#617187]">
              Tus partidos asignados para la fecha seleccionada.
            </p>
          </div>
          <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#95a3ba]">
            {todayAssignments.length} visibles
          </span>
        </div>

        {todayAssignments.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {todayAssignments.map((assignment) => (
              <AssignmentCard
                key={`${assignment.assignmentId}-${assignment.matchId}`}
                assignment={assignment}
              />
            ))}
          </div>
        ) : (
          <Card className="space-y-3 rounded-[22px] p-6">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#95a3ba]">
              Sin actividad hoy
            </p>
            <h3 className="text-2xl font-black tracking-tight text-[var(--foreground)]">
              No tienes partidos asignados para esta fecha
            </h3>
            <p className="text-sm leading-7 text-[#617187]">
              Prueba con otro día o revisa la sección de próximos partidos.
            </p>
          </Card>
        )}
      </section>

      {data.upcomingAssignments.length ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-[var(--foreground)]">
                Próximamente
              </h2>
              <p className="mt-1 text-sm text-[#617187]">
                Siguientes compromisos ya vinculados a tu perfil.
              </p>
            </div>
            <Link
              href="/grid"
              className="inline-flex items-center gap-2 text-sm font-black text-[var(--accent)]"
            >
              Ver Producción
              <ChevronRight className="size-4" />
            </Link>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {data.upcomingAssignments.map((assignment) => (
              <AssignmentCard
                key={`${assignment.assignmentId}-${assignment.matchId}`}
                assignment={assignment}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

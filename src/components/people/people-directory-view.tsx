import Link from "next/link";
import { Pencil, Power, Send } from "lucide-react";

import { togglePersonActiveAction } from "@/app/actions/people";
import {
  getCityIndicator,
  getInitials,
  getRolePresentation,
  getWhatsAppHref,
  MapPin,
} from "@/components/people/people-view-helpers";
import { getAppRoleDisplayName, getRoleDisplayName } from "@/lib/display";
import { getPersonRoleValues, parsePersonNotesMeta } from "@/lib/people-notes";
import type { PersonListItem } from "@/lib/types";
import { cn, normalizeText } from "@/lib/utils";

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

function getDirectoryDisplayName(value: string | null | undefined) {
  if (!value?.trim()) {
    return "Sin nombre";
  }

  const parts = value.trim().split(/\s+/).filter(Boolean);

  if (parts.length <= 2) {
    return value.trim();
  }

  const surname =
    parts
      .slice(1)
      .find((part) => !NAME_CONNECTORS.has(normalizeText(part))) ?? parts[1];

  return `${parts[0]} ${surname}`;
}

function buildDirectoryHref(input: { query?: string; edit?: string }) {
  const search = new URLSearchParams();

  search.set("view", "directory");

  if (input.query) {
    search.set("q", input.query);
  }

  if (input.edit) {
    search.set("edit", input.edit);
  }

  return `/people?${search.toString()}`;
}

function getStatePresentation(person: PersonListItem) {
  if (!person.active || person.assignment_state === "Inactivo") {
    return {
      avatarShellClassName: "bg-[#eef2f6]",
      avatarInnerClassName:
        "border-[#eef2f6] bg-[radial-gradient(circle_at_top_left,#f8fafc_0%,#e7ecf3_100%)]",
      avatarTextClassName: "text-[#95a1b4]",
      toggleButtonClassName:
        "border-[#d8dee8] bg-white/80 text-[#94a3b8] hover:border-[#cfd7e3] hover:bg-white hover:text-[#64748b]",
    };
  }

  if (person.assignment_state === "En asignacion") {
    return {
      avatarShellClassName: "bg-[#dcfce7]",
      avatarInnerClassName:
        "border-[#dcfce7] bg-[radial-gradient(circle_at_top_left,#f4fff7_0%,#dff7e7_100%)]",
      avatarTextClassName: "text-[#4f8f64]",
      toggleButtonClassName:
        "border-[#cdeed7] bg-[#f1fcf5] text-[#179a56] hover:border-[#bce5ca] hover:bg-[#e8faef] hover:text-[#177245]",
    };
  }

  return {
    avatarShellClassName: "bg-[#dcfce7]",
    avatarInnerClassName:
      "border-[#dcfce7] bg-[radial-gradient(circle_at_top_left,#f4fff7_0%,#dff7e7_100%)]",
    avatarTextClassName: "text-[#4f8f64]",
    toggleButtonClassName:
      "border-[#cdeed7] bg-[#f1fcf5] text-[#179a56] hover:border-[#bce5ca] hover:bg-[#e8faef] hover:text-[#177245]",
  };
}

export function PeopleDirectoryView({
  people,
  query,
  selectedPersonId,
  canEdit,
}: {
  people: PersonListItem[];
  query: string;
  selectedPersonId?: string | null;
  canEdit: boolean;
}) {
  return (
    <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
      {people.map((person) => {
        const meta = parsePersonNotesMeta(person.notes);
        const roles = getPersonRoleValues(meta, person.primary_role);
        const primaryRole = roles[0] ?? "";
        const displayRole = roles.map((role) => getRoleDisplayName(role)).join(", ");
        const rolePresentation = getRolePresentation(primaryRole);
        const whatsappHref = getWhatsAppHref(person.phone);
        const city = meta.city || "";
        const cityIndicator = getCityIndicator(city);
        const isSelected = selectedPersonId === person.id;
        const profileHref = buildDirectoryHref({
          query,
          edit: person.id,
        });
        const state = getStatePresentation(person);
        const roleLabel = displayRole || "Sin rol";
        const cityLabel = city || "Sin ciudad";
        const actionHref = whatsappHref ?? profileHref;
        const actionLabel = whatsappHref ? "Enviar mensaje" : "Ver perfil";
        const directoryDisplayName = getDirectoryDisplayName(person.full_name);
        const currentDirectoryHref = buildDirectoryHref({
          query,
          edit: isSelected ? person.id : undefined,
        });

        return (
          <article
            key={person.id}
            className={cn(
              "group relative min-w-0 w-full max-w-full overflow-hidden rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--surface)] shadow-[0_10px_24px_rgba(28,13,16,0.05)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(28,13,16,0.07)]",
              isSelected && "border-[#f0d9de] ring-1 ring-[#f4d2da]",
            )}
          >
            <div className="pointer-events-none absolute -right-10 -top-10 size-36 rounded-full bg-[rgba(100,116,139,0.05)] blur-3xl" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 size-36 rounded-full bg-[rgba(100,116,139,0.04)] blur-3xl" />

            <div className="pointer-events-none relative h-[3.9rem] bg-[#d8dee8]" />

            <div className="relative flex justify-center -mt-9">
              <div
                className={cn(
                  "rounded-full p-1 shadow-[0_8px_18px_rgba(15,23,42,0.05)]",
                  state.avatarShellClassName,
                )}
              >
                <div
                  className={cn(
                    "flex size-20 items-center justify-center overflow-hidden rounded-full border-[3px]",
                    state.avatarInnerClassName,
                  )}
                >
                  <span
                    className={cn(
                      "text-[1.65rem] font-black tracking-[-0.06em]",
                      state.avatarTextClassName,
                    )}
                  >
                    {getInitials(person.full_name)}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-5 pb-4 pt-3 text-center">
              <div>
                <h3
                  title={person.full_name}
                  className="truncate whitespace-nowrap text-[1.08rem] font-black leading-[1.12] tracking-[-0.03em] text-[var(--foreground)] xl:text-[1.14rem]"
                >
                  {directoryDisplayName}
                </h3>
                <div className="mt-1 flex items-center justify-center gap-1.5 text-[#64748b]">
                  <rolePresentation.Icon className="size-3.5" />
                  <p className="truncate text-[11px] font-bold uppercase tracking-[0.16em]">
                    {roleLabel}
                  </p>
                </div>
                {person.platform_access_role ? (
                  <div className="mt-0.5 flex items-center justify-center gap-1.5 text-[#7b8798]">
                    <Power className="size-3.5" />
                    <p className="truncate text-[10px] font-black uppercase tracking-[0.16em]">
                      {getAppRoleDisplayName(person.platform_access_role)}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="mt-2 flex items-center justify-center gap-1.5 text-xs font-medium text-[#7b8798]">
                {cityIndicator.emoji ? (
                  <span className="inline-flex size-4 items-center justify-center text-sm leading-none">
                    {cityIndicator.emoji}
                  </span>
                ) : (
                  <MapPin className="size-4 text-[#b0bccd]" />
                )}
                <p className="max-w-[16rem] truncate">
                  {cityLabel}
                </p>
              </div>

              <div className="mt-3.5 space-y-2">
                {person.email ? (
                  <a
                    href={`mailto:${person.email}`}
                    className="group flex min-h-[3.65rem] items-center justify-center rounded-[var(--panel-radius)] border border-[#eef1f5] px-3 py-2 text-center transition hover:bg-[#fafbfc]"
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#a0abba]">
                        Correo institucional
                      </p>
                      <p className="truncate text-sm font-medium text-[#445164]">
                        {person.email}
                      </p>
                    </div>
                  </a>
                ) : (
                  <div className="flex min-h-[3.65rem] items-center justify-center rounded-[var(--panel-radius)] border border-[#eef1f5] px-3 py-2 text-center">
                    <div className="min-w-0 space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#a0abba]">
                        Correo institucional
                      </p>
                      <p className="truncate text-sm font-medium text-[#7b8798]">
                        Sin correo
                      </p>
                    </div>
                  </div>
                )}

                {person.phone ? (
                  <a
                    href={whatsappHref ?? undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex min-h-[3.65rem] items-center justify-center rounded-[var(--panel-radius)] border border-[#eef1f5] px-3 py-2 text-center transition hover:bg-[#fafbfc]"
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#a0abba]">
                        Teléfono directo
                      </p>
                      <p className="truncate text-sm font-medium text-[#445164]">
                        {person.phone}
                      </p>
                    </div>
                  </a>
                ) : (
                  <div className="flex min-h-[3.65rem] items-center justify-center rounded-[var(--panel-radius)] border border-[#eef1f5] px-3 py-2 text-center">
                    <div className="min-w-0 space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#a0abba]">
                        Teléfono directo
                      </p>
                      <p className="truncate text-sm font-medium text-[#7b8798]">
                        Sin teléfono
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-3.5 flex items-center justify-center gap-3">
                <a
                  href={actionHref}
                  target={whatsappHref ? "_blank" : undefined}
                  rel={whatsappHref ? "noreferrer" : undefined}
                  aria-label={actionLabel}
                  title={actionLabel}
                  className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-[#e6e9ef] text-[#6b778b] transition hover:bg-[#fafbfc] hover:text-[var(--foreground)]"
                >
                  <Send className="size-3.5" />
                </a>
                <Link
                  href={profileHref}
                  aria-label={`Editar a ${person.full_name}`}
                  title="Editar personal"
                  className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-[#e6e9ef] text-[#6b778b] transition hover:bg-[#fafbfc] hover:text-[var(--foreground)]"
                >
                  <Pencil className="size-3.5" />
                </Link>
                <form action={togglePersonActiveAction} className="shrink-0">
                  <input type="hidden" name="personId" value={person.id} />
                  <input
                    type="hidden"
                    name="active"
                    value={person.active ? "off" : "on"}
                  />
                  <input type="hidden" name="redirectTo" value={currentDirectoryHref} />
                  <button
                    type="submit"
                    disabled={!canEdit}
                    aria-label={`${person.active ? "Desactivar" : "Activar"} a ${person.full_name}`}
                    title={person.active ? "Desactivar" : "Activar"}
                    className={cn(
                      "inline-flex size-10 items-center justify-center rounded-full border transition",
                      state.toggleButtonClassName,
                      !canEdit && "cursor-not-allowed opacity-60",
                    )}
                  >
                    <Power className="size-3.5" />
                  </button>
                </form>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

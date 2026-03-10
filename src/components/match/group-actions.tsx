"use client";

import Link from "next/link";
import { MessageCircleMore, UsersRound } from "lucide-react";

import { CopyButton } from "@/components/ui/copy-button";
import { Card } from "@/components/ui/card";

export function GroupActions({
  groupName,
  message,
  roster,
}: {
  groupName: string;
  message: string;
  roster: Array<{
    assignmentId: string;
    roleName: string;
    personName: string;
    phone: string;
    href: string;
  }>;
}) {
  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-[var(--accent)]">
            Grupo
          </p>
          <h3 className="mt-2 text-xl font-extrabold text-[var(--foreground)]">
            WhatsApp operativo
          </h3>
        </div>
        <CopyButton value={message} label="Copiar grupo" />
      </div>
      <div className="panel-surface flex items-start gap-3 border border-[var(--border)] bg-[var(--background-soft)] p-4">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-[var(--surface)] text-[var(--accent)] shadow-sm">
          <UsersRound className="size-5" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--muted)]">
            Nombre sugerido
          </p>
          <p className="mt-2 text-lg font-extrabold text-[var(--foreground)]">
            {groupName}
          </p>
        </div>
      </div>
      <div className="space-y-3">
        {roster.map((contact) => (
          <div
            key={contact.assignmentId}
            className="panel-surface flex flex-col gap-3 border border-[var(--border)] bg-[var(--surface-muted)] p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-sm font-bold text-[var(--foreground)]">{contact.personName}</p>
              <p className="text-sm text-[var(--muted)]">
                {contact.roleName} · {contact.phone}
              </p>
            </div>
            {contact.href ? (
              <Link
                href={contact.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-[#d8eadf] bg-[#f1faf4] px-4 py-2 text-sm font-semibold text-[#237450] transition hover:bg-[#e5f6ea]"
              >
                <MessageCircleMore className="size-4" />
                Abrir WhatsApp
              </Link>
            ) : (
              <span className="text-sm text-[var(--muted)]">Sin teléfono</span>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

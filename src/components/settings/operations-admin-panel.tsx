import { ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { OperationsSnapshot } from "@/lib/data/operations";

function StatusBadge({
  ready,
  readyLabel = "Listo",
  missingLabel = "Pendiente",
}: {
  ready: boolean;
  readyLabel?: string;
  missingLabel?: string;
}) {
  if (ready) {
    return (
      <Badge className="border-[#cce8db] bg-[#effaf4] text-[#17654d]">
        {readyLabel}
      </Badge>
    );
  }

  return (
    <Badge className="border-[#f2ddb1] bg-[#fff7e8] text-[#b7791f]">
      {missingLabel}
    </Badge>
  );
}

export function OperationsAdminPanel({
  snapshot,
}: {
  snapshot: OperationsSnapshot;
}) {
  return (
    <Card className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
          <ShieldCheck className="size-[18px]" strokeWidth={1.9} />
        </span>
        <div>
          <h3 className="text-lg font-extrabold text-[var(--foreground)]">
            Funcionamiento
          </h3>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div
          className="rounded-[var(--panel-radius)] border border-[var(--border)] bg-[#fbfcfe] px-4 py-4"
          title="Indica si la conexión directa a la base de datos está configurada para tareas operativas internas."
          aria-label="DB directa: conexión directa a la base de datos para tareas operativas internas."
        >
          <p className="cursor-help text-[10px] font-black uppercase tracking-[0.22em] text-[#94a3b8]">
            DB directa
          </p>
          <div className="mt-2 flex items-center gap-2">
            <StatusBadge
              ready={snapshot.directDbConfigured}
              missingLabel="Falta SUPABASE_DB_URL"
            />
          </div>
        </div>

        <div
          className="rounded-[var(--panel-radius)] border border-[var(--border)] bg-[#fbfcfe] px-4 py-4"
          title="Indica si la clave de servicio de Supabase está disponible para acciones administrativas del sistema."
          aria-label="Service role: clave de servicio de Supabase para acciones administrativas del sistema."
        >
          <p className="cursor-help text-[10px] font-black uppercase tracking-[0.22em] text-[#94a3b8]">
            Service role
          </p>
          <div className="mt-2 flex items-center gap-2">
            <StatusBadge
              ready={snapshot.serviceRoleConfigured}
              missingLabel="Falta service role"
            />
          </div>
        </div>

        <div
          className="rounded-[var(--panel-radius)] border border-[var(--border)] bg-[#fbfcfe] px-4 py-4"
          title="Indica si el canal de Telegram está conectado para recibir alertas operativas."
          aria-label="Alertas: canal de Telegram conectado para recibir alertas operativas."
        >
          <p className="cursor-help text-[10px] font-black uppercase tracking-[0.22em] text-[#94a3b8]">
            Alertas
          </p>
          <div className="mt-2 flex items-center gap-2">
            <StatusBadge
              ready={snapshot.telegramConfigured}
              readyLabel="Telegram activo"
              missingLabel="Sin Telegram"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

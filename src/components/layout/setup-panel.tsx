import Link from "next/link";

import { Card } from "@/components/ui/card";

export function SetupPanel() {
  return (
    <Card className="space-y-4 border-[#f2d8ae] bg-[#fffaf0]">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-[#9a5a0f]">
          Configuración pendiente
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
          Falta conectar Supabase
        </h2>
      </div>
      <div className="space-y-2 text-sm text-[var(--muted)]">
        <p>
          1. Copia <code>.env.example</code> a <code>.env.local</code> y completa{" "}
          <code>NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
        </p>
        <p>
          2. Ejecuta en orden los SQL dentro de <code>supabase/migrations/</code>{" "}
          y luego <code>supabase/seed.sql</code>.
        </p>
        <p>
          3. Si vas a usar el importador CSV, agrega también{" "}
          <code>SUPABASE_SERVICE_ROLE_KEY</code>.
        </p>
        <p>
          4. Promueve tu usuario a <code>admin</code> desde la tabla{" "}
          <code>profiles</code>.
        </p>
      </div>
      <Link
        href="https://supabase.com/dashboard"
        target="_blank"
        rel="noreferrer"
        className="inline-flex rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--foreground)] transition hover:bg-[var(--background-soft)]"
      >
        Abrir Supabase
      </Link>
    </Card>
  );
}

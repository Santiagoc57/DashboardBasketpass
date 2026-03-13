import Link from "next/link";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";

import { requestPasswordResetAction } from "@/app/actions/auth";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { PageMessage } from "@/components/ui/page-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { parseNotice } from "@/lib/search-params";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ForgotPasswordPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const { intent, notice } = parseNotice(resolvedSearchParams);

  return (
    <AuthPageShell
      eyebrow="Recuperar acceso"
      title="Restablece tu contraseña"
      description="Te enviaremos un enlace seguro a tu correo para crear una nueva contraseña."
      footer={
        <p className="mt-6 text-center text-sm font-medium text-[var(--muted)] xl:mt-8">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-[var(--foreground)] underline transition hover:text-[var(--accent)]"
          >
            <ArrowLeft className="size-4" />
            Volver al login
          </Link>
        </p>
      }
    >
      <PageMessage intent={intent} message={notice} />

      <form action={requestPasswordResetAction} className="mt-5 space-y-[18px]">
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-[var(--foreground)]">
            Correo electrónico
          </span>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[var(--muted)]">
              <Mail className="size-5" />
            </div>
            <input
              type="email"
              name="email"
              placeholder="operaciones@canal.com"
              autoComplete="email"
              required
              className="block h-[52px] w-full rounded-[var(--panel-radius)] border border-[var(--border)] bg-[var(--background-soft)] pl-11 pr-4 text-[15px] text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[rgba(230,18,56,0.12)] xl:h-14 xl:pl-12 xl:text-base"
            />
          </div>
        </label>

        <div className="grid gap-3 pt-3">
          <SubmitButton
            pendingLabel="Enviando..."
            className="h-[52px] w-full gap-2 text-[15px] font-bold shadow-[0_8px_24px_rgba(230,18,56,0.26)] xl:h-14 xl:text-base"
          >
            Enviar enlace de recuperación
            <ArrowRight className="size-5" />
          </SubmitButton>
        </div>
      </form>
    </AuthPageShell>
  );
}

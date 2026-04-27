# Basket Production

Dashboard operativo para programación deportiva con Next.js, Tailwind y Supabase.

## Incluye

- Login con Supabase Auth
- Grilla por día o mes con buscador y filtros por liga, modo, estado y responsable
- Detalle del partido con edición de datos base, asignaciones por rol, historial y conflictos por solape
- ABM de personas y roles
- Auditoría automática en `audit_log`
- RLS para `admin`, `editor`, `coordinator`, `collaborator` y `viewer`
- Bandeja admin de reportes de equipos en `Settings`
- Link dinámico a Google Calendar y panel `GRUPO` con copiar / abrir WhatsApp
- Importador CSV en `tools/import`
- Primera pantalla móvil `Mi jornada` para colaboradores vinculados por correo o nombre a `Personal`

## Stack

- Next.js 16 App Router
- Tailwind CSS 4
- Supabase (`@supabase/ssr`, Postgres, Auth)

## Calidad y proceso

- `CHANGELOG.md`: historial de cambios relevantes
- `CONTRIBUTING.md`: normas de desarrollo y definición de done
- `docs/production-sheet.md`: hoja de produccion visual con tipografia, colores y reglas del sistema
- `docs/roadmap.md`: hoja de ruta funcional y técnica para `Producción`, `Reportes`, `Incidencias`, `Equipos`, `Personal` e IA
- `docs/colaboradores.md`: propuesta de portal móvil para colaboradores, permisos, flujos y modelo de datos sugerido
- `docs/entrega-profesional/README.md`: paquete de entrega profesional con arquitectura, permisos, runbook, QA y operacion
- `docs/entrega-profesional/12-backup-restore-operacional.md`: comandos de backup, restore y verificacion operacional
- `.github/workflows/ci.yml`: verificación automática en push y PR
- `.github/pull_request_template.md`: checklist mínima para cambios reales

Comandos de verificación:

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run check
```

`npm run check` ejecuta lint, typecheck, pruebas unitarias y build.

Comandos operativos:

```bash
npm run ops:db-backup
npm run ops:db-backup:plain
npm run ops:db-backups -- --latest
npm run ops:db-apply -- --file supabase/migrations/0014_harden_collaborator_rls.sql
npm run ops:db-restore:dry-run -- --file backups/db/archivo.dump
npm run ops:recovery-smoke
```

La documentación operativa clave vive en `docs/entrega-profesional/`.

## Setup

1. Instala dependencias:

```bash
npm install
```

2. Crea tu entorno local:

```bash
cp .env.example .env.local
```

3. Completa estas variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_TIMEZONE=America/Bogota
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPPORT_EMAIL=soporte@basketproduction.pro
```

Variables opcionales:

```bash
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DB_URL=
ALLOW_GUEST_MI_JORNADA=false
PORTAL_GEMINI_API_KEY=
PORTAL_GEMINI_MODEL=gemini-2.5-flash
MATCH_LOOKUP_API_URL=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
OPERATION_ALERT_WEBHOOK_URL=
```

`SUPABASE_SERVICE_ROLE_KEY` es necesaria para el importador CSV. Las demás se usan para funciones opcionales.
`SUPABASE_DB_URL` se usa para backup, restore y verificación operacional.
`TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID` activan alertas operativas por Telegram. Si están vacíos, el sistema usa `OPERATION_ALERT_WEBHOOK_URL` si existe; si no, solo registra el evento en consola.

4. En Supabase ejecuta, en orden, todos los archivos de `supabase/migrations/` y luego `supabase/seed.sql`.

Migraciones actuales:

- `supabase/migrations/0001_initial.sql`
- `supabase/migrations/0002_fix_audit_trigger.sql`
- `supabase/migrations/0003_add_operator_roles.sql`
- `supabase/migrations/0004_allow_collaborator_edit.sql`
- `supabase/migrations/0005_add_match_intake_fields.sql`
- `supabase/migrations/0006_add_announcements.sql`
- `supabase/migrations/0007_add_collaborator_reports.sql`
- `supabase/migrations/0008_add_app_settings.sql`
- `supabase/migrations/0009_fix_audit_log_match_delete_fk.sql`
- `supabase/migrations/0010_add_announcement_scheduling_and_customization.sql`
- `supabase/migrations/0011_add_announcement_audience_targeting.sql`
- `supabase/migrations/0012_add_collaborator_report_evidence_storage.sql`
- `supabase/migrations/0013_add_team_issue_reports.sql`
- `supabase/migrations/0014_harden_collaborator_rls.sql`
- `supabase/seed.sql`

5. Crea o invita un usuario en Supabase Auth y luego promuévelo a admin:

```sql
update public.profiles
set role = 'admin'
where id = '<AUTH_USER_ID>';
```

Roles disponibles:

- `admin`: acceso total
- `editor`: edición operativa general
- `coordinator`: edición operativa sin administración global
- `collaborator`: acceso móvil inicial a `Mi jornada` y edición operativa temporal mientras se completa el portal de cargas
- `viewer`: solo lectura

6. Levanta el proyecto:

```bash
npm run dev
```

## Importar CSV

El importador mapea columnas típicas como `Día`, `Hora`, `Liga`, `Producción`, `Partido`, `Local`, `Visitante`, `Responsable`, `Observaciones` y trata el resto de columnas como roles.

```bash
npm run import:csv -- ./archivo.csv
```

También acepta una zona horaria por argumento:

```bash
npm run import:csv -- ./archivo.csv America/Bogota
```

## Rutas

- `/login`
- `/grid`
- `/match/[id]`
- `/mi-jornada`
- `/people`
- `/roles`
- `/api/health`

## Notas

- Si faltan variables de entorno, la app muestra un panel de setup en lugar de romper durante el build.
- La auditoría se genera desde triggers SQL sobre `matches`, `people`, `roles` y `assignments`.
- Los conflictos por solape se calculan en el detalle del partido usando la ventana `kickoff_at + duration_minutes`.

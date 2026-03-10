# Basket Production

Dashboard operativo para programación deportiva con Next.js, Tailwind y Supabase.

## Incluye

- Login con Supabase Auth
- Grilla por día o mes con buscador y filtros por liga, modo, estado y responsable
- Detalle del partido con edición de datos base, asignaciones por rol, historial y conflictos por solape
- ABM de personas y roles
- Auditoría automática en `audit_log`
- RLS para `admin`, `editor`, `coordinator`, `collaborator` y `viewer`
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
- `.github/workflows/ci.yml`: verificación automática en push y PR
- `.github/pull_request_template.md`: checklist mínima para cambios reales

Comandos de verificación:

```bash
npm run lint
npm run typecheck
npm run check
```

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
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_TIMEZONE=America/Bogota
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. En Supabase ejecuta:

- `supabase/migrations/0001_initial.sql`
- `supabase/migrations/0002_fix_audit_trigger.sql`
- `supabase/migrations/0003_add_operator_roles.sql`
- `supabase/migrations/0004_allow_collaborator_edit.sql`
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

# 2026-04-23 - Aplicacion controlada de migraciones 0003 y 0014

## Objetivo

Cerrar el endurecimiento real de permisos de `collaborator` en producción y
dejar evidencia del procedimiento aplicado.

## Hallazgos previos

- El repo ya tenia `0014_harden_collaborator_rls.sql`, pero faltaba una forma
  segura de ejecutar SQL operativo leyendo `.env.local` sin romper passwords con
  caracteres especiales.
- La base de producción no tenia aplicada `0003_add_operator_roles.sql`, por lo
  que el enum `public.app_role` no incluia `coordinator` ni `collaborator`.

## Acciones ejecutadas

1. Se agrego el comando:

   ```bash
   npm run ops:db-apply -- --file supabase/migrations/archivo.sql
   ```

2. Se verifico el plan de ejecucion para `0014`:

   ```bash
   npm run ops:db-apply -- --file supabase/migrations/0014_harden_collaborator_rls.sql --dry-run
   ```

3. Se aplico `0003_add_operator_roles.sql` sin transaccion unica por el cambio
   de enum:

   ```bash
   npm run ops:db-apply -- --file supabase/migrations/0003_add_operator_roles.sql --no-single-transaction
   ```

4. Se aplico `0014_harden_collaborator_rls.sql`:

   ```bash
   npm run ops:db-apply -- --file supabase/migrations/0014_harden_collaborator_rls.sql
   ```

## Resultado

- `0003` quedo aplicada correctamente en Supabase.
- `0014` quedo aplicada correctamente en Supabase.
- Se recrearon las funciones de acceso y las policies scoped para:
  - `public.collaborator_reports`
  - `storage.objects` del bucket `collaborator-report-evidence`

## Riesgos o pendientes

- Falta validar el flujo completo con una sesion real de `collaborator`:
  - abrir `mi-jornada`
  - enviar reporte
  - subir evidencia
- Si se siguen aplicando migraciones manuales fuera del repo, hay riesgo de
  volver a desalinear producción respecto a la secuencia versionada.

## Criterio de cierre restante

No dar por cerrado el frente de permisos hasta completar la prueba funcional
con un usuario `collaborator` real.

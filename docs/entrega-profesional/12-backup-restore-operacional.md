# Backup y restore operacional

## Objetivo

Dejar un proceso concreto para respaldar y recuperar el estado del sistema
cuando hay cambios de schema, incidente de datos o deploy fallido.

## Variables necesarias

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_URL`

## Comandos del repo

- `npm run ops:db-backup`
- `npm run ops:db-backup:plain`
- `npm run ops:db-backups -- --latest`
- `npm run ops:db-apply -- --file supabase/migrations/archivo.sql`
- `npm run ops:db-restore:dry-run -- --file backups/db/archivo.dump`
- `npm run ops:db-restore -- --file backups/db/archivo.dump --confirm-restore <db-name>`
- `npm run ops:recovery-smoke`

Los dumps se escriben en `backups/db/` y el manifiesto de cada backup en
`backups/manifests/`.

## Backup de base de datos

### Opcion recomendada

```bash
npm run ops:db-backup
```

### Opcion SQL plana

```bash
npm run ops:db-backup:plain
```

### Ejemplos utiles

```bash
npm run ops:db-backup -- --tag pre-release
npm run ops:db-backup -- --output backups/db/release-20260423.dump
npm run ops:db-backup -- --dry-run
```

## Restore de base de datos

### Primero: revisar el plan

```bash
npm run ops:db-restore:dry-run -- --file backups/db/basket-production-YYYYMMDD-HHMMSS.dump
```

El `dry-run` muestra:

- formato detectado,
- base de destino,
- manifiesto del backup si existe,
- token exacto que exige el restore.

### Restore desde dump custom o SQL plano

```bash
npm run ops:db-restore -- --file backups/db/basket-production-YYYYMMDD-HHMMSS.dump --confirm-restore postgres
```

El restore exige `--confirm-restore <db-name>` para reducir ejecuciones
accidentales. El valor correcto sale en el `dry-run`.

## Aplicacion de SQL operativo

Para aplicar migraciones o fixes puntuales desde el repo:

```bash
npm run ops:db-apply -- --file supabase/migrations/0014_harden_collaborator_rls.sql
```

Si el SQL agrega valores nuevos a un enum y luego los usa en el mismo archivo,
ejecutar sin transaccion unica:

```bash
npm run ops:db-apply -- --file supabase/migrations/0003_add_operator_roles.sql --no-single-transaction
```

## Storage

El bucket `collaborator-report-evidence` no vive dentro del dump SQL. Si hace
falta recuperación completa, exportar el bucket por separado con la herramienta
del proveedor o con una copia de objetos.

## Verificacion posterior

Despues del restore o un deploy sensible:

```bash
npm run ops:recovery-smoke
```

Ese chequeo valida:

- acceso a tablas criticas,
- acceso a `audit_log`,
- existencia del bucket de evidencia,
- conectividad real contra Supabase.

## Estado actual

- Ya existe tooling operativo en el repo para crear dumps y preparar restores.
- Sigue faltando ejecutar un simulacro documentado de restore en un entorno
  aislado antes de cerrar este frente como resuelto.

## Criterio de cierre

No cerrar el incidente hasta verificar:

- login,
- lectura de datos,
- escritura controlada,
- auditoria,
- evidencias,
- bucket de storage.

# Simulacro controlado de restore dry-run

## Resumen

- Fecha: 2026-04-23
- Responsable: Santiago / Codex
- Escenario: verificacion operativa de backup existente y `restore dry-run`
- Severidad inicial: `warning`
- Deteccion: simulacro manual controlado
- Ultimo cambio identificado: incorporacion del tooling operativo de backup, restore y runbook

## Objetivo

Validar que el equipo puede:

- confirmar salud de la app,
- validar acceso a datos y Storage,
- identificar el ultimo backup disponible,
- preparar un restore seguro sin ejecutar cambios destructivos.

## Evidencia

### Healthcheck

- Endpoint verificado: `GET /api/health`
- Resultado:
  `ok: true`
- Base de datos:
  `Conectado.`
- Storage:
  `Bucket de evidencia disponible.`
- Timestamp:
  `2026-04-23T22:59:09.597Z`

### Recovery smoke

- Comando:
  `npm run ops:recovery-smoke`
- Resultado general:
  `ok: true`
- Tablas verificadas:
  `profiles`, `people`, `roles`, `matches`, `assignments`, `audit_log`, `announcements`, `collaborator_reports`, `app_settings`
- Conteos observados:
  `profiles=4`, `people=6`, `roles=18`, `matches=1`, `assignments=3`, `audit_log=25`, `announcements=3`, `collaborator_reports=1`, `app_settings=0`
- Storage verificado:
  bucket `collaborator-report-evidence`, privado, `fileSizeLimit=5242880`

### Backup objetivo

- Comando:
  `npm run ops:db-backups -- --latest`
- Archivo:
  `backups/db/basket-production-20260423-173435.dump`
- Manifiesto:
  `backups/manifests/basket-production-20260423-173435.dump.json`
- Formato:
  `custom`
- Tamano:
  `266522 bytes`
- Hash SHA-256:
  `59e9dae83499786a389a279a8f7057519496a04079cc52ba3e907c232fd47554`
- Estado del archivo:
  `outputExists: true`

### Restore dry-run

- Comando:
  `npm run ops:db-restore:dry-run -- --file backups/db/basket-production-20260423-173435.dump`
- Resultado general:
  `ok: true`
- Formato detectado:
  `custom`
- Base objetivo:
  `postgres`
- Confirmacion esperada para restore real:
  `postgres`
- Restore real ejecutado:
  `no`

## Resultado final

- Estado final:
  sano
- Restore destructivo requerido:
  no
- Rollback de codigo requerido:
  no
- Causa raiz:
  simulacro preventivo, no incidente real
- Aprendizaje:
  el flujo operativo ya permite validar backup, manifiesto y restore `dry-run` sin improvisar

## Siguiente mejora

- Repetir el simulacro en un entorno aislado con restore real si el cambio de schema o de datos lo justifica.

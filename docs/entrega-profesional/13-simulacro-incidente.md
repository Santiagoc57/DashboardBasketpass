# Simulacro de incidente

## Objetivo

Dejar una plantilla simple para evidenciar que el runbook y el rollback ya se
probaron al menos una vez.

## Escenario sugerido

- deploy con fallo de escritura,
- migracion fallida en staging,
- bucket de evidencia no disponible,
- alerta de Telegram no entregada.

## Registro

- Fecha:
- Responsable:
- Escenario:
- Severidad inicial:
- Deteccion:
- Ultimo cambio identificado:

## Pasos ejecutados

1. `GET /api/health`
2. `npm run ops:recovery-smoke`
3. `npm run ops:db-backups -- --latest`
4. rollback de codigo o restore dry-run
5. verificacion final

## Evidencia

- Resultado de `health`:
- Resultado de `recovery-smoke`:
- Backup objetivo:
- Accion de rollback:
- Estado final:

## Cierre

- Causa raiz:
- Mejora pendiente:
- Fecha del siguiente simulacro:

## Ultima evidencia registrada

- [2026-04-23 - Simulacro controlado de restore dry-run](./simulacros/2026-04-23-restore-dry-run.md)
- [2026-04-23 - Aplicacion controlada de migraciones 0003 y 0014](./simulacros/2026-04-23-migracion-rls-collaborator.md)
- [2026-04-23 - Verificacion funcional de collaborator](./simulacros/2026-04-23-verificacion-funcional-collaborator.md)

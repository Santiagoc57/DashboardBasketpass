# 2026-04-23 - Evidencia de salida para handoff

## Objetivo

Dejar registro del estado mínimo de salida antes de entregar la plataforma.

## Evidencia ejecutada

### Backup fresco

Comando:

```bash
npm run ops:db-backup -- --tag handoff-final
```

Resultado:

- dump: `backups/db/basket-production-20260423-203758-handoff-final.dump`
- manifiesto: `backups/manifests/basket-production-20260423-203758-handoff-final.dump.json`
- hash SHA-256: `5923c9e721b26723165fac223f0f31b4892a7dfdfaa080247dd140883eef5f92`

### Verificación del último backup

Comando:

```bash
npm run ops:db-backups -- --latest
```

Resultado:

- el dump existe,
- el manifiesto existe,
- el archivo es legible desde el repo.

### Smoke operativo

Comando:

```bash
npm run ops:recovery-smoke
```

Resultado:

- estado general: `ok`
- acceso confirmado a tablas críticas,
- bucket `collaborator-report-evidence` disponible,
- conectividad real con Supabase confirmada.

## Observaciones

- La cuenta de prueba usada para validar collaborator ya fue eliminada antes de
  este cierre.
- El paquete de entrega ya incluye manual corto para cliente y documentación
  operativa para soporte técnico.

# Runbook de operacion

## Objetivo

Responder incidentes sin improvisar, con una secuencia clara de:

- deteccion,
- contencion,
- verificacion,
- cierre.

## Alcance

Este runbook aplica a:

- caidas de login,
- fallas de escritura,
- errores de Storage,
- deploys fallidos,
- migraciones fallidas,
- alertas operativas recibidas por Telegram.

## Roles minimos

- `Incident commander`: decide si se congela el release, rollback o restore.
- `Operador tecnico`: ejecuta chequeos, backups, restores y smoke tests.
- `Comunicacion`: avisa a usuarios internos si el incidente afecta operacion.

Si trabajas solo, los tres roles recaen sobre la misma persona.

## Severidad inicial

- `critical`: login caido, escritura caida, storage roto, deploy roto, migracion fallida.
- `warning`: feature degradada, alertas repetidas sin corte total, bandejas o automatismos secundarios.

## Primeros 5 minutos

1. Confirmar el area afectada desde Telegram o desde el reporte manual.
2. Congelar cambios si el incidente aparecio durante release o migracion.
3. Ejecutar `GET /api/health` y registrar el resultado.
4. Ejecutar `npm run ops:recovery-smoke`.
5. Revisar el ultimo backup con `npm run ops:db-backups -- --latest`.

## Comandos utiles

```bash
npm run ops:recovery-smoke
npm run ops:db-backups -- --latest
npm run ops:db-backup
npm run ops:db-restore:dry-run -- --file backups/db/archivo.dump
```

## Flujo comun por incidente

1. Confirmar impacto.
2. Identificar ultimo cambio relevante:
   release, migracion, cambio de variables, cambio de permisos o incidente manual.
3. Decidir contencion:
   rollback de codigo, rollback funcional, restore de DB o correccion puntual.
4. Ejecutar la accion elegida.
5. Verificar:
   `health`, `recovery-smoke`, login, lectura y una escritura no destructiva.
6. Cerrar comunicacion y registrar causa raiz.

## Playbooks

### Healthcheck o recovery smoke fallan

1. Validar variables de entorno del servidor.
2. Confirmar conectividad a Supabase y existencia del bucket de evidencia.
3. Si el fallo coincide con un deploy reciente, revertir codigo primero.
4. Si el fallo coincide con una migracion, preparar rollback o restore antes de reabrir trafico.

### Error de escritura en datos operativos

1. Confirmar que el error afecte `matches`, `assignments`, `people`, `roles` o `team_issue_reports`.
2. Revisar si el rol del usuario y RLS permiten la accion esperada.
3. Revisar si hubo cambio reciente en server actions, payload o migraciones.
4. Si la lectura funciona pero la escritura no, priorizar rollback de codigo.

### Falla en subida de adjuntos

1. Confirmar existencia del bucket `collaborator-report-evidence`.
2. Revisar politicas de Storage y tamaño/tipo del archivo.
3. Si la app quedo sana salvo Storage, marcar incidente como degradacion parcial.
4. No ejecutar restore de DB por un fallo aislado de bucket sin evidencia de perdida de datos.

### Deploy fallido

1. Congelar nuevos cambios.
2. Volver al ultimo deploy sano.
3. Confirmar que el `healthcheck` vuelva a verde.
4. Ejecutar `npm run ops:recovery-smoke`.
5. Verificar login, grid y una escritura controlada.

### Migracion fallida

1. Frenar despliegues adicionales.
2. Identificar si la migracion fue:
   solo aditiva, destructiva o de transformacion de datos.
3. Si fue solo aditiva y rompio la app, probar rollback de codigo primero.
4. Si toco datos o borro estructuras, preparar restore desde el backup mas reciente.
5. Correr `npm run ops:db-restore:dry-run -- --file <backup>` antes de cualquier restore real.

### Telegram no recibe alertas

1. Confirmar `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID`.
2. Verificar que el bot siga presente en el chat.
3. Probar `GET /api/health?notify=1` solo si el healthcheck esta degradado o se necesita forzar validacion del canal.
4. Si Telegram esta roto pero la app esta sana, tratarlo como degradacion de monitoreo.

## Criterio de cierre

No cerrar un incidente hasta cumplir esto:

- `GET /api/health` sano,
- `npm run ops:recovery-smoke` sano,
- login sano,
- lectura de datos sana,
- una escritura controlada sana,
- mensaje de cierre documentado.

## Registro minimo del incidente

- fecha y hora,
- area afectada,
- severidad,
- sintoma inicial,
- ultimo cambio identificado,
- accion tomada,
- evidencia de verificacion,
- causa raiz,
- accion preventiva.

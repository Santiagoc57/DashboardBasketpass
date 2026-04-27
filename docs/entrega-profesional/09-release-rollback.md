# Release y rollback

## Objetivo

Desplegar con evidencia previa y volver atras sin improvisar si algo sale mal.

## Antes del release

Checklist minima:

- `CI` verde.
- migraciones revisadas.
- variables de entorno revisadas.
- backup previo listo.
- responsable del despliegue definido.
- criterio de rollback acordado.

## Comandos previos recomendados

```bash
npm run check
npm run ops:db-backup
npm run ops:db-backups -- --latest
```

## Orden recomendado de release

1. Confirmar el commit o tag que vas a desplegar.
2. Ejecutar backup previo.
3. Desplegar en staging si existe.
4. Ejecutar smoke test en staging.
5. Desplegar en produccion.
6. Ejecutar `GET /api/health`.
7. Ejecutar `npm run ops:recovery-smoke`.
8. Monitorear Telegram por al menos 15 minutos.

## Smoke test minimo

- login,
- carga de grid,
- apertura de un partido,
- lectura de personas y roles,
- una escritura no destructiva,
- subida de evidencia si el cambio toca reportes o adjuntos.

## Decision de rollback

### Caso 1: fallo de UI o server action sin cambio destructivo de schema

Accion:

1. revertir codigo o redeploy del ultimo commit sano,
2. volver a correr `health`,
3. validar que no haga falta restore de DB.

### Caso 2: cambio aditivo de schema y la app rompio

Accion:

1. rollback de codigo primero,
2. dejar la migracion aplicada si no rompe el estado,
3. validar comportamiento con `recovery-smoke`.

### Caso 3: migracion destructiva o transformacion de datos fallida

Accion:

1. congelar cambios,
2. elegir el backup objetivo con `npm run ops:db-backups -- --latest`,
3. ejecutar `npm run ops:db-restore:dry-run -- --file <backup>`,
4. restaurar solo en entorno aislado primero,
5. abrir produccion solo cuando la verificacion pase.

## Secuencia de rollback operativo

1. Congelar nuevos cambios.
2. Registrar hora del incidente y ultimo release sano.
3. Ejecutar rollback de codigo o preparar restore segun el caso.
4. Verificar:
   `GET /api/health`, `npm run ops:recovery-smoke`, login y escritura controlada.
5. Comunicar cierre o degradacion parcial.

## Restore y evidencia

Antes de un restore real, debe quedar registrado:

- archivo de backup elegido,
- manifiesto asociado,
- hora del backup,
- hash del dump,
- razon del restore,
- responsable.

## Criterio de salida

No se considera cerrado hasta que:

- el deploy estable este activo,
- la app responda sana,
- los datos criticos esten accesibles,
- las alertas se normalicen,
- quede anotado si hubo rollback de codigo, restore de DB o ambos.

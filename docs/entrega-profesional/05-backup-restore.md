# Backup y restore

## Objetivo

Poder recuperar la operacion si hay perdida de datos o un mal deploy.

## Que se debe respaldar

- base de datos.
- storage de adjuntos.
- variables de entorno.
- migraciones y seed.
- archivos de configuracion de despliegue.

## Politica recomendada

- backup diario automatico.
- retencion definida por negocio.
- backup antes de cambios de schema.
- backup antes de release mayor.

## Restore

Debe existir un procedimiento probado para:

- restaurar base completa.
- restaurar una tabla o rango temporal.
- validar integridad despues del restore.
- verificar acceso y permisos.

## Procedimiento sugerido

### Antes del cambio

1. Confirmar el alcance de la migracion.
2. Crear backup o snapshot reciente.
3. Registrar la version que se va a desplegar.
4. Verificar que exista un plan de rollback.

### Si hace falta restaurar

1. Restaurar en un entorno aislado.
2. Validar que autentica, lee y escribe.
3. Revisar tablas clave: `profiles`, `matches`, `assignments`, `audit_log`.
4. Revisar evidencias en Storage.
5. Cuando el restore sea correcto, apuntar la app al entorno recuperado o rehidratar el entorno de produccion.

## Pruebas que conviene hacer

- restore en entorno de staging.
- restauracion de un backup reciente.
- verificacion de adjuntos.
- verificacion de auditoria post-restore.

## Criterio de salida

No se considera listo si no puedes explicar:

- de dónde sale el backup,
- cuánto tiempo tarda restaurar,
- cómo validas que la restauración fue correcta,
- qué datos no se recuperan automáticamente.

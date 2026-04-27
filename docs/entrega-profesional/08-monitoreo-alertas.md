# Monitoreo y alertas

## Objetivo

Saber rapido cuando algo se rompe, se degrada o pierde datos.

## Lo minimo que deberia monitorearse

- disponibilidad de la app.
- disponibilidad de Supabase.
- errores HTTP.
- errores de server actions y routes.
- latencia de consultas criticas.
- fallos de build o deploy.
- volumen de auditoria inesperado.

## Alertas utiles

- healthcheck devuelve error.
- login falla por encima de umbral.
- subida de adjuntos falla.
- importacion falla.
- migracion falla.
- error rate alto en rutas criticas.

## Log deseado

Cada log importante deberia incluir:

- timestamp.
- usuario o actor.
- ruta o accion.
- entidad afectada.
- correlation id si existe.
- resultado.

## Recomendacion

No depender solo de `console.log`.
Usar una estrategia consistente de:

- logs estructurados.
- errores capturados.
- alertas accionables.

## Monitoreo minimo recomendado

- `GET /api/health` como chequeo sintético.
- estado de build y deploy en el proveedor de hosting.
- errores de autenticación y rutas críticas.
- fallas de escritura en `matches`, `assignments` y `collaborator_reports`.
- fallas de subida a Storage.
- actividad anómala en `audit_log`.

## Umbrales iniciales

- 1 fallo de healthcheck sostenido por 5 minutos.
- 3 o más errores consecutivos en login.
- cualquier error en subida de adjuntos.
- cualquier migración que falle en staging o producción.

## Accion esperada

Cada alerta debe tener:

1. un dueño,
2. un mensaje claro,
3. una acción inmediata,
4. un criterio de cierre.

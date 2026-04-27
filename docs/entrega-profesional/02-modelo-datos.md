# Modelo de datos

## Objetivo

Dejar claro que entidad existe, como se relaciona y cual es su fuente de
verdad.

## Entidades centrales

- `matches`: entidad principal de produccion.
- `people`: personas operativas y administrativas.
- `roles`: catalogo de roles.
- `assignments`: relacion entre persona, partido y rol.
- `audit_log`: trazabilidad de cambios.
- `announcements`: comunicados operativos.
- `collaborator_reports`: carga operativa de colaboradores.
- `app_settings`: configuracion de negocio.

## Reglas de negocio que conviene explicitar

- Un partido es la unidad madre.
- Cada asignacion debe colgar de un partido.
- Toda edicion importante debe dejar trazabilidad.
- Los cambios sensibles requieren revisar permisos y auditoria.
- Las horas deben interpretarse con la timezone de aplicacion.

## Documentacion que deberia existir por tabla

- proposito
- campos
- tipos
- nullability
- default
- indices
- llaves foraneas
- politicas de RLS
- triggers
- responsabilidad de escritura

## Estado actual

El repo ya tiene migraciones versionadas en `supabase/migrations/` y una
secuencia de arranque documentada en `README.md`.

## Huecos habituales

- Diccionario de datos formal.
- Decisiones de nombres para campos duplicados o historicos.
- Politica de retencion para evidencias y adjuntos.
- Estrategia para evolucion de schema sin romper reportes.

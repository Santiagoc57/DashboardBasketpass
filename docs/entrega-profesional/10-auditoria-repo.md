# Auditoria del repo

## Resumen

El repositorio ya tiene una base mejor que un dashboard improvisado, pero aun
le faltan varias piezas para verse como entrega senior.

## Lo que ya esta bien encaminado

- App en Next.js con App Router.
- Supabase como backend.
- Roles y RLS.
- Auditoria automatica.
- Tests de utilidades puras ejecutables con Node.
- Matriz de permisos y diccionario de datos en desarrollo.
- Separacion explicita entre edicion global y operacion colaborador.
- CI de lint, typecheck y build.
- Documentacion inicial de proceso y roadmap.

## Critico

- Backup y restore ya tienen tooling operativo y un simulacro controlado de `restore dry-run`; falta repetirlo en entorno aislado si el riesgo del cambio lo exige.
- Falta monitoreo y alertas conectadas a un proveedor real.
- Runbook y rollback ya estan documentados y ya se usaron en un simulacro controlado; falta repetirlos de forma periodica.

## Importante

- El modelo de permisos del colaborador ya quedó más acotado en app y RLS, pero la lectura global sigue abierta para autenticados y podría endurecerse más si el negocio lo exige.
- Falta completar el diccionario de datos con ejemplos de uso y owners.
- Falta ampliar los ADRs iniciales con mas decisiones estructurales.
- Falta un flujo de QA mas completo para cambios sensibles.
- Falta explicitar contratos entre UI, acciones y datos.

## Deseable

- Diagrama visual de arquitectura.
- Diagrama ER del modelo de datos.
- SLO o objetivos internos de disponibilidad.
- Guia de soporte para usuarios internos.
- Evidencia automatica de performance y accesibilidad.

## Prioridad de cierre

1. Backup y restore.
2. Monitoreo y alertas.
3. Runbook.
4. Rollback.
5. ADRs restantes y endurecimiento fino de permisos.

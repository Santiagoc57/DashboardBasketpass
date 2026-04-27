# Arquitectura

## Objetivo

Separar la aplicacion en capas claras para que el dashboard sea mantenible,
seguro y facil de operar.

## Capas

- Presentacion: rutas de Next.js, componentes UI y estado local.
- Dominio: reglas de negocio, permisos, validaciones y calculos.
- Datos: Supabase, consultas, mutaciones, storage y triggers.
- Operacion: auditoria, logs, monitoreo, backups y runbooks.

## Flujo recomendado

```text
Usuario -> pagina/accion -> validacion -> politica de acceso
       -> capa de dominio -> Supabase -> respuesta
       -> auditoria / log / UI de estado
```

## Piezas ya presentes en el repo

- Next.js App Router.
- Supabase Auth, Postgres y RLS.
- Auditoria automatica en `audit_log`.
- Healthcheck basico en `/api/health`.
- CI con lint, typecheck y build.

## Riesgos a cerrar

- No existe un mapa formal de servicios, ownership y dependencias.
- No hay diagrama de despliegue ni de entorno.
- No hay contrato explicito entre UI, backend y datos.
- Falta documentar que se ejecuta en server actions, routes y triggers.

## Recomendacion de entrega

- Mantener la UI solo para interaccion.
- Centralizar validaciones en funciones reutilizables.
- Evitar logica critica duplicada entre componentes y acciones.
- Documentar todo flujo que toque permisos, auditoria o estado final.


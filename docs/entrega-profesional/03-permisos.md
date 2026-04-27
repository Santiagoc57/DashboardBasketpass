# Matriz de permisos

## Objetivo

Definir quien puede ver, crear, editar, certificar y borrar.

## Roles

- `admin`: acceso total.
- `editor`: edicion operativa general.
- `coordinator`: edicion operativa con limites administrativos.
- `collaborator`: carga de trabajo sobre sus asignaciones.
- `viewer`: solo lectura.

## Matriz real actual

Esta es la fotografia del esquema actual segun las políticas RLS.

| Recurso | Leer | Crear | Editar | Borrar |
| --- | --- | --- | --- | --- |
| `profiles` | autenticados | self o admin | self o admin | no aplica |
| `people` | autenticados | `can_edit()` | `can_edit()` | `can_edit()` |
| `roles` | autenticados | `can_edit()` | `can_edit()` | `can_edit()` |
| `matches` | autenticados | `can_edit()` | `can_edit()` | `can_edit()` |
| `assignments` | autenticados | `can_edit()` | `can_edit()` | `can_edit()` |
| `audit_log` | autenticados | `can_edit()` | no aplica | no aplica |
| `announcements` | autenticados | admin | admin | admin |
| `collaborator_reports` | backoffice o propio | backoffice o propio | backoffice o propio | backoffice |
| `app_settings` | autenticados | admin | admin | admin |
| `storage.objects` del bucket de evidencia | backoffice o asignacion propia | backoffice o asignacion propia | backoffice o asignacion propia | backoffice o asignacion propia |

## Matriz recomendada para UI

La app debe ocultar acciones aunque la DB las permita.

| Recurso | admin | editor | coordinator | collaborator | viewer |
| --- | --- | --- | --- | --- | --- |
| Partidos | leer/editar/borrar | leer/editar | leer/editar | leer limitado | leer |
| Personas | leer/editar/borrar | leer/editar | leer | leer limitado | leer |
| Roles | leer/editar/borrar | leer | leer | no | leer |
| Reportes | leer/editar/certificar | leer/editar | leer/editar | crear/editar propios | leer |
| Incidencias | leer/editar/borrar | leer/editar | leer/editar | crear/editar propias | leer |
| Adjuntos | leer/editar/borrar | leer/editar | leer/editar | subir propios | leer |
| Settings | leer/editar | no | no | no | no |

## Reglas que conviene no negociar

- El colaborador no administra permisos globales.
- El colaborador solo opera sobre partidos vinculados.
- Las acciones destructivas deben estar limitadas y auditadas.
- La UI no debe mostrar acciones que la RLS no permita.
- Las restricciones de colaborador deben vivir en RLS por asignación o por
  registro, no solo en la UI.
- `canEdit` en la app ya no debería interpretarse como permiso colaborador;
  debe significar edición global de backoffice.
- La operación de colaborador es un permiso aparte y solo cubre reportes y
  evidencias sobre asignaciones vinculadas.

## Recomendacion

Mantener una sola fuente de verdad para permisos:

- RLS en Supabase.
- Helpers de permisos en la app.
- UI condicionada por el permiso real, no por supuestos.

## Regla operativa

Si una pantalla permite una acción, debe existir:

1. una política de DB que la soporte,
2. un helper de acceso que la explique,
3. una prueba que la cubra.

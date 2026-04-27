# Diccionario de datos

## Objetivo

Dejar documentadas las tablas reales del esquema actual para que cualquier
ingeniero entienda qué guarda cada entidad y qué reglas la protegen.

## `profiles`

- `id`: UUID que referencia `auth.users`.
- `full_name`: nombre visible del usuario.
- `role`: `admin`, `editor`, `viewer` y extensiones posteriores.
- `created_at` / `updated_at`: metadata del sistema.

Uso:

- espejo mínimo del usuario autenticado.
- fuente para la autorización de alto nivel.

## `people`

- `id`: UUID propio de la persona operativa.
- `full_name`: nombre obligatorio.
- `phone`: contacto opcional.
- `email`: email opcional.
- `active`: habilitación operativa.
- `notes`: texto estructurado para datos complementarios.
- `created_by` / `updated_by`: trazabilidad.

Uso:

- directorio operativo.
- base para asignaciones y visibilidad de colaboradores.

## `roles`

- `id`: UUID del rol.
- `name`: nombre único del rol.
- `category`: agrupación operativa.
- `sort_order`: orden en la UI.
- `active`: estado del rol.
- `created_by` / `updated_by`: trazabilidad.

Uso:

- catálogo maestro de funciones operativas.

## `matches`

- `id`: UUID del partido.
- `competition`: liga o torneo.
- `production_mode`: modo de producción.
- `status`: `Pendiente`, `Confirmado`, `Realizado`.
- `home_team` / `away_team`: equipos.
- `venue`: sede.
- `kickoff_at`: inicio UTC.
- `duration_minutes`: duración operativa.
- `timezone`: zona horaria de presentación.
- `owner_id`: responsable principal.
- `notes`: observaciones.
- `external_match_id`: identificador externo.
- `production_code`: código de producción.
- `commentary_plan`: plan de relato/comentario.
- `transport`: canal o forma de envío.
- `created_by` / `updated_by`: trazabilidad.

Uso:

- entidad madre de toda la operación.

## `assignments`

- `id`: UUID de la asignación.
- `match_id`: partido padre.
- `role_id`: rol asignado.
- `person_id`: persona asignada.
- `confirmed`: confirmación operativa.
- `notes`: observaciones por rol.
- `created_by` / `updated_by`: trazabilidad.

Uso:

- relación operativa entre partido, rol y persona.

## `audit_log`

- `id`: identidad secuencial.
- `table_name`: tabla afectada.
- `record_id`: registro afectado.
- `match_id`: partido relacionado cuando aplica.
- `action`: `INSERT`, `UPDATE`, `DELETE`.
- `changed_by`: actor.
- `before` / `after`: payload anterior y posterior.
- `created_at`: momento de la auditoría.

Uso:

- trazabilidad histórica de cambios críticos.

## `announcements`

- `id`: UUID del comunicado.
- `title` / `body`: contenido.
- `active`: visibilidad.
- `eyebrow_label`: etiqueta corta.
- `dismiss_label`: texto del CTA de cierre.
- `starts_at` / `ends_at`: ventana de publicación.
- `audience_type`: `all`, `photographers`, `roles`, `people`.
- `target_role_names`: filtro por roles.
- `target_person_ids`: filtro por personas.
- `created_by` / `updated_by`: trazabilidad.

Uso:

- avisos operativos con segmentación.

## `collaborator_reports`

- `id`: UUID del reporte.
- `assignment_id`: asignación origen.
- `match_id`: partido origen.
- `reporter_profile_id`: perfil que reporta.
- `incident_level`: `sin`, `baja`, `alta`, `critica`.
- `paid`: indicador financiero.
- `feed_detected`: señal detectada.
- `signal_label`: etiqueta de señal.
- `apto_lineal`: apto para lineal.
- `test_time`, `test_check`, `start_check`, `graphics_check`: controles operativos.
- `speedtest_value`, `ping_value`, `gpu_value`: métricas de evidencia.
- `technical_observations`, `building_observations`, `general_observations`: notas.
- `other_flag`, `st_flag`, `club_flag` y observaciones asociadas: clasificación extendida.
- `problems`: JSON flexible para problemas.
- `attachments`: JSON flexible para adjuntos.
- `submitted_at`: momento de envío.
- `created_by` / `updated_by`: trazabilidad.

Uso:

- reporte operativo del colaborador sobre una asignación concreta.

## `app_settings`

- `id`: UUID de configuración.
- `setting_key`: clave única.
- `secret_value`: secreto sensible.
- `public_value`: valor público.
- `created_by` / `updated_by`: trazabilidad.

Uso:

- configuración global del sistema.

## Storage: `collaborator-report-evidence`

- bucket privado.
- tamaño máximo: 5 MB.
- MIME permitidos: `image/jpeg`, `image/png`, `image/webp`.

Uso:

- capturas y evidencias de soporte operativo.

## Reglas de manejo

- Las tablas transaccionales deben mantener `created_by` y `updated_by`.
- Los cambios sensibles deben registrarse en `audit_log`.
- Los adjuntos deben persistirse en Storage, no solo en JSON.
- Las claves y secretos deben permanecer fuera del frontend.


# Hoja de Ruta

Esta hoja de ruta resume el siguiente tramo de producto para `Basket Production`.
La idea es usarla como referencia de implementación, no como documento comercial.

## Objetivo

Convertir la plataforma actual en una consola operativa completa para:

- `Producción`: partido como entidad madre
- `Reportes`: cierre ejecutivo, uno por partido
- `Incidencias`: eventos técnicos y operativos, muchas por partido
- `Equipos`: clubes, sedes, responsables y contexto institucional
- `Personal`: staff operativo con roles y cobertura real
- `IA`: asistencia contextual sobre los datos visibles y los adjuntos

## Principios

- El `partido` sigue siendo la entidad principal.
- `1 partido -> 1 reporte`.
- `1 partido -> N incidencias`.
- `Reportes` e `Incidencias` deben dejar de depender de mocks.
- Todo cambio importante debe dejar trazabilidad.
- Los adjuntos técnicos deben persistirse como evidencia real.

## Orden recomendado

1. Persistencia real de `Incidencias` y `Reportes`
2. Adjuntos y evidencias en `Storage`
3. Integración completa con `Producción`
4. Activity log real
5. `Equipos` en base de datos
6. IA contextual con datos reales

## Fase 1. Persistencia real de Incidencias y Reportes

### Objetivo

Sacar ambos módulos de datos locales y llevarlos a Supabase.

### Alcance

- Crear tabla `incidents`
- Crear tabla `reports`
- Vincular ambas con `matches`
- Reemplazar mocks en UI por queries reales
- Mantener el look actual ya validado por producto

### Modelo mínimo sugerido

#### `incidents`

- `id`
- `match_id`
- `severity`
- `operator_name`
- `streamer_name`
- `main_problem`
- `event_date`
- `event_time`
- `venue`
- `competition`
- `speedtest_upload_mbps`
- `ping_ms`
- `test_time`
- `test_result`
- `start_status`
- `graphics_status`
- `internet_problem`
- `image_problem`
- `ocr_problem`
- `ges_overlays_problem`
- `production_mode`
- `signal_delivery`
- `apto_lineal`
- `notes_technical`
- `notes_infrastructure`
- `notes_general`
- `created_at`
- `updated_at`
- `created_by`

#### `reports`

- `id`
- `match_id`
- `feed_id`
- `bp_id`
- `severity`
- `problem_summary`
- `feed_detected`
- `control_status`
- `paid_status`
- `event_date`
- `event_time`
- `venue`
- `competition`
- `technical_notes`
- `created_at`
- `updated_at`
- `created_by`

### Criterio de cierre

- `Reportes` lista y detalle leen desde Supabase
- `Incidencias` lista y drawer leen desde Supabase
- un partido puede abrir sus incidencias y su reporte real

## Fase 2. Adjuntos y evidencia técnica

### Objetivo

Guardar evidencia real de operación y no solo texto.

### Alcance

- `Supabase Storage` para:
  - captura de `speedtest`
  - captura de `ping`
  - captura de `gpu`
  - imágenes de cancha
  - avatar de usuario
- tabla `incident_attachments`
- tabla `report_attachments` si luego hace falta

### Extra recomendado

- lectura automática con Gemini sobre capturas de `speedtest`
- extracción sugerida de:
  - `upload`
  - `ping`
  - `fecha/hora` si aparece en la imagen

### Criterio de cierre

- cada incidencia puede mostrar adjuntos persistidos
- los valores técnicos pueden quedar autocompletados o confirmados manualmente

## Fase 3. Integración total con Producción

### Objetivo

Que `Producción` sea la puerta de entrada real al resto del sistema.

### Alcance

- desde la card o detalle del partido:
  - `Crear incidencia`
  - `Ver incidencias`
  - `Completar reporte`
  - `Ver reporte`
- badges visibles:
  - incidencia crítica
  - reporte pendiente
  - reporte completado

### Criterio de cierre

- desde `/match/[id]` se administra el ciclo operativo completo del evento

## Fase 4. Activity log real

### Objetivo

Trazabilidad completa, no solo visual.

### Alcance

- activity log para:
  - `matches`
  - `incidents`
  - `reports`
  - `teams`
  - `people`
- registrar:
  - actor
  - acción
  - timestamp
  - antes / después si aplica

### Criterio de cierre

- los tabs `Actividad` dejan de ser mock
- cualquier edición importante puede auditarse

## Fase 5. Equipos en base de datos

### Objetivo

Formalizar `Equipos` y sus relaciones.

### Alcance

- tabla `teams`
- tabla puente `team_competitions`
- relación de responsable con `people`
- links oficiales persistidos
- incidencias calculadas por partidos donde participa el club

### Criterio de cierre

- `Equipos` deja de depender de catálogo local para el núcleo del módulo

## Fase 6. IA contextual con datos reales

### Objetivo

Que la IA deje de ser solo un chat por pantalla y se vuelva herramienta operativa.

### Alcance

- respuestas con contexto real del módulo
- citas del registro usado
- lectura de adjuntos técnicos
- sugerencias de consistencia
- resúmenes ejecutivos automáticos

### Casos de uso deseados

- qué incidencias críticas siguen sin evidencia
- qué partidos no tienen reporte final
- qué equipo acumula más incidencias
- qué operador aparece más veces en incidencias altas
- resumen ejecutivo automático de un reporte

### Criterio de cierre

- la IA responde con datos persistidos y no solo con el contexto visible de la pantalla

## Backlog transversal

Estas mejoras no bloquean la salida de las fases, pero suman mucho valor:

- filtros globales por fecha, competencia, gravedad y responsable
- vistas guardadas
- portal móvil de `colaboradores` basado en asignaciones y cargas operativas
- estados de calidad del dato:
  - completo
  - incompleto
  - con evidencia
  - pendiente de validar
- dashboard ejecutivo real con:
  - partidos del día
  - reportes pendientes
  - incidencias críticas
  - equipos con más incidencias
  - carga por responsable
- preferencias de perfil persistidas por usuario

## Dependencias prácticas

- `Incidencias` y `Reportes` deben persistirse antes de hacer activity log serio
- `Storage` conviene salir antes de IA multimodal completa
- `Equipos` en base ayuda a mejorar filtros, reportes y cobertura de personal
- la IA gana mucho valor cuando existen adjuntos y auditoría real

## Próximo hito recomendado

Si hay que empezar por un punto único, el más rentable es este:

`Persistir Incidencias + Reportes + relación con Producción`

Porque desbloquea:

- trazabilidad real
- filtros confiables
- activity log
- adjuntos
- IA con contexto útil

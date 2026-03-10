# Portal de Colaboradores

Este documento aterriza cómo debería funcionar el acceso de usuarios operativos
que no son administradores dentro de `Basket Production`, especialmente para uso
desde celular.

## Objetivo

Separar claramente dos experiencias:

- `Backoffice de coordinación`
  para administración general, operación, configuración y control total
- `Portal de colaboradores`
  para que cada persona vea sus asignaciones, consulte la parrilla y cargue
  evidencia o datos operativos desde móvil

La idea es que el colaborador no edite el sistema entero. El colaborador aporta
datos sobre partidos donde está involucrado.

## Roles propuestos

La base actual ya soporta `admin`, `editor`, `coordinator`, `collaborator` y
`viewer`.
Para el siguiente tramo, conviene operar con:

- `admin`
  acceso total
- `coordinator`
  gestiona producción, incidencias y reportes, pero no toca configuración
  sensible ni permisos globales
- `collaborator`
  ve solo lo necesario para su trabajo diario y carga información operativa
- `viewer`
  lectura general

## Qué puede hacer cada uno

### Admin

- ver todo
- editar todo
- configurar usuarios
- asignar roles
- certificar reportes
- borrar registros sensibles

### Coordinator

- ver producción completa
- editar partidos y asignaciones
- gestionar incidencias y reportes
- revisar y validar cargas de colaboradores
- no administra permisos globales ni settings críticos

### Collaborator

- iniciar sesión con su correo
- ver sus asignaciones
- ver la parrilla general en lectura
- abrir el detalle de partidos donde participa
- cargar evidencia técnica
- subir capturas e imágenes
- agregar notas
- reportar incidencias sobre partidos asignados
- completar solo los campos que le correspondan
- editar solo sus aportes mientras el registro siga abierto

## Estado actual implementado

Ya quedó activa una primera fase del portal:

- rol `collaborator` habilitado en aplicación y SQL
- permiso de edición temporal mientras se completa el flujo móvil
- pantalla `Mi jornada` como primer acceso mobile-first
- vinculación automática por correo o, como fallback, por nombre contra `Personal`

Esto permite empezar a operar con usuarios reales antes de cerrar el modelo fino
de permisos por tipo de carga.

### Viewer

- lectura
- sin edición

## Experiencia móvil propuesta

No conviene exponer el backoffice entero en celular. Conviene crear una
experiencia más directa y accionable.

### Navegación sugerida

- `Inicio`
- `Mi jornada`
- `Parrilla`
- `Incidencias`
- `Perfil`

### Pantallas mínimas

#### 1. Inicio

Resumen muy corto de:

- próximos partidos asignados
- pendientes por cargar
- incidencias abiertas donde participa
- accesos rápidos

#### 2. Mi jornada

Lista de partidos del día para ese usuario:

- hora
- local vs visitante
- sede
- rol asignado
- estado de su carga

Cada tarjeta debe tener CTA claros:

- `Subir speedtest`
- `Cargar prueba`
- `Agregar nota`
- `Reportar incidencia`

### Primera entrega ya resuelta

La primera versión de `Mi jornada` debería cubrir:

- resumen del día
- cantidad de partidos asignados hoy
- pendientes por confirmar
- siguiente partido programado
- tarjetas por asignación con acceso a:
  - `Abrir partido`
  - `Ver parrilla`
  - `WhatsApp`

#### 3. Detalle de mi partido

Vista mobile-first con:

- resumen del partido
- rol del usuario en ese partido
- campos que debe completar
- evidencias subidas
- historial corto

#### 4. Incidencias

Vista filtrada por:

- incidencias del usuario
- incidencias de sus partidos

#### 5. Perfil

- nombre
- correo
- teléfono
- avatar
- preferencias básicas

## Qué datos debería cargar el colaborador

Según tu producto actual, el colaborador debería poder cargar:

- captura de speedtest
- captura de ping
- captura de GPU
- hora de prueba
- prueba
- inicio
- gráfica
- problema internet
- problema IMG
- OCR
- overlays / GES
- tipo de transmisión
- envíos de señal
- apto lineal
- imágenes de cancha
- notas

## Regla clave de permisos

El colaborador no debería:

- editar personas
- editar roles
- editar equipos
- editar configuración
- editar cualquier partido no asignado
- cerrar o certificar un reporte final global

El colaborador sí debería:

- cargar evidencia
- marcar estados de su flujo
- agregar observaciones
- crear incidencia operativa si participa en ese partido

## Modelo de datos recomendado

### Extender `profiles`

Agregar:

- `avatar_url`
- `phone`
- `is_active`
- `role`

### Extender `app_role`

Agregar valores:

- `coordinator`
- `collaborator`

### Mantener `assignments` como vínculo central

Ese vínculo ya existe y es la llave ideal para determinar si una persona puede
interactuar con un partido.

### Nueva tabla `assignment_submissions`

Propósito:
guardar todo lo que el colaborador sube o registra sobre una asignación.

Campos sugeridos:

- `id`
- `assignment_id`
- `match_id`
- `person_id`
- `submission_type`
- `speedtest_upload_mbps`
- `ping_ms`
- `gpu_snapshot_value`
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
- `notes`
- `created_at`
- `updated_at`
- `created_by`

### Adjuntos

Conviene usar `Supabase Storage` para:

- `speedtest`
- `ping`
- `gpu`
- imágenes de cancha
- avatar

Y luego guardar la referencia en:

- `incident_attachments`
- `assignment_submission_attachments`
- `report_attachments`

## Reglas de acceso recomendadas

### Regla simple

Un `collaborator` puede interactuar con un partido si:

- existe una fila en `assignments`
- `assignments.person_id` corresponde a su perfil operativo

### Regla práctica

Un colaborador puede:

- leer partidos donde está asignado
- leer la parrilla global
- crear o editar sus cargas operativas
- ver incidencias del partido asignado
- crear incidencias ligadas a su partido

## Flujo de producto recomendado

### Flujo de alta

1. Admin crea o invita usuario por email
2. Usuario recibe acceso
3. Se crea `profile`
4. Admin asigna rol `collaborator`
5. Admin vincula esa persona con su registro operativo si hace falta
6. Usuario entra desde celular

### Flujo de trabajo diario

1. Usuario entra a `Mi jornada`
2. Abre su partido
3. Sube capturas y evidencias
4. Completa campos operativos
5. Reporta incidencias si corresponde
6. Coordinator revisa y consolida
7. Admin o coordinator certifica el cierre final

## UX recomendada para celular

- botones grandes
- formularios cortos
- pocas decisiones por pantalla
- acciones directas
- carga de fotos con cámara
- guardado automático o borrador

Evitar:

- tablas densas
- demasiadas columnas
- edición del backoffice entero

## Relación con IA

Más adelante, el colaborador podría usar IA para:

- verificar si ya cargó todo lo pendiente
- resumir incidencias del partido
- leer speedtest y ping desde capturas
- validar si faltan evidencias

## Fases sugeridas de implementación

### Fase A

- agregar roles `coordinator` y `collaborator`
- definir permisos mínimos
- permitir login real para colaboradores

### Fase B

- crear `Mi jornada`
- filtrar por asignaciones del usuario
- habilitar solo lectura de parrilla global

### Fase C

- crear flujo de carga móvil
- speedtest, ping, prueba, inicio, gráfica, imágenes, notas

### Fase D

- adjuntos persistidos en storage
- activity log por colaborador

### Fase E

- IA contextual sobre sus propios partidos y cargas

## Recomendación final

No conviene pensar esto como “más permisos dentro del mismo panel”.
Conviene pensarlo como:

- un `panel de coordinación`
- y un `portal móvil de ejecución`

Ambos comparten la misma base de datos, pero no la misma interfaz ni el mismo
nivel de acceso.

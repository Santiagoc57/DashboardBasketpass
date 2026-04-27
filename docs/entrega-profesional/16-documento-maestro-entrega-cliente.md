# Documento Maestro de Entrega para Cliente

## Portada

**Sistema:** Basket Production  
**Tipo de documento:** Entrega profesional y handoff operativo  
**Versión del documento:** 1.0  
**Fecha:** [COMPLETAR EN WORD]  
**Responsable de entrega:** [COMPLETAR EN WORD]  
**Estado:** Final / Entrega  
**Destinatario:** Cliente y equipo operativo/técnico  

[INSERTAR LOGO O PORTADA DEL PROYECTO]

---

## Control del documento

| Campo | Valor |
| --- | --- |
| Documento | Documento maestro de entrega para cliente |
| Producto | Basket Production |
| Versión | 1.0 |
| Fecha | [COMPLETAR EN WORD] |
| Autor o responsable | [COMPLETAR EN WORD] |
| Última actualización | [COMPLETAR EN WORD] |
| Destinatario | Cliente y equipo operativo/técnico |
| Estado | Final / Entrega |

---

## Cómo leer este documento

Este documento resume de forma consolidada qué es la plataforma, cuál es su
objetivo, qué problemas resuelve, cómo se usa, cómo está construida a alto
nivel, cómo se opera y qué buenas prácticas deben respetarse para mantenerla
estable. Está pensado para que un cliente pueda comprender el producto y, al
mismo tiempo, para que ese cliente pueda delegar su uso, soporte u operación a
un equipo nuevo sin depender de explicaciones informales.

---

## Resumen ejecutivo

Basket Production es un dashboard operativo para coordinar transmisiones en
vivo, administrar asignaciones de personal, centralizar reportes de campo,
recibir alertas de operación y mantener trazabilidad técnica y funcional del
servicio.

La plataforma resuelve un problema frecuente en operaciones de producción:
información dispersa, seguimiento manual, poca visibilidad sobre el estado de
los partidos o jornadas, y baja trazabilidad cuando un colaborador reporta una
novedad o cuando la operación presenta fallos.

En esta entrega, el sistema ya cuenta con:

- autenticación y control de acceso por roles,
- módulo de operación principal,
- vista móvil para colaboradores,
- reportes y evidencias técnicas,
- bandeja interna de reportes de equipos,
- alertas operativas por Telegram,
- documentación de backup, rollback y operación,
- endurecimiento de permisos para colaboradores,
- respaldo reciente y smoke operativo validado.

En términos prácticos, el sistema ya está listo para ser usado y administrado,
con la salvedad de que algunas dependencias de negocio quedan del lado del
cliente, como la carga de su propia API key de Gemini si desea activar lectura
automática de capturas mediante IA.

---

## Objetivo del sistema

El objetivo principal del sistema es dar una base operativa clara, segura y
centralizada para planificar, ejecutar, monitorear y documentar una operación
de producción asociada a transmisiones o jornadas deportivas.

Este dashboard está diseñado para:

- visualizar y gestionar partidos o eventos operativos,
- asignar personas y roles con trazabilidad,
- permitir que colaboradores reporten novedades desde una interfaz móvil,
- capturar evidencias técnicas,
- alertar rápidamente cuando algo falla,
- dejar soporte documental y operativo para continuidad.

El sistema no pretende reemplazar todas las herramientas del negocio ni
convertirse en un ERP general. Su foco es la operación diaria, el seguimiento
de tareas críticas y la visibilidad de estado para equipos de producción.

---

## Visión general del producto

La plataforma combina una consola principal para administración y coordinación
con una superficie simplificada para colaboradores de campo.

### Usuarios involucrados

- `admin`: administra configuración, revisa reportes, define parámetros
  globales, controla accesos y supervisa la operación.
- `editor` / `coordinator`: operan el sistema en backoffice con permisos
  amplios, pero no necesariamente administrativos.
- `collaborator`: ve su jornada, reporta novedades y sube evidencias solo sobre
  sus asignaciones.
- `viewer`: tiene lectura limitada, sin operación crítica.

### Flujo general del trabajo diario

1. El equipo administrativo prepara la jornada y las asignaciones.
2. Los colaboradores consultan `Mi jornada` y revisan sus compromisos.
3. Desde el partido asignado, el colaborador reporta novedades y adjunta
   evidencias.
4. El backoffice revisa reportes, banderas y alertas.
5. Si se detecta un problema, el sistema deja evidencia y puede disparar avisos
   operativos por Telegram.

[INSERTAR CAPTURA: Producción]  
[INSERTAR CAPTURA: Mi jornada]

---

## Funcionalidades principales

### 1. Producción

Es la vista central de operación. Permite revisar la jornada, la grilla de
partidos, los responsables y el estado general del trabajo.

**Qué hace**

- organiza la operación diaria,
- muestra partidos o eventos,
- expone datos relevantes para seguimiento.

**Quién la usa**

- admins,
- coordinadores,
- equipo operativo con acceso de backoffice.

**Beneficio operativo**

- centraliza la jornada en una única vista
- reduce coordinación manual por chat o planillas separadas
- facilita detectar faltantes o desajustes.

### 2. Mi jornada

Es la superficie pensada para colaboradores. Muestra sus asignaciones y les
permite actuar directamente sobre ellas.

**Qué hace**

- muestra partidos asignados por fecha,
- permite abrir el detalle del partido,
- permite enviar reportes,
- permite subir evidencias técnicas.

**Quién la usa**

- colaboradores de campo o personal asignado a la jornada.

**Beneficio operativo**

- reduce fricción para reportar,
- ordena el trabajo móvil,
- evita acceso a superficies que no corresponden a ese rol.

### 3. Equipos

Permite revisar fichas de clubes o equipos y reportar inconsistencias o
banderas.

**Qué hace**

- expone información útil por equipo,
- permite marcar errores o inconsistencias,
- envía esos reportes a una bandeja interna y al canal de alertas si aplica.

**Quién la usa**

- backoffice,
- usuarios que requieran revisar consistencia de información operativa.

**Beneficio operativo**

- crea un flujo formal para detectar y resolver errores de catálogo o metadata.

### 4. Configuración

Agrupa los controles de perfil, IA, operación y revisión interna.

**Qué hace**

- permite administrar perfil y avatar,
- permite configurar Gemini,
- permite revisar reportes internos,
- permite consultar estado operativo.

**Quién la usa**

- principalmente admin,
- en menor medida usuarios que necesitan gestionar su propia sesión.

**Beneficio operativo**

- centraliza controles sensibles en una sola pantalla,
- reduce dependencia de intervención técnica para tareas básicas.

### 5. Reportes, incidencias y evidencias

La plataforma soporta el reporte de novedades operativas y el almacenamiento de
evidencias asociadas.

**Qué hace**

- registra reportes por asignación,
- permite adjuntar evidencia,
- mantiene trazabilidad de quién reportó,
- facilita seguimiento posterior.

**Quién la usa**

- colaboradores,
- admins y backoffice para revisión.

**Beneficio operativo**

- documenta la operación real,
- deja pruebas objetivas de incidencias o estado técnico,
- mejora auditoría y soporte.

---

## Flujos clave del negocio

### 1. Login y acceso

El usuario entra con su correo y contraseña. Según su rol y sus permisos, la
plataforma determina qué superficie puede usar y qué acciones puede ejecutar.

[INSERTAR CAPTURA: login]

### 2. Revisión de jornada

El colaborador entra a `Mi jornada`, elige la fecha si hace falta y revisa sus
partidos asignados. Si no tiene actividad en esa fecha pero sí en otra, la
plataforma le sugiere navegar hacia la jornada correcta en lugar de mostrar una
vista demo engañosa.

### 3. Envío de reporte de colaborador

Desde un partido asignado, el colaborador puede abrir el formulario de reporte,
completar observaciones y enviar el estado operativo.

### 4. Carga de evidencia

El colaborador puede adjuntar capturas o evidencia técnica asociada a su propia
asignación. Esas evidencias quedan restringidas por permisos y vinculadas al
registro correspondiente.

### 5. Revisión de reportes por admin

El admin revisa reportes internos desde `Configuración`, donde también puede
marcar estados y seguir la resolución de casos.

### 6. Activación de Gemini global

Un admin puede entrar a `Configuración > Gemini`, elegir `Global de la
plataforma`, pegar la API key del cliente y guardar. Desde ese momento,
funcionalidades asistidas por IA pueden quedar habilitadas para el resto del
sistema.

[INSERTAR CAPTURA: Settings > Gemini]

### 7. Recepción y uso de alertas

Cuando ocurre una degradación o error operativo relevante, la plataforma puede
emitir alertas hacia Telegram, facilitando una reacción más rápida.

---

## Arquitectura resumida

La plataforma está construida con una arquitectura moderna, simple de mantener
y orientada a seguridad por capas.

### Componentes principales

- `Frontend`: Next.js App Router para interfaz, rutas y experiencia de usuario.
- `Backend de aplicación`: acciones del servidor y rutas API para validación y
  lógica de negocio.
- `Datos`: Supabase como proveedor de autenticación, base de datos Postgres,
  políticas RLS y storage.
- `Monitoreo operativo`: healthcheck, smoke operativo y alertas por Telegram.

### Principio general de funcionamiento

```text
Usuario -> interfaz -> validación -> permisos -> dominio -> Supabase
       -> respuesta -> auditoría / alertas / seguimiento
```

### Qué aporta esta arquitectura

- separación clara entre interfaz, lógica y datos,
- permisos fuertes soportados por base de datos,
- menor riesgo de que la UI muestre capacidades no autorizadas,
- base sólida para evolución futura.

[INSERTAR DIAGRAMA: Arquitectura general]  
[INSERTAR DIAGRAMA: Arquitectura]

---

## Modelo operativo y permisos

El sistema usa roles para definir qué puede hacer cada usuario y, además, usa
restricciones en la base de datos para que esos límites no dependan solo de la
interfaz.

### Roles disponibles

| Rol | Uso principal |
| --- | --- |
| `admin` | administración global, configuración, revisión y control |
| `editor` | operación de backoffice |
| `coordinator` | operación amplia con límites administrativos |
| `collaborator` | trabajo sobre asignaciones propias |
| `viewer` | lectura |

### Principio general de seguridad

- el backoffice tiene permisos amplios,
- el colaborador opera solo sobre sus propias asignaciones,
- la UI condiciona acciones,
- la base de datos refuerza esas restricciones con RLS.

### Resumen funcional de permisos

| Capacidad | Admin | Backoffice | Collaborator | Viewer |
| --- | --- | --- | --- | --- |
| Ver operación | Sí | Sí | Limitado | Sí |
| Editar datos globales | Sí | Sí | No | No |
| Configurar plataforma | Sí | No | No | No |
| Enviar reportes propios | Sí | Sí | Sí | No |
| Subir evidencia propia | Sí | Sí | Sí | No |
| Revisar reportes internos | Sí | Según rol | No | No |

La recomendación operativa es tratar a RLS como fuente de verdad y a la UI como
una capa de guía y ergonomía, no como barrera única.

---

## Seguridad y buenas prácticas

Para que la plataforma siga siendo operable y segura, deben respetarse algunas
prácticas mínimas.

### Credenciales

- no compartir usuarios entre personas,
- no pegar claves sensibles fuera de las pantallas previstas,
- no enviar contraseñas o API keys por canales inseguros.

### API keys

- la API key de Gemini debe cargarla un admin desde `Configuración`,
- no debe quedar hardcodeada en el frontend,
- el cliente debe administrar su propia clave.

### Trazabilidad

- las acciones relevantes deben quedar registradas,
- la auditoría ayuda a explicar quién hizo qué y cuándo,
- los reportes y evidencias deben conservar contexto suficiente para revisión.

### Principio de mínimo acceso

- cada rol debe ver y operar solo lo necesario,
- el collaborator no debe recibir acceso global,
- toda capacidad sensible debe estar limitada y auditada.

---

## Operación y soporte

La plataforma ya contempla una base operativa para soporte y continuidad.

### Señales mínimas de salud

- `healthcheck` para saber si la app está sana,
- smoke operativo para validar acceso a tablas críticas y storage,
- alertas por Telegram para incidentes relevantes.

### Qué revisar en operación normal

- acceso al sistema,
- carga de jornada,
- reportes pendientes,
- alertas operativas,
- disponibilidad de storage para evidencias.

### Qué hacer ante fallas comunes

- validar si el problema es de acceso, permisos, storage o configuración,
- revisar Telegram si ya existe una alerta emitida,
- usar el runbook si el problema afecta operación real,
- documentar módulo afectado, hora y síntoma.

### Escalación

Si el problema no se resuelve desde la interfaz:

1. tomar captura,
2. identificar módulo afectado,
3. registrar hora aproximada,
4. elevar al responsable técnico.

---

## Backups, continuidad y recuperación

La solución ya cuenta con un frente operativo serio para continuidad.

### Qué existe hoy

- backup de base de datos desde el repo,
- restore con `dry-run`,
- smoke operativo posterior,
- runbook de incidentes,
- plan de rollback,
- evidencia documentada de simulacros y salida.

### Qué significa para el cliente

No se depende de “improvisar” si algo falla. Existe una base definida para:

- respaldar antes de cambios sensibles,
- verificar restauraciones,
- revisar el último backup,
- validar operatividad después de un incidente.

### Qué no se debe hacer

- ejecutar restores sin verificación previa,
- modificar estructura crítica sin backup reciente,
- tratar storage o base de datos como si fueran descartables.

---

## Estado actual de la solución

### Qué quedó implementado

- autenticación por usuario,
- permisos por roles,
- módulo de jornada,
- operación principal,
- reportes por colaborador,
- evidencias técnicas,
- bandeja de reportes de equipos,
- alertas operativas,
- documentación de operación, QA, release y backup.

### Qué quedó validado

- acceso admin,
- acceso collaborator,
- endurecimiento de permisos de collaborator,
- backup reciente,
- smoke operativo,
- limpieza de cuentas de prueba,
- flujo de reporte y evidencia validado durante implementación.

### Qué depende del cliente

- cargar la API key de Gemini si desea usar IA,
- definir usuarios reales autorizados,
- administrar responsables internos,
- definir canal de soporte posterior.

### Punto importante

La activación de Gemini global no queda hardcodeada ni cerrada por el equipo de
implementación. El cliente debe cargar su propia API key cuando decida
habilitar esa capacidad.

---

## FAQ

### ¿Cómo ingreso a la plataforma?

Con la URL entregada, tu correo y tu contraseña. Si olvidas la clave, usa el
flujo de recuperación disponible.

### ¿Quién configura Gemini?

Una persona con rol `admin`, desde `Configuración > Gemini > Global de la
plataforma`.

### ¿Por qué un colaborador no ve su jornada?

Las causas más probables son:

- no tiene asignaciones cargadas,
- no está vinculado correctamente en `Personal`,
- está mirando una fecha distinta a la de su asignación.

### ¿Dónde se revisan los reportes?

Los reportes internos y de equipos se revisan principalmente desde
`Configuración`, en la bandeja correspondiente para admin.

### ¿Qué significan las alertas de Telegram?

Indican una degradación o error operativo relevante, por ejemplo:

- fallos de escritura,
- fallos de storage,
- fallos de configuración,
- errores de backend o de health.

### ¿Qué pasa si falla una carga de evidencia?

Debe revisarse si el problema fue de conexión, formato de archivo, storage o
configuración. Si el error es operativo, el sistema puede generar una alerta.

### ¿Cómo se recupera un acceso?

Desde los flujos normales de autenticación o mediante intervención de un admin,
según el tipo de usuario.

### ¿Qué debe hacer un nuevo miembro del equipo?

1. recibir su usuario,
2. validar acceso,
3. conocer su rol,
4. revisar el módulo que le corresponde,
5. usar este documento y el manual del cliente como base.

---

## Anexos y referencias

Este documento es autosuficiente para entender la solución, pero puede apoyarse
en los anexos siguientes para operación o soporte más detallado:

- [14 - Manual para cliente](./14-manual-cliente.md)
- [01 - Arquitectura](./01-arquitectura.md)
- [03 - Matriz de permisos](./03-permisos.md)
- [04 - Runbook de operación](./04-runbook.md)
- [06 - Checklist de QA](./06-qa-checklist.md)
- [08 - Monitoreo y alertas](./08-monitoreo-alertas.md)
- [09 - Release y rollback](./09-release-rollback.md)
- [12 - Backup y restore operacional](./12-backup-restore-operacional.md)
- [13 - Simulacro de incidente](./13-simulacro-incidente.md)
- [15 - Checklist de entrega final](./15-checklist-entrega-final.md)
- [Diagramas](./diagrams)
- [Simulacros](./simulacros)

---

## Cierre

Basket Production no se entrega como una demo local ni como una colección de
pantallas aisladas. Se entrega como una base operativa real, con permisos,
alertas, trazabilidad, documentación y respaldo suficiente para ser usada,
explicada y delegada por el cliente a su propio equipo.

Ese es el propósito de este documento: que el sistema pueda entenderse,
operarse y sostenerse con criterio profesional.

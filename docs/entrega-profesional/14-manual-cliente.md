# Manual para cliente

## Objetivo

Este documento explica el uso básico del sistema para una operación normal, sin
entrar en detalles técnicos del código o de la infraestructura.

## Ingreso a la plataforma

1. Abre la URL entregada para el dashboard.
2. Inicia sesión con tu correo y contraseña.
3. Si no recuerdas la contraseña, usa `Olvidé mi contraseña`.

## Roles principales

- `Admin`: configura la plataforma, ve reportes, ajusta IA y revisa operación.
- `Collaborator`: entra a `Mi jornada`, reporta novedades y sube evidencias.

## Pantallas principales

### Producción

- Vista general de la jornada.
- Permite revisar partidos, responsables y carga operativa.

### Mi jornada

- Vista pensada para colaboradores.
- Muestra partidos asignados por fecha.
- Permite abrir el grupo de trabajo y enviar reportes.

### Equipos

- Permite revisar fichas de clubes y reportar banderas o errores.
- Los reportes llegan a la bandeja interna y a Telegram si está configurado.

### Configuración

- Ajustes de perfil y avatar.
- Configuración de Gemini.
- Bandeja operativa para admin.

## Cómo activar Gemini para toda la plataforma

Esto lo debe hacer una persona con rol `admin`.

1. Entra a `Configuración`.
2. Busca la tarjeta `Gemini`.
3. En `Alcance`, selecciona `Global de la plataforma`.
4. Pega la API key entregada por tu organización.
5. Pulsa `Guardar`.
6. Pulsa `Probar conexión`.

### Resultado esperado

- Si todo está bien, la plataforma mostrará un mensaje de conexión correcta.
- A partir de ese momento, la lectura automática de capturas quedará disponible
  también para colaboradores.

## Cómo revisar reportes de equipos

Esto lo ve `admin`.

1. Entra a `Configuración`.
2. Busca la bandeja de reportes de equipos.
3. Revisa pendientes.
4. Cuando el caso esté resuelto, márcalo como resuelto.

## Cómo interpretar alertas

Las alertas operativas pueden llegar por Telegram.

### Ejemplos

- fallo guardando un reporte
- fallo de storage
- problema de configuración
- problema de base de datos

### Qué hacer

1. Leer el área afectada en la alerta.
2. Revisar si el problema bloquea la operación o solo requiere seguimiento.
3. Entrar a `Configuración` o revisar el módulo afectado.
4. Si el problema persiste, seguir el runbook técnico.

## Qué hacer si algo falla

### No puedo entrar

- Verifica correo y contraseña.
- Usa recuperación de contraseña.
- Si sigue fallando, revisa con el administrador.

### No aparece Gemini

- Revisa si la tarjeta muestra `Global activa`.
- Si no está activa, un admin debe cargar la API key global.

### Un colaborador no ve su jornada

- Verifica que tenga asignaciones cargadas.
- Verifica que esté vinculado en `Personal`.
- Si tiene partidos en otras fechas, puede navegar a la fecha sugerida.

### No se puede subir evidencia

- Revisa conexión.
- Reintenta la carga.
- Si persiste, el sistema debería reportarlo por alerta operativa.

## Buenas prácticas

- No compartir contraseñas por chat.
- No pegar API keys fuera de `Configuración`.
- Usar cuentas separadas por persona.
- Revisar reportes y alertas al menos una vez al día de operación.

## Escalación

Si aparece un problema operativo que no puedes resolver desde la interfaz:

1. toma captura del error,
2. indica módulo afectado,
3. indica hora aproximada,
4. envía el caso al responsable técnico.

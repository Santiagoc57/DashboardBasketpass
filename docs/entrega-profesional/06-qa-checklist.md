# Checklist de QA

## Objetivo

Validar que cada cambio importante llegue sin romper operacion, permisos ni
datos.

## Checklist base

- [ ] corre `npm run lint`.
- [ ] corre `npm run typecheck`.
- [ ] corre `npm run build`.
- [ ] valida login y logout.
- [ ] valida lectura de datos principales.
- [ ] valida edicion con cada rol.
- [ ] valida estados vacios.
- [ ] valida errores de red y permisos.
- [ ] valida responsive en desktop y mobile.
- [ ] valida timezone.
- [ ] valida auditoria despues de ediciones.
- [ ] valida importacion CSV si aplica.

## Casos criticos

- crear partido.
- editar partido.
- asignar persona.
- cambiar rol.
- crear incidencia.
- subir adjunto.
- generar reporte.
- revocar acceso.

## Criterio de salida

No deberia promoverse a produccion ningun cambio que falle en:

- permiso.
- persistencia.
- auditoria.
- visualizacion base.
- build.


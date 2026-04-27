# Checklist de entrega final

## Objetivo

Cerrar la entrega con evidencia concreta de que la plataforma está operable,
respaldada y documentada.

## Checklist previo al handoff

- [ ] `npm run check` en verde.
- [ ] migraciones aplicadas en el entorno real.
- [ ] acceso admin validado.
- [ ] acceso collaborator validado.
- [ ] Telegram operativo para alertas.
- [ ] bandeja de reportes visible para admin.
- [ ] Gemini explicado al cliente en `Configuración`.
- [ ] cuenta de prueba eliminada.
- [ ] backup fresco generado.
- [ ] smoke operativo ejecutado.
- [ ] manual para cliente entregado.
- [ ] responsables y contactos definidos.

## Evidencia recomendada para adjuntar

- último backup y manifiesto,
- resultado de `recovery-smoke`,
- estado de `/api/health`,
- fecha del último simulacro,
- versión o commit entregado,
- responsable del handoff.

## Última evidencia registrada

- Backup:
  - dump: `backups/db/basket-production-20260423-203758-handoff-final.dump`
  - manifiesto: `backups/manifests/basket-production-20260423-203758-handoff-final.dump.json`
  - hash: `5923c9e721b26723165fac223f0f31b4892a7dfdfaa080247dd140883eef5f92`
- Smoke operativo:
  - `npm run ops:recovery-smoke`
  - estado: `ok`
- Manual cliente:
  - `docs/entrega-profesional/14-manual-cliente.md`

## Checklist de entrega al cliente

1. Compartir URL del sistema.
2. Compartir usuarios iniciales autorizados.
3. Explicar dónde se carga Gemini:
   `Configuración > Gemini > Global de la plataforma`.
4. Explicar dónde revisar reportes:
   `Configuración`.
5. Explicar qué alertas llegan por Telegram.
6. Explicar qué hacer si algo falla.
7. Confirmar quién administra usuarios, permisos y claves.

## Criterio de cierre

No dar por terminada la entrega hasta que:

- el cliente pueda entrar,
- el cliente sepa dónde cargar Gemini,
- el admin sepa revisar reportes y alertas,
- exista backup reciente,
- exista un canal claro para soporte posterior.

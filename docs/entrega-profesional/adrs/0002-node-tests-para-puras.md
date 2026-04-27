# ADR 0002: Tests de utilidades puras con Node

## Estado

Aprobado.

## Contexto

El repo no traía runner de tests. Antes de introducir una infraestructura pesada
conviene cubrir lógica pura y crítica con pruebas simples, ejecutables y baratas.

## Decisión

Usar `node --test` para validar utilidades puras compiladas desde TypeScript con
un `tsconfig.tests.json` dedicado.

## Consecuencias

- No hace falta instalar un framework grande para arrancar.
- Las pruebas quedan integradas al flujo local y a CI.
- Se puede ampliar luego a pruebas de más capas sin descartar esta base.


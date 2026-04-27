# ADR 0001: RLS como fuente de verdad de permisos

## Estado

Aprobado.

## Contexto

El dashboard maneja datos operativos sensibles. La UI sola no alcanza para
proteger cambios ni lecturas; la autorización debe vivir cerca de los datos.

## Decisión

Usar RLS en Supabase como fuente de verdad de permisos y complementar con
helpers en la app para evitar mostrar acciones que el usuario no podrá ejecutar.

## Consecuencias

- La seguridad no depende de la interfaz.
- La UI puede simplificarse con checks reutilizables.
- Los cambios de permisos se revisan en SQL y en la capa de app.


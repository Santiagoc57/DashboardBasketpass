# 2026-04-23 - Verificacion funcional de collaborator

## Objetivo

Confirmar que el endurecimiento de acceso para `collaborator` funciona con una
sesion real y que el flujo operativo principal sigue utilizable.

## Cuenta de prueba usada

- Perfil: `viewer`
- `bp_access_role`: `collaborator`
- Persona vinculada por email y nombre a una asignacion real

## Evidencia verificada

1. Login correcto en `/login`.
2. Acceso restringido a la superficie de colaborador en `/mi-jornada`.
3. Visualizacion del partido asignado al abrir:

   ```text
   /mi-jornada?view=day&date=2026-04-21
   ```

4. Envio exitoso del reporte en:

   ```text
   /mi-jornada/9d249127-2de0-4a32-b4af-7591c8cb1925/reportar
   ```

5. Respuesta de la app:

   ```text
   Reporte enviado. Marcamos este partido como reportado.
   ```

6. Confirmacion en base:
   - `collaborator_reports.assignment_id` coincide con la asignacion probada
   - `reporter_profile_id` coincide con el usuario collaborator de prueba
   - `assignments.confirmed = true`

7. Confirmacion de evidencia en storage a traves del endpoint autenticado:
   - bucket: `collaborator-report-evidence`
   - path bajo la ruta:

     ```text
     matches/<match-id>/assignments/<assignment-id>/speedtest.png
     ```

## Observaciones

- La lectura IA de la captura no devolvio valor porque Gemini no esta
  configurado para ese flujo, pero la subida y el enlace del attachment si
  quedaron funcionando.
- La prueba confirma el punto importante: el collaborator puede operar su propia
  asignacion y no depende de permisos globales.

# Windsurf + Supabase MCP Setup

Este es el paso a paso exacto para repetir la configuracion en otro computador sin depender de memoria.

## 1. Instalar y abrir Windsurf

1. Instala Windsurf.
2. Verifica que la version sea `0.1.37` o superior.
3. Abre Windsurf al menos una vez para que cree la carpeta `~/.codeium/windsurf/`.

En esta maquina quedo validado con la version `1.9577.43`.

## 2. Configurar el cliente MCP de Windsurf

Archivo:

```json
~/.codeium/windsurf/mcp_config.json
```

Si el archivo no existe, crealo.

Si ya existe y tiene otros MCPs, no lo reemplaces completo: agrega el bloque `supabase` dentro de `mcpServers`.

Configuracion usada:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://mcp.supabase.com/mcp?project_ref=zjasulcjnojrmsshumsi"
      ]
    }
  }
}
```

Nota:

- Windsurf no soporta este servidor remoto directamente por HTTP en este flujo, por eso se usa `mcp-remote` como proxy.
- Si usas `zsh` y quieres probar esa URL por terminal, ponla entre comillas porque el `?` puede romper el comando.

## 3. Reiniciar Windsurf

1. Cierra Windsurf.
2. Abre Windsurf otra vez.
3. Espera a que vuelva a cargar los MCPs.

## 4. Instalar Agent Skills de Supabase

Comando recomendado:

```bash
npx skills add -y -g supabase/agent-skills
```

Por que asi:

- `-y` evita prompts interactivos.
- `-g` instala en la ubicacion global de skills y crea el enlace para Windsurf.

Resultado esperado:

- carpeta global: `~/.agents/skills/supabase-postgres-best-practices`
- symlink para Windsurf: `~/.codeium/windsurf/skills/supabase-postgres-best-practices`

## 5. Validar que el proxy MCP funciona

Prueba manual desde terminal:

```bash
npx -y mcp-remote 'https://mcp.supabase.com/mcp?project_ref=zjasulcjnojrmsshumsi'
```

Mensajes esperados:

- `Connected to remote server`
- `Local STDIO server running`
- `Proxy established successfully`

Luego puedes cerrarlo con `Ctrl+C`.

## 6. Validar dentro de Windsurf

Prueba en el chat de Windsurf con algo como:

```text
usa Supabase para listar las tablas del proyecto
```

En esta maquina la prueba devolvio estas tablas del esquema `public`:

- `profiles`
- `people`
- `roles`
- `matches`
- `assignments`
- `audit_log`

## 7. Variables de entorno del proyecto

Si tambien vas a mover este proyecto a otro computador:

1. Copia `.env.example` a `.env.local`.
2. Llena las variables reales en `.env.local`.
3. No dejes secretos reales dentro de `.env.example`.

Variables usadas por esta app:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_TIMEZONE=America/Bogota
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Uso dentro del proyecto:

- `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` son obligatorias para la app.
- `SUPABASE_SERVICE_ROLE_KEY` se usa para el importador CSV.

## 8. Levantar la app local

```bash
npm install
npm run dev
```

Si el puerto `3000` esta ocupado, Next usara otro puerto disponible.

## 9. Problemas comunes

- `zsh: no matches found`: faltan comillas en la URL del proxy.
- El instalador de `skills` se queda esperando: vuelve a correrlo con `-y -g`.
- Ya existe `mcp_config.json`: fusiona el bloque `supabase` en lugar de borrar los MCPs anteriores.
- Windsurf no detecta el MCP nuevo: reinicia la app.
- La app no conecta con Supabase: revisa `.env.local` y confirma `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY`.

## 10. Estado que quedo funcionando en esta maquina

- Windsurf con version `1.9577.43`
- `~/.codeium/windsurf/mcp_config.json` con entrada `supabase`
- skill `supabase-postgres-best-practices` instalado globalmente
- symlink de la skill disponible para Windsurf
- proxy `mcp-remote` validado contra el proyecto `zjasulcjnojrmsshumsi`
- consulta MCP probada listando tablas del proyecto

## 11. Recomendacion de seguridad

- No copies tokens reales a documentos compartidos.
- No subas `.env.local`.
- Usa placeholders en `.env.example`.
- Si un archivo de ejemplo o configuracion termina con claves reales, rotalas en Supabase o en el proveedor correspondiente y reemplazalas por placeholders.
ido del mismo 
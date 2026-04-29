# Evolution API + Dashboard: WhatsApp automatico

Esta guia conecta el dashboard con Evolution API para enviar WhatsApp desde un
numero operativo dedicado.

## Telefono remitente

El telefono que escanea el QR de la instancia Evolution API es el numero que
enviara los mensajes. Recomendacion: usar un numero dedicado de operaciones,
no un WhatsApp personal.

## Variables del dashboard

Configura `.env.local`:

```env
EVOLUTION_API_BASE_URL=http://localhost:8080
EVOLUTION_API_KEY=tu-api-key
EVOLUTION_API_INSTANCE=basketpass
```

En produccion, `EVOLUTION_API_BASE_URL` debe ser la URL publica o privada del
servidor donde corre Evolution API.

## Flujo

1. El usuario entra a un partido y abre Notificar.
2. El dashboard llama a `POST /api/notifications/whatsapp`.
3. El endpoint llama a Evolution API:
   `POST {EVOLUTION_API_BASE_URL}/message/sendText/{EVOLUTION_API_INSTANCE}`.
4. Evolution API envia el mensaje desde el WhatsApp conectado a esa instancia.

## Payload usado

El dashboard envia a Evolution API:

```json
{
  "number": "573001112233",
  "text": "Mensaje operativo"
}
```

con header:

```http
apikey: tu-api-key
content-type: application/json
```

## Instalacion de Evolution API

Puedes correr Evolution API con Docker siguiendo la documentacion oficial del
proyecto. Una vez levantado:

1. Crea una instancia llamada `basketpass`.
2. Abre el QR de conexion de esa instancia.
3. Escanea el QR con el telefono operativo.
4. Verifica que la instancia quede conectada.
5. Prueba desde el dashboard con un partido real y un contacto con telefono.

## Seguridad operativa

- No subas `EVOLUTION_API_KEY` al repositorio.
- Usa un numero dedicado para operaciones.
- Evita envios masivos sin pausas.
- Mantiene Evolution API en un servidor estable.
- Si el numero se desconecta, vuelve a escanear el QR.

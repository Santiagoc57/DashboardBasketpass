# Robomotion + Dashboard: WhatsApp Web sin API

Esta guía conecta la pantalla de notificaciones del dashboard con un robot local de Robomotion que abre WhatsApp Web uno por uno.

## Estado actual del dashboard

El dashboard ya envía las solicitudes de WhatsApp a este endpoint interno:

- `POST /api/notifications/whatsapp`

Ese endpoint reenvía la solicitud al webhook de Robomotion definido en `.env.local`:

```env
ROBOMOTION_WHATSAPP_WEBHOOK_URL=http://127.0.0.1:9090/webhook/whatsapp
ROBOMOTION_WHATSAPP_WEBHOOK_TOKEN=
```

Si Robomotion no responde o no está configurado, el dashboard hace fallback y abre WhatsApp Web directamente en el navegador.

## Flujo recomendado en Robomotion

Usa un flujo local escuchando en:

- Method: `POST`
- IP: `127.0.0.1`
- Port: `9090`
- Endpoint: `/webhook/whatsapp`

Con esto, el dashboard podrá llamar al robot por `http://127.0.0.1:9090/webhook/whatsapp`.

## Payload que envía el dashboard

El dashboard le manda a Robomotion un JSON con esta forma:

```json
{
  "action": "individual",
  "phone": "573001234567",
  "phones": ["573001234567"],
  "message": "Hola equipo",
  "meta": {
    "source": "dashboard-basketpass",
    "requestedAt": "2026-04-21T18:10:00.000Z",
    "requestedBy": {
      "userId": "uuid",
      "email": "usuario@correo.com",
      "fullName": "Nombre Apellido"
    },
    "recipientName": "Nombre Apellido",
    "matchLabel": null
  }
}
```

Para `action: "todos"`, `phones` vendrá con varios números.

## Nodos del flujo

Orden sugerido:

1. `HTTP In` o tu nodo actual `Receive Webhook`
2. `Function` llamado `Normalize Request`
3. `HTTP Out` o tu nodo actual `Respond OK`
4. `Open Browser`
5. `For Each`
6. `Function` llamado `Build WhatsApp URL`
7. `Open Link`
8. `Sleep`
9. `Dialog / Message Box` opcional
10. `Loop Back`
11. `Stop`

## 1. Nodo HTTP In / Receive Webhook

Configúralo así:

- Method: `POST`
- Endpoint: `/webhook/whatsapp`
- IP: `127.0.0.1`
- Port: `9090`

Ese nodo debe dejar el body del request disponible en `msg.body` o en el payload que use tu versión de Robomotion.

## 2. Function: Normalize Request

Usa este código:

```javascript
const payload = msg.body || msg.payload || {};
const action = payload.action === "individual" ? "individual" : "todos";
const rawPhones =
  action === "individual"
    ? [payload.phone || payload.phones?.[0] || ""]
    : Array.isArray(payload.phones)
      ? payload.phones
      : [];

const phones = [...new Set(
  rawPhones
    .map((value) => String(value || "").replace(/[^\d]/g, ""))
    .filter(Boolean)
)];

if (!phones.length) {
  throw new Error("No llegaron telefonos validos");
}

const message = String(payload.message || "").trim();

if (!message) {
  throw new Error("No llego ningun mensaje");
}

return {
  ...msg,
  action,
  phones,
  phone: phones[0],
  message,
  browserReady: false
};
```

## 3. HTTP Out / Respond OK

Responde rápido al dashboard antes de empezar a abrir chats.

Body sugerido:

```json
{
  "ok": true,
  "received": true
}
```

Status:

- `200`

Esto hace que el botón del dashboard te muestre que Robomotion sí recibió la solicitud.

## 4. Open Browser

Configúralo así:

- Browser Type: `Chrome`
- Maximized: `true`

Importante:

- Antes de probar el flujo, abre `https://web.whatsapp.com` manualmente.
- Escanea el QR.
- Deja la sesión iniciada.

Si tu versión de Robomotion soporta `User Data Dir`, usa el perfil real de Chrome para conservar la sesión.

## 5. For Each

Input:

- `phones`

Si tu nodo necesita items explícitos, usa el array generado por `Normalize Request`.

## 6. Function: Build WhatsApp URL

Dentro del loop usa este código:

```javascript
const phone = String(item || msg.phone || "").replace(/[^\d]/g, "");

if (!phone) {
  throw new Error("Telefono vacio dentro del loop");
}

const encodedMessage = encodeURIComponent(msg.message);
const url = `https://web.whatsapp.com/send?phone=${phone}&text=${encodedMessage}`;

return {
  ...msg,
  currentPhone: phone,
  url
};
```

## 7. Open Link

Configúralo con:

- Browser ID: el `Browser ID` que devolvió `Open Browser`
- URL: `{{url}}`

Si tu versión muestra `Page ID`, puedes dejar que Robomotion lo genere.

Referencia oficial:

- https://docs.robomotion.io/reference/packages/net/http-in/
- https://docs.robomotion.io/reference/packages/web-automation/openbrowser/
- https://docs.robomotion.io/reference/packages/web-automation/openlink/

## 8. Sleep

Usa:

- `8` a `12` segundos

Empieza con `10` segundos.

## 9. Dialog / Message Box opcional

Si quieres revisión manual antes de pasar al siguiente chat:

- Title: `Chat listo`
- Message: `Revisa el texto, envialo en WhatsApp y presiona OK para continuar`

Si quieres que solo deje el chat abierto unos segundos y continúe, omite este nodo.

## 10. Loop Back

Después del `Sleep` o del `Dialog`, vuelve al `For Each`.

Cuando se termine el array, conecta la salida final a `Stop`.

## Cómo probar por fuera del dashboard

Primero prueba el robot directo:

```bash
curl -X POST http://127.0.0.1:9090/webhook/whatsapp \
  -H 'Content-Type: application/json' \
  -d '{
    "action":"individual",
    "phone":"573001234567",
    "message":"Hola, esta es una prueba desde curl"
  }'
```

Si eso funciona, luego prueba desde el dashboard en la pantalla:

- `/match/[id]/notificar`

Usa:

- `WhatsApp a todos`
- o el ícono individual de WhatsApp por persona

## Si el botón del dashboard no dispara el robot

Revisa esto:

1. El robot de Robomotion debe estar abierto y conectado.
2. El flow debe estar corriendo o el trigger debe estar activo.
3. El puerto `9090` no debe estar ocupado por otro proceso.
4. El endpoint del flujo debe ser exactamente `/webhook/whatsapp`.
5. WhatsApp Web debe tener sesión iniciada en el navegador que usará Robomotion.

## Comportamiento esperado

Cuando todo esté bien:

1. Haces clic en `WhatsApp a todos` en el dashboard.
2. Next.js llama a `/api/notifications/whatsapp`.
3. Ese endpoint le pega a `http://127.0.0.1:9090/webhook/whatsapp`.
4. Robomotion responde `200`.
5. El dashboard muestra confirmación.
6. El robot abre WhatsApp Web, un chat por número.

## Notas

- Este flujo usa WhatsApp Web sin API oficial.
- Conviene mantener delays conservadores.
- Si el flujo falla, el dashboard conserva un fallback que abre WhatsApp Web directamente en pestañas del navegador.

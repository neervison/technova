# Bot de TechNova con n8n

El "cerebro" del bot ya vive en el backend de TechNova:

`POST https://technova-t0j2.onrender.com/api/bot/simulate`
Body: `{ "from": "<id_del_cliente>", "text": "<mensaje>" }`
Respuesta: `{ "reply": "...", "advisor": false }`

n8n se usa como la capa de **canal**: recibe el mensaje de WhatsApp/Telegram y llama a esa API.

## Instancia desplegada
- URL: https://technova-n8n.onrender.com
- Usuario: `admin` · Contraseña: ver variable `N8N_DEFAULT_PASSWORD` en Render (demo: `TechNova2026!`, cámbiala).

> Nota: el plan *free* de Render puede dormir el servicio tras inactividad; para
> producción usa un plan de pago o n8n.cloud.

## Workflow (armalo en la UI de n8n)
1. **Webhook** (o **WhatsApp Trigger** / **Telegram Trigger** si ya tienes credenciales):
   - Método `POST`, path `techova-bot`.
2. **HTTP Request**:
   - Método `POST`
   - URL: `https://technova-t0j2.onrender.com/api/bot/simulate`
   - Body (JSON): `{"from":"{{$json.body.from}}","text":"{{$json.body.text}}"}`
   - Envía como JSON, espera JSON.
3. **Respond to Webhook** (si usaste Webhook) devolviendo `{{$json.reply}}`,
   o nodo **WhatsApp** / **Telegram** para enviar `{{$json.reply}}` al cliente.
4. Activa el workflow. El webhook queda en:
   `https://technova-n8n.onrender.com/webhook/techova-bot`

## Conectar un canal real
- **WhatsApp (Meta):** necesitas `WHATSAPP_TOKEN` + `WHATSAPP_PHONE_ID`. Usa el nodo
  "WhatsApp" de n8n y pon como Callback URL el webhook de arriba.
- **Telegram:** necesitas el token de @BotFather. Usa el nodo "Telegram Trigger".

Cualquiera de los dos requiere una credencial tuya (n8n no la genera). Mientras tanto,
el **chat en sitio** (globo abajo a la derecha en https://technova-t0j2.onrender.com)
ya funciona sin ninguna cuenta externa.

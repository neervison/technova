# Conectar el bot de WhatsApp (Meta Cloud API)

El bot ya está programado en `server/bot.js` + `server/bot.json` y expone:
- Webhook: `https://<tu-dominio>/webhook/whatsapp` (GET verifica, POST recibe mensajes)
- Simulador de prueba: `POST /api/bot/simulate` `{ "from": "...", "text": "..." }`

Para que responda a clientes **reales** necesitas una cuenta de **WhatsApp Business** verificada y conectarla con Meta. Pasos:

## 1. Crear la app en Meta
1. Entra a https://developers.facebook.com y crea una app (tipo "Business").
2. En el panel de la app, agrega el producto **WhatsApp**.
3. En la sección **WhatsApp > API Setup** verás:
   - **Phone Number ID** (ej. `1234567890...`) → guárdalo.
   - Un **token temporal**. Genera un **token permanente** (System User) desde
     *WhatsApp > API Setup > Generate access token* o creando un System User en
     *Business Manager > Users > System Users* y dándole permiso `whatsapp_business_messaging`.
   - El número de prueba ya viene asociado; para producción conecta tu número real
     verificado (Business Manager > Phone Numbers).

## 2. Variables de entorno (Render)
En el panel de Render de este servicio, agrega/actualiza:
- `WHATSAPP_TOKEN` = el token permanente de arriba
- `WHATSAPP_PHONE_ID` = el Phone Number ID
- `WHATSAPP_VERIFY_TOKEN` = `techNovaWebhook2026` (o cámbialo en `server/app.js` y aquí)
- Opcional `WHATSAPP_TEMPLATE` = nombre de una plantilla aprobada (solo para enviar
  fuera de la ventana de 24 h después de que el cliente escribió).

## 3. Configurar el Webhook en Meta
1. En la app de Meta: **WhatsApp > Configuration > Webhooks**.
2. Click **Edit** y pon:
   - **Callback URL**: `https://technova-t0j2.onrender.com/webhook/whatsapp`
   - **Verify token**: `techNovaWebhook2026` (debe coincidir con `WHATSAPP_VERIFY_TOKEN`)
3. Suscríbete a los campos: marca **messages** (y opcionalmente `message_deliveries`).
4. Guarda. Meta hará un GET de verificación; el servidor responde `200` con el challenge.

## 4. Probar
- Envía un WhatsApp a tu número de negocio desde otro teléfono.
- El bot debe responder con el menú (`hola` → opciones 1-5, submenús, FAQ con
  "precio"/"horario"/"ubicacion", y al elegir 5 avisa a tu número de asesor).
- Para probar sin Meta usa: `POST https://technova-t0j2.onrender.com/api/bot/simulate`
  con body `{"from":"56961112430","text":"hola"}`.

## 5. Notas
- **Ventana de 24 h:** Meta permite responder con texto libre solo dentro de las 24 h
  desde que el cliente escribió. Fuera de eso, el bot usará `WHATSAPP_TEMPLATE` (debe
  estar aprobada en Meta > Message Templates).
- **Personalizar respuestas:** edita `server/bot.json` (no requiere tocar código).
- **Quitar el simulador en producción:** `POST /api/bot/simulate` es público; puedes
  borrarlo o protegerlo si lo deseas.
- El número de asesor al que avisa el bot está en `bot.json` → `advisorNumber`.

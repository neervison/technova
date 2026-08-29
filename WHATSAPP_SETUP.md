# Conectar el bot de WhatsApp (Meta Cloud API)

El bot ya está programado en `server/bot.js` + `server/bot.json` y expone:
- Webhook: `https://<tu-dominio>/webhook/whatsapp` (GET verifica, POST recibe mensajes)
- Simulador de prueba: `POST /api/bot/simulate` `{ "from": "...", "text": "..." }`

Para que responda a clientes **reales** necesitas una cuenta de **WhatsApp Business** verificada y conectarla con Meta. Pasos:

## Dónde copiar cada valor (en developers.facebook.com)
- **WHATSAPP_PHONE_ID**: entra a tu app → menú izquierdo **WhatsApp > API Setup**. En la tarjeta *Send messages* verás tu número y, justo debajo, el **Phone Number ID** (cadena numérica larga, ej. `123456789012345`). Cópialo.
- **WHATSAPP_TOKEN** (temporal, para probar ya): en la misma página **WhatsApp > API Setup**, arriba a la derecha hay un botón **"Generate access token"**. Cópialo; expira en ~60 min.
- **WHATSAPP_TOKEN** (permanente, para producción): ver sección 1 abajo (System User en Business Manager).

## 1. Crear la app en Meta
1. Entra a https://developers.facebook.com y crea una app (tipo "Business").
2. En el panel de la app, agrega el producto **WhatsApp**.
3. En la sección **WhatsApp > API Setup** verás:
   - **Phone Number ID** (ej. `1234567890...`) → guárdalo.
   - El **token temporal** (válido ~60 min). Cámbialo por un **token permanente**:
     - Ve a *Meta Business Manager > Configuración > Usuarios > System Users*.
     - Crea un *System User* (nombre p.ej. `techNovaBot`), rol *Admin*.
     - En *System Users*, entra al usuario y en *Assign Assets* agrega tu
       *Business Account* y tu app, con permiso `whatsapp_business_messaging`
       (y `whatsapp_business_management` para configurar).
     - Genera un *System User Access Token* con ese permiso y unigura la vigencia
       (p.ej. 1 año). **Cópialo ya**: solo se muestra una vez.
     - Ese token va en la variable `WHATSAPP_TOKEN` de Render.
   - El número de prueba ya viene asociado; para producción conecta tu número real
     verificado (Business Manager > Phone Numbers) y usalo en `WHATSAPP_PHONE_ID`.

   > Si prefieres lo rápido para pruebas: en *WhatsApp > API Setup* hay un botón
   > *Generate access token* (temporal). Funciona para validar el webhook, pero
   > expirará; usa el System User para producción.

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

## Opción B: Bot en Telegram (más simple, sin Meta)
El mismo `bot.js` / `bot.json` funciona en Telegram. Pasos:
1. En Telegram habla con **@BotFather** y manda `/newbot`. Dale nombre y usuario. BotFather te devuelve un **token** (`123456789:ABC...`).
2. Pon ese token en la variable de entorno **`TELEGRAM_TOKEN`** (Render → Environment, o tu `.env`).
3. La app registra sola el webhook en `https://<tu-dominio>/webhook/telegram` al arrancar (usa `RENDER_EXTERNAL_URL`). Para forzarlo manualmente:
   `https://api.telegram.org/bot<TOKEN>/setWebhook?url=<tu-dominio>/webhook/telegram`
4. Escríbele al bot en Telegram y responderá con los mismos menús, precios y consulta de pedidos.

Ventaja: no necesitas cuenta de Meta ni verificación de número; el bot queda en vivo en minutos.

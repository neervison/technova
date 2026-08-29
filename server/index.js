// Punto de entrada para un proceso Node normal (local, Render, Railway, Docker).
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const { app } = require('./app');
const { connect } = require('./db');

const PORT = process.env.PORT || 3000;

connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`TechNova corriendo en http://localhost:${PORT}`);
      const telegramToken = process.env.TELEGRAM_TOKEN;
      const publicUrl = process.env.RENDER_EXTERNAL_URL || process.env.PUBLIC_URL;
      if (telegramToken && publicUrl) {
        const hook = `${publicUrl.replace(/\/$/, '')}/webhook/telegram`;
        fetch(`https://api.telegram.org/bot${telegramToken}/setWebhook?url=${encodeURIComponent(hook)}`)
          .then(() => console.log('Webhook de Telegram registrado:', hook))
          .catch((e) => console.error('No se pudo registrar webhook Telegram:', e.message));
      }
    });
  })
  .catch((e) => {
    console.error('No se pudo conectar a MongoDB:', e.message);
    process.exit(1);
  });

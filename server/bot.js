// TechNova — bot de WhatsApp (lógica de menús basada en la info del sitio).
// Usa server/bot.json como base de conocimiento. Mantiene sesión en memoria.
const fs = require('node:fs');
const path = require('node:path');
const db = require('./db');

const DATA = JSON.parse(fs.readFileSync(path.join(__dirname, 'bot.json'), 'utf8'));

// Sesiones: phone -> { step: 'main'|'repair'|'optimize'|'web'|'portfolio' }
const sessions = new Map();
const TTL = 10 * 60 * 1000; // 10 min
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of sessions) if (now - v.ts > TTL) sessions.delete(k);
}, 60 * 1000);

function setStep(phone, step) {
  sessions.set(phone, { step, ts: Date.now() });
}
function getStep(phone) {
  const s = sessions.get(phone);
  return s ? s.step : 'main';
}

function firstDigit(text) {
  const m = String(text || '').trim().match(/^[1-5]/);
  return m ? m[0] : null;
}

// Consulta el último pedido de un cliente por su número (si existe).
async function orderStatus(phone) {
  try {
    const D = db.getDb();
    if (!D) return null;
    const digits = String(phone || '').replace(/\D/g, '');
    if (!digits) return null;
    const custs = await D.collection('customers').find({}).toArray();
    const cust = custs.find((c) => String(c.phone || '').replace(/\D/g, '') === digits);
    if (!cust) return null;
    const orders = await D.collection('orders')
      .find({ customer_id: cust._id })
      .sort({ created_at: -1 })
      .limit(1)
      .toArray();
    return orders && orders.length ? orders[0] : null;
  } catch (e) {
    console.error('orderStatus error:', e.message);
    return null;
  }
}

// Devuelve { reply, advisor } donde advisor=true indica avisar al negocio.
async function handleIncoming(phone, text) {
  const raw = String(text || '').trim().toLowerCase();
  const digit = firstDigit(text);
  const step = getStep(phone);

  // Reinicio explícito
  if (raw.includes('menu') || raw.includes('inicio') || raw.includes('hola')) {
    setStep(phone, 'main');
    return { reply: DATA.welcome };
  }

  // Estado de pedido / cita (consulta la base de datos)
  if (/pedido|estado|seguimiento|orden|cit/.test(raw)) {
    const o = await orderStatus(phone);
    if (o) {
      return {
        reply: `*Estado de tu pedido:*\nServicio: ${o.service}\nFecha: ${o.fecha || '—'}\nHora: ${o.hora || '—'}\nEstado: ${o.status}`,
      };
    }
    return {
      reply: 'No encontré pedidos asociados a tu número. Si quieres, agendamos uno escribiendo el número de la opción (1-5) o aquí: https://technova-t0j2.onrender.com/#agendar',
    };
  }

  // Preguntas frecuentes por palabra clave
  const faq = {
    precio: DATA.replies.precio, costo: DATA.replies.precio, cotizar: DATA.replies.precio,
    horario: DATA.replies.horario, hora: DATA.replies.horario,
    ubicacion: DATA.replies.ubicacion, donde: DATA.replies.ubicacion,
    gracias: DATA.replies.gracias,
    si: DATA.replies.ok, ok: DATA.replies.ok, vale: DATA.replies.ok, claro: DATA.replies.ok,
    no: DATA.replies.no,
  };
  for (const k in faq) {
    if (raw.includes(k)) return { reply: faq[k] };
  }

  if (step === 'main') {
    if (!digit) return { reply: DATA.welcome };
    const map = { '1': 'repair', '2': 'optimize', '3': 'web', '4': 'portfolio', '5': 'advisor' };
    const key = map[digit];
    if (key === 'repair' || key === 'optimize' || key === 'web') {
      setStep(phone, key);
      return { reply: DATA.replies[key] };
    }
    if (key === 'portfolio') return { reply: DATA.replies.portfolio };
    if (key === 'advisor') return { reply: DATA.replies.advisor, advisor: true };
    return { reply: DATA.replies.fallback };
  }

  if (step === 'repair') {
    if (digit === '1') { setStep(phone, 'main'); return { reply: DATA.replies.repair_laptop }; }
    if (digit === '2') { setStep(phone, 'main'); return { reply: DATA.replies.repair_desktop }; }
    if (digit === '5') return { reply: DATA.replies.advisor, advisor: true };
    return { reply: DATA.replies.fallback };
  }

  if (step === 'optimize') {
    if (digit === '1') { setStep(phone, 'main'); return { reply: DATA.replies.advisor }; }
    if (digit === '2') { setStep(phone, 'main'); return { reply: DATA.replies.bye }; }
    if (digit === '5') return { reply: DATA.replies.advisor, advisor: true };
    return { reply: DATA.replies.fallback };
  }

  if (step === 'web') {
    const map = { '1': 'web_landing', '2': 'web_store', '3': 'web_system' };
    if (map[digit]) { setStep(phone, 'main'); return { reply: DATA.replies[map[digit]] }; }
    if (digit === '5') return { reply: DATA.replies.advisor, advisor: true };
    return { reply: DATA.replies.fallback };
  }

  if (step === 'portfolio') {
    if (digit === '5') return { reply: DATA.replies.advisor, advisor: true };
    return { reply: DATA.replies.fallback };
  }

  // Por defecto: menú principal
  setStep(phone, 'main');
  return { reply: DATA.welcome };
}

module.exports = { handleIncoming, advisorNumber: DATA.advisorNumber };

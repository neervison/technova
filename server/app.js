// TechNova — app Express (landing + API de pedidos + panel del vendedor).
// Este módulo SOLO define la app (sin escuchar el puerto) para que pueda
// reutilizarse tanto en un proceso Node normal como en serverless (Vercel).
const path = require('node:path');
const express = require('express');
const db = require('./db');
const auth = require('./auth');
const invoice = require('./invoice');
const bot = require('./bot');

const app = express();
const PUBLIC = path.join(__dirname, '..', 'public');

const company = {
  name: process.env.COMPANY_NAME || 'TechNova',
  rfc: process.env.COMPANY_RFC || '',
  address: process.env.COMPANY_ADDRESS || '',
  phone: process.env.COMPANY_PHONE || '',
  email: process.env.COMPANY_EMAIL || '',
};

// ---------- notificación WhatsApp (Meta Cloud API) ----------
// Se activa solo si configuras WHATSAPP_TOKEN y WHATSAPP_PHONE_ID en las
// variables de entorno. Envía un mensaje de confirmación al cliente cuando
// crea un pedido. Fuera de la ventana de 24h de WhatsApp se requiere una
// plantilla aprobada (usa WHATSAPP_TEMPLATE). No rompe el flujo si falla.
// Envía un mensaje de texto por WhatsApp (Meta Cloud API). No hace nada si no
// hay credenciales. Reutilizable por notificaciones y por el bot.
async function sendWhatsApp(to, text) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  if (!token || !phoneId) return false;

  let digits = String(to || '').replace(/\D/g, '');
  if (!digits.startsWith('56') && digits.length === 9) digits = '56' + digits;
  if (!digits) return false;

  const url = `https://graph.facebook.com/v19.0/${phoneId}/messages`;
  const template = process.env.WHATSAPP_TEMPLATE;
  const body = template
    ? {
        messaging_product: 'whatsapp',
        to: digits,
        type: 'template',
        template: {
          name: template,
          language: { code: 'es' },
          components: [{ type: 'body', parameters: [{ type: 'text', text: text }] }],
        },
      }
    : { messaging_product: 'whatsapp', to: digits, type: 'text', text: { body: text } };

  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      const err = await r.text().catch(() => '');
      console.error('WhatsApp send falló:', r.status, err.slice(0, 200));
      return false;
    }
    return true;
  } catch (e) {
    console.error('WhatsApp send error:', e.message);
    return false;
  }
}

// Notificación de confirmación de pedido al cliente (usa sendWhatsApp).
async function notifyWhatsApp(telefono, nombre, servicio, orderId) {
  const shortId = String(orderId).slice(-6);
  const text = `*¡Hola ${nombre || ''}!* Gracias por tu solicitud en TechNova. Recibimos tu pedido (#${shortId}) de *${servicio}*. Te contactaremos pronto para confirmar los detalles.`;
  await sendWhatsApp(telefono, text);
}

// ---------- webhook de WhatsApp (Meta Cloud API) ----------
const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'techNovaWebhook';

app.get('/webhook/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

app.post('/webhook/whatsapp', (req, res) => {
  res.sendStatus(200); // acuse inmediato a Meta
  const entry = req.body && req.body.entry;
  if (!entry) return;
  (async () => {
    for (const e of entry) {
      for (const change of e.changes || []) {
        const value = change.value || {};
        const msg = value.messages && value.messages[0];
        if (!msg) continue;
        const from = msg.from;
        const text = (msg.text && msg.text.body) || '';
        const { reply, advisor } = bot.handleIncoming(from, text);
        await sendWhatsApp(from, reply);
        if (advisor && bot.advisorNumber) {
          await sendWhatsApp(bot.advisorNumber, `📩 Cliente ${from} pidió hablar con un asesor vía bot.`);
        }
      }
    }
  })().catch((err) => console.error('Webhook WhatsApp error:', err.message));
});

// Ruta de prueba del bot sin Meta (desarrollo)
app.post('/api/bot/simulate', (req, res) => {
  const from = (req.body && req.body.from) || '56961112430';
  const text = (req.body && req.body.text) || '';
  const out = bot.handleIncoming(from, text);
  res.json({ reply: out.reply, advisor: !!out.advisor });
});

// ---------- utilidades ----------
function getCookie(req, name) {
  const c = req.headers.cookie;
  if (!c) return null;
  const m = c.split(';').map(s => s.trim()).find(s => s.startsWith(name + '='));
  return m ? decodeURIComponent(m.split('=').slice(1).join('=')) : null;
}
function requireAuth(req, res, next) {
  if (!auth.isValid(getCookie(req, 'tn_session'))) return res.status(401).json({ error: 'No autenticado' });
  next();
}
function requireAuthHtml(req, res, next) {
  if (!auth.isValid(getCookie(req, 'tn_session'))) return res.redirect('/admin');
  next();
}
function toStrId(doc) {
  if (!doc) return doc;
  if (doc._id) doc.id = doc._id.toString();
  return doc;
}

async function getInvoiceData(orderId) {
  const D = db.getDb();
  const _id = db.ObjectId.isValid(orderId) ? new db.ObjectId(orderId) : null;
  if (!_id) return null;
  const order = await D.collection('orders').findOne({ _id });
  if (!order) return null;
  const cust = await D.collection('customers').findOne({ _id: order.customer_id }) || {};
  const inv = await D.collection('invoices').findOne({ order_id: _id });
  return {
    customer: { name: cust.name, phone: cust.phone, email: cust.email },
    order: {
      id: order._id.toString(),
      service: order.service,
      fecha: order.fecha,
      hora: order.hora,
      descripcion: order.descripcion,
    },
    invoice: inv ? toStrId({ ...inv, order_id: inv.order_id.toString() }) : null,
  };
}

// ---------- middleware ----------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(PUBLIC, {
  setHeaders(res) {
    res.setHeader('Cache-Control', 'no-cache');
  },
}));

// ---------- salud ----------
app.get('/api/health', (req, res) => res.json({ ok: true }));

// ---------- público: crear pedido (y redirigir a WhatsApp) ----------
app.post('/api/orders', async (req, res) => {
  const D = db.getDb();
  const { servicio, fecha, hora, nombre, telefono, descripcion } = req.body || {};
  if (!servicio || !nombre || !telefono) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }
  let cust = await D.collection('customers').findOne({ phone: telefono });
  if (!cust) {
    const info = await D.collection('customers').insertOne({
      name: nombre, phone: telefono, email: null, created_at: new Date().toISOString(),
    });
    cust = { _id: info.insertedId };
  }
  const info = await D.collection('orders').insertOne({
    customer_id: cust._id,
    service: servicio,
    fecha: fecha || null,
    hora: hora || null,
    descripcion: descripcion || null,
    status: 'pendiente',
    total: null,
    created_at: new Date().toISOString(),
  });
  const orderId = info.insertedId.toString();

  const waNumber = process.env.WA_NUMBER || '56961112430';
  const greeting = process.env.WA_GREETING || '*¡Hola!* Somos TechNova. Cuéntanos en qué te ayudamos: reparación y optimización de tu PC, mantenimiento o desarrollo web. Agenda tu cita, ¡rápido y garantizado!';
  const msg = `${greeting}\n\n*¡Quiero agendar una cita!*\n\n*Servicio:* ${servicio}\n*Fecha:* ${fecha || '—'}\n*Hora:* ${hora || '—'}\n*Nombre:* ${nombre}\n*Teléfono:* ${telefono}\n\n*Descripción:*\n${descripcion || '—'}`;
  const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;

  // Notificación automática al cliente por WhatsApp (si hay credenciales)
  notifyWhatsApp(telefono, nombre, servicio, orderId).catch(() => {});

  res.json({ ok: true, orderId, waLink });
});

// ---------- panel del vendedor ----------
app.get('/admin', (req, res) => res.sendFile(path.join(PUBLIC, 'admin.html')));

app.post('/admin/login', (req, res) => {
  const { password } = req.body || {};
  if (password && password === process.env.ADMIN_PASSWORD) {
    const token = auth.createSession();
    res.cookie('tn_session', token, { httpOnly: true, sameSite: 'lax', maxAge: 8 * 60 * 60 * 1000 });
    return res.json({ ok: true });
  }
  res.status(401).json({ error: 'Contraseña incorrecta' });
});

app.post('/admin/logout', (req, res) => {
  auth.destroy(getCookie(req, 'tn_session'));
  res.clearCookie('tn_session');
  res.json({ ok: true });
});

app.get('/api/admin/me', (req, res) => res.json({ authed: auth.isValid(getCookie(req, 'tn_session')) }));

app.get('/api/admin/customers', requireAuth, async (req, res) => {
  const D = db.getDb();
  const rows = await D.collection('customers').aggregate([
    {
      $lookup: {
        from: 'orders', localField: '_id', foreignField: 'customer_id', as: 'ord',
      },
    },
    {
      $project: {
        name: 1, phone: 1, email: 1, created_at: 1,
        orders: { $size: '$ord' },
      },
    },
    { $sort: { created_at: -1 } },
  ]).toArray();
  res.json(rows.map(toStrId));
});

app.get('/api/admin/orders', requireAuth, async (req, res) => {
  const D = db.getDb();
  const rows = await D.collection('orders').aggregate([
    {
      $lookup: {
        from: 'customers', localField: 'customer_id', foreignField: '_id', as: 'c',
      },
    },
    { $unwind: { path: '$c', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        service: 1, fecha: 1, hora: 1, descripcion: 1, status: 1, total: 1, created_at: 1,
        customer_name: '$c.name', customer_phone: '$c.phone',
      },
    },
    { $sort: { created_at: -1 } },
  ]).toArray();
  res.json(rows.map(toStrId));
});

app.post('/api/admin/orders/:id/status', requireAuth, async (req, res) => {
  const D = db.getDb();
  const { status } = req.body || {};
  const _id = db.ObjectId.isValid(req.params.id) ? new db.ObjectId(req.params.id) : null;
  if (!_id) return res.status(400).json({ error: 'ID inválido' });
  await D.collection('orders').updateOne({ _id }, { $set: { status } });
  res.json({ ok: true });
});

app.post('/api/admin/invoices', requireAuth, async (req, res) => {
  const D = db.getDb();
  const { orderId, subtotal, tax = 0, notes = '' } = req.body || {};
  const _id = db.ObjectId.isValid(orderId) ? new db.ObjectId(orderId) : null;
  if (!_id) return res.status(400).json({ error: 'ID de pedido inválido' });

  if (await D.collection('invoices').findOne({ order_id: _id })) {
    return res.status(409).json({ error: 'Ya existe una factura para este pedido' });
  }
  const subtotalN = Number(subtotal) || 0;
  const taxN = Number(tax) || 0;
  const total = +(subtotalN + taxN).toFixed(2);
  const count = await D.collection('invoices').countDocuments();
  const number = 'FAC-' + String(count + 1).padStart(4, '0');
  const info = await D.collection('invoices').insertOne({
    order_id: _id, number, subtotal: subtotalN, tax: taxN, total, notes: notes || null,
    issued_at: new Date().toISOString(),
  });
  res.json({ ok: true, invoiceId: info.insertedId.toString(), number });
});

app.get('/api/admin/invoices/:orderId', requireAuth, async (req, res) => {
  const data = await getInvoiceData(req.params.orderId);
  if (!data || !data.invoice) return res.status(404).json({ error: 'Sin factura' });
  res.json({ ...data.invoice, customer: data.customer, order: data.order });
});

// ---------- páginas de factura ----------
app.get('/admin/invoice/:orderId', requireAuthHtml, async (req, res) => {
  const data = await getInvoiceData(req.params.orderId);
  if (!data) return res.status(404).send('Pedido no encontrado');
  res.type('html').send(invoice.renderInvoiceHTML(company, data.customer, data.order, data.invoice));
});

app.get('/admin/pdf/:orderId', requireAuthHtml, async (req, res) => {
  const data = await getInvoiceData(req.params.orderId);
  if (!data || !data.invoice) return res.status(404).send('Sin factura');
  const doc = invoice.buildPdfDoc(company, data.customer, data.order, data.invoice);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="factura-${data.invoice.number}.pdf"`);
  doc.pipe(res);
  doc.end();
});

module.exports = { app };

// TechNova — servidor Express (landing + API de pedidos + panel del vendedor).
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const path = require('node:path');
const express = require('express');
const db = require('./db');
const auth = require('./auth');
const invoice = require('./invoice');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, '..', 'public');

const company = {
  name: process.env.COMPANY_NAME || 'TechNova',
  rfc: process.env.COMPANY_RFC || '',
  address: process.env.COMPANY_ADDRESS || '',
  phone: process.env.COMPANY_PHONE || '',
  email: process.env.COMPANY_EMAIL || '',
};

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
function getInvoiceData(orderId) {
  const order = db.prepare(`
    SELECT o.id, o.service, o.fecha, o.hora, o.descripcion, o.status,
           c.name AS customer_name, c.phone AS customer_phone, c.email AS customer_email
    FROM orders o JOIN customers c ON c.id = o.customer_id
    WHERE o.id = ?
  `).get(orderId);
  if (!order) return null;
  const inv = db.prepare('SELECT * FROM invoices WHERE order_id = ?').get(orderId) || null;
  return {
    customer: { name: order.customer_name, phone: order.customer_phone, email: order.customer_email },
    order: { id: order.id, service: order.service, fecha: order.fecha, hora: order.hora, descripcion: order.descripcion },
    invoice: inv,
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
app.post('/api/orders', (req, res) => {
  const { servicio, fecha, hora, nombre, telefono, descripcion } = req.body || {};
  if (!servicio || !nombre || !telefono) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }
  let cust = db.prepare('SELECT id FROM customers WHERE phone = ?').get(telefono);
  if (!cust) {
    const info = db.prepare('INSERT INTO customers (name, phone) VALUES (?, ?)').run(nombre, telefono);
    cust = { id: Number(info.lastInsertRowid) };
  }
  const info = db.prepare(
    'INSERT INTO orders (customer_id, service, fecha, hora, descripcion, status) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(cust.id, servicio, fecha || null, hora || null, descripcion || null, 'pendiente');
  const orderId = Number(info.lastInsertRowid);

  const waNumber = process.env.WA_NUMBER || '5210000000000';
  const msg = `¡Hola! Quiero agendar una cita 🚀\n\n*Servicio:* ${servicio}\n*Fecha:* ${fecha || '—'}\n*Hora:* ${hora || '—'}\n*Nombre:* ${nombre}\n*Teléfono:* ${telefono}\n\n*Descripción:*\n${descripcion || '—'}`;
  const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;

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

app.get('/api/admin/customers', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT c.*, COUNT(o.id) AS orders
    FROM customers c LEFT JOIN orders o ON o.customer_id = c.id
    GROUP BY c.id ORDER BY c.created_at DESC
  `).all();
  res.json(rows);
});

app.get('/api/admin/orders', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT o.*, c.name AS customer_name, c.phone AS customer_phone
    FROM orders o JOIN customers c ON c.id = o.customer_id
    ORDER BY o.created_at DESC
  `).all();
  res.json(rows);
});

app.post('/api/admin/orders/:id/status', requireAuth, (req, res) => {
  const { status } = req.body || {};
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ ok: true });
});

app.delete('/api/admin/orders/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  db.prepare('DELETE FROM invoices WHERE order_id = ?').run(id);
  db.prepare('DELETE FROM orders WHERE id = ?').run(id);
  res.json({ ok: true });
});

app.delete('/api/admin/customers/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const ord = db.prepare('SELECT id FROM orders WHERE customer_id = ?').all(id);
  ord.forEach(o => db.prepare('DELETE FROM invoices WHERE order_id = ?').run(o.id));
  db.prepare('DELETE FROM orders WHERE customer_id = ?').run(id);
  db.prepare('DELETE FROM customers WHERE id = ?').run(id);
  res.json({ ok: true });
});

app.post('/api/admin/invoices', requireAuth, (req, res) => {
  const { orderId, subtotal, tax = 0, notes = '' } = req.body || {};
  if (db.prepare('SELECT id FROM invoices WHERE order_id = ?').get(orderId)) {
    return res.status(409).json({ error: 'Ya existe una factura para este pedido' });
  }
  const subtotalN = Number(subtotal) || 0;
  const taxN = Number(tax) || 0;
  const total = +(subtotalN + taxN).toFixed(2);
  const info = db.prepare(
    'INSERT INTO invoices (order_id, number, subtotal, tax, total, notes) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(orderId, '', subtotalN, taxN, total, notes || null);
  const invId = Number(info.lastInsertRowid);
  const number = 'FAC-' + String(invId).padStart(4, '0');
  db.prepare('UPDATE invoices SET number = ? WHERE id = ?').run(number, invId);
  res.json({ ok: true, invoiceId: invId, number });
});

app.get('/api/admin/invoices/:orderId', requireAuth, (req, res) => {
  const data = getInvoiceData(req.params.orderId);
  if (!data || !data.invoice) return res.status(404).json({ error: 'Sin factura' });
  res.json({ ...data.invoice, customer: data.customer, order: data.order });
});

// ---------- páginas de factura ----------
app.get('/admin/invoice/:orderId', requireAuthHtml, (req, res) => {
  const data = getInvoiceData(req.params.orderId);
  if (!data) return res.status(404).send('Pedido no encontrado');
  res.type('html').send(invoice.renderInvoiceHTML(company, data.customer, data.order, data.invoice));
});

app.get('/admin/pdf/:orderId', requireAuthHtml, (req, res) => {
  const data = getInvoiceData(req.params.orderId);
  if (!data || !data.invoice) return res.status(404).send('Sin factura');
  const doc = invoice.buildPdfDoc(company, data.customer, data.order, data.invoice);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="factura-${data.invoice.number}.pdf"`);
  doc.pipe(res);
  doc.end();
});

app.listen(PORT, () => console.log(`TechNova corriendo en http://localhost:${PORT}`));

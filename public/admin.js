// Panel del vendedor: login + dashboard de clientes/pedidos + facturación.
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

const STATUSES = ['pendiente', 'en progreso', 'completado', 'cancelado'];

async function authed() {
  const r = await fetch('/api/admin/me');
  return (await r.json()).authed;
}

async function apiJSON(url, opts) {
  const r = await fetch(url, opts);
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || r.status);
  return r.json();
}

function showLogin() {
  $('#view').innerHTML = `
    <div class="min-h-[60vh] flex items-center justify-center">
      <form id="login-form" class="w-full max-w-sm bg-brand-card border border-brand-border rounded-2xl p-8">
        <h1 class="font-display text-2xl font-bold text-white mb-1">Panel del vendedor</h1>
        <p class="text-sm text-slate-400 mb-6">Inicia sesión para continuar</p>
        <label class="block text-sm text-slate-300 mb-2" for="password">Contraseña</label>
        <input id="password" type="password" required class="w-full rounded-xl bg-brand-dark border border-brand-border px-4 py-3 text-white focus:outline-none focus:border-brand-emerald" />
        <button class="mt-6 w-full px-6 py-3 rounded-full bg-gradient-to-r from-brand-emerald to-brand-cyan text-brand-dark font-semibold hover:opacity-90">Entrar</button>
        <p id="err" class="text-red-400 text-sm mt-3 hidden">Contraseña incorrecta</p>
      </form>
    </div>`;
  $('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const r = await fetch('/admin/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: $('#password').value })
    });
    if (r.ok) location.reload();
    else $('#err').classList.remove('hidden');
  });
}

function statCard(label, value) {
  return `<div class="bg-brand-card border border-brand-border rounded-2xl p-5">
    <p class="text-sm text-slate-400">${label}</p>
    <p class="font-display text-3xl font-bold text-white mt-1">${value}</p>
  </div>`;
}

function statusSelect(current, id) {
  const opts = STATUSES.map(s =>
    `<option value="${s}" ${s === current ? 'selected' : ''}>${s}</option>`).join('');
  return `<select data-status="${id}" class="status-select rounded-lg bg-brand-dark border border-brand-border px-2 py-1 text-sm text-white focus:outline-none focus:border-brand-emerald">${opts}</select>`;
}

async function showDashboard() {
  const [customers, orders] = await Promise.all([
    apiJSON('/api/admin/customers'),
    apiJSON('/api/admin/orders')
  ]);

  const pending = orders.filter(o => o.status === 'pendiente').length;

  const customersRows = customers.map(c => `
    <tr class="border-t border-brand-border">
      <td class="py-2 pr-4">${c.id}</td>
      <td class="py-2 pr-4 text-white">${esc(c.name)}</td>
      <td class="py-2 pr-4">${esc(c.phone)}</td>
      <td class="py-2 pr-4">${c.orders}</td>
      <td class="py-2 pr-4">
        <a href="${waLinkFor(c.phone, c.name)}" target="_blank" class="text-brand-emerald hover:text-brand-cyan font-medium whitespace-nowrap">WhatsApp →</a>
      </td>
      <td class="py-2 pr-4">
        <button data-del-customer="${c.id}" class="text-red-400 hover:text-red-300 font-medium">Eliminar</button>
      </td>
    </tr>`).join('') || `<tr><td colspan="6" class="py-4 text-slate-500">Sin clientes aún</td></tr>`;

  const ordersRows = orders.map(o => `
    <tr class="border-t border-brand-border">
      <td class="py-2 pr-4">${o.id}</td>
      <td class="py-2 pr-4 text-white">${esc(o.customer_name)}</td>
      <td class="py-2 pr-4">${esc(o.service)}</td>
      <td class="py-2 pr-4">${esc(o.fecha || '—')}</td>
      <td class="py-2 pr-4">${esc(o.hora || '—')}</td>
      <td class="py-2 pr-4">${statusSelect(o.status, o.id)}</td>
      <td class="py-2 pr-4">
        <a href="${waLinkFor(o.customer_phone, o.customer_name)}" target="_blank" class="text-brand-emerald hover:text-brand-cyan font-medium whitespace-nowrap">WhatsApp →</a>
      </td>
      <td class="py-2 pr-4">
        <a href="/admin/invoice/${o.id}" target="_blank" class="text-brand-emerald hover:text-brand-cyan font-medium">Factura →</a>
      </td>
      <td class="py-2 pr-4">
        <button data-del-order="${o.id}" ${o.status === 'completado' ? 'disabled title="No se puede eliminar un pedido concretado"' : ''} class="text-red-400 hover:text-red-300 font-medium disabled:opacity-30 disabled:cursor-not-allowed">Eliminar</button>
      </td>
    </tr>`).join('') || `<tr><td colspan="9" class="py-4 text-slate-500">Sin pedidos aún</td></tr>`;

  $('#view').innerHTML = `
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="font-display text-3xl font-bold text-white">Panel del <span class="text-brand-emerald">vendedor</span></h1>
        <p class="text-sm text-slate-400">Clientes, pedidos y facturación</p>
      </div>
      <a href="/" class="px-5 py-2 rounded-full border border-brand-border text-sm hover:border-brand-cyan transition-colors">Ver sitio web</a>
      <button id="logout" class="px-5 py-2 rounded-full border border-brand-border text-sm hover:border-brand-cyan transition-colors">Cerrar sesión</button>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      ${statCard('Clientes', customers.length)}
      ${statCard('Pedidos', orders.length)}
      ${statCard('Pendientes', pending)}
    </div>

    <div class="grid grid-cols-1 gap-8">
      <section class="bg-brand-card border border-brand-border rounded-2xl p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-display text-xl font-semibold text-white">Clientes</h2>
          <span class="text-xs text-slate-500">${customers.length} en total</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead><tr class="text-slate-400 text-left"><th class="pb-2 pr-4">#</th><th class="pb-2 pr-4">Nombre</th><th class="pb-2 pr-4">Teléfono</th><th class="pb-2 pr-4">Pedidos</th><th class="pb-2 pr-4">WhatsApp</th><th class="pb-2 pr-4">Eliminar</th></tr></thead>
            <tbody>${customersRows}</tbody>
          </table>
        </div>
      </section>

      <hr class="border-brand-border" />

      <section class="bg-brand-card border border-brand-border rounded-2xl p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-display text-xl font-semibold text-white">Pedidos</h2>
          <span class="text-xs text-slate-500">${orders.length} en total</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead><tr class="text-slate-400 text-left"><th class="pb-2 pr-4">#</th><th class="pb-2 pr-4">Cliente</th><th class="pb-2 pr-4">Servicio</th><th class="pb-2 pr-4">Fecha</th><th class="pb-2 pr-4">Hora</th><th class="pb-2 pr-4">Estado</th><th class="pb-2 pr-4">WhatsApp</th><th class="pb-2 pr-4">Factura</th><th class="pb-2 pr-4">Eliminar</th></tr></thead>
            <tbody>${ordersRows}</tbody>
          </table>
        </div>
      </section>
    </div>`;

  $('#logout').addEventListener('click', async () => {
    await fetch('/admin/logout', { method: 'POST' });
    location.reload();
  });

  $$('.status-select').forEach(sel => {
    sel.addEventListener('change', async () => {
      try {
        await apiJSON(`/api/admin/orders/${sel.dataset.status}/status`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: sel.value })
        });
        location.reload();
      } catch (e) { alert('No se pudo actualizar: ' + e.message); }
    });
  });

  // Eliminar pedidos (no permitido si está "completado").
  $$('[data-del-order]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('¿Eliminar este pedido? Esta acción no se puede deshacer.')) return;
      try {
        await apiJSON(`/api/admin/orders/${btn.dataset.delOrder}`, { method: 'DELETE' });
        location.reload();
      } catch (e) { alert('No se pudo eliminar: ' + e.message); }
    });
  });

  // Eliminar clientes (y sus pedidos/facturas asociados).
  $$('[data-del-customer]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('¿Eliminar este cliente y todos sus pedidos? No se puede deshacer.')) return;
      try {
        await apiJSON(`/api/admin/customers/${btn.dataset.delCustomer}`, { method: 'DELETE' });
        location.reload();
      } catch (e) { alert('No se pudo eliminar: ' + e.message); }
    });
  });
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Normaliza un teléfono a formato wa.me (Chile: 56 + 9 dígitos).
function waPhone(phone) {
  const d = String(phone || '').replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('56') || d.startsWith('521') || d.startsWith('52')) return d;
  if (d.length === 9) return '56' + d;
  if (d.length === 10) return '521' + d;
  return d;
}

// Link de WhatsApp para escribirle al CLIENTE (no a la empresa).
function waLinkFor(phone, name) {
  const p = waPhone(phone);
  if (!p) return '#';
  const company = (window.TN && window.TN.COMPANY_NAME) || 'TechNova';
  const msg = `Hola ${name || ''}, te saluda ${company} 👋\n\n`;
  return `https://wa.me/${p}?text=${encodeURIComponent(msg)}`;
}

document.addEventListener('DOMContentLoaded', async () => {
  if (await authed()) await showDashboard().catch(err => alert(err.message));
  else showLogin();
});

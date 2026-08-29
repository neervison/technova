// Generación de facturas: plantilla HTML imprimible + documento PDF (PDFKit).
const PDFDocument = require('pdfkit');

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function money(n) {
  return '$' + Number(n || 0).toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// HTML de la factura (o formulario de emisión si aún no existe).
function renderInvoiceHTML(company, customer, order, invoice) {
  if (!invoice) {
    return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Emitir factura</title>
    <style>
      body{font-family:Inter,system-ui,sans-serif;background:#0a0f1a;color:#e2e8f0;max-width:680px;margin:40px auto;padding:0 16px}
      .card{background:#111827;border:1px solid #1f2937;border-radius:16px;padding:24px}
      h1{color:#fff;font-size:20px}
      .meta{color:#94a3b8;font-size:13px;margin-top:6px}
      label{display:block;font-size:13px;color:#94a3b8;margin:14px 0 6px}
      input{width:100%;padding:10px;border-radius:10px;background:#0a0f1a;border:1px solid #1f2937;color:#fff;box-sizing:border-box}
      button{margin-top:18px;background:linear-gradient(90deg,#10b981,#22d3ee);color:#0a0f1a;border:0;padding:12px 18px;border-radius:9999px;font-weight:700;cursor:pointer}
    </style></head><body>
    <div class="card">
      <h1>Emitir factura — Pedido #${esc(order.id)}</h1>
      <p class="meta">Cliente: <b style="color:#fff">${esc(customer.name)}</b> · ${esc(customer.phone || '')}</p>
      <p class="meta">Servicio: ${esc(order.service)} · ${esc(order.fecha || '')} ${esc(order.hora || '')}</p>
       <form id="f">
         <label>Subtotal</label><input name="subtotal" id="subtotal" type="number" step="0.01" value="0" min="0">
         <label>IVA (19% en Chile)</label><input name="tax" id="tax" type="number" step="0.01" value="0" min="0">
         <label>Notas</label><input name="notes" type="text" placeholder="Opcional">
         <button type="submit">Emitir factura</button>
       </form>
       <p id="msg" style="color:#22d3ee;margin-top:12px"></p>
     </div>
     <script>
       // IVA 19% por defecto en Chile: se recalcula al cambiar el subtotal.
       const IVA = 0.19;
       const $sub = document.getElementById('subtotal');
       const $tax = document.getElementById('tax');
       function recalc() { $tax.value = (Number($sub.value || 0) * IVA).toFixed(2); }
       $sub.addEventListener('input', recalc);
       recalc();
       document.getElementById('f').addEventListener('submit', async (e) => {
         e.preventDefault();
         const b = new URLSearchParams(new FormData(e.target));
         const r = await fetch('/api/admin/invoices', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             orderId: ${order.id},
             subtotal: Number(b.get('subtotal')),
             tax: Number(b.get('tax')),
             notes: b.get('notes')
           })
         });
         if (r.ok) location.reload();
         else document.getElementById('msg').textContent = 'Error al emitir la factura';
       });
     </script></body></html>`;
  }

  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Factura ${esc(invoice.number)}</title>
  <style>
    body{font-family:Inter,system-ui,sans-serif;background:#0a0f1a;color:#0f172a;margin:0}
    .page{max-width:820px;margin:32px auto;background:#fff;border-radius:14px;padding:40px;box-shadow:0 10px 40px rgba(0,0,0,.3)}
    .head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #10b981;padding-bottom:18px}
    .brand{font-size:24px;font-weight:800}.brand span{color:#10b981}
    .sub{color:#64748b;font-size:13px}
    table{width:100%;border-collapse:collapse;margin-top:18px}
    th,td{text-align:left;padding:10px;border-bottom:1px solid #e2e8f0;font-size:14px;vertical-align:top}
    .tot{margin-top:18px;text-align:right}
    .tot div{margin:4px 0}
    .bar{margin-top:24px;display:flex;gap:12px}
    .btn{background:#0a0f1a;color:#fff;border:0;padding:10px 16px;border-radius:10px;cursor:pointer;text-decoration:none;font-size:14px}
    .btn.g{background:linear-gradient(90deg,#10b981,#22d3ee);color:#0a0f1a;font-weight:700}
    .notes{margin-top:16px;color:#475569;font-size:13px}
    @media print{body{background:#fff}.bar{display:none}.page{box-shadow:none;margin:0}}
  </style></head><body>
  <div class="page">
    <div class="head">
      <div>
        <div class="brand">${esc(company.name)}</div>
        <div class="sub">${esc(company.rfc ? 'RFC: ' + company.rfc : '')} ${esc(company.address)}<br>${esc(company.phone)} · ${esc(company.email)}</div>
      </div>
      <div style="text-align:right">
        <div class="sub">FACTURA</div>
        <div style="font-size:20px;font-weight:800">${esc(invoice.number)}</div>
        <div class="sub">${esc(invoice.issued_at)}</div>
      </div>
    </div>
    <h2>Cliente</h2>
    <div class="sub">${esc(customer.name)}<br>${esc(customer.phone || '')} ${esc(customer.email ? '· ' + customer.email : '')}</div>
    <table>
      <thead><tr><th>Concepto</th><th>Fecha</th><th>Hora</th><th>Detalle</th><th style="text-align:right">Importe</th></tr></thead>
      <tbody>
        <tr>
          <td>${esc(order.service)}</td>
          <td>${esc(order.fecha || '—')}</td>
          <td>${esc(order.hora || '—')}</td>
          <td>${esc(order.descripcion || '—')}</td>
          <td style="text-align:right">${money(invoice.subtotal)}</td>
        </tr>
      </tbody>
    </table>
    <div class="tot">
      <div>Subtotal: ${money(invoice.subtotal)}</div>
      <div>IVA/Impuesto: ${money(invoice.tax)}</div>
      <div style="font-size:18px;font-weight:800">Total: ${money(invoice.total)}</div>
    </div>
    ${invoice.notes ? `<div class="notes">Notas: ${esc(invoice.notes)}</div>` : ''}
    <div class="bar">
      <button class="btn" onclick="window.print()">Imprimir / Guardar PDF</button>
      <a class="btn g" href="/admin/pdf/${esc(order.id)}">Descargar PDF</a>
      <a class="btn" href="/admin">Volver al panel</a>
    </div>
  </div></body></html>`;
}

// Documento PDFKit (el llamador debe hacer doc.pipe(res); doc.end()).
function buildPdfDoc(company, customer, order, invoice) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  doc.fontSize(22).fillColor('#0f172a').text(company.name, 50, 50);
  doc.fontSize(10).fillColor('#64748b');
  let y = 78;
  if (company.rfc) { doc.text('RFC: ' + company.rfc, 50, y); y += 14; }
  if (company.address) { doc.text(company.address, 50, y); y += 14; }
  doc.text(company.phone + '   ' + company.email, 50, y);

  doc.fontSize(10).fillColor('#0f172a').text('FACTURA', 400, 50);
  doc.fontSize(16).text(invoice.number, 400, 66);
  doc.fontSize(10).fillColor('#64748b').text(invoice.issued_at, 400, 86);

  doc.moveDown(2).fontSize(12).fillColor('#0f172a').text('Cliente', 50, 130);
  doc.fontSize(10).fillColor('#334155').text(customer.name);
  if (customer.phone) doc.text(customer.phone);
  if (customer.email) doc.text(customer.email);

  let ty = 195;
  doc.fontSize(10).fillColor('#0f172a')
    .text('Concepto', 50, ty)
    .text('Fecha', 250, ty)
    .text('Hora', 320, ty)
    .text('Importe', 470, ty);
  ty += 16;
  doc.moveTo(50, ty - 4).lineTo(545, ty - 4).stroke();
  doc.fillColor('#334155')
    .text(order.service, 50, ty)
    .text(order.fecha || '—', 250, ty)
    .text(order.hora || '—', 320, ty)
    .text(money(invoice.subtotal), 470, ty);

  ty += 26;
  doc.fontSize(11).fillColor('#0f172a').text('Subtotal: ' + money(invoice.subtotal), 400, ty);
  ty += 16; doc.text('IVA/Impuesto: ' + money(invoice.tax), 400, ty);
  ty += 20; doc.fontSize(14).text('Total: ' + money(invoice.total), 400, ty);

  return doc;
}

module.exports = { renderInvoiceHTML, buildPdfDoc };

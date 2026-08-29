/* ============================================================
   TechNova — Lógica de la landing page (vanilla JS, sin build)
   Orden:
     1. Configuración  (datos vía window.TN, de js/data.js)
     2. Utilidades DOM
     3. Módulos de UI  (cada uno inicializa su sección)
     4. Arranque       (DOMContentLoaded → init)
   El contenido vive en js/data.js; aquí solo el comportamiento.
   Todo se encapsula en una IIFE: nada queda en el scope global.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 1. Configuración (datos) ---------- */
  const { testimonials, projects, WA_NUMBER } = window.TN;

  /* ---------- 2. Utilidades DOM ---------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  // Fecha actual en formato YYYY-MM-DD (atributo min del input date)
  function todayISO() {
    const t = new Date();
    const m = String(t.getMonth() + 1).padStart(2, '0');
    const d = String(t.getDate()).padStart(2, '0');
    return `${t.getFullYear()}-${m}-${d}`;
  }

  // URL de imagen de Unsplash (el fallback se maneja en el atributo onerror)
  function unsplash(id, w) {
    return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;
  }

  // Notificación efímera (toast)
  function showToast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    requestAnimationFrame(() => t.classList.remove('opacity-0', 'translate-y-2'));
    setTimeout(() => {
      t.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => t.classList.add('hidden'), 400);
    }, 3500);
  }

  /* ---------- 3. Módulos de UI ---------- */

  // 3.1 Navbar: menú hamburguesa (desktop/móvil)
  function initNav() {
    const toggle = $('#nav-toggle');
    const panel = $('#nav-panel');
    toggle.addEventListener('click', () => {
      const open = panel.classList.toggle('hidden') === false;
      toggle.setAttribute('aria-expanded', String(open));
    });
    $$('.nav-link', panel).forEach(link => {
      link.addEventListener('click', () => {
        panel.classList.add('hidden');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // 3.1b Título del hero con efecto de tipeo (igual que el subtítulo)
  function initHeroTitle() {
    const el = $('#hero-title');
    if (!el) return;
    const full = 'Tu tecnología, siempre al máximo rendimiento';
    let c = 0;
    function tick() {
      el.textContent = full.substring(0, c);
      if (c < full.length) {
        c++;
        setTimeout(tick, 45);
      } else {
        el.innerHTML = 'Tu tecnología, siempre al <span class="gradient-text">máximo rendimiento</span>';
      }
    }
    tick();
  }

  // 3.1c FAB de WhatsApp: usa número y saludo configurados en window.TN
  function initFabWhatsApp() {
    const fab = document.getElementById('fab-wa');
    if (!fab || !window.TN) return;
    const num = window.TN.WA_NUMBER || '56961112430';
    const msg = window.TN.WA_GREETING || 'Hola, necesito informes';
    fab.href = `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
  }

  // 3.2 Subtítulo animado (typewriter)
  function initTyped() {
    const el = $('#typed');
    const phrases = ['rápido y garantizado', '100% profesional', 'a tu medida', 'sin complicaciones'];
    let p = 0, c = 0, deleting = false;
    function tick() {
      const full = phrases[p];
      el.textContent = full.substring(0, c);
      if (!deleting && c < full.length) {
        c++;
        setTimeout(tick, 55);
      } else if (!deleting && c === full.length) {
        deleting = true;
        setTimeout(tick, 1600);
      } else if (deleting && c > 0) {
        c--;
        setTimeout(tick, 30);
      } else {
        deleting = false;
        p = (p + 1) % phrases.length;
        setTimeout(tick, 400);
      }
    }
    tick();
  }

  // 3.3 Testimonios: carrusel con autoavance y pausa en hover
  function initTestimonials() {
    const track = $('#ts-track');
    const dotsWrap = $('#ts-dots');
    const viewport = $('#ts-viewport');
    let idx = 0;
    let timer = null;

    track.innerHTML = testimonials.map(t => `
      <div class="ts-slide px-2">
        <div class="bg-brand-card border border-brand-border rounded-3xl p-8 text-center">
          <div class="flex justify-center gap-1 mb-4 text-amber-400">
            ${'<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 7.1-1.01L12 2z"/></svg>'.repeat(5)}
          </div>
          <p class="text-slate-300 italic mb-6">"${t.text}"</p>
          <img src="${t.avatar}" alt="${t.name}" loading="lazy" onerror="this.onerror=null;this.replaceWith(Object.assign(document.createElement('div'),{className:'w-12 h-12 mx-auto rounded-full bg-brand-emerald text-white flex items-center justify-center font-semibold',textContent:'${t.name.split(' ').map(x=>x[0]).join('')}'}))"
               class="w-12 h-12 mx-auto rounded-full mb-3" />
          <p class="text-white font-semibold">${t.name}</p>
          <p class="text-sm text-slate-400">${t.role}</p>
        </div>
      </div>
    `).join('');

    dotsWrap.innerHTML = testimonials.map((_, i) =>
      `<button type="button" aria-label="Ir a testimonio ${i + 1}" class="ts-dot w-2.5 h-2.5 rounded-full bg-brand-border transition-colors ${i === 0 ? 'active' : ''}"></button>`
    ).join('');

    const dots = $$('.ts-dot', dotsWrap);

    function go(n) {
      idx = (n + testimonials.length) % testimonials.length;
      track.style.transform = `translateX(-${idx * 100}%)`;
      dots.forEach((d, i) => d.classList.toggle('active', i === idx));
    }
    function start() { timer = setInterval(() => go(idx + 1), 5000); }
    function stop() { clearInterval(timer); }

    $('#ts-prev').addEventListener('click', () => go(idx - 1));
    $('#ts-next').addEventListener('click', () => go(idx + 1));
    dots.forEach((d, i) => d.addEventListener('click', () => go(i)));
    viewport.addEventListener('mouseenter', stop);
    viewport.addEventListener('mouseleave', start);

    go(0);
    start();
  }

  // 3.4 Portafolio: tarjetas + modal de detalle
  function initPortfolio() {
    const grid = $('#projects-grid');
    const modal = $('#project-modal');
    const content = $('#modal-content');

    grid.innerHTML = projects.map((p, i) => `
      <article data-aos="zoom-in" data-index="${i}" class="glow-hover group cursor-pointer rounded-2xl bg-brand-card border border-brand-border overflow-hidden">
        <div class="aspect-video overflow-hidden">
          <img loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="${p.title}" src="${p.img}" onerror="this.onerror=null;this.src='img/projects/${p.seed}.svg'" />
        </div>
        <div class="p-5">
          <span class="text-xs uppercase tracking-wide text-brand-cyan">${p.category}</span>
          <h4 class="text-white font-semibold mt-1">${p.title}</h4>
          <div class="mt-3 flex flex-wrap gap-2">
            ${p.tech.map(t => `<span class="text-xs px-2 py-1 rounded-md bg-white/5 border border-brand-border text-brand-cyan">${t}</span>`).join('')}
          </div>
          <span class="mt-4 inline-flex items-center gap-1 text-sm text-brand-emerald group-hover:text-brand-cyan transition-colors">Ver detalles →</span>
        </div>
      </article>
    `).join('');

    // Delegación de eventos: un solo listener para todas las tarjetas
    grid.addEventListener('click', (e) => {
      const card = e.target.closest('article');
      if (card) openProject(Number(card.dataset.index));
    });

    function openProject(i) {
      const p = projects[i];
      const gallery = [p.img, 1, 2, 3].map(g => typeof g === 'string' ? g : `img/projects/${p.seed}-${g}.jpg`);
      content.innerHTML = `
        <div class="aspect-video overflow-hidden rounded-t-3xl">
          <img class="modal-hero w-full h-full object-cover" src="${p.img}" alt="${p.title}" loading="lazy" onerror="this.onerror=null;this.src='img/projects/${p.seed}.svg'" />
        </div>
        <div class="p-6 sm:p-8">
          <span class="text-xs uppercase tracking-wide text-brand-cyan">${p.category}</span>
          <h3 class="font-display text-2xl font-bold text-white mt-1">${p.title}</h3>
          <p class="mt-4 text-slate-300 leading-relaxed">${p.description}</p>
          <div class="mt-4 flex flex-wrap gap-2">
            ${p.tech.map(t => `<span class="text-xs px-2 py-1 rounded-md bg-white/5 border border-brand-border text-brand-cyan">${t}</span>`).join('')}
          </div>
          <h4 class="mt-6 text-sm font-semibold text-white">Galería del proyecto <span class="text-slate-400 font-normal">(haz clic en una imagen para verla grande)</span></h4>
          <div class="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
            ${gallery.map((src, gi) => `<img src="${src}" alt="${p.title} ${gi + 1}" loading="lazy" class="gallery-thumb cursor-pointer rounded-xl w-full h-24 object-cover border border-brand-border hover:scale-105 transition-transform ${gi === 0 ? 'ring-2 ring-brand-cyan' : ''}" />`).join('')}
          </div>
          <a href="#agendar" class="mt-6 inline-flex items-center justify-center w-full px-6 py-3 rounded-full bg-gradient-to-r from-brand-emerald to-brand-cyan text-brand-dark font-semibold hover:opacity-90 transition-opacity">Agendar un proyecto similar</a>
        </div>
      `;
      const hero = $('.modal-hero', content);
      const thumbs = $$('.gallery-thumb', content);
      const box = content.parentElement;
      thumbs.forEach(th => {
        th.addEventListener('click', () => {
          hero.src = th.src;
          hero.alt = th.alt;
          thumbs.forEach(t => t.classList.remove('ring-2', 'ring-brand-cyan'));
          th.classList.add('ring-2', 'ring-brand-cyan');
          hero.animate(
            [{ transform: 'scale(1.04)' }, { transform: 'scale(1)' }],
            { duration: 350, easing: 'ease-out' }
          );
          if (box) box.scrollTo({ top: 0, behavior: 'smooth' });
        });
      });
      content.querySelector('a[href="#agendar"]').addEventListener('click', closeProject);
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closeProject() {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    $('#modal-close').addEventListener('click', closeProject);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeProject(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeProject();
    });

    if (window.AOS) AOS.refresh();
  }

  // 3.5 Agendamiento: validación + redirección a WhatsApp
  function initBooking() {
    const form = $('#booking-form');
    const fecha = $('#fecha');
    const hora = $('#hora');
    fecha.min = todayISO();

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const servicio = form.querySelector('input[name="servicio"]:checked');
      const nombre = form.nombre.value.trim();
      const telefono = form.telefono.value.trim();
      const descripcion = form.descripcion.value.trim();

      if (!servicio || !fecha.value || !hora.value || !nombre || !telefono) {
        showToast('⚠️ Completa los campos obligatorios (*)');
        return;
      }

      // 1) Guardar cliente + pedido en la base de datos
      let waLink = null;
      try {
        const r = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            servicio: servicio.value, fecha: fecha.value, hora: hora.value,
            nombre, telefono, descripcion
          })
        });
        if (r.ok) waLink = (await r.json()).waLink;
      } catch (_) { /* sin servidor: igual abrimos WhatsApp */ }

      // 2) Redirigir a WhatsApp (link del servidor o construido en cliente)
      if (!waLink) {
        const waNumber = (window.TN && window.TN.WA_NUMBER) || '56961112430';
        const greeting = (window.TN && window.TN.WA_GREETING) || '¡Hola! 👋';
        const msg = `${greeting}\n\n¡Quiero agendar una cita! 🚀\n\n*Servicio:* ${servicio.value}\n*Fecha:* ${fecha.value}\n*Hora:* ${hora.value}\n*Nombre:* ${nombre}\n*Teléfono:* ${telefono}\n\n*Descripción:*\n${descripcion || '—'}`;
        waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;
      }
      window.open(waLink, '_blank');

      showToast('¡Cita enviada! Te redirigimos a WhatsApp ✅');
      form.reset();
      form.querySelector('input[name="servicio"][value="Mantenimiento de PC"]').checked = true;
      fecha.min = todayISO();
    });
  }

  // 3.6 Footer: año actual
  function initYear() {
    $('#year').textContent = new Date().getFullYear();
  }

  /* ---------- 4. Arranque ---------- */
  function init() {
    initNav();
    initHeroTitle();
    initFabWhatsApp();
    initTyped();
    initTestimonials();
    initPortfolio();
    initBooking();
    initYear();
    if (window.AOS) {
      document.documentElement.classList.add('aos-enabled');
      AOS.init({ once: true, duration: 800, easing: 'ease-out-cubic' });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

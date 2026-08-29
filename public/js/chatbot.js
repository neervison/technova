// Chat bot en sitio para TechNova (usa el mismo motor que el bot de WhatsApp/Telegram)
(function () {
  var API = '/api/bot/simulate';

  var session = localStorage.getItem('tn_bot_session');
  if (!session) {
    session = 'web-' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem('tn_bot_session', session);
  }

  var toggle = document.getElementById('tn-chat-toggle');
  var panel = document.getElementById('tn-chat-panel');
  var closeBtn = document.getElementById('tn-chat-close');
  var msgs = document.getElementById('tn-chat-msgs');
  var form = document.getElementById('tn-chat-form');
  var input = document.getElementById('tn-chat-input');
  var chips = document.getElementById('tn-chat-chips');
  var started = false;

  // Sonido de teclado (sintetizado, sin archivos externos)
  var audioCtx = null;
  function playKey() {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      var o = audioCtx.createOscillator();
      var g = audioCtx.createGain();
      o.type = 'square';
      o.frequency.value = 420 + Math.random() * 180;
      var t0 = audioCtx.currentTime;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.05, t0 + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.04);
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start(t0);
      o.stop(t0 + 0.045);
    } catch (e) { /* ignora si el audio no está disponible */ }
  }

  document.addEventListener('keydown', function (e) {
    var el = e.target;
    if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && !el.readOnly && !el.disabled) {
      playKey();
    }
  });

  var suggestions = [
    { label: '1 · Reparación PC', text: '1' },
    { label: '2 · Optimización', text: '2' },
    { label: '3 · Página web', text: '3' },
    { label: 'Precio', text: 'precio' },
    { label: 'Horario', text: 'horario' },
    { label: 'Hablar con asesor', text: '5' }
  ];

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function addMsg(text, who) {
    var div = document.createElement('div');
    div.className = 'tn-msg ' + (who === 'bot' ? 'tn-msg-bot' : 'tn-msg-user');
    String(text).split(/(\s+)/).forEach(function (tok) {
      if (/^https?:\/\//.test(tok)) {
        var a = document.createElement('a');
        a.href = tok;
        a.target = '_blank';
        a.rel = 'noopener';
        a.className = 'tn-link';
        a.textContent = tok;
        div.appendChild(a);
      } else {
        div.appendChild(document.createTextNode(tok));
      }
    });
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function renderChips() {
    chips.innerHTML = '';
    suggestions.forEach(function (s) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'tn-chip';
      b.textContent = s.label;
      b.addEventListener('click', function () { send(s.text); });
      chips.appendChild(b);
    });
  }

  function send(text) {
    text = String(text || '').trim();
    if (!text) return;
    addMsg(text, 'user');
    input.value = '';
    fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: session, text: text })
    })
      .then(function (r) { return r.json(); })
      .then(function (data) { addMsg(data.reply || '...', 'bot'); })
      .catch(function () { addMsg('No pude conectar. Intenta de nuevo.', 'bot'); });
  }

  function openChat() {
    panel.classList.remove('hidden');
    toggle.classList.add('hidden');
    if (!started) {
      started = true;
      renderChips();
      send('hola');
    }
    input.focus();
  }

  function closeChat() {
    panel.classList.add('hidden');
    toggle.classList.remove('hidden');
  }

  toggle.addEventListener('click', openChat);
  closeBtn.addEventListener('click', closeChat);
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    send(input.value);
  });
})();

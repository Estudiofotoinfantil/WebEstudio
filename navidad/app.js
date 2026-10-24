/* Navidad 2026 · Estudio Fotoinfantil — propuesta personalizada
   El nombre llega en el link:  ?para=Alaia  (y opcional &mama=Laura)  */
(function () {
  'use strict';

  var C = window.NAVIDAD || {};
  var V = window.NAV_V || '';
  var WA = String(C.whatsapp || '5491130448139').replace(/\D/g, '');
  var root = document.documentElement;
  var Q = new URLSearchParams(location.search);
  var PDFBG = root.classList.contains('pdfbg');

  function $(s, el) { return (el || document).querySelector(s); }
  function $$(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }

  /* ---------------------------------------------------------------- datos del link */
  function clean(s) {
    s = String(s || '').replace(/[\u0000-\u001f\u007f<>{}\[\]\\"`]/g, '').replace(/\s+/g, ' ').trim();
    if (s.length > 40) s = s.slice(0, 40).trim();
    if (s && (s === s.toLowerCase() || s === s.toUpperCase())) {
      s = s.toLowerCase().replace(/(^|[\s\-'’])([^\s\-'’])/g, function (m, a, b) { return a + b.toUpperCase(); });
    }
    return s;
  }
  var bebe = clean(Q.get('para') || Q.get('bebe') || Q.get('b'));
  var mama = clean(Q.get('mama') || Q.get('m'));

  function today() {
    var o = Q.get('_hoy');
    if (o && /^\d{4}-\d{2}-\d{2}$/.test(o)) return o;
    try {
      var parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
      var m = {};
      parts.forEach(function (p) { m[p.type] = p.value; });
      if (m.year && m.month && m.day) return m.year + '-' + m.month + '-' + m.day;
    } catch (e) { /* sigue abajo */ }
    return new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10);
  }
  var HOY = today();
  var REGALO_HASTA = C.regaloHasta || '2026-10-31';
  var regalo = Q.has('_regalo') ? Q.get('_regalo') === '1' : HOY <= REGALO_HASTA;
  var completos = Q.get('_full') === 'all' ? 'all' : (PDFBG ? [] : (C.completos || []));
  if (!PDFBG && Q.get('_completos')) completos = Q.get('_completos').split(',');  // solo para pruebas

  var T = {
    bebe: bebe || 'tu familia',
    saludo: mama ? 'Querida ' + mama + ',' : (bebe ? 'Querida familia de ' + bebe + ',' : 'Querida familia,'),
    packsub: bebe ? 'Cuatro maneras de guardar la Navidad de ' + bebe : 'Cuatro maneras de guardar esta Navidad',
    giftname: ((bebe || 'Con amor') + ' · 2026').toUpperCase(),
    closing: bebe ? 'Los cupos son limitados: reservá la Navidad de ' + bebe + '.' : 'Los cupos son limitados: reservá su lugar.'
  };

  function waText(kind, pack) {
    var para = bebe ? ' para ' + bebe : '';
    if (kind === 'pack') return '¡Hola! Quiero reservar la experiencia ' + pack + para + ' ✨';
    if (kind === 'regalo') return '¡Hola! Quiero reservar en octubre la sesión de Navidad' + para + ' y recibir la tarjeta de regalo ✨';
    return '¡Hola! Quiero reservar la sesión de Navidad 2026' + para + ' ✨';
  }
  function waURL(kind, pack) { return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(waText(kind, pack)); }
  var mapsEl = $('[data-link="maps"]');
  var MAPS = mapsEl ? mapsEl.href : '';

  /* ---------------------------------------------------------------- textos personalizados */
  var slots = $$('svg[data-slot]');
  var lines = $$('[data-line]');

  function fitSvg(svg) {
    var ts = svg.querySelectorAll('text');
    if (!ts.length) return;
    var fs = +svg.getAttribute('data-fs'), mw = +svg.getAttribute('data-maxw');
    for (var i = 0; i < ts.length; i++) ts[i].setAttribute('font-size', fs);
    var w = 0;
    try { w = ts[ts.length - 1].getComputedTextLength(); } catch (e) { w = 0; }
    if (w > mw) {
      var s = (fs * mw / w).toFixed(2);
      for (i = 0; i < ts.length; i++) ts[i].setAttribute('font-size', s);
    }
  }
  function fitLine(el) {
    var fs = +el.getAttribute('data-fs');
    el.style.fontSize = fs + 'px';
    for (var n = 0; n < 3 && el.scrollWidth > el.clientWidth + 0.5; n++) {
      var cur = parseFloat(el.style.fontSize);
      el.style.fontSize = Math.max(cur * el.clientWidth / el.scrollWidth * 0.985, fs * 0.55).toFixed(2) + 'px';
    }
  }
  function fitAll() { slots.forEach(fitSvg); lines.forEach(fitLine); }

  slots.forEach(function (svg) {
    var t = T[svg.getAttribute('data-slot')];
    if (t == null) return;
    svg.querySelectorAll('text').forEach(function (x) { x.textContent = t; });
    svg.setAttribute('aria-label', t);
  });
  lines.forEach(function (el) {
    var t = T[el.getAttribute('data-line')];
    if (t != null) el.textContent = t;
  });
  fitAll();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll);
  window.addEventListener('load', fitAll);

  if (bebe) document.title = 'Navidad 2026 · Propuesta para ' + bebe + ' · Estudio Fotoinfantil';

  /* ---------------------------------------------------------------- links, regalo y calendario */
  $$('[data-wa]').forEach(function (a) { a.href = waURL(a.getAttribute('data-wa'), a.getAttribute('data-pack')); });
  $$('[data-regalo]').forEach(function (el) { el.hidden = !regalo; });

  var LAST = C.ultimoDia || '2026-12-23';
  $$('.cal .d[data-date]').forEach(function (d) {
    var ds = d.getAttribute('data-date');
    if (d.classList.contains('off')) return;
    if (ds < HOY || ds > LAST) { d.className = 'd off'; return; }
    if (completos === 'all' || completos.indexOf(ds) >= 0) {
      d.classList.remove('wk', 'we', 'fe');
      d.classList.add('full');
    }
  });

  /* ---------------------------------------------------------------- utilidades */
  var toastEl = $('#toast'), toastT;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('on');
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove('on'); }, 2200);
  }
  function copyText(t) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(t);
    return new Promise(function (res, rej) {
      var ta = document.createElement('textarea');
      ta.value = t; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy') ? res() : rej(); } catch (e) { rej(e); }
      document.body.removeChild(ta);
    });
  }
  $$('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      copyText(b.getAttribute('data-copy')).then(function () {
        b.textContent = 'COPIADO'; b.classList.add('ok'); toast('Alias copiado');
        setTimeout(function () { b.textContent = 'COPIAR'; b.classList.remove('ok'); }, 2500);
      }, function () { toast('Mantené apretado el alias para copiarlo'); });
    });
  });

  /* ---------------------------------------------------------------- animaciones (solo pantalla) */
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;
  if (!PDFBG && !reduce) {
    root.classList.add('anim');
    var pws = $$('.pw');
    pws.forEach(function (pw) {
      if (pw.classList.contains('cover-w')) return;
      var i = 0;
      $$('.flow > *, .mid > *, .steps > .step, .faq > .qa', pw).forEach(function (el) {
        if (el.classList.contains('mid') || el.classList.contains('steps') || el.classList.contains('faq')) return;
        el.classList.add('rv');
        el.style.setProperty('--i', i++);
      });
    });
    if (hasIO) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
      }, { threshold: 0.12 });
      pws.forEach(function (pw) { io.observe(pw); });
    } else {
      pws.forEach(function (pw) { pw.classList.add('in'); });
    }
    $$('canvas.snow').forEach(function (cv) { snow(cv); });
  }

  function snow(cv) {
    var ctx = cv.getContext('2d'), W = 540, H = 960, parts = [], run = false, last = 0, dpr = 1;
    function size() {
      var k = parseFloat(getComputedStyle(root).getPropertyValue('--k')) || 1;
      dpr = Math.min(window.devicePixelRatio || 1, 2) * k;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    }
    function mk(init) {
      var r = Math.random();
      return { x: Math.random() * W, y: init ? Math.random() * H : -8, r: 0.7 + r * r * 2.4, vy: 10 + Math.random() * 20,
        amp: 6 + Math.random() * 14, ph: Math.random() * 6.28, f: 0.3 + Math.random() * 0.6, a: 0.3 + Math.random() * 0.5, g: Math.random() < 0.35 };
    }
    for (var i = 0; i < 46; i++) parts.push(mk(true));
    size();
    window.addEventListener('resize', size);
    function frame(t) {
      if (!run) return;
      var dt = Math.min(0.05, (t - (last || t)) / 1000); last = t;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      for (var j = 0; j < parts.length; j++) {
        var p = parts[j];
        p.y += p.vy * dt; p.ph += p.f * dt;
        if (p.y > H + 10) { parts[j] = p = mk(false); }
        var x = p.x + Math.sin(p.ph) * p.amp;
        ctx.fillStyle = p.g ? '#f3d98f' : '#fff7ea';
        ctx.globalAlpha = p.a;
        ctx.beginPath(); ctx.arc(x, p.y, p.r, 0, 6.2832); ctx.fill();
        if (p.r > 1.7) { ctx.globalAlpha = p.a * 0.16; ctx.beginPath(); ctx.arc(x, p.y, p.r * 2.8, 0, 6.2832); ctx.fill(); }
      }
      requestAnimationFrame(frame);
    }
    if (!hasIO) { run = true; requestAnimationFrame(frame); return; }
    new IntersectionObserver(function (es) {
      var vis = es[0].isIntersecting;
      if (vis && !run) { run = true; last = 0; requestAnimationFrame(frame); }
      else if (!vis) run = false;
    }).observe(cv.closest('.pw'));
  }

  /* ---------------------------------------------------------------- barra fija de reserva */
  (function () {
    var bar = $('#sbar');
    if (!bar || PDFBG) return;
    var cover = $('.cover-w'), end = $('[data-pg="cierre"]'), past = false, atEnd = false;
    function upd() { bar.classList.toggle('on', past && !atEnd); }
    if (!hasIO) { bar.classList.add('on'); return; }
    new IntersectionObserver(function (es) { past = !es[0].isIntersecting; upd(); }, { threshold: 0.04 }).observe(cover);
    new IntersectionObserver(function (es) { atEnd = es[0].isIntersecting; upd(); }, { threshold: 0.3 }).observe(end);
  })();

  /* ---------------------------------------------------------------- PDF personalizado */
  var GRAD = {
    L: [[0, '#fcf1c8'], [0.28, '#e5c47e'], [0.52, '#b6893d'], [0.74, '#eed597'], [1, '#c49546']],
    D: [[0, '#a47c36'], [0.26, '#cfa95c'], [0.52, '#835d22'], [0.78, '#b58c44'], [1, '#70501d']]
  };
  var vq = '?v=' + V;
  var imgCache = {};
  function loadImg(src) {
    if (imgCache[src]) return imgCache[src];
    imgCache[src] = new Promise(function (res, rej) {
      var im = new Image();
      im.onload = function () { res(im); };
      im.onerror = function () { delete imgCache[src]; rej(new Error('No se pudo cargar ' + src)); };
      im.src = src;
    });
    return imgCache[src];
  }
  function loadScript(src) {
    return new Promise(function (res, rej) {
      if (window.jspdf && window.jspdf.jsPDF) return res();
      var s = document.createElement('script');
      s.src = src; s.onload = function () { res(); }; s.onerror = function () { rej(new Error('No se pudo cargar el generador de PDF')); };
      document.head.appendChild(s);
    });
  }
  function fontsReady() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.all(['58px Pinyon', '100px Ballet', 'italic 500 16px Cormorant', '600 8px Cinzel'].map(function (f) {
      return document.fonts.load(f).catch(function () {});
    }));
  }
  function linkURL(l) {
    if (l.kind === 'maps') return MAPS;
    if (l.kind === 'pack' || l.kind === 'regalo' || l.kind === 'general') return waURL(l.kind, l.pack);
    return '';
  }

  async function drawSvgSlot(ctx, s, text, S) {
    var fam = '"' + s.font + '"';
    ctx.save();
    ctx.setTransform(S, 0, 0, S, 0, 0);
    ctx.font = s.fs + 'px ' + fam;
    var fs = s.fs, w = ctx.measureText(text).width;
    if (w > s.maxw) fs = s.fs * s.maxw / w;
    var F = fs.toFixed(2) + 'px ' + fam;
    var align = s.anchor === 'middle' ? 'center' : (s.anchor === 'end' ? 'right' : 'left');
    ctx.font = F; ctx.textBaseline = 'alphabetic'; ctx.textAlign = align;
    ctx.beginPath(); ctx.rect(s.x, s.y, s.w, s.h); ctx.clip();
    var X = s.x + s.fx, Y = s.y + s.base;
    if (s.glow) {
      ctx.save();
      var off = 4000;
      ctx.shadowColor = 'rgba(255,199,126,0.42)';
      ctx.shadowBlur = 18 * S;
      ctx.shadowOffsetX = off * S;
      ctx.fillStyle = '#000';
      ctx.fillText(text, X - off, Y);
      ctx.restore();
    }
    var light = s.tone === 'light';
    function layer(color, alpha, dy) { ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.fillText(text, X, Y + dy); ctx.restore(); }
    if (light) { layer('#140004', 0.55, 2.2); layer('#fff4cf', 0.55, -0.55); }
    else { layer('#7a5222', 0.13, 1.6); layer('#ffffff', 0.9, 0.7); }
    if (s.tex) {
      var timg = await loadImg('assets/' + (light ? 'foil_light_tex.jpg' : 'foil_dark_tex.jpg') + vq);
      var oc = document.createElement('canvas');
      oc.width = Math.ceil(s.w * S); oc.height = Math.ceil(s.h * S);
      var o = oc.getContext('2d');
      o.setTransform(S, 0, 0, S, 0, 0);
      o.font = F; o.textBaseline = 'alphabetic'; o.textAlign = align; o.fillStyle = '#fff';
      o.fillText(text, s.fx, s.base);
      o.setTransform(1, 0, 0, 1, 0, 0);
      o.globalCompositeOperation = 'source-in';
      o.drawImage(timg, 0, 0, oc.width, oc.height);
      ctx.drawImage(oc, s.x, s.y, s.w, s.h);
    } else {
      var m = ctx.measureText(text);
      var top = Y - (m.actualBoundingBoxAscent || fs * 0.7), bot = Y + (m.actualBoundingBoxDescent || fs * 0.25);
      var g = ctx.createLinearGradient(0, top, 0, bot);
      (light ? GRAD.L : GRAD.D).forEach(function (st) { g.addColorStop(st[0], st[1]); });
      ctx.fillStyle = g;
      ctx.fillText(text, X, Y);
    }
    ctx.restore();
  }

  function drawLine(ctx, s, text, S) {
    ctx.save();
    ctx.setTransform(S, 0, 0, S, 0, 0);
    ctx.translate(s.cx, s.cy);
    if (s.rot) ctx.rotate(s.rot * Math.PI / 180);
    ctx.translate(s.dx || 0, 0);
    var chars = Array.from(text);
    function setF(z) { ctx.font = s.style + ' ' + s.weight + ' ' + z.toFixed(2) + 'px ' + s.family; }
    function width(z) { setF(z); return ctx.measureText(text).width + (chars.length - 1) * s.lsEm * z; }
    var fs = s.fs, w = width(fs);
    if (w > s.w) { fs = fs * s.w / w; w = width(fs); }
    ctx.fillStyle = s.color;
    ctx.textBaseline = 'middle';
    if (!s.lsEm) { ctx.textAlign = 'center'; ctx.fillText(text, 0, 0); }
    else {
      ctx.textAlign = 'left';
      var x = -w / 2;
      chars.forEach(function (ch) { ctx.fillText(ch, x, 0); x += ctx.measureText(ch).width + s.lsEm * fs; });
    }
    ctx.restore();
  }

  async function drawCells(ctx, cells, man, S) {
    var need = { off: [], full: [] };
    cells.forEach(function (c) {
      if (c.kind === 'off') return;
      if (c.date < HOY || c.date > LAST) need.off.push(c);
      else if (completos === 'all' || completos.indexOf(c.date) >= 0) need.full.push(c);
    });
    for (var k of ['off', 'full']) {
      if (!need[k].length) continue;
      var img = await loadImg((k === 'off' ? man.calOff : man.calFull) + vq);
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      need[k].forEach(function (c) {
        var x = Math.floor((c.x - 1) * S), y = Math.floor((c.y - 1) * S);
        var w = Math.ceil((c.w + 2) * S), h = Math.ceil((c.h + 2) * S);
        ctx.drawImage(img, x, y, w, h, x, y, w, h);
      });
      ctx.restore();
    }
  }

  var ov = $('#pdfov'), pmsg = $('#pdfmsg'), pbar = $('#pdfbar'), pacts = $('#pdfacts'), pdl = $('#pdfdl'), pshare = $('#pdfshare');
  var busy = false, readyBlob = null, blobURL = null;
  function fileName() { return 'Propuesta Navidad 2026 - ' + (bebe || 'Estudio Fotoinfantil') + '.pdf'; }
  function closePdf() { if (ov) ov.hidden = true; }
  if (ov) {
    $('#pdfx').addEventListener('click', closePdf);
    ov.addEventListener('click', function (e) { if (e.target === ov && !busy) closePdf(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !busy) closePdf(); });
  }
  function showReady() {
    if (blobURL) URL.revokeObjectURL(blobURL);
    blobURL = URL.createObjectURL(readyBlob);
    pdl.href = blobURL;
    pdl.setAttribute('download', fileName());
    pmsg.textContent = '¡Listo! Ya podés guardarla.';
    pbar.style.width = '100%';
    pacts.hidden = false;
    var file = null;
    try { file = new File([readyBlob], fileName(), { type: 'application/pdf' }); } catch (e) { file = null; }
    if (file && navigator.canShare && navigator.share) {
      var ok = false;
      try { ok = navigator.canShare({ files: [file] }); } catch (e) { ok = false; }
      if (ok) {
        pshare.hidden = false;
        pshare.onclick = function () { navigator.share({ files: [file], title: fileName() }).catch(function () {}); };
      }
    }
  }

  async function makePDF() {
    if (!ov || busy) return;
    ov.hidden = false;
    pacts.hidden = true;
    if (readyBlob) { showReady(); return; }
    busy = true;
    pbar.style.width = '4%';
    pmsg.textContent = 'Preparando las páginas…';
    try {
      var got = await Promise.all([
        fetch('pdf/manifest.json' + vq, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error('manifest'); return r.json(); }),
        loadScript('vendor/jspdf.umd.min.js' + vq),
        fontsReady()
      ]);
      var man = got[0];
      var pages = man.pages.filter(function (p) { return p.when === 'always' || (p.when === 'regalo') === regalo; });
      var S = man.scale, W = man.w, H = man.h, PW = W * 0.75, PH = H * 0.75;
      var cv = document.createElement('canvas');
      cv.width = W * S; cv.height = H * S;
      var ctx = cv.getContext('2d');
      var doc = new window.jspdf.jsPDF({ unit: 'pt', format: [PW, PH], orientation: 'portrait', compress: true });
      doc.setProperties({ title: 'Navidad 2026 · Propuesta' + (bebe ? ' para ' + bebe : '') + ' · Estudio Fotoinfantil', author: 'Estudio Fotoinfantil' });
      for (var i = 0; i < pages.length; i++) {
        var p = pages[i];
        pmsg.textContent = 'Armando la página ' + (i + 1) + ' de ' + pages.length + '…';
        var img = await loadImg(p.img + vq);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(img, 0, 0, W * S, H * S);
        if (p.cells && p.cells.length) await drawCells(ctx, p.cells, man, S);
        for (var j = 0; j < p.slots.length; j++) {
          var s = p.slots[j], text = T[s.key];
          if (text == null) continue;
          if (s.t === 'svg') await drawSvgSlot(ctx, s, text, S);
          else drawLine(ctx, s, text, S);
        }
        var data = cv.toDataURL('image/jpeg', 0.88);
        if (i) doc.addPage([PW, PH], 'portrait');
        doc.addImage(data, 'JPEG', 0, 0, PW, PH);
        (p.links || []).forEach(function (l) {
          var u = linkURL(l);
          if (u) doc.link(l.x * 0.75, l.y * 0.75, l.w * 0.75, l.h * 0.75, { url: u });
        });
        pbar.style.width = Math.round(4 + (i + 1) / pages.length * 92) + '%';
        await new Promise(function (r) { setTimeout(r, 0); });
      }
      pmsg.textContent = 'Guardando…';
      readyBlob = doc.output('blob');
      showReady();
    } catch (err) {
      if (window.console) console.error(err);
      pmsg.textContent = 'No se pudo generar el PDF. Revisá la conexión y probá de nuevo.';
      pbar.style.width = '0%';
    }
    busy = false;
  }
  $$('[data-pdf]').forEach(function (b) { b.addEventListener('click', makePDF); });

  window.NAV = { T: T, HOY: HOY, regalo: regalo, bebe: bebe, mama: mama, makePDF: makePDF, fitAll: fitAll, ready: false };
  Promise.all([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise(function (r) {
    if (document.readyState === 'complete') r(); else window.addEventListener('load', r);
  })]).then(function () { fitAll(); window.NAV.ready = true; });
})();

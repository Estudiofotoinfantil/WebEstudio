window.__CFG_DEF = {"whatsapp":"5491130448139","reservasURL":"https://script.google.com/macros/s/AKfycbxlWQSw4Bj2PYrJlnUVC4QdpcYAVV0vIu-ZqenCTMEOgbolkSfKY_Gr1h140VeMAc3YXw/exec","sena":0.2,"vigenciaDias":7,"listaActual":"2026-10","listas":{"2026-10":{"esencial":65000,"recuerdo":89000,"historia":119000,"cuadro":39000,"carpeta":18000,"calendario":22000}},"horarios":{"semana":["18:15","19:15"],"sabado":["10:00","11:00","13:00","14:00"],"feriado":["10:00","11:00","13:00","14:00"]},"feriados":["2026-11-09","2026-11-10","2026-11-23","2026-12-07","2026-12-08","2026-12-25","2027-01-01","2027-02-08","2027-02-09","2027-03-24","2027-03-26","2027-04-02","2027-05-01","2027-05-25","2027-06-20","2027-06-21","2027-07-09","2027-08-16","2027-10-11","2027-11-20","2027-12-08","2027-12-25"],"cerrados":["2026-12-24","2026-12-25","2026-12-31","2027-01-01","2027-12-24","2027-12-25","2027-12-31"],"completos":[]};
/* Estudio Fotoinfantil · motor de propuestas personalizadas (web + PDF)
   Cada propuesta llama a Prop.start({...}) con sus textos y reglas. */
(function () {
  'use strict';

  var root = document.documentElement;
  var Q = new URLSearchParams(location.search);
  var PDFBG = root.classList.contains('pdfbg');
  var V = window.NAV_V || '';
  var vq = '?v=' + V;

  function $(s, el) { return (el || document).querySelector(s); }
  function $$(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }

  /* ---------------------------------------------------------------- datos */
  function clean(s) {
    s = String(s || '').replace(/[\u0000-\u001f\u007f<>{}\[\]\\"`]/g, '').replace(/\s+/g, ' ').trim();
    if (s.length > 40) { var cut = s.slice(0, 41), sp = cut.lastIndexOf(' '); s = (sp > 15 ? cut.slice(0, sp) : s.slice(0, 40)).trim(); }
    if (s && (s === s.toLowerCase() || s === s.toUpperCase())) {
      s = s.toLowerCase().replace(/(^|[\s\-'’])([^\s\-'’])/g, function (m, a, b) { return a + b.toUpperCase(); });
      s = s.replace(/ (De|Del|La|Las|Los|Y)(?= )/g, function (m, w) { return ' ' + w.toLowerCase(); });
    }
    return s;
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function validDate(s) {
    s = String(s || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return '';
    var p = s.split('-').map(Number), d = new Date(Date.UTC(p[0], p[1] - 1, p[2]));
    return d.getUTCFullYear() === p[0] && d.getUTCMonth() === p[1] - 1 && d.getUTCDate() === p[2] ? s : '';
  }
  function today() {
    var o = validDate(Q.get('_hoy'));
    if (o) return o;
    try {
      var parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
      var m = {};
      parts.forEach(function (p) { m[p.type] = p.value; });
      if (m.year && m.month && m.day) return m.year + '-' + m.month + '-' + m.day;
    } catch (e) { /* sigue abajo */ }
    return new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10);
  }
  function parse(s) { var p = s.split('-').map(Number); return new Date(Date.UTC(p[0], p[1] - 1, p[2])); }
  function iso(d) { return d.toISOString().slice(0, 10); }
  function addDays(s, n) { var d = parse(s); d.setUTCDate(d.getUTCDate() + n); return iso(d); }
  function diffDays(a, b) { return Math.round((parse(b) - parse(a)) / 86400000); }
  function dow(s) { return parse(s).getUTCDay(); }
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  function fmtLong(s, wd) { var d = parse(s); return (wd === false ? '' : DIAS[d.getUTCDay()] + ' ') + d.getUTCDate() + ' de ' + MESES[d.getUTCMonth()]; }
  function fmtShort(s) { var d = parse(s); return d.getUTCDate() + '/' + (d.getUTCMonth() + 1); }
  function money(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }

  /* precios: lee la lista del link (si sigue vigente) o la actual. Perdona errores comunes al editar config.js:
     "70.000" escrito como número (JS lo lee 70) o como texto "$70.000". Si config.js no carga o tiene un error,
     usa los valores con los que se publicó la propuesta (window.__CFG_DEF). */
  function priceNum(v) {
    if (typeof v === 'string') v = Number(v.replace(/[^\d]/g, ''));
    if (typeof v !== 'number' || !isFinite(v) || v <= 0) return NaN;
    return v < 1000 ? Math.round(v * 1000) : Math.round(v);
  }
  function priceList(C, keys, listaId, vigente) {
    var DEF = window.__CFG_DEF || {};
    function norm(L) {
      if (!L || typeof L !== 'object') return null;
      var o = {};
      for (var i = 0; i < keys.length; i++) { var n = priceNum(L[keys[i]]); if (isNaN(n)) return null; o[keys[i]] = n; }
      return o;
    }
    var ls = (C && C.listas) || {}, L;
    if (vigente && listaId && (L = norm(ls[listaId]))) return { id: listaId, L: L };
    if (C && (L = norm(ls[C.listaActual]))) return { id: C.listaActual, L: L };
    var ids = Object.keys(ls).filter(function (k) { return norm(ls[k]); }).sort();
    if (ids.length) return { id: ids[ids.length - 1], L: norm(ls[ids[ids.length - 1]]) };
    var dl = DEF.listas || {};
    return { id: DEF.listaActual || '', L: norm(dl[DEF.listaActual]) || {}, fallback: true };
  }

  /* ---------------------------------------------------------------- textos en la página */
  var T = {}, H = {}, TYPE = null;

  function fitSvg(svg) {
    var ts = svg.querySelectorAll('text');
    if (!ts.length) return;
    var fs = +svg.getAttribute('data-fs'), mw = +svg.getAttribute('data-maxw');
    for (var i = 0; i < ts.length; i++) ts[i].setAttribute('font-size', fs);
    var w = 0;   // se mide el texto principal (el brillo animado puede estar oculto)
    for (var j = 0; j < ts.length; j++) {
      if (ts[j].classList.contains('shine')) continue;
      try { w = Math.max(w, ts[j].getComputedTextLength()); } catch (e) { /* sin medida */ }
    }
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
  function fitBox(el) {
    el.style.fontSize = '';
    var base = parseFloat(getComputedStyle(el).fontSize), max = +el.getAttribute('data-fitbox');
    for (var z = base; z > base * 0.7 && el.scrollHeight > max + 0.5; z -= 0.4) el.style.fontSize = z.toFixed(1) + 'px';
  }
  function fitAll() {
    $$('svg[data-slot]').forEach(fitSvg);
    $$('[data-line]').forEach(fitLine);
    $$('[data-fitbox]').forEach(fitBox);
  }
  function apply() {
    $$('svg[data-slot]').forEach(function (svg) {
      var t = T[svg.getAttribute('data-slot')];
      if (t == null) return;
      svg.querySelectorAll('text').forEach(function (x) { x.textContent = t; });
      svg.setAttribute('aria-label', t);
    });
    $$('[data-t]').forEach(function (el) { var t = T[el.getAttribute('data-t')]; if (t != null) el.textContent = t; });
    $$('[data-h]').forEach(function (el) { var t = H[el.getAttribute('data-h')]; if (t != null) el.innerHTML = t; });
    $$('[data-wa]').forEach(function (a) { a.href = waURL(a.getAttribute('data-wa'), a.getAttribute('data-pack')); });
    fitAll();
  }
  function waURL(kind, pack) { return 'https://wa.me/' + TYPE.whatsapp + '?text=' + encodeURIComponent(TYPE.waText(kind, pack)); }

  /* ---------------------------------------------------------------- utilidades de pantalla */
  var toastEl, toastT;
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
  function screenUI() {
    toastEl = $('#toast');
    $$('[data-copy]').forEach(function (b) {
      b.addEventListener('click', function () {
        copyText(b.getAttribute('data-copy')).then(function () {
          b.textContent = 'COPIADO'; b.classList.add('ok'); toast('Alias copiado');
          setTimeout(function () { b.textContent = 'COPIAR'; b.classList.remove('ok'); }, 2500);
        }, function () { toast('Mantené apretado el alias para copiarlo'); });
      });
    });
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
      } else pws.forEach(function (pw) { pw.classList.add('in'); });
    }
    var bar = $('#sbar');
    if (bar && !PDFBG) {
      var cover = $('.cover-w'), end = $('[data-pg="cierre"]'), past = false, atEnd = false;
      var upd = function () { bar.classList.toggle('on', past && !atEnd); };
      if (!hasIO) bar.classList.add('on');
      else {
        new IntersectionObserver(function (es) { past = !es[0].isIntersecting; upd(); }, { threshold: 0.04 }).observe(cover);
        new IntersectionObserver(function (es) { atEnd = es[0].isIntersecting; upd(); }, { threshold: 0.3 }).observe(end);
      }
    }
  }

  /* ---------------------------------------------------------------- PDF: foto de lo variable */
  // métricas verticales (ascenso, descenso en em) de las fuentes de la página
  var METRICS = { 'Cormorant LN': [0.924, 0.287], 'Cinzel': [0.976, 0.372], 'Pinyon': [0.8633, 0.3843], 'Ballet': [1.13, 0.77] };
  function family(ff) { return String(ff).split(',')[0].replace(/["']/g, '').trim(); }
  function alpha(c) { var m = /rgba?\(([^)]+)\)/.exec(c || ''); if (!m) return 0; var p = m[1].split(','); return p.length > 3 ? parseFloat(p[3]) : 1; }
  function visible(el) {
    if (el.closest('[hidden]') || el.closest('.web-only')) return false;
    var cs = getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden';
  }
  function effOpacity(el, stop) {
    var o = 1;
    for (var e = el; e && e !== stop; e = e.parentElement) {
      if (e.classList && e.classList.contains('rv')) continue;     // animación de entrada: no cuenta
      var v = parseFloat(getComputedStyle(e).opacity);
      o *= isNaN(v) ? 1 : v;
    }
    return o;
  }
  function radii(cs, w, h) {
    function r(v) { v = String(v).split(' ')[0]; return v.indexOf('%') > 0 ? Math.min(w, h) * parseFloat(v) / 100 : (parseFloat(v) || 0); }
    return [r(cs.borderTopLeftRadius), r(cs.borderTopRightRadius), r(cs.borderBottomRightRadius), r(cs.borderBottomLeftRadius)];
  }
  function lineThrough(el, page) {
    for (var e = el; e && e !== page; e = e.parentElement) {
      var cs = getComputedStyle(e);
      if (String(cs.textDecorationLine || cs.textDecoration).indexOf('line-through') >= 0) return cs.textDecorationColor || cs.color;
    }
    return null;
  }
  function transform(t, tt) {
    if (tt === 'uppercase') return t.toLocaleUpperCase('es');
    if (tt === 'lowercase') return t.toLocaleLowerCase('es');
    return t;
  }

  function collect(rootEl, page, rel, ops) {
    var els = [rootEl].concat($$('*', rootEl));
    els.forEach(function (el) {
      if (el.closest('svg') && !el.matches('svg[data-icon]')) return;
      if (!visible(el)) return;
      var r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      var cs = getComputedStyle(el), R = rel(r), op = effOpacity(el, page);
      if (el.matches('svg[data-icon]')) { ops.push({ t: 'icon', icon: el.getAttribute('data-icon'), r: R, color: cs.color, op: op }); return; }
      if (alpha(cs.backgroundColor) > 0) ops.push({ t: 'box', r: R, fill: cs.backgroundColor, rad: radii(cs, R.w, R.h), op: op });
      var bw = ['Top', 'Right', 'Bottom', 'Left'].map(function (s) { return cs['border' + s + 'Style'] !== 'none' ? parseFloat(cs['border' + s + 'Width']) || 0 : 0; });
      if (bw.some(function (w) { return w > 0; })) {
        ops.push({ t: 'border', r: R, w: bw, c: ['Top', 'Right', 'Bottom', 'Left'].map(function (s) { return cs['border' + s + 'Color']; }), rad: radii(cs, R.w, R.h), op: op });
      }
    });
    var tw = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, null);
    var node, range = document.createRange();
    while ((node = tw.nextNode())) {
      var txt = node.nodeValue;
      if (!txt || !/\S/.test(txt)) continue;
      var par = node.parentElement;
      if (!par || par.closest('svg') || !visible(par)) continue;
      var cs = getComputedStyle(par);
      var fs = parseFloat(cs.fontSize), ls = cs.letterSpacing === 'normal' ? 0 : parseFloat(cs.letterSpacing) || 0;
      var base = { font: (cs.fontStyle === 'italic' ? 'italic ' : '') + cs.fontWeight + ' ' + fs + 'px "' + family(cs.fontFamily) + '"', fam: family(cs.fontFamily),
        fs: fs, color: cs.color, deco: lineThrough(par, page), op: effOpacity(par, page), tt: cs.textTransform };
      var re = ls ? /\S/g : /\S+/g, m;
      while ((m = re.exec(txt))) {
        range.setStart(node, m.index);
        range.setEnd(node, m.index + m[0].length);
        var rects = range.getClientRects();
        if (!rects.length) continue;
        var rr = rects[0];
        if (!rr.width) continue;
        var R = rel(rr);
        ops.push({ t: 'text', s: transform(m[0], base.tt), x: R.x, y: R.y, w: R.w, h: R.h, font: base.font, fam: base.fam, fs: base.fs, color: base.color, deco: base.deco, op: base.op });
      }
      // subrayado tachado continuo entre palabras
      if (base.deco) {
        range.selectNodeContents(node);
        var all = range.getClientRects();
        for (var i = 0; i < all.length; i++) ops.push({ t: 'strike', r: rel(all[i]), fs: fs, fam: base.fam, color: base.deco, op: base.op });
      }
    }
  }

  function snapshot() {
    root.classList.add('measuring');
    var out = {};
    try {
      $$('.pw').forEach(function (pw) {
        if (pw.hidden) return;
        var page = $('.page', pw), pr = page.getBoundingClientRect(), k = pr.width / 540;
        var rel = function (r) { return { x: (r.left - pr.left) / k, y: (r.top - pr.top) / k, w: r.width / k, h: r.height / k }; };
        var slots = [], ops = [], links = [];
        $$('svg[data-slot]', page).forEach(function (s) {
          if (!visible(s)) return;
          var d = s.dataset, R = rel(s.getBoundingClientRect()), t = s.querySelector('text');
          slots.push({ text: t ? t.textContent : '', x: R.x, y: R.y, w: R.w, h: R.h, fs: +d.fs, maxw: +d.maxw, base: +d.base, fx: +d.fx,
            anchor: d.anchor, font: d.font, weight: d.weight || '400', tex: d.tex === '1' });
        });
        $$('[data-t],[data-h],[data-dyn]', page).forEach(function (el) {
          if (el.parentElement.closest('[data-t],[data-h],[data-dyn]')) return;
          if (!visible(el)) return;
          collect(el, page, rel, ops);
        });
        $$('[data-wa],[data-link]', page).forEach(function (a) {
          if (!visible(a)) return;
          var R = rel(a.getBoundingClientRect());
          if (!R.w || !R.h) return;
          links.push({ kind: a.getAttribute('data-wa') || a.getAttribute('data-link'), pack: a.getAttribute('data-pack') || '', href: a.href, r: R });
        });
        out[pw.getAttribute('data-pg')] = { slots: slots, ops: ops, links: links };
      });
    } finally { root.classList.remove('measuring'); }
    return out;
  }

  /* ---------------------------------------------------------------- PDF: dibujo */
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
    var list = ['80px Ballet', '58px Pinyon', 'italic 500 16px "Cormorant LN"', '500 16px "Cormorant LN"', '600 16px "Cormorant LN"', '700 16px "Cormorant LN"',
      'italic 600 16px "Cormorant LN"', '600 8px Cinzel', '700 8px Cinzel', '500 8px Cinzel'];
    return Promise.all(list.map(function (f) { return document.fonts.load(f).catch(function () {}); }));
  }
  var GRAD_D = [[0, '#a47c36'], [0.26, '#cfa95c'], [0.52, '#835d22'], [0.78, '#b58c44'], [1, '#70501d']];

  async function drawSvgSlot(ctx, s, S) {
    var text = s.text;
    if (!text) return;
    var fam = '"' + s.font + '"', wt = s.weight + ' ';
    ctx.save();
    ctx.setTransform(S, 0, 0, S, 0, 0);
    ctx.font = wt + s.fs + 'px ' + fam;
    var fs = s.fs, w = ctx.measureText(text).width;
    if (w > s.maxw) fs = s.fs * s.maxw / w;
    var F = wt + fs.toFixed(2) + 'px ' + fam;
    var align = s.anchor === 'middle' ? 'center' : (s.anchor === 'end' ? 'right' : 'left');
    ctx.font = F; ctx.textBaseline = 'alphabetic'; ctx.textAlign = align;
    ctx.beginPath(); ctx.rect(s.x, s.y, s.w, s.h); ctx.clip();
    var X = s.x + s.fx, Y = s.y + s.base;
    function layer(color, a, dy) { ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = color; ctx.fillText(text, X, Y + dy); ctx.restore(); }
    layer('#7a5222', 0.14, 1.6);
    layer('#ffffff', 0.9, 0.7);
    if (s.tex) {
      var timg = await loadImg('assets/foil_dark_tex.jpg' + vq);
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
      GRAD_D.forEach(function (st) { g.addColorStop(st[0], st[1]); });
      ctx.fillStyle = g;
      ctx.fillText(text, X, Y);
    }
    ctx.restore();
  }

  function rrect(ctx, x, y, w, h, rad) {
    var r = rad.map(function (v) { return Math.max(0, Math.min(v, w / 2, h / 2)); });
    ctx.beginPath();
    ctx.moveTo(x + r[0], y);
    ctx.lineTo(x + w - r[1], y); ctx.arcTo(x + w, y, x + w, y + r[1], r[1]);
    ctx.lineTo(x + w, y + h - r[2]); ctx.arcTo(x + w, y + h, x + w - r[2], y + h, r[2]);
    ctx.lineTo(x + r[3], y + h); ctx.arcTo(x, y + h, x, y + h - r[3], r[3]);
    ctx.lineTo(x, y + r[0]); ctx.arcTo(x, y, x + r[0], y, r[0]);
    ctx.closePath();
  }
  function star(ctx, r) {
    var cx = r.x + r.w / 2, cy = r.y + r.h / 2, s = Math.min(r.w, r.h) / 2;
    var P = function (x, y) { return [cx + x * s, cy + y * s]; };
    ctx.beginPath();
    var a = P(0, -1); ctx.moveTo(a[0], a[1]);
    var seg = [[[.09, -.09], [.09, -.09], [1, 0]], [[.09, .09], [.09, .09], [0, 1]], [[-.09, .09], [-.09, .09], [-1, 0]], [[-.09, -.09], [-.09, -.09], [0, -1]]];
    seg.forEach(function (sg) { var c1 = P(sg[0][0], sg[0][1]), c2 = P(sg[1][0], sg[1][1]), e = P(sg[2][0], sg[2][1]); ctx.bezierCurveTo(c1[0], c1[1], c2[0], c2[1], e[0], e[1]); });
    ctx.closePath();
  }
  function paint(ctx, ops, S) {
    ctx.save();
    ctx.setTransform(S, 0, 0, S, 0, 0);
    ops.forEach(function (o) {
      ctx.save();
      ctx.globalAlpha = o.op == null ? 1 : o.op;
      if (o.t === 'box') { ctx.fillStyle = o.fill; rrect(ctx, o.r.x, o.r.y, o.r.w, o.r.h, o.rad); ctx.fill(); }
      else if (o.t === 'border') {
        var uni = o.w.every(function (w) { return w === o.w[0]; }) && o.c.every(function (c) { return c === o.c[0]; });
        if (uni) { var w = o.w[0]; ctx.strokeStyle = o.c[0]; ctx.lineWidth = w; rrect(ctx, o.r.x + w / 2, o.r.y + w / 2, o.r.w - w, o.r.h - w, o.rad.map(function (v) { return Math.max(0, v - w / 2); })); ctx.stroke(); }
        else {
          var R = o.r;
          if (o.w[0]) { ctx.fillStyle = o.c[0]; ctx.fillRect(R.x, R.y, R.w, o.w[0]); }
          if (o.w[1]) { ctx.fillStyle = o.c[1]; ctx.fillRect(R.x + R.w - o.w[1], R.y, o.w[1], R.h); }
          if (o.w[2]) { ctx.fillStyle = o.c[2]; ctx.fillRect(R.x, R.y + R.h - o.w[2], R.w, o.w[2]); }
          if (o.w[3]) { ctx.fillStyle = o.c[3]; ctx.fillRect(R.x, R.y, o.w[3], R.h); }
        }
      } else if (o.t === 'icon') { ctx.fillStyle = o.color; star(ctx, o.r); ctx.fill(); }
      else if (o.t === 'text') {
        var M = METRICS[o.fam] || [0.85, 0.3];
        var by = o.y + (o.h - (M[0] + M[1]) * o.fs) / 2 + M[0] * o.fs;
        ctx.font = o.font; ctx.fillStyle = o.color; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
        ctx.fillText(o.s, o.x, by);
      } else if (o.t === 'strike') {
        var M2 = METRICS[o.fam] || [0.85, 0.3];
        var b2 = o.r.y + (o.r.h - (M2[0] + M2[1]) * o.fs) / 2 + M2[0] * o.fs;
        ctx.fillStyle = o.color;
        ctx.fillRect(o.r.x, b2 - o.fs * 0.27, o.r.w, Math.max(0.75, o.fs * 0.06));
      }
      ctx.restore();
    });
    ctx.restore();
  }

  var ov, pmsg, pbar, pacts, pdl, pshare, busy = false, readyBlob = null, blobURL = null;
  function showReady() {
    if (blobURL) URL.revokeObjectURL(blobURL);
    blobURL = URL.createObjectURL(readyBlob);
    pdl.href = blobURL;
    pdl.setAttribute('download', TYPE.fileName());
    pmsg.textContent = '¡Listo! Ya podés guardarla.';
    pbar.style.width = '100%';
    pacts.hidden = false;
    var file = null;
    try { file = new File([readyBlob], TYPE.fileName(), { type: 'application/pdf' }); } catch (e) { file = null; }
    if (file && navigator.canShare && navigator.share) {
      var ok = false;
      try { ok = navigator.canShare({ files: [file] }); } catch (e) { ok = false; }
      if (ok) {
        pshare.hidden = false;
        pshare.onclick = function () { navigator.share({ files: [file], title: TYPE.fileName() }).catch(function () {}); };
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
        fontsReady(),
        TYPE.beforePdf ? TYPE.beforePdf() : null
      ]);
      var man = got[0];
      fitAll();
      var snap = snapshot();
      var variant = TYPE.variant || 'base';
      var pages = man.pages.filter(function (p) { return snap[p.pg] && p.img[variant]; });
      var S = man.scale, W = man.w, H2 = man.h, PW = W * 0.75, PH = H2 * 0.75;
      var cv = document.createElement('canvas');
      cv.width = W * S; cv.height = H2 * S;
      var ctx = cv.getContext('2d');
      var doc = new window.jspdf.jsPDF({ unit: 'pt', format: [PW, PH], orientation: 'portrait', compress: true });
      doc.setProperties({ title: TYPE.pdfTitle(), author: 'Estudio Fotoinfantil' });
      for (var i = 0; i < pages.length; i++) {
        var p = pages[i], sp = snap[p.pg];
        pmsg.textContent = 'Armando la página ' + (i + 1) + ' de ' + pages.length + '…';
        var img = await loadImg(p.img[variant] + vq);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(img, 0, 0, W * S, H2 * S);
        paint(ctx, sp.ops, S);
        for (var j = 0; j < sp.slots.length; j++) await drawSvgSlot(ctx, sp.slots[j], S);
        var data = cv.toDataURL('image/jpeg', 0.88);
        if (i) doc.addPage([PW, PH], 'portrait');
        doc.addImage(data, 'JPEG', 0, 0, PW, PH);
        sp.links.forEach(function (l) {
          var u = l.kind === 'maps' ? l.href : waURL(l.kind, l.pack);
          if (u) doc.link(l.r.x * 0.75, l.r.y * 0.75, l.r.w * 0.75, l.r.h * 0.75, { url: u });
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
  function pdfUI() {
    ov = $('#pdfov'); pmsg = $('#pdfmsg'); pbar = $('#pdfbar'); pacts = $('#pdfacts'); pdl = $('#pdfdl'); pshare = $('#pdfshare');
    if (!ov) return;
    var close = function () { ov.hidden = true; };
    $('#pdfx').addEventListener('click', close);
    ov.addEventListener('click', function (e) { if (e.target === ov && !busy) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !busy) close(); });
    $$('[data-pdf]').forEach(function (b) { b.addEventListener('click', makePDF); });
  }

  /* ---------------------------------------------------------------- arranque */
  function refresh(t, h) {
    if (t) Object.assign(T, t);
    if (h) Object.assign(H, h);
    apply();
    readyBlob = null;   // si cambió algo, el próximo PDF se arma de nuevo
  }
  function start(type) {
    TYPE = type;
    var tx = type.texts();
    T = tx.T; H = tx.H;
    apply();
    if (type.title) document.title = type.title;
    screenUI();
    pdfUI();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll);
    window.addEventListener('load', fitAll);
    var ready = type.init ? type.init() : null;
    window.PROP.ready = false;
    Promise.all([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise(function (r) {
      if (document.readyState === 'complete') r(); else window.addEventListener('load', r);
    }), ready]).then(function () { fitAll(); window.PROP.ready = true; });
  }

  window.PROP = { Q: Q, PDFBG: PDFBG, clean: clean, esc: esc, validDate: validDate, today: today, addDays: addDays, diffDays: diffDays,
    dow: dow, parse: parse, iso: iso, fmtLong: fmtLong, fmtShort: fmtShort, money: money, priceNum: priceNum, priceList: priceList, MESES: MESES, DIAS: DIAS,
    start: start, refresh: refresh, fitAll: fitAll, makePDF: makePDF, snapshot: snapshot, toast: toast, T: function () { return T; }, H: function () { return H; } };
})();

/* Primer añito · Estudio Fotoinfantil — propuesta personalizada
   Link:  ?para=Alaia&mama=Laura&g=nena&cumple=2027-01-15&hasta=2026-11-01&l=2026-10
   (todo opcional; g = nena | nene; cumple = fecha del primer cumple; hasta = vigencia de los valores; l = lista de precios) */
(function () {
  'use strict';
  var P = window.PROP, Q = P.Q;
  var C = window.PRIMER_ANITO || window.__CFG_DEF || {};
  var G = window.__G || 'neutro';
  var WA = String(C.whatsapp || '5491130448139').replace(/\D/g, '');

  var bebe = P.clean(Q.get('para') || Q.get('bebe') || Q.get('b'));
  var mama = P.clean(Q.get('mama') || Q.get('m'));
  var HOY = P.today();
  var cumple = P.validDate(Q.get('cumple') || Q.get('c'));
  var hasta = P.validDate(Q.get('hasta') || Q.get('v'));
  var listaId = String(Q.get('l') || '').trim();

  /* ---------------------------------------------------------------- precios */
  var vigente = !!hasta && hasta >= HOY;
  var vencida = !!hasta && hasta < HOY;
  var PL = P.priceList(C, ['esencial', 'recuerdo', 'historia', 'cuadro', 'carpeta', 'calendario'], listaId, vigente);
  var lid = PL.id, L = PL.L;
  var SENA = typeof C.sena === 'number' && C.sena > 0 && C.sena < 1 ? C.sena : (C.sena >= 1 && C.sena < 100 ? C.sena / 100 : 0.2);
  var m = P.money;
  var PK = {
    esencial: { price: L.esencial, sep: 0 },
    recuerdo: { price: L.recuerdo, sep: L.esencial + L.cuadro },
    historia: { price: L.historia, sep: L.esencial + L.cuadro + L.carpeta + L.calendario }
  };
  Object.keys(PK).forEach(function (k) {
    var p = PK[k];
    p.sena = Math.round(p.price * SENA);
    p.saldo = p.price - p.sena;
    p.save = p.sep - p.price;
  });

  /* ---------------------------------------------------------------- cumple y momento ideal */
  var who = bebe || '';
  function deName() { return who ? 'de <b>' + P.esc(who) + '</b>' : ''; }
  function rangeTxt(a, b) {
    var A = P.parse(a), B = P.parse(b);
    if (A.getUTCMonth() === B.getUTCMonth()) return 'del ' + P.DIAS[A.getUTCDay()] + ' ' + A.getUTCDate() + ' al ' + P.DIAS[B.getUTCDay()] + ' ' + B.getUTCDate() + ' de ' + P.MESES[B.getUTCMonth()];
    return 'del ' + A.getUTCDate() + ' de ' + P.MESES[A.getUTCMonth()] + ' al ' + B.getUTCDate() + ' de ' + P.MESES[B.getUTCMonth()];
  }
  var W0 = '', W1 = '';               // ventana ideal visible en el calendario
  var CD = { a: 'LA EDAD IDEAL', n: '11', b: 'MESES',
    txt: 'Lo ideal es hacer la sesión entre los 10 y 11 meses, de <b>2 a 4 semanas antes del cumple</b>: así llegan con las fotos para la invitación y la deco.' };
  if (cumple) {
    var dd = P.diffDays(HOY, cumple);
    var paraCumple = who ? 'para el primer cumple ' + deName() + '.' : 'para su primer cumple.';
    if (dd > 0) {
      if (dd >= 21) { var wk = Math.floor(dd / 7); CD.a = 'FALTAN'; CD.n = String(wk); CD.b = wk === 1 ? 'SEMANA' : 'SEMANAS'; }
      else { CD.a = dd === 1 ? 'FALTA' : 'FALTAN'; CD.n = String(dd); CD.b = dd === 1 ? 'DÍA' : 'DÍAS'; }
      var w0 = P.addDays(cumple, -28), w1 = P.addDays(cumple, -14), manana = P.addDays(HOY, 1);
      if (HOY < w0) {
        W0 = w0; W1 = w1;
        CD.txt = paraCumple + ' Su momento ideal: <b>' + rangeTxt(w0, w1) + '</b>, así llegan con las fotos para la invitación y la deco.';
      } else if (HOY < w1) {
        W0 = manana; W1 = w1;
        CD.txt = paraCumple + ' <b>¡Están en el momento ideal!</b> Reservando estos días llegan con las fotos para la invitación y la deco.';
      } else {
        W0 = manana; W1 = P.addDays(cumple, -1);
        CD.txt = paraCumple + ' <b>¡Todavía están a tiempo!</b> Reservá cuanto antes y llegan con sus fotos al gran día.';
      }
    } else if (dd === 0) {
      CD.a = '¡FELIZ'; CD.n = '1'; CD.b = 'AÑITO!';
      CD.txt = '¡Hoy es su primer cumple! Celebralo con una sesión: el recuerdo de este año queda para siempre.';
    } else {
      CD.a = 'YA CUMPLIÓ'; CD.n = '1'; CD.b = 'AÑITO';
      CD.txt = 'Su primer año ya llegó: la sesión se puede hacer cuando quieras, <b>¡el recuerdo queda para siempre!</b>';
    }
  }

  /* ---------------------------------------------------------------- textos */
  var vigTxt = '', pillTxt = 'Más de 100 temáticas · Fotos en menos de 24 h';
  if (vigente) { vigTxt = 'Valores vigentes hasta el <b>' + P.fmtLong(hasta) + '</b>.'; pillTxt = 'Valores vigentes hasta el ' + P.fmtLong(hasta, false); }
  else if (vencida) { vigTxt = 'La vigencia de esta propuesta terminó el ' + P.fmtShort(hasta) + ': te confirmamos los valores.'; pillTxt = 'Consultanos los valores actualizados'; }

  function texts() {
    var T = {
      bebe: bebe || 'tu bebé',
      saludo: mama ? 'Querida ' + mama + ',' : (bebe ? 'Querida familia de ' + bebe + ',' : 'Querida familia,'),
      packsub: bebe ? 'Tres maneras de celebrar el primer año de ' + bebe : 'Tres maneras de celebrar su primer año',
      solo: bebe ? 'Solo falta ' + bebe : 'Su trono ya está listo',
      closing: bebe ? 'Reservá con tiempo la sesión de ' + bebe + '.' : 'Reservá con tiempo su sesión de primer añito.',
      cd_a: CD.a, cd_n: CD.n, cd_b: CD.b,
      pill: pillTxt,
      x_cuadro: '$' + m(L.cuadro), x_carpeta: '$' + m(L.carpeta), x_calendario: '$' + m(L.calendario)
    };
    var H = { cd_txt: CD.txt, vig2: vigTxt, vig3: vigTxt,
      upgrade: 'Por <b>$' + m(PK.historia.price - PK.recuerdo.price) + '</b> más que Recuerdo sumás la carpeta con 5 fotos impresas y el calendario.' };
    Object.keys(PK).forEach(function (k) {
      var p = PK[k];
      T['p_' + k] = m(p.price);
      T['s_' + k] = '$' + m(p.sena);
      if (p.sep) { T['sep_' + k] = p.save > 0 ? '$' + m(p.sep) : ''; T['save_' + k] = p.save > 0 ? 'AHORRÁS $' + m(p.save) : ''; }
      H['dep_' + k] = 'Reservás con <b>$' + m(p.sena) + '</b> y abonás $' + m(p.saldo) + ' al finalizar.';
    });
    return { T: T, H: H };
  }

  function waText(kind, pack) {
    var de = bebe ? ' de ' + bebe : '';
    var cu = cumple ? ' (cumple el ' + P.fmtShort(cumple) + ')' : '';
    if (kind === 'pack') return '¡Hola! Quiero reservar el pack ' + pack + ' para el primer añito' + de + cu + ' ✨';
    return '¡Hola! Quiero reservar la sesión de primer añito' + de + cu + ' ✨';
  }

  /* ---------------------------------------------------------------- calendario */
  var HR = C.horarios || {};
  var FER = C.feriados || [], CERR = C.cerrados || [], COMP = C.completos || [];
  var AV = { ok: false, ocupados: {}, bloqueos: [], grilla: null, hoy: '' };
  function hrs(list) { return (list || []).map(function (h) { return String(h).split(':')[0].replace(/^0/, ''); }); }
  function slotsFor(d) {
    var w = P.dow(d);
    if (w === 0) return [];
    var base = FER.indexOf(d) >= 0 ? hrs(HR.feriado) : hrs(w === 6 ? (AV.grilla ? AV.grilla.sabado : HR.sabado) : (AV.grilla ? AV.grilla.semana : HR.semana));
    AV.bloqueos.forEach(function (b) { if (b.tipo === 'slot_extra' && b.fecha === d && b.horario) base.push(String(b.horario).split(':')[0].replace(/^0/, '')); });
    return base.filter(function (h, i) { return base.indexOf(h) === i; });
  }
  function estado(d) {
    var w = P.dow(d);
    if (d <= HOY) return 'past';
    if (w === 0 || CERR.indexOf(d) >= 0) return 'off';
    if (AV.bloqueos.some(function (b) { return b.tipo === 'dia' && b.fecha === d; })) return 'off';
    if (COMP.indexOf(d) >= 0) return 'full';
    if (AV.ok) {
      var hs = slotsFor(d);
      if (!hs.length) return 'off';
      var busy = {};
      (AV.ocupados[d] || []).forEach(function (h) { busy[String(h).split(':')[0].replace(/^0/, '')] = 1; });
      AV.bloqueos.forEach(function (b) { if (b.tipo === 'slot' && b.fecha === d && b.horario) busy[String(b.horario).split(':')[0].replace(/^0/, '')] = 1; });
      if (!hs.some(function (h) { return !busy[h]; })) return 'full';
    }
    return FER.indexOf(d) >= 0 ? 'fe' : (w === 6 ? 'sat' : 'wk');
  }
  function months() {
    var startM = HOY.slice(0, 7);
    // si quedan pocos días del mes, arrancamos por el siguiente
    var finMes = P.addDays(P.addDays(startM + '-01', 32).slice(0, 7) + '-01', -1);
    var enEste = (W0 && W0.slice(0, 7) === startM) || (cumple && cumple >= HOY && cumple.slice(0, 7) === startM);
    if (!enEste && P.diffDays(HOY, finMes) < 8) startM = P.addDays(finMes, 1).slice(0, 7);
    if (W0 && W0.slice(0, 7) > startM) startM = W0.slice(0, 7);
    var a = startM + '-01', b = P.addDays(a, 32).slice(0, 7) + '-01';
    return [a, b];
  }
  var DW = ['LU', 'MA', 'MI', 'JU', 'VI', 'SÁ', 'DO'];
  var STAR = '<svg class="st" data-icon="star" viewBox="-1 -1 2 2" aria-hidden="true"><use href="#star4" x="-1" y="-1" width="2" height="2" fill="currentColor"/></svg>';
  function monthHTML(first) {
    var D = P.parse(first), y = D.getUTCFullYear(), mo = D.getUTCMonth();
    var name = P.MESES[mo].charAt(0).toUpperCase() + P.MESES[mo].slice(1);
    var h = '<div class="mon"><div class="mh">' + name + '<i>' + y + '</i></div><div class="g">';
    DW.forEach(function (d) { h += '<div class="dw">' + d + '</div>'; });
    var lead = (D.getUTCDay() + 6) % 7, n = new Date(Date.UTC(y, mo + 1, 0)).getUTCDate();
    for (var i = 0; i < lead; i++) h += '<div class="d e"></div>';
    for (var d = 1; d <= n; d++) {
      var ds = y + '-' + ('0' + (mo + 1)).slice(-2) + '-' + ('0' + d).slice(-2);
      var st = estado(ds), cls = 'd ' + st, col = (lead + d - 1) % 7;
      var idl = W0 && ds >= W0 && ds <= W1;
      if (idl) {
        cls += ' idl';
        if (ds === W0 || col === 0 || d === 1) cls += ' s0';
        if (ds === W1 || col === 6 || d === n) cls += ' s1';
      }
      if (ds === cumple) cls += ' bd';
      var lbl = ds === cumple ? 'Su cumple' : ({ past: '', off: 'Sin turnos', full: 'Completo', fe: 'Feriado' }[st] || '');
      h += '<div class="' + cls + '" data-date="' + ds + '"' + (lbl ? ' title="' + lbl + '"' : '') + '><span class="n">' + d + '</span>' +
        (ds === cumple ? STAR : (st === 'fe' ? STAR : '')) + '</div>';
    }
    return h + '</div></div>';
  }
  function renderCal() {
    var el = document.getElementById('cal');
    if (!el) return;
    var ms = months();
    el.innerHTML = monthHTML(ms[0]) + monthHTML(ms[1]);
    var lg = document.getElementById('lgdyn');
    if (lg) {
      lg.querySelector('[data-lg="idl"]').hidden = !W0;
      lg.querySelector('[data-lg="bd"]').hidden = !(cumple && (cumple.slice(0, 7) === ms[0].slice(0, 7) || cumple.slice(0, 7) === ms[1].slice(0, 7)));
    }
  }
  function note(txt) { P.refresh({ cal_note: txt }); }

  function fetchJSON(url, ms) {
    return new Promise(function (res, rej) {
      var done = false, t = setTimeout(function () { done = true; rej(new Error('timeout')); }, ms);
      fetch(url, { mode: 'cors', cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
        .then(function (j) { if (!done) { clearTimeout(t); res(j); } }, function (e) { if (!done) { clearTimeout(t); rej(e); } });
    });
  }
  function scriptURL() {
    var fb = C.reservasURL || '';
    return fetch('/CalendarioDeReserva/config.js', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.text() : ''; })
      .then(function (t) { var mm = /SCRIPT_URL\s*:\s*['"](https:\/\/script\.google\.com\/[^'"\s]+)['"]/.exec(t || ''); return mm ? mm[1] : fb; })
      .catch(function () { return fb; });
  }
  var availP = null;
  function loadAvail() {
    if (availP) return availP;
    var local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
    if (P.PDFBG || Q.get('_noapi') === '1') { availP = Promise.resolve(false); return availP; }
    var cached = null;
    try { cached = JSON.parse(sessionStorage.getItem('pa_av') || 'null'); } catch (e) { cached = null; }
    var src = local && Q.get('_api') ? Promise.resolve(Q.get('_api')) : scriptURL().then(function (u) { return u ? u + '?action=horarios' : ''; });
    availP = (cached && Date.now() - cached.t < 5 * 60 * 1000 && !Q.get('_api') ? Promise.resolve(cached.d) : src.then(function (u) {
      if (!u) throw new Error('sin servidor');
      return fetchJSON(u, 15000);
    })).then(function (d) {
      if (!d || !d.ok) throw new Error('respuesta');
      AV = { ok: true, ocupados: d.ocupados || {}, bloqueos: d.bloqueos || [], grilla: d.grilla || null, hoy: d.hoy || '' };
      try { sessionStorage.setItem('pa_av', JSON.stringify({ t: Date.now(), d: d })); } catch (e) { /* sin almacenamiento */ }
      renderCal();
      note('Disponibilidad actualizada al ' + P.fmtLong(HOY));
      return true;
    }).catch(function () {
      note('Confirmamos la disponibilidad por WhatsApp');
      return false;
    });
    return availP;
  }

  P.start({
    whatsapp: WA,
    variant: G,
    title: bebe ? 'Primer añito · Propuesta para ' + bebe + ' · Estudio Fotoinfantil' : null,
    texts: texts,
    waText: waText,
    fileName: function () { return 'Propuesta Primer añito - ' + (bebe || 'Estudio Fotoinfantil') + '.pdf'; },
    pdfTitle: function () { return 'Primer añito · Propuesta' + (bebe ? ' para ' + bebe : '') + ' · Estudio Fotoinfantil'; },
    init: function () {
      renderCal();
      if (!P.PDFBG && Q.get('_noapi') !== '1') note('Consultando la disponibilidad…');
      loadAvail();
      return null;
    },
    beforePdf: function () {
      // esperamos la disponibilidad hasta 6 s para que el PDF salga con los días completos
      return Promise.race([loadAvail(), new Promise(function (r) { setTimeout(r, 6000); })]);
    }
  });

  window.PA = { HOY: HOY, G: G, bebe: bebe, mama: mama, cumple: cumple, hasta: hasta, lista: lid, vigente: vigente, vencida: vencida, PK: PK, W0: function () { return W0; }, W1: function () { return W1; }, AV: function () { return AV; }, estado: estado, loadAvail: loadAvail };
})();

/* Estudio Fotoinfantil · aviso de lectura de las propuestas (24/11/2026)
   Le cuenta al servidor de reservas (Apps Script, acción "visto") que una familia abrió su propuesta,
   hasta qué página llegó, cuántos segundos la miró y si bajó el PDF o tocó WhatsApp.
   Solo manda lo que ya está en el link (bebé y mamá) y un número al azar por teléfono.
   No avisa: links sin nombre, pruebas (?_algo), capturas del PDF, navegadores automáticos
   y los teléfonos del estudio (los que abrieron el generador o el panel, o un link con ?estudio). */
(function () {
  'use strict';
  var SRV = 'https://script.google.com/macros/s/AKfycbxlWQSw4Bj2PYrJlnUVC4QdpcYAVV0vIu-ZqenCTMEOgbolkSfKY_Gr1h140VeMAc3YXw/exec';
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  try {
    var Q = new URLSearchParams(location.search);
    if (Q.has('estudio')) { store('efi_estudio', '1'); return; }
    if (store('efi_estudio') === '1') return;
    if (navigator.webdriver || document.documentElement.classList.contains('pdfbg')) return;
    var prueba = false;
    Q.forEach(function (v, k) { if (k.charAt(0) === '_') prueba = true; });
    if (prueba) return;
    var bebe = (Q.get('para') || Q.get('bebe') || Q.get('b') || '').trim().slice(0, 40);
    var mama = (Q.get('mama') || Q.get('m') || '').trim().slice(0, 40);
    if (!bebe && !mama) return;
    var partes = location.pathname.split('/').filter(function (x) { return x && !/\.html?$/i.test(x); });
    var prop = (partes[partes.length - 1] || '').toLowerCase();
    if (!prop) return;
    var dev = store('efi_dev');
    if (!dev) { dev = Math.random().toString(36).slice(2, 12); store('efi_dev', dev); }
  } catch (e) { return; }

  function enviar(ev, extra) {
    var o = { action: 'visto', prop: prop, bebe: bebe, mama: mama, dev: dev, ev: ev };
    for (var k in extra) o[k] = extra[k];
    var s = JSON.stringify(o);
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(SRV, s)) return;
    } catch (e) { /* sigue abajo */ }
    try { fetch(SRV, { method: 'POST', body: s, mode: 'no-cors', keepalive: true }); } catch (e) { /* sin aviso */ }
  }

  /* páginas visibles, en orden (la de regalo, si está oculta, no cuenta) */
  var pags = [];
  function leerPaginas() {
    var todas = document.querySelectorAll('[data-pg]');
    if (!todas.length) todas = document.querySelectorAll('.page');
    pags = Array.prototype.slice.call(todas).filter(function (el) {
      return el.getClientRects().length && getComputedStyle(el).display !== 'none';
    });
  }
  var NOMBRES = { portada: 'Portada', carta: 'Carta', escenarios: 'Escenarios', sesion: 'Así es su sesión',
    packs1: 'Destello e Ilusión', packs2: 'Magia y Polo Norte', productos: 'Cuadro y calendarios', regalo: 'Regalo',
    vestuario: 'Vestuario', fechas: 'Fechas', reserva: 'Cómo reservar', preguntas: 'Preguntas', cierre: 'Final' };
  function nombre(el) {
    var pg = el.getAttribute('data-pg');
    if (pg && NOMBRES[pg]) return NOMBRES[pg];
    var h = el.querySelector('h1, h2, .ttl, .title');
    var t = (h && h.textContent || el.getAttribute('data-pg') || '').replace(/\s+/g, ' ').trim();
    return t.slice(0, 40);
  }

  var max = 0, maxNombre = '', enviadoMax = 0;
  var activo = document.visibilityState !== 'hidden' ? Date.now() : 0, acumulado = 0, timer = 0;
  function pendiente() { return acumulado + (activo ? Date.now() - activo : 0); }
  function segundos() {
    var t = pendiente();
    acumulado = 0; if (activo) activo = Date.now();
    return Math.round(t / 1000);
  }
  function progreso() {
    clearTimeout(timer); timer = 0;
    if (max <= enviadoMax && pendiente() < 3000) return;   // nada nuevo que contar
    enviadoMax = max;
    enviar('progreso', { pag: max, tot: pags.length, nombre: maxNombre, seg: segundos() });
  }
  function programar() { if (!timer) timer = setTimeout(progreso, 6000); }

  function arrancar() {
    leerPaginas();
    if (pags.length) { max = 1; maxNombre = nombre(pags[0]); }
    enviar('abrio', { pag: max, tot: pags.length, nombre: maxNombre });
    enviadoMax = max;
    if ('IntersectionObserver' in window && pags.length) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          var i = pags.indexOf(e.target) + 1;
          if (i > max) { max = i; maxNombre = nombre(e.target); programar(); }
        });
      }, { threshold: 0.45 });
      pags.forEach(function (p) { io.observe(p); });
    }
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') {
        if (activo) { acumulado += Date.now() - activo; activo = 0; }
        progreso();
      } else {
        activo = Date.now();
      }
    });
    window.addEventListener('pagehide', function () { if (activo || acumulado) progreso(); });
    document.addEventListener('click', function (e) {
      var t = e.target && e.target.closest ? e.target : null;
      if (!t) return;
      if (t.closest('[data-pdf]')) { enviar('pdf', { pag: max, tot: pags.length, seg: segundos() }); return; }
      var w = t.closest('[data-wa], a[href*="wa.me"], a[href*="api.whatsapp.com"]');
      if (w) enviar('whatsapp', { pag: max, tot: pags.length, seg: segundos(), pack: w.getAttribute('data-pack') || '' });
    }, true);
  }
  if (document.readyState === 'complete') setTimeout(arrancar, 300);
  else window.addEventListener('load', function () { setTimeout(arrancar, 300); });
})();

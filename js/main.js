/* El Bohemio · interacciones de la landing (sin dependencias) */
(function () {
  'use strict';
  var d = document.documentElement;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esCelu = matchMedia('(max-width: 899px)').matches;
  var WA = '5491131611584';

  /* ---------- horarios del local (hora de Buenos Aires) ---------- */
  var HORARIOS = {
    1: [['12:00', '16:00'], ['17:00', '24:00']], 2: [],
    3: [['12:00', '16:00'], ['17:00', '24:00']], 4: [['12:00', '16:00'], ['17:00', '24:00']],
    5: [['12:00', '16:00'], ['17:00', '24:00']], 6: [['12:00', '24:00']], 0: [['12:00', '17:00']]
  };
  var DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  function ahoraBA() {
    var p = {};
    new Intl.DateTimeFormat('en-US', { timeZone: 'America/Argentina/Buenos_Aires', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false })
      .formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
    var dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday);
    return { dow: dow, min: (parseInt(p.hour, 10) % 24) * 60 + parseInt(p.minute, 10) };
  }
  var aMin = function (h) { var a = h.split(':'); return +a[0] * 60 + +a[1]; };
  var fmt = function (h) { return (h === '24:00' ? '00:00' : h) + ' hs'; };
  function estado() {
    var n = ahoraBA(), hoy = HORARIOS[n.dow];
    for (var i = 0; i < hoy.length; i++) {
      if (n.min >= aMin(hoy[i][0]) && n.min < aMin(hoy[i][1])) return { abierto: true, txt: 'Abierto ahora · hasta las ' + fmt(hoy[i][1]) };
    }
    for (var j = 0; j < hoy.length; j++) {
      if (n.min < aMin(hoy[j][0])) return { abierto: false, txt: (j === 0 ? 'Hoy abrimos a las ' : 'Volvemos a abrir a las ') + fmt(hoy[j][0]) };
    }
    if (!hoy.length) {
      var m = HORARIOS[(n.dow + 1) % 7];
      return { abierto: false, txt: 'Hoy ' + DIAS[n.dow] + ' descansamos · mañana desde las ' + fmt(m[0][0]) };
    }
    for (var k = 1; k <= 7; k++) {
      var dd = (n.dow + k) % 7, h = HORARIOS[dd];
      if (h.length) return { abierto: false, txt: (k === 1 ? 'Mañana' : 'El ' + DIAS[dd]) + ' abrimos a las ' + fmt(h[0][0]) };
    }
    return { abierto: false, txt: 'Donado 1802 · Villa Urquiza' };
  }
  var est = $('#estadoHero');
  if (est) { var e = estado(); est.classList.toggle('abierto', e.abierto); $('.estado__txt', est).textContent = e.txt; }

  /* ---------- intro: la puerta de hierro ---------- */
  var intro = $('#intro');
  function terminarIntro() {
    d.classList.add('listo'); d.classList.remove('intro-bloq', 'con-intro');
    if (intro && intro.parentNode) intro.parentNode.removeChild(intro);
  }
  if (intro && d.classList.contains('con-intro')) {
    d.classList.add('intro-bloq');
    var t0 = performance.now();
    requestAnimationFrame(function () { intro.classList.add('prende'); });
    var heroImg = $('.hero__foto img');
    var fotoLista = new Promise(function (ok) {
      if (!heroImg || (heroImg.complete && heroImg.naturalWidth)) return ok();
      heroImg.addEventListener('load', ok, { once: true }); heroImg.addEventListener('error', ok, { once: true });
    });
    var fuentes = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    var tope = new Promise(function (ok) { setTimeout(ok, 2600); });
    Promise.race([Promise.all([fotoLista, fuentes]), tope]).then(function () {
      var minimo = esCelu ? 1050 : 1300;
      setTimeout(function () {
        intro.classList.add('abre');
        setTimeout(terminarIntro, esCelu ? 600 : 760);
      }, Math.max(0, minimo - (performance.now() - t0)));
    });
  } else { terminarIntro(); }

  /* ---------- header ---------- */
  var hdr = $('#hdr');
  var yAnt = 0, quieto = 0;
  var onScroll = function () {
    var y = window.scrollY;
    hdr.classList.toggle('con-sombra', y > 24); d.classList.toggle('pasado-hero', y > innerHeight * 0.7);
    if (Math.abs(y - yAnt) > 6) { d.classList.toggle('scroll-abajo', y > yAnt); yAnt = y; }
    clearTimeout(quieto); quieto = setTimeout(function () { d.classList.remove('scroll-abajo'); }, 1400);
  };
  var rafS = 0;
  window.addEventListener('scroll', function () { if (!rafS) rafS = requestAnimationFrame(function () { rafS = 0; onScroll(); }); }, { passive: true });
  onScroll();

  /* ---------- menú celu ---------- */
  var burger = $('.hdr__burger'), menu = $('#menu'), scrollGuardado = 0;
  function bloquear(si) {
    if (si) { scrollGuardado = window.scrollY; document.body.style.position = 'fixed'; document.body.style.top = -scrollGuardado + 'px'; document.body.style.width = '100%'; }
    else { document.body.style.position = ''; document.body.style.top = ''; document.body.style.width = ''; window.scrollTo(0, scrollGuardado); }
  }
  function menuAbrir(si) {
    if (!menu) return;
    menu.hidden = !si; burger.setAttribute('aria-expanded', si); bloquear(si);
    if (si) { var a = $('a', menu); a && a.focus({ preventScroll: true }); }
  }
  burger && burger.addEventListener('click', function () { menuAbrir(menu.hidden); });
  menu && menu.addEventListener('click', function (ev) {
    var a = ev.target.closest('a[href^="#"]'); if (!a) return;
    ev.preventDefault(); var dest = a.getAttribute('href'); menuAbrir(false);
    setTimeout(function () { var t = $(dest); t && t.scrollIntoView({ behavior: 'smooth' }); }, 30);
  });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && menu && !menu.hidden) { menuAbrir(false); burger.focus(); } });
  document.addEventListener('click', function (ev) {
    if (ev.target.closest('[data-kit-open]') && menu && !menu.hidden) menuAbrir(false);
  });

  /* ---------- entradas al hacer scroll ---------- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('visto'); io.unobserve(en.target); } });
    }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
    $$('[data-r],[data-r-luz]').forEach(function (el) { io.observe(el); });
  } else { $$('[data-r],[data-r-luz]').forEach(function (el) { el.classList.add('visto'); }); }

  /* ---------- la casona: de día y de noche ---------- */
  var casona = $('#casona'), llave = $('#llave');
  function momento(m) {
    if (!casona) return;
    casona.dataset.momento = m;
    var noche = m === 'noche';
    llave.setAttribute('aria-pressed', noche);
    $('.llave__txt', llave).textContent = noche ? 'Ver de día' : 'Ver de noche';
    $('#casonaKicker').textContent = noche ? 'Noche de guirnaldas' : 'Mediodía en la vereda';
  }
  if (casona) {
    var q = new URLSearchParams(location.search).get('momento');
    var hora = Math.floor(ahoraBA().min / 60);
    momento(q === 'noche' || q === 'dia' ? q : (hora >= 6 && hora < 17 ? 'dia' : 'noche'));
    llave.addEventListener('click', function () { momento(casona.dataset.momento === 'noche' ? 'dia' : 'noche'); });
  }

  /* ---------- filas: arrastrar con el mouse ---------- */
  $$('.fila').forEach(function (f) {
    var x0 = 0, s0 = 0, activo = false, movio = false, id = null;
    f.addEventListener('pointerdown', function (ev) {
      if (ev.pointerType !== 'mouse' || ev.button !== 0 || f.scrollWidth <= f.clientWidth + 2 || ev.target.closest('.talon,button,a')) return;
      activo = true; movio = false; x0 = ev.clientX; s0 = f.scrollLeft; id = ev.pointerId;
      f.style.scrollSnapType = 'none'; f.style.cursor = 'grabbing';
    });
    f.addEventListener('pointermove', function (ev) {
      if (!activo || ev.pointerId !== id) return;
      var dx = ev.clientX - x0;
      if (Math.abs(dx) > 4 && !movio) { movio = true; try { f.setPointerCapture(id); } catch (e) {} }
      if (movio) { f.scrollLeft = s0 - dx; ev.preventDefault(); }
    });
    var fin = function () {
      if (!activo) return; activo = false; f.style.cursor = '';
      var w = f.firstElementChild ? f.firstElementChild.getBoundingClientRect().width + 14 : 300;
      f.scrollTo({ left: Math.round(f.scrollLeft / w) * w, behavior: 'smooth' });
      setTimeout(function () { f.style.scrollSnapType = ''; }, 400);
    };
    f.addEventListener('pointerup', fin); f.addEventListener('pointercancel', fin);
    f.addEventListener('click', function (ev) { if (movio) { ev.preventDefault(); ev.stopPropagation(); movio = false; } }, true);
  });

  /* ---------- entradas de la agenda: el talón se corta ---------- */
  function accion(t) {
    if (t.dataset.talon === 'reserva') {
      var k = window.kit;
      if (k && k.reservas) k.reservas.abrir({ fecha: t.dataset.fecha, hora: t.dataset.hora, personas: 2 });
      else { var r = $('#reservar'); r && r.scrollIntoView({ behavior: 'smooth' }); }
    } else {
      window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(t.dataset.msg || 'Hola Bohemio!'), '_blank', 'noopener');
    }
  }
  function cortar(t) {
    t.classList.remove('tira'); t.style.transform = '';
    t.classList.add('cortado');
    setTimeout(function () { accion(t); }, 260);
    setTimeout(function () { t.classList.remove('cortado'); }, 1100);
  }
  $$('.talon').forEach(function (t) {
    var y0 = 0, x0 = 0, dy = 0, activo = false, id = null, horizontal = false;
    t.addEventListener('pointerdown', function (ev) {
      if (ev.button && ev.button !== 0) return;
      activo = true; horizontal = false; y0 = ev.clientY; x0 = ev.clientX; dy = 0; id = ev.pointerId;
      t.classList.add('tira');
    });
    t.addEventListener('pointermove', function (ev) {
      if (!activo || ev.pointerId !== id) return;
      var mx = ev.clientX - x0, my = ev.clientY - y0;
      if (!horizontal && Math.abs(mx) > 12 && Math.abs(mx) > Math.abs(my)) { horizontal = true; t.style.transform = ''; return; }
      if (horizontal) return;
      dy = Math.max(0, Math.min(90, my));
      if (dy > 3) { try { t.setPointerCapture(id); } catch (e) {} }
      t.style.transform = 'translateY(' + dy + 'px) rotate(' + (-dy / 18) + 'deg)';
    });
    var fin = function (ev) {
      if (!activo) return; activo = false;
      if (horizontal) { t.classList.remove('tira'); t.style.transform = ''; return; }
      if (dy > 46 || (dy < 6 && ev.type === 'pointerup')) { cortar(t); }
      else { t.classList.remove('tira'); t.style.transform = ''; }
      t.dataset.p = '1'; setTimeout(function () { delete t.dataset.p; }, 400);
    };
    t.addEventListener('pointerup', fin);
    t.addEventListener('pointercancel', function () { activo = false; t.classList.remove('tira'); t.style.transform = ''; });
    t.addEventListener('click', function (ev) { if (!t.dataset.p && ev.detail === 0) cortar(t); });
  });
})();

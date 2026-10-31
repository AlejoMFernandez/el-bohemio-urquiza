// El Bohemio · kit de funcionalidades (carta, pizarra, mercado, reservas, panel)
import { initKit } from '../kit/kit.js?v=1';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const mouse = matchMedia('(hover: hover) and (pointer: fine)').matches;
const mini = (src) => /img\/carta\/\d+\.webp$/.test(src) ? src.replace(/\.webp$/, '-t.webp') : src;
const CANASTA = '<svg viewBox="0 0 24 24"><path d="M4 10h16l-1.6 9.2a2 2 0 0 1-2 1.8H7.6a2 2 0 0 1-2-1.8L4 10Z"/><path d="M8 10 11 4M16 10l-3-6"/></svg>';

document.addEventListener('kit:carta', onCarta);

const kit = await initKit({
  config: 'cliente.json',
  imagenes: { lqip: 'img/lqip.json' },
  carrito: { label: 'Tu canasta', icono: CANASTA },
  cartas: {
    'pizarra-carta': {
      pedir: false,
      template: (p, ctx) => `
        <span class="tz__nom">${esc(p.nombre)}${p.foto ? '<span class="tz__ojo" aria-hidden="true"></span>' : ''}</span>
        <span class="tz__pre">${ctx.money(p.precio) ?? 'Consultar'}</span>
        ${p.descripcion ? `<span class="tz__desc">${esc(p.descripcion)}</span>` : ''}`,
    },
    'carta-local': {
      pedir: false,
      template: (p, ctx) => `
        ${p.foto ? `<img class="ci__mini" src="${esc(mini(ctx.asset(p.foto)))}" alt="" width="58" height="58" loading="lazy" decoding="async">` : ''}
        <div class="ci__body">
          <h4 class="ci__nom">${esc(p.nombre)}${(p.etiquetas || []).map(ctx.etiquetaHTML).join('')}${p.foto ? '<span class="ci__dot" title="Tiene foto"></span>' : ''}</h4>
          ${p.descripcion ? `<p class="ci__desc">${esc(p.descripcion)}</p>` : ''}
        </div>
        <span class="ci__pre">${ctx.money(p.precio) ?? 'Consultar'}</span>`,
    },
    'mercado-carta': {
      template: (p, ctx) => `
        ${p.foto ? `<img class="mi__foto" src="${esc(ctx.asset(p.foto))}" alt="" width="820" height="1025" loading="lazy" decoding="async">` : `<div class="mi__tiza" aria-hidden="true">${esc(p.nombre)}</div>`}
        <div class="mi__body">
          <h3 class="mi__nom">${esc(p.nombre)}</h3>
          ${p.descripcion ? `<p class="mi__desc">${esc(p.descripcion)}</p>` : ''}
          <span class="mi__pre">${ctx.money(p.precio) ?? 'A confirmar'}</span>
          ${ctx.carrito && ctx.pedible(p) ? `<div class="mi__qty"><div data-kit-qty="${esc(p.id)}"></div></div>` : ''}
        </div>`,
    },
  },
});
window.kit = kit;

/* ---------- cambio suave de foto ---------- */
function cambiarFoto(img, src, cap, texto) {
  if (!img || !src || img.dataset.src === src) { if (cap && texto) cap.textContent = texto; return; }
  img.dataset.src = src;
  img.classList.add('cambia');
  const pre = new Image(); pre.src = src;
  const listo = () => { img.src = src; requestAnimationFrame(() => img.classList.remove('cambia')); if (cap) cap.textContent = texto; };
  (pre.decode ? pre.decode() : Promise.resolve()).then(listo, listo);
}

/* ---------- pizarra de hoy ---------- */
function pizarra(el, productos) {
  const items = $$('.kit-item', el);
  const foto = $('#pizarraFoto'), cap = $('#pizarraCap');
  const elegir = (it) => {
    items.forEach((x) => { x.classList.toggle('on', x === it); x.setAttribute('aria-pressed', x === it); });
    const p = productos.find((x) => x.id === it.dataset.id);
    if (it.dataset.photo) cambiarFoto(foto, it.dataset.photo, cap, p ? p.nombre : '');
  };
  items.forEach((it) => {
    const p = productos.find((x) => x.id === it.dataset.id);
    it.tabIndex = 0; it.setAttribute('role', 'button'); it.setAttribute('aria-label', `Ver foto: ${p ? p.nombre : ''}`);
    it.addEventListener('click', () => elegir(it));
    it.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); elegir(it); } });
    if (mouse) it.addEventListener('pointerenter', () => elegir(it));
  });
  const primero = items.find((x) => x.dataset.photo) || items[0];
  if (primero) elegir(primero);
  // el primer plato también va en la pizarrita del hero
  const p0 = productos.find((x) => x.categoria === 'pizarra' && x.disponible !== false);
  const hp = $('#heroPlato');
  if (hp && p0) {
    const precio = p0.precio != null ? ' · ' + new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(p0.precio).replace(/\s/g, '') : '';
    hp.textContent = p0.nombre + precio;
  }
}

/* ---------- carta: encabezado, anterior/siguiente y foto al costado ---------- */
function carta(el, categorias) {
  const nombre = (id) => (categorias.find((c) => c.id === id) || {}).nombre || '';
  const paneles = $$('.kit-carta__panel', el);
  const tabs = $$('.kit-tab', el);
  const foto = $('#cartaFoto'), cap = $('#cartaFotoCap');
  paneles.forEach((pn, i) => {
    const items = $$('.kit-item', pn);
    const cat = items[0]?.dataset.cat;
    const head = document.createElement('header');
    head.className = 'carta-head';
    head.innerHTML = `<h3>${esc(nombre(cat))}</h3><span>${items.length} ${items.length === 1 ? 'opción' : 'opciones'}</span>`;
    pn.prepend(head);
    const nav = document.createElement('div');
    nav.className = 'carta-nav';
    const ant = paneles[i - 1] ? $$('.kit-item', paneles[i - 1])[0]?.dataset.cat : null;
    const sig = paneles[i + 1] ? $$('.kit-item', paneles[i + 1])[0]?.dataset.cat : null;
    nav.innerHTML = `<button type="button" data-ir="${ant || ''}" ${ant ? '' : 'disabled'}>← ${esc(nombre(ant))}</button><button type="button" data-ir="${sig || ''}" ${sig ? '' : 'disabled'}>${esc(nombre(sig))} →</button>`;
    pn.append(nav);
    if (mouse) items.forEach((it) => it.addEventListener('pointerenter', () => {
      if (!it.dataset.photo) return;
      items.forEach((x) => x.classList.toggle('on', x === it));
      cambiarFoto(foto, it.dataset.photo, cap, $('.ci__nom', it)?.firstChild?.textContent || '');
    }));
  });
  const fotoDelPanel = () => {
    const pn = paneles.find((p) => !p.hidden); if (!pn) return;
    const it = $$('.kit-item', pn).find((x) => x.dataset.photo);
    $$('.kit-item', pn).forEach((x) => x.classList.toggle('on', x === it));
    if (it) cambiarFoto(foto, it.dataset.photo, cap, $('.ci__nom', it)?.firstChild?.textContent || '');
  };
  if (!el.dataset.bohemio) {
    el.dataset.bohemio = '1';
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-ir]');
      if (b && b.dataset.ir) {
        const t = $$('.kit-tab', el).find((x) => x.dataset.cat === b.dataset.ir);
        if (t) { t.click(); t.scrollIntoView({ block: 'nearest', inline: 'center' }); const top = el.getBoundingClientRect().top + scrollY - (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--hdr')) || 60) - 10; if (el.getBoundingClientRect().top < 0) scrollTo({ top, behavior: 'smooth' }); }
        return;
      }
      if (e.target.closest('.kit-tab')) requestAnimationFrame(() => { fotoDelPanel(); e.target.closest('.kit-tab').scrollIntoView({ block: 'nearest', inline: 'center' }); });
    });
  }
  fotoDelPanel();
  void tabs;
}

function onCarta(e) {
  const { el, productos, categorias } = e.detail;
  if (el.id === 'pizarra-carta') pizarra(el, productos);
  else if (el.id === 'carta-local') carta(el, categorias);
}

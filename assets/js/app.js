/* Социокультурная разведка: сборка страницы из data.js.
   Видео на первом экране и в полосе, программа по дням, истории мест, карта Leaflet,
   пласты, перспективы, мероприятия, контакты. Места и пласты открываются в панели,
   кнопка «Назад» телефона и браузера закрывает панель и меню, а не уводит со страницы. */
(() => {
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const IMG = 'assets/img/', VID = 'assets/video/';
const L_ = R.layers;
const touch = matchMedia('(hover: none) and (pointer: coarse)').matches;
const small = () => innerWidth <= 820;
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
// видео — часть содержания: отключаем его только в режиме экономии трафика
const noVideo = !!(navigator.connection && navigator.connection.saveData);
const Q = innerWidth <= 767 ? '720' : '1080';
document.documentElement.classList.toggle('touch', touch);

/* ---------- Штриховки пластов: плитка SVG как фон ---------- */
const TILE = {
  pr:  [1.7, 1.7, c => `<circle cx=".42" cy=".42" r=".21" fill="${c}"/><circle cx="1.27" cy="1.27" r=".21" fill="${c}"/>`],
  bsh: [1.3, 1.9, c => `<path d="M0 1.35L.65 .55L1.3 1.35" fill="none" stroke="${c}" stroke-width=".2"/>`],
  lt:  [6.4, 2.6, c => `<path d="M.3 .65H4.3M4.9 .65H6.1M.3 1.95H2.2M2.8 1.95H6.1" stroke="${c}" stroke-width=".2"/>`],
  zhd: [1.5, 2.2, c => `<path d="M0 1.1H1.5M.75 .55V1.65" stroke="${c}" stroke-width=".21"/>`],
  pm:  [3.2, 1.7, c => `<path d="M0 .05H3.2M0 .9H3.2M.05 .05V.9M1.65 .9V1.75" stroke="${c}" stroke-width=".2"/>`],
  de:  [3, 3, c => `<path d="M0 0H3M0 0V3M0 3L1.5 0L3 3" fill="none" stroke="${c}" stroke-width=".2"/>`],
  kn:  [2.6, 2.2, c => `<rect x=".6" y=".75" width="1.1" height=".72" rx=".16" fill="${c}"/>`],
  rm:  [1.6, 1.6, c => `<path d="M0 0L1.6 1.6M0 1.6L1.6 0" stroke="${c}" stroke-width=".16"/>`],
  sb:  [3.4, 3.2, c => `<g fill="none" stroke="${c}" stroke-width=".18"><circle cx=".85" cy=".9" r=".5"/><circle cx="2.45" cy="1.05" r=".36"/><circle cx="1.7" cy="2.35" r=".42"/><circle cx="3.05" cy="2.7" r=".25"/><circle cx=".3" cy="2.6" r=".22"/></g>`],
  st:  [3.2, 1.6, c => `<path d="M0 .8Q.8 .1 1.6 .8T3.2 .8" fill="none" stroke="${c}" stroke-width=".2"/>`]
};
// одинарные кавычки: значение попадает в атрибут style="…"
const pat = (k, s = 5) => {
  const [w, h, fn] = TILE[k], Ly = L_[k];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w * s}" height="${h * s}" viewBox="0 0 ${w} ${h}">${fn(Ly.c)}</svg>`;
  return `url('data:image/svg+xml,${encodeURIComponent(svg)}') 0 0/${w * s}px ${h * s}px repeat, ${Ly.bg}`;
};
const chip = (k, tag = 'span', extra = '') => { const Ly = L_[k]; return `<${tag} class="chip${Ly.idea ? ' idea' : ''}" style="--c:${Ly.c}" ${extra}><i class="sw" style="background:${pat(k, 3)}"></i>${Ly.short || Ly.name}</${tag}>`; };
const chips = keys => `<div class="chips">${keys.map(k => chip(k)).join('')}</div>`;
const grad = keys => keys.length === 1 ? L_[keys[0]].c : `conic-gradient(${keys.map((k, i) => `${L_[k].c} ${i * 100 / keys.length}% ${(i + 1) * 100 / keys.length}%`).join(',')})`;
const place = id => R.places.find(p => p.id === id);
const imgType = im => (im && im[2]) || '';
const plural = (n, a, b, c) => { const m = n % 10, h = n % 100; return m === 1 && h !== 11 ? a : m >= 2 && m <= 4 && (h < 12 || h > 14) ? b : c; };

/* ---------- Керн по правому краю ---------- */
$('#kern').innerHTML = R.layerOrder.map(k => `<span style="background:${pat(k, 2.4)}"></span>`).join('');

/* ---------- Шапка, меню, нижняя панель ---------- */
const hdr = $('#hdr'), burger = $('#burger'), sheet = $('#msheet');
let ticking = false;
const onScroll = () => { hdr.classList.toggle('solid', scrollY > 40 || sheet.classList.contains('open')); ticking = false; };
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true }); onScroll();
const openMenu = () => { sheet.classList.add('open'); sheet.setAttribute('aria-hidden', 'false'); burger.setAttribute('aria-expanded', 'true'); document.body.classList.add('lock'); onScroll(); history.pushState({ menu: 1 }, ''); };
const closeMenu = () => { sheet.classList.remove('open'); sheet.setAttribute('aria-hidden', 'true'); burger.setAttribute('aria-expanded', 'false'); if (!drawer.classList.contains('on')) document.body.classList.remove('lock'); onScroll(); };
burger.addEventListener('click', () => sheet.classList.contains('open') ? history.back() : openMenu());
$$('a', sheet).forEach(a => a.addEventListener('click', e => {
  e.preventDefault(); closeMenu(); history.replaceState(null, '', location.pathname + location.search);
  const t = $(a.getAttribute('href')); if (t) setTimeout(() => t.scrollIntoView({ behavior: calm ? 'auto' : 'smooth' }), 60);
}));
const secObs = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; const id = '#' + e.target.id;
  $$('.nav a, .tabbar a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === id)); }), { rootMargin: '-45% 0px -50% 0px' });
$$('main section[id]').forEach(s => secObs.observe(s));

/* ---------- Видео на первом экране: три ролика сменяются наплывом ---------- */
(() => {
  const media = $('#heroMedia'), v1 = $('#hv1'), play = $('#heroPlay');
  if (noVideo) { v1.removeAttribute('autoplay'); v1.pause(); v1.classList.remove('on'); return; }
  const CL = ['hero', 'hero2', 'hero3'];
  const v2 = document.createElement('video'); v2.muted = true; v2.playsInline = true; v2.setAttribute('playsinline', ''); v2.preload = 'auto'; v2.className = 'hv'; v2.setAttribute('aria-hidden', 'true');
  media.append(v2); v1.loop = false; v1.dataset.clip = '0';
  const vids = [v1, v2]; let cur = 0, k = 0, busy = false;
  const tryPlay = el => { const p = el.play(); if (p && p.catch) p.catch(() => { if (el.paused) play.hidden = false; }); };
  const prep = (el, i) => { if (el.dataset.clip === String(i)) return; el.dataset.clip = i; el.src = `${VID}${CL[i]}-${Q}.mp4`; el.poster = `${VID}${CL[i]}-poster.jpg`; el.load(); };
  const swap = () => {
    const nv = vids[1 - cur], nk = (k + 1) % CL.length;
    if (nv.dataset.clip !== String(nk) || nv.readyState < 3) { const o = vids[cur]; o.currentTime = 0; tryPlay(o); prep(nv, nk); return; }
    busy = true; nv.currentTime = 0; tryPlay(nv); nv.classList.add('on'); vids[cur].classList.remove('on');
    const old = vids[cur]; setTimeout(() => { old.pause(); busy = false; }, 1300); cur = 1 - cur; k = nk;
  };
  vids.forEach(el => {
    el.addEventListener('timeupdate', () => { if (el !== vids[cur] || busy || !el.duration) return; const left = el.duration - el.currentTime;
      if (left < Math.max(6, el.duration / 2)) prep(vids[1 - cur], (k + 1) % CL.length); if (left < 1.1) swap(); });
    el.addEventListener('ended', () => { if (el === vids[cur] && !busy) swap(); });
    el.addEventListener('playing', () => { play.hidden = true; });
  });
  if (v1.readyState >= 2) tryPlay(v1); else v1.addEventListener('canplay', () => tryPlay(v1), { once: true });
  setTimeout(() => { if (v1.paused && v1.currentTime === 0) play.hidden = false; }, 3500);
  play.addEventListener('click', () => { vids[cur].muted = true; tryPlay(vids[cur]); });
  // ролик не тратит батарею, пока первый экран не виден
  new IntersectionObserver(es => es.forEach(e => { const v = vids[cur]; if (e.isIntersecting) { if (v.paused) tryPlay(v); } else v.pause(); })).observe($('#hero'));
  document.addEventListener('visibilitychange', () => { if (document.hidden) vids[cur].pause(); });
})();

/* ---------- Программа ---------- */
const mins = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const dur = (a, b) => { const m = mins(b) - mins(a), h = Math.floor(m / 60), r = m % 60; return (h ? h + ' ч' : '') + (h && r ? ' ' : '') + (r ? r + ' мин' : ''); };
const tabs = $('#dayTabs'), days = $('#days');
tabs.innerHTML = R.days.map((d, i) => `<button role="tab" aria-selected="${!i}" data-i="${i}"><b>${d.date}</b><span>${d.wd}</span></button>`).join('') + '<i class="pill"></i>';
days.innerHTML = R.days.map((d, i) => `<div class="day${i ? '' : ' on'}" role="tabpanel"><p class="day-route">${esc(d.route)}</p><div class="tl">${d.items.map(it => {
  if (it.k === 'road') return `<div class="ti road"><div class="tm">${it.s}</div><div class="bd"><div class="road-t">${esc(it.t)}<span>${dur(it.s, it.e)}</span></div></div></div>`;
  if (it.k === 'end') return `<div class="ti end"><div class="tm">${it.s}</div><div class="bd"><i class="dot"></i><div class="end-t">${esc(it.t)}</div></div></div>`;
  const cls = it.opt ? 'opt' : it.k === 'camp' ? 'camp' : '';
  const style = it.L ? `style="--pat:${pat(it.L[0], 4)}"` : '';
  return `<div class="ti"><div class="tm">${it.s || '··:··'}${it.e ? `<small>до ${it.e}</small>` : ''}</div><div class="bd"><i class="dot"></i><div class="plate ${cls}" ${style}><h4>${it.opt ? '<span class="badge">по желанию</span>' : ''}${esc(it.t)}</h4>${it.d ? `<p>${esc(it.d)}</p>` : ''}${it.L ? chips(it.L) : ''}</div></div></div>`;
}).join('')}</div></div>`).join('');
const pill = $('.pill', tabs);
const setTab = (i, scroll) => {
  $$('button', tabs).forEach((b, j) => b.setAttribute('aria-selected', i === j));
  $$('.day', days).forEach((d, j) => d.classList.toggle('on', i === j));
  const b = $$('button', tabs)[i]; pill.style.left = b.offsetLeft + 'px'; pill.style.width = b.offsetWidth + 'px';
  if (scroll && small()) { const top = days.getBoundingClientRect().top + scrollY - 130; if (scrollY > top) scrollTo({ top, behavior: 'smooth' }); }
};
$$('button', tabs).forEach(b => b.addEventListener('click', () => setTab(+b.dataset.i, true)));
addEventListener('resize', () => setTab($$('button', tabs).findIndex(b => b.getAttribute('aria-selected') === 'true')));
document.fonts && document.fonts.ready.then(() => setTab($$('button', tabs).findIndex(b => b.getAttribute('aria-selected') === 'true'))); setTab(0);

/* ---------- Истории мест: карточки ---------- */
const cards = $('#cards'), more = $('#moreCards');
const cardPh = p => {
  const im = (p.img || [])[0], pos = imgType(im) === 'portrait' ? 'object-position:50% 25%' : imgType(im) === 'tall' ? 'object-position:50% 40%' : '';
  return `<div class="ph" style="--pat:${pat(p.L[0], 5)}">${im ? `<img src="${IMG + im[0]}" alt="${esc(p.n)}" loading="lazy" decoding="async" style="${pos}">` : `<span class="code" style="color:${L_[p.L[0]].c}">${L_[p.L[0]].code}</span>`}${p.plan ? '<span class="plan">будут строить</span>' : ''}${p.video ? '<span class="vid"><svg viewBox="0 0 24 24"><use href="#i-play"/></svg>видео</span>' : ''}</div>`;
};
cards.innerHTML = R.places.map(p => `<button class="card reveal" data-id="${p.id}" data-d="${p.d}">${cardPh(p)}<div class="ci"><span class="wh">${R.districts[p.d]} · ${esc(p.where)}</span><p class="hook">${esc(p.hook)}</p><h3>${esc(p.n)}</h3>${chips(p.L)}</div></button>`).join('');
$$('.card', cards).forEach((c, i) => { c.style.transitionDelay = (i % 3) * 70 + 'ms'; c.addEventListener('click', () => show({ t: 'place', id: c.dataset.id })); });
let dist = 'all', expanded = false;
const LIMIT = 8;
const applyCards = () => {
  let n = 0;
  $$('.card', cards).forEach(c => { const ok = dist === 'all' || c.dataset.d === dist; const cut = ok && small() && !expanded && dist === 'all' && n >= LIMIT; if (ok) n++; c.classList.toggle('hide', !ok || cut); });
  more.hidden = !(small() && !expanded && dist === 'all' && n > LIMIT);
};
const seg = $('#distSeg');
seg.innerHTML = [['all', 'Все места'], ['a', 'Альшеевский'], ['d', 'Давлекановский'], ['b', 'Белебеевский']].map(([k, n], i) => `<button data-d="${k}" class="${i ? '' : 'on'}">${n}</button>`).join('');
$$('button', seg).forEach(b => b.addEventListener('click', () => { $$('button', seg).forEach(x => x.classList.toggle('on', x === b)); dist = b.dataset.d; applyCards(); }));
more.addEventListener('click', () => { expanded = true; applyCards(); });
applyCards(); addEventListener('resize', applyCards);

/* ---------- Карта: создаётся, когда до неё доскроллили ---------- */
let map = null; const markers = {};
const active = new Set(R.layerOrder);
const mf = $('#mapFilters'), mlist = $('#mapList'), mapbox = $('#mapbox');
mf.innerHTML = `<button class="all" id="allLayers">Все пласты</button>` + R.layerOrder.map(k => chip(k, 'button', `data-k="${k}"`)).join('');
mlist.innerHTML = R.places.map(p => `<button class="mli" data-id="${p.id}"><span class="pin${p.plan ? ' plan' : ''}" style="--g:${grad(p.L)};--c1:${L_[p.L[0]].c};width:16px;height:16px"></span><div><b>${esc(p.n)}</b><span>${esc(p.where)}</span></div></button>`).join('');
const popHTML = p => {
  const im = (p.img || [])[0];
  return `<div class="pop">${im ? `<img src="${IMG + im[0]}" alt="" loading="lazy" style="${imgType(im) === 'portrait' ? 'object-position:50% 25%' : ''}">` : ''}<div class="pi"><p class="hk">${esc(p.hook)}</p><h4>${esc(p.n)}</h4><div class="wh">${esc(p.where)} · ${R.districts[p.d]}</div>${chips(p.L)}<button class="btn btn-ink btn-sm" data-open="${p.id}">Читать историю</button></div></div>`;
};
const lockMap = on => {
  if (!map || !touch) return;
  const h = [map.dragging, map.touchZoom, map.doubleClickZoom];
  h.forEach(x => on ? x.disable() : x.enable());
  mapbox.classList.toggle('live', !on); $('#mapdone').hidden = on;
};
function initMap() {
  if (map) return;
  map = L.map('map', { scrollWheelZoom: false, zoomSnap: .25, fadeAnimation: !touch, inertia: true, tapTolerance: 20 });
  if (!touch) $('#map').classList.add('tilefx');
  const osm = '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">участники OpenStreetMap</a>';
  const list = [
    ['https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', { subdomains: 'abc', maxZoom: 18, attribution: osm + ', OSM France', updateWhenIdle: true, keepBuffer: 2 }],
    ['https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: osm, updateWhenIdle: true, keepBuffer: 2 }],
    ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', { maxZoom: 18, attribution: '© Esri, ' + osm, updateWhenIdle: true, keepBuffer: 2 }]
  ];
  let layer = null;
  const use = k => { if (layer) map.removeLayer(layer); let bad = 0, good = 0; layer = L.tileLayer(list[k][0], list[k][1]).addTo(map); layer.on('tileload', () => good++); layer.on('tileerror', () => { if (++bad >= 3 && !good && k < list.length - 1) use(k + 1); }); };
  use(0);
  if (!touch) { map.on('click focus', () => map.scrollWheelZoom.enable()); map.getContainer().addEventListener('mouseleave', () => map.scrollWheelZoom.disable()); }
  [[window.BELEB_BOUNDARY, '#E9DDBE', 'Белебеевский район', [53.93, 54.22]], [window.DAVL_BOUNDARY, '#DCE2C8', 'Давлекановский район', [54.33, 54.82]], [window.ALSHEY_BOUNDARY, '#F1E2C2', 'Альшеевский район', [53.84, 54.86]]].forEach(([B, fill, n, at]) => {
    if (!B) return;
    L.polygon(B, { color: '#1F2B22', weight: 1.2, opacity: .55, dashArray: '6 5', fillColor: fill, fillOpacity: .28, interactive: false, smoothFactor: 1.5 }).addTo(map);
    L.tooltip({ permanent: true, direction: 'center', className: 'dlabel', interactive: false }).setLatLng(at).setContent(n).addTo(map);
  });
  R.places.forEach(p => {
    const icon = L.divIcon({ className: '', html: `<span class="pin${p.plan ? ' plan' : ''}" style="--g:${grad(p.L)};--c1:${L_[p.L[0]].c}"></span>`, iconSize: [20, 20], iconAnchor: [10, 10], popupAnchor: [0, -12] });
    markers[p.id] = L.marker(p.ll, { icon, title: p.n, riseOnHover: true }).bindPopup(popHTML(p), { maxWidth: 270, autoPanPadding: [24, 24] }).addTo(map);
  });
  map.on('popupopen', e => { const b = $('[data-open]', e.popup.getElement()); if (b) b.addEventListener('click', () => show({ t: 'place', id: b.dataset.open })); });
  map.fitBounds(L.latLngBounds(R.places.map(p => p.ll)), { padding: [24, 24] });
  const hub = [54.078752, 54.911427];
  const rings = L.layerGroup([20, 40, 60].flatMap(r => [
    L.circle(hub, { radius: r * 1000, color: '#2A6464', weight: 1.4, dashArray: '7 6', fill: false, interactive: false }),
    L.tooltip({ permanent: true, direction: 'center', className: 'dlabel', interactive: false }).setLatLng([hub[0] + r / 111.2, hub[1]]).setContent(r + ' км')
  ]));
  $('#rings').addEventListener('change', e => e.target.checked ? rings.addTo(map) : map.removeLayer(rings));
  applyFilter();
  lockMap(true);
  addEventListener('resize', () => map.invalidateSize());
}
new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { initMap(); o.disconnect(); } }), { rootMargin: '600px 0px' }).observe(mapbox);
// на телефоне карта включается касанием и выключается, когда уходит с экрана
$('#maplock').addEventListener('click', () => lockMap(false));
$('#mapdone').addEventListener('click', () => lockMap(true));
new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) lockMap(true); }), { threshold: .15 }).observe(mapbox);
function applyFilter() {
  $$('button.chip', mf).forEach(b => { b.classList.toggle('off', !active.has(b.dataset.k)); b.classList.toggle('on', active.has(b.dataset.k) && active.size < R.layerOrder.length); });
  R.places.forEach(p => {
    const vis = p.L.some(k => active.has(k)), m = markers[p.id];
    if (m) { if (vis && !map.hasLayer(m)) m.addTo(map); if (!vis && map.hasLayer(m)) map.removeLayer(m); }
    $(`.mli[data-id="${p.id}"]`, mlist).classList.toggle('hide', !vis);
  });
}
$$('button.chip', mf).forEach(b => b.addEventListener('click', () => {
  const k = b.dataset.k;
  if (active.size === R.layerOrder.length) { active.clear(); active.add(k); }
  else if (active.has(k)) { active.delete(k); if (!active.size) R.layerOrder.forEach(x => active.add(x)); }
  else active.add(k);
  applyFilter();
}));
$('#allLayers').addEventListener('click', () => { R.layerOrder.forEach(x => active.add(x)); applyFilter(); });
// перелёт к месту; подпись открывается по таймеру, чтобы не зависеть от анимации
function flyOpen(p, z) {
  initMap();
  if (!map.hasLayer(markers[p.id])) { p.L.forEach(k => active.add(k)); applyFilter(); }
  map.flyTo(p.ll, z, { duration: touch ? .6 : .9 });
  clearTimeout(flyOpen.t); flyOpen.t = setTimeout(() => markers[p.id].openPopup(), touch ? 700 : 1000);
}
$$('.mli', mlist).forEach(b => b.addEventListener('click', () => {
  const p = place(b.dataset.id);
  $$('.mli', mlist).forEach(x => x.classList.toggle('on', x === b));
  if (small()) mapbox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  flyOpen(p, Math.max(map ? map.getZoom() : 9, 11));
}));

/* ---------- Пласты ---------- */
const placesOf = k => R.places.filter(p => p.L.includes(k));
$('#layers').innerHTML = R.layerOrder.map((k, i) => { const Ly = L_[k], n = placesOf(k).length; return `<button class="layer reveal${Ly.idea ? ' idea' : ''}" data-k="${k}" style="--pat:${pat(k, 6)};--c:${Ly.c};transition-delay:${(i % 5) * 60}ms"><div class="lt"><b>${Ly.code}</b></div><div class="li"><h3>${Ly.name}</h3><span>${Ly.age}</span><i>${k === 'rm' ? R.crafts.length + ' ремёсел по реестру' : n + ' ' + plural(n, 'место', 'места', 'мест')}</i></div></button>`; }).join('');
$$('.layer').forEach(b => b.addEventListener('click', () => show({ t: 'layer', k: b.dataset.k })));

/* ---------- Видео-полоса: грузится и играет только на экране ---------- */
(() => {
  const v = $('#vbVideo'); if (noVideo) return;
  new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { if (!v.src) { v.src = `${VID}hero2-${Q}.mp4`; v.load(); } const p = v.play(); if (p && p.catch) p.catch(() => {}); }
    else v.pause();
  }), { rootMargin: '200px 0px' }).observe($('#vband'));
})();

/* ---------- Перспективы ---------- */
const stCls = s => s === 'решено' ? 'done' : s === 'будут строить' || s === 'планируется' ? 'build' : 'idea';
$('#future').innerHTML = R.future.map((f, i) => `<div class="fut reveal" style="--pat:${pat(f.k, 4)};transition-delay:${(i % 3) * 70}ms"><span class="wn">${esc(f.when)}</span><h4>${esc(f.t)}</h4><p>${esc(f.d)}</p><span class="st ${stCls(f.s)}">${esc(f.s)}</span></div>`).join('');

/* ---------- Мероприятия и фильмы ---------- */
$('#cal').innerHTML = R.events.map(m => `<div class="mon"><div class="m">${m.m}</div>${m.items.map(([b, t, k]) => `<div class="ev" style="--c:${L_[k].c}"><b>${esc(b)}</b>${esc(t)}</div>`).join('')}</div>`).join('');
$('#calNote').textContent = R.eventsNote;
$('#films').innerHTML = R.films.map(f => `<div class="film"><div class="fp" style="--pat:${pat('kn', 5)}">${f.img ? `<img src="${IMG + f.img}" alt="${esc(f.n)}" loading="lazy" decoding="async">` : ''}</div><div class="fi"><b>${esc(f.n)}</b>${f.year ? `<span>${esc(f.year)}</span>` : ''}<p>${esc(f.note)}</p>${f.watch ? `<a class="btn btn-line btn-sm" href="${f.watch}" target="_blank" rel="noopener">Смотреть</a>` : ''}</div></div>`).join('');

/* ---------- Мотивация и сервис ---------- */
$('#motiv').innerHTML = R.motiv.map(([k, b, t]) => `<li><i class="sw" style="--c:${L_[k].c};background:${pat(k, 3)}"></i><span><b>${b}:</b> ${t}</span></li>`).join('');
$('#serv').innerHTML = R.serv.map(([b, t]) => `<li><i class="sq"></i><span><b>${b}:</b> ${t}</span></li>`).join('');

/* ---------- Контакты с QR ---------- */
const qrSvg = url => {
  if (!window.qrcode) return '';
  const q = qrcode(0, 'M'); q.addData(url); q.make();
  const n = q.getModuleCount(), z = 3; let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) { if (!q.isDark(r, c)) continue; let len = 1; while (c + len < n && q.isDark(r, c + len)) len++; d += `M${c} ${r}h${len}v1.04h-${len}z`; c += len - 1; }
  return `<svg viewBox="${-z} ${-z} ${n + 2 * z} ${n + 2 * z}" role="img" aria-label="QR-код"><rect x="${-z}" y="${-z}" width="${n + 2 * z}" height="${n + 2 * z}" fill="#fff"/><path d="${d}" fill="#1F2B22"/></svg>`;
};
$('#contacts').innerHTML = R.contacts.map(c => `<div class="ct reveal"><a class="qr" href="${c.url}" target="_blank" rel="noopener">${qrSvg(c.url)}</a><b>${esc(c.n)}</b><span>${esc(c.s)}</span>${c.tel ? `<a class="tel" href="tel:${c.telHref}">${c.tel}</a>` : ''}<a class="btn btn-line btn-sm" href="${c.url}" target="_blank" rel="noopener" style="align-self:flex-start;margin-top:6px">Открыть</a></div>`).join('');
$('#sources').innerHTML = R.sources.map(([h, t]) => `<h4>${esc(h)}</h4><p>${esc(t)}</p>`).join('');

/* ---------- Панель места или пласта и кнопка «Назад» ----------
   Каждое открытие панели добавляет шаг в историю браузера: «Назад» на телефоне
   возвращает к предыдущей панели или закрывает её, страница остаётся на месте. */
const drawer = $('#drawer'), din = $('#drawerIn'), scrim = $('#scrim'), dbar = $('#dbar');
let depth = 0, lastFocus = null;
const hashOf = v => v.t === 'place' ? '#mesto/' + v.id : '#plast/' + v.k;
const para = ([h, t]) => `<h4>${esc(h)}</h4><p>${esc(t)}</p>`;
const mainImg = (im, alt) => { const t = imgType(im); const cls = t === 'drawing' || t === 'scheme' || t === 'tall' ? 'contain' : calm ? '' : 'kb'; const pos = t === 'portrait' ? 'object-position:50% 25%' : ''; return `<img class="${cls}" src="${IMG + im[0]}" alt="${esc(alt)}" style="${pos}"><span class="cap">${esc(im[1])}</span>`; };
const headVideo = p => `<video src="${VID}${p.video[0]}-${Q}.mp4" poster="${VID}${p.video[0]}-poster.jpg" muted playsinline loop autoplay preload="auto"></video><span class="cap">${esc(p.n)} с дрона · видео туристического портала Альшеевского района</span>`;
function renderPlace(p) {
  const imgs = p.img || [], film = p.film && R.films.find(f => f.id === p.film);
  const head = p.video && !noVideo ? headVideo(p) : imgs.length ? mainImg(imgs[0], p.n) : '';
  const thumbs = (p.video && !noVideo ? [['__video']] : []).concat(imgs);
  din.innerHTML = `
    <div class="dw-ph" id="dwPh" style="--pat:${pat(p.L[0], 6)}">${head}</div>
    <div class="dw">
      <div class="wh">${esc(p.where)} · ${R.districts[p.d]}</div>
      <p class="hk">${esc(p.hook)}</p>
      <h2 id="drawerTitle">${esc(p.n)}</h2>
      ${chips(p.L)}
      ${p.lead ? `<p class="lead">${esc(p.lead)}</p>` : ''}
      ${thumbs.length > 1 ? `<div class="gal">${thumbs.map((im, i) => `<button data-i="${i}" class="${i ? '' : 'on'}" aria-label="${im[0] === '__video' ? 'Видео' : 'Фото ' + i}">${im[0] === '__video' ? `<img src="${VID}${p.video[0]}-poster.jpg" alt="">` : `<img src="${IMG + im[0]}" alt="" loading="lazy">`}</button>`).join('')}</div>` : ''}
      ${p.story ? `<div class="story">${p.story.map(para).join('')}</div>` : ''}
      ${p.list ? `<div class="blk"><span class="lab">${esc(p.listTitle || '')}</span><ul class="blist">${p.list.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
      ${p.legend ? `<div class="blk box-legend"><span class="lab">Легенда</span>${esc(p.legend)}</div>` : ''}
      ${p.events ? `<div class="blk box-ev"><span class="lab">Какие мероприятия проводят</span><ul>${p.events.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
      ${p.next ? `<div class="blk box-plan"><span class="lab">Перспективы</span>${esc(p.next)}</div>` : ''}
      ${film ? `<div class="blk"><span class="lab">Кино</span><div class="links"><span style="font-size:16px;color:var(--ink2)">Фильм ${esc(film.n)}${film.year ? ', ' + esc(film.year) : ''}.</span>${film.watch ? `<a class="btn btn-line btn-sm" href="${film.watch}" target="_blank" rel="noopener">Смотреть</a>` : ''}</div></div>` : ''}
      <div class="blk links"><button class="btn btn-ink btn-sm" data-map="${p.id}">Показать на карте</button></div>
      <p class="src">Источники: ${esc(p.src)}</p>
    </div>`;
  $('#dbarTitle').textContent = p.n;
  $$('.gal button', din).forEach(b => b.addEventListener('click', () => {
    $$('.gal button', din).forEach(x => x.classList.toggle('on', x === b));
    const im = thumbs[+b.dataset.i];
    $('#dwPh').innerHTML = im[0] === '__video' ? headVideo(p) : mainImg(im, p.n);
  }));
  $('[data-map]', din).addEventListener('click', () => showOnMap(p.id));
}
function renderLayer(k) {
  const Ly = L_[k], ps = placesOf(k);
  let extra = '';
  if (k === 'kn') extra = `<div class="blk"><span class="lab">Фильмы</span><div class="notes">${R.films.map(f => `<div class="nt"><div><b>${esc(f.n)}${f.year ? ', ' + esc(f.year) : ''}</b>${esc(f.note)}${f.watch ? ` <a href="${f.watch}" target="_blank" rel="noopener">Смотреть</a>` : ''}</div></div>`).join('')}</div></div>
    <div class="blk box-ev"><span class="lab">Какие мероприятия проводят</span><ul>${R.events.flatMap(m => m.items.map(([b, t]) => `<li><b>${esc(m.m)}:</b> ${esc(b)}, ${esc(t)}</li>`)).join('')}</ul></div>`;
  if (k === 'rm') extra = `<div class="blk"><img src="${IMG}motivy-logo.png" alt="Альшеевские мотивы" style="width:min(340px,100%)"></div><div class="blk"><span class="lab">Ремёсла по реестру мастеров района</span><div class="crafts">${R.crafts.map(c => `<div><i class="sw" style="background:${pat('rm', 3)}"></i>${esc(c)}</div>`).join('')}</div></div>`;
  if (k === 'sb') extra = `<div class="blk"><span class="lab">Сервис</span><ul class="blist">${R.serv.map(([b, t]) => `<li><b>${esc(b)}:</b> ${esc(t)}</li>`).join('')}</ul></div>`;
  din.innerHTML = `
    <div class="lhead" style="--pat:${pat(k, 8)}"></div>
    <div class="dw">
      <div class="wh">Пласт · ${esc(Ly.age)}</div>
      <p class="hk" id="drawerTitle" style="color:${Ly.c}">${esc(Ly.name)}</p>
      <p class="lead">${esc(Ly.lead)}</p>
      ${ps.length ? `<div class="blk"><span class="lab">Места пласта</span><div class="links">${ps.map(p => `<button class="btn btn-line btn-sm" data-place="${p.id}">${esc(p.n)}</button>`).join('')}</div></div>` : ''}
      ${Ly.people ? `<div class="blk"><span class="lab">Люди</span><div class="ppl">${Ly.people.map(([n, t, im]) => `<div class="pp">${im ? `<img src="${IMG + im}" alt="${esc(n)}" loading="lazy">` : ''}<div style="${im ? '' : 'grid-column:1/-1'}"><b>${esc(n)}</b>${esc(t)}</div></div>`).join('')}</div></div>` : ''}
      ${Ly.notes ? `<div class="blk notes">${Ly.notes.map(([h, t, im, cap]) => `<div class="nt">${im ? `<img src="${IMG + im}" alt="${esc(h)}" loading="lazy">` : ''}<div><b>${esc(h)}</b>${esc(t)}${cap ? `<i>${esc(cap)}</i>` : ''}</div></div>`).join('')}</div>` : ''}
      ${extra}
    </div>`;
  $('#dbarTitle').textContent = Ly.name;
  $$('[data-place]', din).forEach(b => b.addEventListener('click', () => show({ t: 'place', id: b.dataset.place })));
}
const render = v => { if (v.t === 'place') { const p = place(v.id); if (!p) return false; renderPlace(p); } else { if (!L_[v.k]) return false; renderLayer(v.k); } din.scrollTop = 0; dbar.classList.remove('solid'); return true; };
const openUI = () => {
  if (!drawer.classList.contains('on')) lastFocus = document.activeElement;
  drawer.classList.add('on'); scrim.classList.add('on'); drawer.setAttribute('aria-hidden', 'false'); document.body.classList.add('lock');
  setTimeout(() => $('#drawerBack').focus({ preventScroll: true }), 60);
};
const closeUI = () => {
  if (!drawer.classList.contains('on')) return;
  drawer.classList.remove('on'); scrim.classList.remove('on'); drawer.setAttribute('aria-hidden', 'true');
  if (!sheet.classList.contains('open')) document.body.classList.remove('lock');
  $$('video', din).forEach(v => v.pause());
  setTimeout(() => { if (!drawer.classList.contains('on')) din.innerHTML = ''; }, 650);
  if (lastFocus) lastFocus.focus({ preventScroll: true });
};
function show(v) { if (!render(v)) return; depth++; history.pushState({ v, d: depth }, '', hashOf(v)); openUI(); }
const closeAll = () => { if (depth > 0) history.go(-depth); else closeUI(); };
addEventListener('popstate', e => {
  const st = e.state || {};
  if (sheet.classList.contains('open') && !st.menu) closeMenu();
  if (st.v) { depth = st.d || 1; render(st.v); openUI(); }
  else { depth = 0; closeUI(); }
});
$('#drawerBack').addEventListener('click', () => history.back());
$('#drawerClose').addEventListener('click', closeAll);
scrim.addEventListener('click', closeAll);
addEventListener('keydown', e => { if (e.key === 'Escape') { if (drawer.classList.contains('on')) closeAll(); else if (sheet.classList.contains('open')) history.back(); } });
din.addEventListener('scroll', () => dbar.classList.toggle('solid', din.scrollTop > (small() ? 160 : 260)), { passive: true });
function showOnMap(id) {
  const d = depth; if (d > 0) history.go(-d); else closeUI();
  setTimeout(() => { $('#karta').scrollIntoView({ behavior: calm ? 'auto' : 'smooth' }); setTimeout(() => flyOpen(place(id), 12), 700); }, 120);
}

/* ---------- Плавное появление ---------- */
const rev = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); rev.unobserve(e.target); } }), { rootMargin: '0px 0px -6% 0px' });
$$('.reveal').forEach(el => rev.observe(el));

/* ---------- Прямая ссылка: #mesto/deev, #plast/lt ---------- */
(() => {
  const m = location.hash.match(/^#(mesto|plast)\/([\w-]+)/);
  if (!m) return;
  history.replaceState(null, '', location.pathname + location.search);
  show(m[1] === 'mesto' ? { t: 'place', id: m[2] } : { t: 'layer', k: m[2] });
})();
})();

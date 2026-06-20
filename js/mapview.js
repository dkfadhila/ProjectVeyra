
import { WORLD_W, WORLD_H } from './map.js';

const ZONES = [
  { id: 'lunaris',     name: 'Lunaris Village',   x: 3200, y: 2400, kind: 'town',     desc: 'The moonlit village — heart of your soulbond.' },
  { id: 'azure_coast', name: 'Azure Coast',        x: 1100, y: 3700, kind: 'coast',    desc: 'White sands and salt-bitten cliffs to the south-west.' },
  { id: 'tide_reefs',  name: 'Tide Reefs',         x:  600, y: 4400, kind: 'water',    desc: 'Treacherous shoals where reef serpents nest.' },
  { id: 'sunken_tmpl', name: 'Sunken Temple',      x: 1400, y: 4500, kind: 'dungeon',  desc: 'A drowned shrine to a forgotten Soul Maiden.' },
  { id: 'moonpine',    name: 'Moonpine Woods',     x: 4900, y: 1500, kind: 'forest',   desc: 'Pale pines that glow under the second moon.' },
  { id: 'iron_pass',   name: 'Iron Pass',          x: 5600, y: 2800, kind: 'mountain', desc: 'A narrow road carved through rusted peaks.' },
];

const KIND_COLOR = {
  town:     '#ffd76b',
  coast:    '#7dd0ff',
  water:    '#60a8d0',
  dungeon:  '#c060ff',
  forest:   '#7be07b',
  mountain: '#d0a070',
};

let _root = null;     // overlay element while open
let _state = null;    // game state reference while open
let _zoom = 1;
let _pan = { x: 0, y: 0 };

const MIN_ZOOM = 0.6;
const MAX_ZOOM = 3.5;

export function isMapViewOpen() {
  return !!_root;
}

export function openMapView(state) {
  if (_root) return;
  _state = state;
  _zoom = 1;
  _pan = { x: 0, y: 0 };
  _root = buildOverlay();
  document.body.appendChild(_root);
  requestAnimationFrame(() => _root.classList.add('show'));
  document.addEventListener('keydown', onKey);
}

export function closeMapView() {
  if (!_root) return;
  document.removeEventListener('keydown', onKey);
  const el = _root;
  _root = null;
  _state = null;
  el.classList.remove('show');
  setTimeout(() => el.remove(), 220);
}

function onKey(e) {
  if (!_root) return;
  if (e.key === 'Escape' || e.key === 'n' || e.key === 'N') {
    e.preventDefault();
    closeMapView();
  } else if (e.key === '+' || e.key === '=') {
    e.preventDefault();
    setZoom(_zoom * 1.2);
  } else if (e.key === '-' || e.key === '_') {
    e.preventDefault();
    setZoom(_zoom / 1.2);
  } else if (e.key === '0') {
    e.preventDefault();
    _zoom = 1; _pan = { x: 0, y: 0 }; applyTransform();
  }
}

function setZoom(z) {
  _zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z));
  applyTransform();
}

function applyTransform() {
  if (!_root) return;
  const viewport = _root.querySelector('.mapview-viewport');
  const stage    = _root.querySelector('.mapview-stage');
  if (!viewport || !stage) return;
  stage.style.transform = `translate(${_pan.x}px, ${_pan.y}px) scale(${_zoom})`;
  const z = _root.querySelector('.mapview-zoom-readout');
  if (z) z.textContent = `${Math.round(_zoom * 100)}%`;
}

function buildOverlay() {
  const root = document.createElement('div');
  root.className = 'mapview-overlay';
  root.innerHTML = `
    <div class="mapview-backdrop"></div>
    <div class="mapview-frame">
      <div class="mapview-header">
        <h2>⚜ WORLD OF VEYRA ⚜</h2>
        <div class="mapview-subtitle">Realm of the Soulbond</div>
        <button class="mapview-close" title="Close (Esc / N)">✕</button>
      </div>
      <div class="mapview-viewport">
        <div class="mapview-stage"></div>
      </div>
      <div class="mapview-controls">
        <button class="mapview-btn" data-act="zout" title="Zoom out (-)">－</button>
        <span class="mapview-zoom-readout">100%</span>
        <button class="mapview-btn" data-act="zin"  title="Zoom in (+)">＋</button>
        <button class="mapview-btn" data-act="rst"  title="Reset (0)">⟲</button>
        <span class="mapview-hint">drag to pan · scroll to zoom · Esc to close</span>
      </div>
    </div>
  `;

  const stage = root.querySelector('.mapview-stage');

  const img = document.createElement('img');
  img.className = 'mapview-bg';
  img.alt = 'World of Veyra';
  img.src = 'assets/map/world.png';
  img.draggable = false;
  stage.appendChild(img);

  for (const z of ZONES) {
    const m = document.createElement('button');
    m.className = 'mapview-marker';
    m.style.left = `${(z.x / WORLD_W) * 100}%`;
    m.style.top  = `${(z.y / WORLD_H) * 100}%`;
    m.style.setProperty('--kind-color', KIND_COLOR[z.kind] || '#fff');
    m.innerHTML = `
      <span class="mapview-marker-dot"></span>
      <span class="mapview-marker-label">${z.name}</span>
    `;
    m.title = `${z.name} — ${z.desc}`;
    m.addEventListener('click', () => showZoneTooltip(z));
    stage.appendChild(m);
  }

  if (_state && _state.player) {
    const p = document.createElement('div');
    p.className = 'mapview-player';
    p.style.left = `${(_state.player.x / WORLD_W) * 100}%`;
    p.style.top  = `${(_state.player.y / WORLD_H) * 100}%`;
    p.innerHTML = `
      <div class="mapview-player-pulse"></div>
      <div class="mapview-player-pin">▲</div>
      <div class="mapview-player-label">You — ${_state.player.name || ''}</div>
    `;
    stage.appendChild(p);
  }

  const tip = document.createElement('div');
  tip.className = 'mapview-tooltip';
  root.querySelector('.mapview-frame').appendChild(tip);

  root.querySelector('.mapview-close').addEventListener('click', closeMapView);
  root.querySelector('.mapview-backdrop').addEventListener('click', closeMapView);
  root.querySelectorAll('.mapview-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const a = btn.dataset.act;
      if (a === 'zin')  setZoom(_zoom * 1.25);
      if (a === 'zout') setZoom(_zoom / 1.25);
      if (a === 'rst')  { _zoom = 1; _pan = { x: 0, y: 0 }; applyTransform(); }
    });
  });

  const viewport = root.querySelector('.mapview-viewport');
  let dragging = false, sx = 0, sy = 0, ox = 0, oy = 0;
  viewport.addEventListener('mousedown', (e) => {
    if (e.target.closest('.mapview-marker')) return;
    dragging = true;
    sx = e.clientX; sy = e.clientY;
    ox = _pan.x;    oy = _pan.y;
    viewport.classList.add('dragging');
  });
  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    _pan.x = ox + (e.clientX - sx);
    _pan.y = oy + (e.clientY - sy);
    applyTransform();
  });
  window.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    viewport.classList.remove('dragging');
  });

  viewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    const rect = viewport.getBoundingClientRect();
    const mx = e.clientX - rect.left - rect.width / 2;
    const my = e.clientY - rect.top  - rect.height / 2;
    const prev = _zoom;
    const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, _zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15)));
    const k = next / prev;
    _pan.x = mx - k * (mx - _pan.x);
    _pan.y = my - k * (my - _pan.y);
    _zoom = next;
    applyTransform();
  }, { passive: false });

  function showZoneTooltip(z) {
    tip.innerHTML = `
      <div class="mapview-tip-name" style="color:${KIND_COLOR[z.kind] || '#fff'}">${z.name}</div>
      <div class="mapview-tip-kind">${z.kind.toUpperCase()}</div>
      <div class="mapview-tip-desc">${z.desc}</div>
    `;
    tip.classList.add('show');
    clearTimeout(showZoneTooltip._t);
    showZoneTooltip._t = setTimeout(() => tip.classList.remove('show'), 3500);
  }

  return root;
}

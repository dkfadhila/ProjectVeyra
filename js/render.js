



import { TILE_SIZE, BUILDINGS, INTERIORS } from './data.js';
import { WORLD_W, WORLD_H } from './map.js';





export const IMAGES = {
  ground: {},
  buildings: {},
  nature: {},
  npc: {},
  classes: {},
  overlays: {},
  monsters: {},
  furniture: {},
};


const PATTERNS = {};

export function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {

      console.warn('[render] failed to load', src);
      const fallback = new Image();
      fallback.width = 1;
      fallback.height = 1;
      resolve(fallback);
    };

    img.src = src + (src.includes('?') ? '&' : '?') + 'v=' + Date.now();
  });
}


const GROUND_KEYS = ['grass', 'path', 'water', 'sand', 'floor_wood', 'wall'];
const BUILDING_KEYS = ['inn', 'inn_basic', 'inn_medium', 'inn_luxury',
  'house_new1', 'house_new2', 'house_new3', 'house_new4',
  'tavern', 'mercen', 'bm'];
const TREE_KEYS = Array.from({ length: 11 }, (_, i) => `tree${i}`);
const ROCK_KEYS = Array.from({ length: 6 }, (_, i) => `rock${i + 1}`);
const GRASS_TUFT_KEYS = ['grass_tuft0', 'grass_tuft1', 'grass_tuft2'];
const GRAVEL_KEYS = ['gravel0', 'gravel1', 'gravel2'];
const FLOWER_KEYS = ['flower_red', 'flower_yellow', 'flower_blue', 'flower_white', 'flower_purple'];
const CLASS_KEYS = ['knight', 'ranger', 'mage', 'alchemist', 'merchant'];




const PENDING_LOADS = new Set();

function lazyLoad(bucket, key, path) {
  if (IMAGES[bucket][key] || PENDING_LOADS.has(path)) return null;
  PENDING_LOADS.add(path);
  loadImage(path).then((img) => {
    IMAGES[bucket][key] = img;
    PENDING_LOADS.delete(path);
  });
  return null;
}





let _canvas = null;
let _ctx = null;
let _time = 0;

export async function initRenderer(canvas) {
  _canvas = canvas;
  _ctx = canvas.getContext('2d');
  _ctx.imageSmoothingEnabled = false;


  const ro = new ResizeObserver(() => {
    _ctx.imageSmoothingEnabled = false;
  });
  ro.observe(canvas);


  const jobs = [];

  for (const k of GROUND_KEYS) {
    jobs.push(loadImage(`assets/ground/${k}.png`).then((img) => { IMAGES.ground[k] = img; }));
  }
  for (const k of BUILDING_KEYS) {
    jobs.push(loadImage(`assets/buildings/${k}.png`).then((img) => { IMAGES.buildings[k] = img; }));
  }
  for (const k of TREE_KEYS) {
    jobs.push(loadImage(`assets/nature/${k}.png`).then((img) => { IMAGES.nature[k] = img; }));
  }
  for (const k of ROCK_KEYS) {
    jobs.push(loadImage(`assets/nature/${k}.png`).then((img) => { IMAGES.nature[k] = img; }));
  }
  for (const k of GRASS_TUFT_KEYS) {
    jobs.push(loadImage(`assets/nature/${k}.png`).then((img) => { IMAGES.nature[k] = img; }));
  }
  for (const k of GRAVEL_KEYS) {
    jobs.push(loadImage(`assets/nature/${k}.png`).then((img) => { IMAGES.nature[k] = img; }));
  }
  for (const k of FLOWER_KEYS) {
    jobs.push(loadImage(`assets/nature/${k}.png`).then((img) => { IMAGES.nature[k] = img; }));
  }
  jobs.push(loadImage('assets/nature/fountain.png').then((img) => { IMAGES.nature.fountain = img; }));
  for (const k of CLASS_KEYS) {
    jobs.push(loadImage(`assets/sprites/classes/${k}.png`).then((img) => { IMAGES.classes[k] = img; }));
  }

  await Promise.all(jobs);
  return IMAGES;
}





const CAMERA_ZOOM = 2;

function computeCamera(state) {
  const cw = _canvas.width / CAMERA_ZOOM;
  const ch = _canvas.height / CAMERA_ZOOM;
  const px = state.player ? state.player.x : WORLD_W / 2;
  const py = state.player ? state.player.y : WORLD_H / 2;

  let camX = px - cw / 2;
  let camY = py - ch / 2;

  camX = Math.max(0, Math.min(camX, WORLD_W - cw));
  camY = Math.max(0, Math.min(camY, WORLD_H - ch));
  if (WORLD_W < cw) camX = (WORLD_W - cw) / 2;
  if (WORLD_H < ch) camY = (WORLD_H - ch) / 2;

  return { camX, camY };
}





function getPattern(key, img) {
  if (!img || !img.width) return null;
  if (PATTERNS[key]) return PATTERNS[key];
  const p = _ctx.createPattern(img, 'repeat');
  PATTERNS[key] = p;
  return p;
}

function fillPattern(ctx, key, img, x, y, w, h, offX = 0, offY = 0) {
  const pat = getPattern(key, img);
  if (!pat) {
    ctx.fillStyle = '#3a5a3a';
    ctx.fillRect(x, y, w, h);
    return;
  }
  ctx.save();
  ctx.translate(offX, offY);
  ctx.fillStyle = pat;
  ctx.fillRect(x - offX, y - offY, w, h);
  ctx.restore();
}





export function drawShadow(ctx, x, y, w) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(x, y, w * 0.45, w * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawHPBar(ctx, x, y, hp, maxHp) {
  const w = 36;
  const h = 4;
  const ratio = Math.max(0, Math.min(1, hp / Math.max(1, maxHp)));
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(x - w / 2 - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = '#5a1010';
  ctx.fillRect(x - w / 2, y, w, h);
  ctx.fillStyle = ratio > 0.5 ? '#48d048' : ratio > 0.25 ? '#e0c020' : '#e04040';
  ctx.fillRect(x - w / 2, y, w * ratio, h);
}

export function drawNameLabel(ctx, x, y, name) {
  if (!name) return;
  ctx.save();
  ctx.font = '11px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(0,0,0,0.85)';
  ctx.strokeText(name, x, y);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(name, x, y);
  ctx.restore();
}







const MINIMAP_SIZE = 140;
const MINIMAP_PAD  = 14;

export function getMinimapBounds() {
  if (!_canvas) return null;
  const r = MINIMAP_SIZE / 2;
  return {
    cx: _canvas.width - MINIMAP_PAD - r,
    cy: MINIMAP_PAD + r,
    r,
  };
}

export function drawMinimap(ctx, state) {
  const b = getMinimapBounds();
  if (!b) return;
  const { cx, cy, r } = b;
  const t = (state && state.time) || performance.now();

  ctx.save();


  const halo = ctx.createRadialGradient(cx, cy, r, cx, cy, r + 14);
  halo.addColorStop(0, 'rgba(0,0,0,0.55)');
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 14, 0, Math.PI * 2);
  ctx.fill();


  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();


  const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  bg.addColorStop(0, '#26331f');
  bg.addColorStop(1, '#0f1610');
  ctx.fillStyle = bg;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);




  const ZOOM = 0.045;
  const px = state.player ? state.player.x : WORLD_W / 2;
  const py = state.player ? state.player.y : WORLD_H / 2;
  const toMini = (wx, wy) => ({
    x: cx + (wx - px) * ZOOM,
    y: cy + (wy - py) * ZOOM,
  });
  const insideDisc = (x, y) => {
    const dx = x - cx, dy = y - cy;
    return dx * dx + dy * dy <= (r - 2) * (r - 2);
  };


  ctx.fillStyle = 'rgba(170,140,90,0.35)';
  for (const p of (state.paths || [])) {
    const a = toMini(p.x, p.y);
    const w = Math.max(1, p.w * ZOOM);
    const h = Math.max(1, p.h * ZOOM);
    ctx.fillRect(a.x, a.y, w, h);
  }


  ctx.fillStyle = 'rgba(80,170,220,0.6)';
  for (const w of (state.water || [])) {
    const a = toMini(w.x, w.y);
    ctx.fillRect(a.x, a.y, Math.max(2, w.w * ZOOM), Math.max(2, w.h * ZOOM));
  }


  ctx.fillStyle = '#a07a48';
  for (const bld of (state.buildings || [])) {
    const a = toMini(bld.x, bld.y);
    const w = Math.max(2, bld.w * ZOOM);
    const h = Math.max(2, bld.h * ZOOM);
    if (insideDisc(a.x + w / 2, a.y + h / 2)) ctx.fillRect(a.x, a.y, w, h);
  }


  ctx.fillStyle = '#60e0ff';
  for (const f of (state.fountains || [])) {
    const a = toMini(f.x + f.w / 2, f.y + f.h / 2);
    if (insideDisc(a.x, a.y)) {
      ctx.beginPath();
      ctx.arc(a.x, a.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }


  ctx.fillStyle = '#7dd0ff';
  for (const n of (state.npcs || [])) {
    const a = toMini(n.x, n.y);
    if (!insideDisc(a.x, a.y)) continue;
    ctx.beginPath();
    ctx.arc(a.x, a.y, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }


  for (const m of (state.monsters || [])) {
    if (!m.alive) continue;
    const a = toMini(m.x, m.y);
    if (!insideDisc(a.x, a.y)) continue;
    ctx.fillStyle = '#ff6464';
    ctx.beginPath();
    ctx.arc(a.x, a.y, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }


  const pulse = 0.55 + 0.45 * Math.sin(t / 320);
  ctx.fillStyle = `rgba(255,224,80,${0.35 * pulse})`;
  ctx.beginPath();
  ctx.arc(cx, cy, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffe040';
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fill();


  if (state.player) {
    const dirVec = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[state.player.dir] || [0, 1];
    ctx.strokeStyle = '#fff5b0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + dirVec[0] * 7, cy + dirVec[1] * 7);
    ctx.stroke();
  }

  ctx.restore();


  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(0,0,0,0.85)';
  ctx.beginPath(); ctx.arc(cx, cy, r + 1, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#c9a043';
  ctx.beginPath(); ctx.arc(cx, cy, r - 0.5, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255,220,120,0.45)';
  ctx.beginPath(); ctx.arc(cx, cy, r - 4, 0, Math.PI * 2); ctx.stroke();


  ctx.fillStyle = '#f0d080';
  ctx.font = 'bold 10px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('N', cx, cy - r + 8);


  ctx.fillStyle = 'rgba(255,220,120,0.85)';
  ctx.font = '8px "Press Start 2P", monospace';
  ctx.fillText('[ N · MAP ]', cx, cy + r + 10);

  ctx.restore();
}







const LPC_FRAME = 64;
const LPC_WALK_ROW = { up: 8, left: 9, down: 10, right: 11 };

function drawLpcSprite(ctx, img, dx, dy, dir = 'down', frame = 0) {
  if (!img || !img.width) return;
  const row = LPC_WALK_ROW[dir] ?? 10;
  const col = Math.max(0, Math.min(8, frame | 0));
  const sx = col * LPC_FRAME;
  const sy = row * LPC_FRAME;
  if (sx + LPC_FRAME > img.width || sy + LPC_FRAME > img.height) return;
  ctx.drawImage(img, sx, sy, LPC_FRAME, LPC_FRAME, dx, dy, LPC_FRAME, LPC_FRAME);
}







const TUX_SRC_W = 16;
const TUX_SRC_H = 32;
const TUX_DST_W = 64;
const TUX_DST_H = 64;
function drawTuxemonNpc(ctx, img, dx, dy, t) {
  if (!img || !img.width) return;
  ctx.drawImage(
    img,
    0, 0, TUX_SRC_W, TUX_SRC_H,
    dx, dy + 64 - TUX_DST_H, TUX_DST_W, TUX_DST_H
  );
}





function drawGroundBackground(ctx, state, camX, camY) {
  const cw = _canvas.width;
  const ch = _canvas.height;

  fillPattern(ctx, 'grass', IMAGES.ground.grass, 0, 0, cw, ch, -camX, -camY);
}

function drawPaths(ctx, state, camX, camY) {
  const paths = state.paths || [];
  for (const p of paths) {
    fillPattern(ctx, 'path', IMAGES.ground.path,
      p.x - camX, p.y - camY, p.w, p.h, -camX, -camY);
  }
}

function drawWater(ctx, state, camX, camY, t) {
  const waters = state.water || state.waters || [];
  if (!waters.length) return;
  const wobble = Math.sin(t / 600) * 2;
  for (const w of waters) {
    fillPattern(ctx, 'water', IMAGES.ground.water,
      w.x - camX, w.y - camY, w.w, w.h,
      -camX + wobble, -camY + (t / 40) % TILE_SIZE);
  }
}

function drawFarms(ctx, state, camX, camY) {
  const farms = state.farms || [];
  for (const f of farms) {
    ctx.save();
    ctx.fillStyle = 'rgba(80,140,60,0.55)';
    ctx.fillRect(f.x - camX, f.y - camY, f.w, f.h);

    ctx.strokeStyle = 'rgba(40,80,30,0.6)';
    ctx.lineWidth = 1;
    const rowH = TILE_SIZE;
    for (let yy = f.y + rowH; yy < f.y + f.h; yy += rowH) {
      ctx.beginPath();
      ctx.moveTo(f.x - camX, yy - camY + 0.5);
      ctx.lineTo(f.x + f.w - camX, yy - camY + 0.5);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawFences(ctx, state, camX, camY) {
  const fences = state.fences || [];
  ctx.save();
  ctx.strokeStyle = '#6b4a25';
  ctx.lineWidth = 1;
  for (const f of fences) {
    const isRect = f.w !== undefined;
    if (isRect) {
      if (f.h <= 1) {
        ctx.beginPath();
        ctx.moveTo(f.x - camX, f.y - camY + 0.5);
        ctx.lineTo(f.x + f.w - camX, f.y - camY + 0.5);
        ctx.stroke();
      } else if (f.w <= 1) {
        ctx.beginPath();
        ctx.moveTo(f.x - camX + 0.5, f.y - camY);
        ctx.lineTo(f.x - camX + 0.5, f.y + f.h - camY);
        ctx.stroke();
      } else {
        ctx.strokeRect(f.x - camX + 0.5, f.y - camY + 0.5, f.w - 1, f.h - 1);
      }
    } else {
      ctx.beginPath();
      ctx.moveTo(f.x1 - camX, f.y1 - camY);
      ctx.lineTo(f.x2 - camX, f.y2 - camY);
      ctx.stroke();
    }
  }
  ctx.restore();
}





function drawDecorations(ctx, state, camX, camY, t) {
  const cw = _canvas.width;
  const ch = _canvas.height;
  const scale = 2;

  // Helper: skip items far outside the viewport.
  function vis(x, y, w, h) {
    return x + w > camX && x < camX + cw && y + h > camY && y < camY + ch;
  }


  for (const g of (state.gravel || [])) {
    const img = IMAGES.nature[g.sprite || 'gravel0'];
    if (!img || !img.width) continue;
    const w = img.width * scale, h = img.height * scale;
    if (!vis(g.x, g.y, w, h)) continue;
    ctx.drawImage(img, g.x - camX, g.y - camY, w, h);
  }


  for (const g of (state.grassTufts || [])) {
    const img = IMAGES.nature[g.sprite || 'grass_tuft0'];
    if (!img || !img.width) continue;
    const w = img.width * scale, h = img.height * scale;
    if (!vis(g.x, g.y, w, h)) continue;

    const sway = Math.sin(t / 900 + g.x * 0.01) * 1.5;
    ctx.drawImage(img, g.x - camX + sway, g.y - camY, w, h);
  }


  for (const f of (state.flowers || [])) {
    const img = IMAGES.nature[f.sprite || 'flower_red'];
    if (!img || !img.width) continue;
    const w = img.width * scale, h = img.height * scale;
    if (!vis(f.x, f.y, w, h)) continue;
    const bob = Math.sin(t / 700 + f.y * 0.02) * 1;
    ctx.drawImage(img, f.x - camX, f.y - camY + bob, w, h);
  }
}





function collectEntities(state) {
  const out = [];

  for (const b of (state.buildings || [])) {
    out.push({ kind: 'building', ref: b, x: b.x, y: b.y, w: b.w, h: b.h, sortY: b.y + b.h });
  }
  for (const t of (state.trees || [])) {
    const w = t.w || 64;
    const h = t.h || 96;
    out.push({ kind: 'tree', ref: t, x: t.x, y: t.y, w, h, sortY: t.y + h });
  }
  for (const r of (state.rocks || [])) {
    const w = r.w || 48;
    const h = r.h || 48;
    out.push({ kind: 'rock', ref: r, x: r.x, y: r.y, w, h, sortY: r.y + h });
  }
  for (const f of (state.fountains || [])) {
    out.push({ kind: 'fountain', ref: f, x: f.x, y: f.y, w: f.w || 96, h: f.h || 96, sortY: f.y + (f.h || 96) });
  }
  for (const n of (state.npcs || [])) {
    out.push({ kind: 'npc', ref: n, x: n.x, y: n.y, w: 64, h: 64, sortY: n.y + 64 });
  }
  for (const m of (state.monsters || [])) {
    out.push({ kind: 'monster', ref: m, x: m.x, y: m.y, w: 48, h: 48, sortY: m.y + 48 });
  }
  if (state.player) {
    out.push({ kind: 'player', ref: state.player, x: state.player.x, y: state.player.y, w: 64, h: 64, sortY: state.player.y + 64 });
  }

  out.sort((a, b) => a.sortY - b.sortY);
  return out;
}

function drawBuilding(ctx, b, camX, camY) {
  const key = b.sprite || b.type || b.id;
  const img = IMAGES.buildings[key];
  const isAnimated = img && img.width && img.width > img.height * 1.5;
  const frames = isAnimated ? 4 : 1;
  const fw = isAnimated ? img.width / frames : (img ? img.width : 0);
  const fh = img && img.height ? img.height : 0;
  const sw = isAnimated ? fw : (img && img.width ? img.width : (b.w || 96));
  const sh = fh || (b.h || 96);

  const dx = b.x - camX + (b.w - sw) / 2;
  const dy = b.y - camY + (b.h - sh);
  drawShadow(ctx, b.x - camX + b.w / 2, b.y - camY + b.h - 4, sw * 0.6);
  if (img && img.width) {
    if (isAnimated) {
      const frame = Math.floor(_time / 400) % frames;
      ctx.drawImage(img, frame * fw, 0, fw, fh, dx, dy, sw, sh);
    } else {
      ctx.drawImage(img, dx, dy, sw, sh);
    }
  } else {
    ctx.fillStyle = '#6a4a30';
    ctx.fillRect(dx, dy, sw, sh);
    ctx.fillStyle = '#3a2a18';
    ctx.fillRect(dx, dy, sw, 12);
  }
}

function drawTree(ctx, t, camX, camY) {
  const key = t.sprite || `tree${(t.variant ?? 0) % 11}`;
  const img = IMAGES.nature[key];

  const scale = 2;
  const w = img && img.width ? img.width * scale : (t.w || 64);
  const h = img && img.height ? img.height * scale : (t.h || 96);
  drawShadow(ctx, t.x - camX + w / 2, t.y - camY + h - 6, w * 0.55);
  if (img && img.width) {
    ctx.drawImage(img, t.x - camX, t.y - camY, w, h);
  } else {
    ctx.fillStyle = '#2d5a2d';
    ctx.beginPath();
    ctx.arc(t.x - camX + w / 2, t.y - camY + h * 0.35, w * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(t.x - camX + w * 0.42, t.y - camY + h * 0.6, w * 0.16, h * 0.35);
  }
}

function drawRock(ctx, r, camX, camY) {
  const key = r.sprite || `rock${((r.variant ?? 0) % 6) + 1}`;
  const img = IMAGES.nature[key];

  const scale = 2;
  const w = img && img.width ? img.width * scale : (r.w || 48);
  const h = img && img.height ? img.height * scale : (r.h || 48);

  drawShadow(ctx, r.x - camX + w / 2, r.y - camY + h - 2, w * 0.55);
  if (img && img.width) {
    ctx.drawImage(img, r.x - camX, r.y - camY, w, h);
  } else {
    ctx.fillStyle = '#8a8a8a';
    ctx.beginPath();
    ctx.ellipse(r.x - camX + w / 2, r.y - camY + h / 2, w * 0.45, h * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFountain(ctx, f, camX, camY, t) {
  const img = IMAGES.nature.fountain;
  const scale = 2;
  const imgW = img && img.width ? img.width * scale : 256;
  const imgH = img && img.height ? img.height * scale : 192;
  const cx = f.x - camX + (f.w || 96) / 2;
  const botY = f.y - camY + (f.h || 96);


  const dx = cx - imgW / 2;
  const dy = botY - imgH;

  ctx.save();


  drawShadow(ctx, cx, botY - 4, imgW * 0.6);


  if (img && img.width) {
    ctx.drawImage(img, dx, dy, imgW, imgH);
  }


  const shimmer = 0.15 + 0.1 * Math.sin(t / 400);
  ctx.fillStyle = `rgba(100, 200, 255, ${shimmer})`;
  ctx.beginPath();
  ctx.ellipse(cx, dy + imgH * 0.7, imgW * 0.28, imgH * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();


  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + t / 600;
    const dist = imgW * 0.1 + Math.sin(t / 250 + i * 1.4) * imgW * 0.06;
    const height = imgH * 0.25 + Math.sin(t / 180 + i * 0.9) * imgH * 0.1;
    const px = cx + Math.cos(angle) * dist;
    const py = dy + imgH * 0.35 - height;
    const alpha = 0.35 + 0.3 * Math.sin(t / 160 + i * 2.3);
    ctx.fillStyle = `rgba(180, 225, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(px, py, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }


  for (let ring = 0; ring < 3; ring++) {
    const phase = (t / 500 + ring * 0.7) % (Math.PI * 2);
    const expand = (phase / (Math.PI * 2)) * imgW * 0.25;
    const alpha = 0.3 * (1 - phase / (Math.PI * 2));
    if (alpha <= 0) continue;
    ctx.strokeStyle = `rgba(120, 200, 255, ${alpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(cx, dy + imgH * 0.7, expand, expand * 0.35, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}




const MAIDEN_IDLE_MS = 600;
const MAIDEN_SCALE = 1;
function drawMaidenNpc(ctx, img, dx, dy, t) {
  if (!img || !img.width) return;
  const frames = 4;
  const fw = Math.floor(img.width / frames);
  const fh = img.height;
  const frame = Math.floor(t / MAIDEN_IDLE_MS) % frames;
  const sx = frame * fw;
  const dw = fw * MAIDEN_SCALE;
  const dh = fh * MAIDEN_SCALE;
  ctx.drawImage(
    img,
    sx, 0, fw, fh,
    dx + 32 - dw / 2, dy + 64 - dh, dw, dh
  );
}

function drawNpc(ctx, n, camX, camY, t) {
  const key = n.sprite || n.id || n.name || 'npc';
  if (!IMAGES.npc[key]) {
    lazyLoad('npc', key, `assets/npc/${key}.png`);
  }
  const img = IMAGES.npc[key];
  const dx = n.x - camX - 32;
  const dy = n.y - camY - 48;
  drawShadow(ctx, n.x - camX, n.y - camY + 14, 44);
  if (img && img.width) {
    if (img.width >= img.height * 3) {
      drawMaidenNpc(ctx, img, dx, dy, t);
    } else if (img.width <= 48 && img.height <= 128) {
      drawTuxemonNpc(ctx, img, dx, dy, t);
    } else {
      const dw = img.width;
      const dh = img.height;
      ctx.drawImage(img, dx + 32 - dw / 2, dy + 64 - dh, dw, dh);
    }
  } else {
    ctx.fillStyle = '#c08040';
    ctx.fillRect(dx, dy, 64, 64);
  }
  drawNameLabel(ctx, n.x - camX, n.y - camY - 50, n.name || key);
}

function drawMonster(ctx, m, camX, camY) {
  const key = m.sprite || m.id || m.name;
  if (key && !IMAGES.monsters[key]) {
    lazyLoad('monsters', key, `assets/monsters/${key}.png`);
  }
  const img = IMAGES.monsters[key];
  const size = 48;
  const dx = m.x - camX - size / 2;
  const dy = m.y - camY - size / 2;
  drawShadow(ctx, m.x - camX, m.y - camY + size / 2 - 2, size);
  if (img && img.width) {
    ctx.drawImage(img, dx, dy, size, size);
  } else {
    ctx.fillStyle = '#a040a0';
    ctx.fillRect(dx, dy, size, size);
  }
  if (m.hp !== undefined) {
    drawHPBar(ctx, m.x - camX, dy - 8, m.hp, m.maxHp ?? m.hp);
  }
}

function drawPlayer(ctx, p, camX, camY, t) {
  const cls = p.sprite || p.classId || p.class || 'knight';
  const body = IMAGES.classes[cls];
  const dx = p.x - camX - 32;
  const dy = p.y - camY - 48;

  const moving = !!p.moving;
  const dir = p.dir || p.direction || 'down';
  const frame = moving ? Math.floor(t / 100) % 9 : 0;

  drawShadow(ctx, p.x - camX, p.y - camY + 14, 44);

  drawLpcSprite(ctx, body, dx, dy, dir, frame);

  for (const slot of ['armor', 'hair', 'weapon']) {
    const id = p[slot];
    if (!id) continue;
    const key = `${slot}:${id}`;
    if (!IMAGES.overlays[key]) {
      lazyLoad('overlays', key, `assets/sprites/classes/${id}.png`);
    }
    drawLpcSprite(ctx, IMAGES.overlays[key], dx, dy, dir, frame);
  }


  drawNameLabel(ctx, p.x - camX, p.y - camY - 44, p.name || 'You');
  if (p.hp !== undefined) {
    drawHPBar(ctx, p.x - camX, p.y - camY - 32, p.hp, p.maxHp ?? p.hp);
  }
}





function drawRoofOverlays(ctx, state, camX, camY) {
  if (!state.player) return;
  const py = state.player.y;
  for (const b of (state.buildings || [])) {

    if (py < b.y + b.h * 0.6 &&
        state.player.x > b.x - 16 && state.player.x < b.x + b.w + 16 &&
        py > b.y - 32 && py < b.y + b.h) {
      const img = IMAGES.buildings[b.sprite || b.type || b.id];
      if (!img || !img.width) continue;
      const sw = img.width;
      const sh = img.height;
      const dx = b.x - camX + (b.w - sw) / 2;
      const dy = b.y - camY + (b.h - sh);
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.drawImage(img, 0, 0, sw, sh * 0.5,
                    dx, dy, sw, sh * 0.5);
      ctx.restore();
    }
  }
}





function drawVignette(ctx) {
  const cw = _canvas.width;
  const ch = _canvas.height;
  const g = ctx.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * 0.4,
                                     cw / 2, ch / 2, Math.max(cw, ch) * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cw, ch);
}





function renderInterior(ctx, state, t) {
  const cw = _canvas.width / CAMERA_ZOOM;
  const ch = _canvas.height / CAMERA_ZOOM;
  const interior = (INTERIORS && INTERIORS[state.interior]) || { w: cw, h: ch, furniture: [], exit: null };


  const iw = interior.w || cw;
  const ih = interior.h || ch;
  let camX = (state.player ? state.player.x : iw / 2) - cw / 2;
  let camY = (state.player ? state.player.y : ih / 2) - ch / 2;
  camX = Math.max(0, Math.min(camX, Math.max(0, iw - cw)));
  camY = Math.max(0, Math.min(camY, Math.max(0, ih - ch)));

  ctx.save();
  ctx.scale(CAMERA_ZOOM, CAMERA_ZOOM);

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, cw, ch);


  fillPattern(ctx, 'floor_wood', IMAGES.ground.floor_wood,
    -camX, -camY, iw, ih, -camX, -camY);


  const wallH = TILE_SIZE * 2;
  fillPattern(ctx, 'wall', IMAGES.ground.wall,
    -camX, -camY, iw, wallH, -camX, -camY);


  const furniture = interior.furniture || state.furniture || [];

  const items = furniture.map((f) => ({
    kind: 'furniture', ref: f, x: f.x, y: f.y, w: f.w || 48, h: f.h || 48,
    sortY: f.y + (f.h || 48),
  }));
  if (state.player) {
    items.push({ kind: 'player', ref: state.player, x: state.player.x, y: state.player.y,
                 w: 64, h: 64, sortY: state.player.y + 64 });
  }
  items.sort((a, b) => a.sortY - b.sortY);

  for (const it of items) {
    if (it.kind === 'furniture') {
      const f = it.ref;
      const key = f.sprite || f.id || f.type;
      if (key && !IMAGES.furniture[key]) {
        lazyLoad('furniture', key, `assets/furniture/${key}.png`);
      }
      const img = IMAGES.furniture[key];
      if (img && img.width) {
        ctx.drawImage(img, f.x - camX, f.y - camY, it.w, it.h);
      } else {
        ctx.fillStyle = '#7a5a3a';
        ctx.fillRect(f.x - camX, f.y - camY, it.w, it.h);
      }
    } else {
      drawPlayer(ctx, it.ref, camX, camY, t);
    }
  }


  const exit = interior.exit;
  if (exit) {
    const pulse = 0.5 + 0.5 * Math.sin(t / 250);
    ctx.save();
    ctx.fillStyle = `rgba(255, 220, 120, ${0.25 + 0.35 * pulse})`;
    ctx.fillRect(exit.x - camX, exit.y - camY, TILE_SIZE, TILE_SIZE);
    ctx.strokeStyle = `rgba(255, 240, 180, ${0.6 + 0.4 * pulse})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(exit.x - camX + 1, exit.y - camY + 1, TILE_SIZE - 2, TILE_SIZE - 2);
    ctx.restore();
  }

  ctx.restore();

  drawVignette(ctx);
  drawMinimap(ctx, state);
}





export function renderFrame(state) {
  if (!_ctx) return;
  const ctx = _ctx;
  const t = (state && state.time) || performance.now();
  _time = t;

  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, _canvas.width, _canvas.height);

  if (state.interior) {
    renderInterior(ctx, state, t);
    return;
  }

  const { camX, camY } = computeCamera(state);

  ctx.save();
  ctx.scale(CAMERA_ZOOM, CAMERA_ZOOM);

  drawGroundBackground(ctx, state, camX, camY);
  drawPaths(ctx, state, camX, camY);
  drawWater(ctx, state, camX, camY, t);
  drawFarms(ctx, state, camX, camY);
  drawFences(ctx, state, camX, camY);

  drawDecorations(ctx, state, camX, camY, t);

  const ents = collectEntities(state);
  for (const e of ents) {
    switch (e.kind) {
      case 'building': drawBuilding(ctx, e.ref, camX, camY); break;
      case 'tree':     drawTree(ctx, e.ref, camX, camY); break;
      case 'rock':     drawRock(ctx, e.ref, camX, camY); break;
      case 'fountain': drawFountain(ctx, e.ref, camX, camY, t); break;
      case 'npc':      drawNpc(ctx, e.ref, camX, camY, t); break;
      case 'monster':  drawMonster(ctx, e.ref, camX, camY); break;
      case 'player':   drawPlayer(ctx, e.ref, camX, camY, t); break;
    }
  }

  drawRoofOverlays(ctx, state, camX, camY);

  ctx.restore();

  drawVignette(ctx);
  drawMinimap(ctx, state);
}

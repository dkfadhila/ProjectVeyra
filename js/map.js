
import { BUILDINGS, NPC_LIST, MONSTERS, TILE_SIZE } from './data.js';

export const MAP_TILES_W = 200;
export const MAP_TILES_H = 150;
export const WORLD_W = MAP_TILES_W * TILE_SIZE; // 6400
export const WORLD_H = MAP_TILES_H * TILE_SIZE; // 4800

export const MAP_OBJECTS = [];
export const COLLISION_RECTS = [];

const PLAZA = { x0: 90, y0: 67, x1: 110, y1: 83 };
const PLAZA_CX = (PLAZA.x0 + PLAZA.x1) / 2; // 100
const PLAZA_CY = (PLAZA.y0 + PLAZA.y1) / 2; // 75

export const PLAYER_SPAWN = {
  x: PLAZA_CX * TILE_SIZE,
  y: (PLAZA_CY + 3) * TILE_SIZE,
};

const t2p = (n) => n * TILE_SIZE;

function makeRng(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rectsOverlap(a, b) {
  return !(a.x + a.w <= b.x || b.x + b.w <= a.x ||
           a.y + a.h <= b.y || b.y + b.h <= a.y);
}

function pointRectDist(px, py, r) {
  const dx = Math.max(r.x - px, 0, px - (r.x + r.w));
  const dy = Math.max(r.y - py, 0, py - (r.y + r.h));
  return Math.hypot(dx, dy);
}

const BUILDING_SIZE = {
  market:     [4, 4], inn_basic:  [4, 6],
  inn:        [5, 7], inn_medium: [4, 4], inn_luxury: [5, 7], blacksmith: [3, 3], fisher_hut: [3, 3],
  house1: [3, 4], house2: [3, 4], house3: [3, 3], house4: [3, 3],
  house5: [3, 4], house6: [3, 4], house7: [3, 3], house8: [3, 3],
  house9: [3, 4], house10: [3, 4],
  house_new1: [3, 4], house_new2: [3, 4], house_new3: [3, 4], house_new4: [3, 4],
};

const isHouse = (id) => /^house\d+|^house_new\d+$/.test(id);

const TOWN_ROWS = [
  { roadTileY: 72, startX: 58,  gap: 3, ids: ['market', 'inn_basic'] },     // west of plaza
  { roadTileY: 72, startX: 112, gap: 3, ids: ['inn', 'inn_medium', 'inn_luxury', 'blacksmith', 'house3'] },   // east of plaza
  { roadTileY: 38, startX: 60,  gap: 3, ids: ['house1', 'inn_basic', 'house7', 'house_new1'] },
  { roadTileY: 38, startX: 112, gap: 3, ids: ['house2', 'inn_medium', 'house8', 'house_new2'] },
  { roadTileY: 110, startX: 60,  gap: 3, ids: ['house4', 'inn', 'house9', 'house_new3'] },
  { roadTileY: 110, startX: 130, gap: 3, ids: ['house10', 'inn_luxury', 'house_new4'] },
];

const SOLO_BUILDINGS = [];

const ROAD_GAP_PX = 8;

function buildBuildingDefs() {
  const defs = [];
  const add = (id, tx, ty, offsetY = 0) => {
    const [tw, th] = BUILDING_SIZE[id] || [3, 3];
    defs.push({
      id, sprite: id, tx, ty, tw, th, offsetY,
      door: { dx: Math.floor(tw / 2), dy: th },
    });
  };
  for (const row of TOWN_ROWS) {
    let cx = row.startX;
    const roadPxY = row.roadTileY * TILE_SIZE;
    for (const id of row.ids) {
      const [tw, th] = BUILDING_SIZE[id] || [3, 3];
      const bottomPx = roadPxY - ROAD_GAP_PX;
      const topPx = bottomPx - th * TILE_SIZE;
      const ty = Math.floor(topPx / TILE_SIZE);
      const offsetY = topPx - ty * TILE_SIZE;
      add(id, cx, ty, offsetY);
      cx += tw + row.gap;
    }
  }
  for (const s of SOLO_BUILDINGS) add(s.id, s.tx, s.ty);
  return defs;
}

const BUILDING_DEFS = buildBuildingDefs();

const PATH_DEFS = [
  { tx: 98, ty: 6, tw: 4, th: 138 },
  { tx: 6, ty: 72, tw: 188, th: 4 },
  { tx: 40, ty: 38, tw: 120, th: 3 },
  { tx: 40, ty: 110, tw: 120, th: 3 },
  { tx: 50, ty: 38, tw: 3, th: 75 },
  { tx: 148, ty: 38, tw: 3, th: 75 },
  { tx: PLAZA.x0, ty: PLAZA.y0, tw: PLAZA.x1 - PLAZA.x0, th: PLAZA.y1 - PLAZA.y0 },
];

const WATER_DEFS = [];

const FARM_DEF = { tx: 14, ty: 60, tw: 10, th: 22 };

const NPC_PLACEMENTS = [
  { id: 'innkeeper',      sprite: 'barmaid',    anchor: { kind: 'door',  building: 'inn'        }, facing: 'down' },
  { id: 'innkeeper_north',  sprite: 'barmaid',    anchor: { kind: 'door',  building: 'inn_basic'  }, facing: 'down' },
  { id: 'innkeeper_north2', sprite: 'barmaid',    anchor: { kind: 'door',  building: 'inn_medium' }, facing: 'down' },
  { id: 'innkeeper_south',  sprite: 'barmaid',    anchor: { kind: 'door',  building: 'inn_luxury' }, facing: 'down' },
  { id: 'blacksmith', sprite: 'knight',     anchor: { kind: 'door',  building: 'blacksmith' }, facing: 'down' },
  { id: 'merchant',   sprite: 'shopkeeper', anchor: { kind: 'door',  building: 'market'     }, facing: 'down' },
  { id: 'farmer',     sprite: 'farmer',     anchor: { kind: 'point', tx: 18, ty: 66 },          facing: 'right' },
  { id: 'professor',  sprite: 'professor',  anchor: { kind: 'point', tx: PLAZA_CX + 4, ty: PLAZA_CY + 1 }, facing: 'left' },
  { id: 'lyra',       sprite: 'lyra',       anchor: { kind: 'point', tx: PLAZA_CX,     ty: PLAZA_CY + 4 }, facing: 'up' },
];

const MONSTER_SPAWNS = [
  { tx: 30,  ty: 4,   radius: 160, monsters: ['spectera', 'dollfin'] },   // north forest
  { tx: 194, ty: 75,  radius: 160, monsters: ['vulpyre', 'spectera'] },   // east forest
  { tx: 180, ty: 144, radius: 160, monsters: ['eruptibus', 'devidra'] },  // south-east forest
  { tx: 6,   ty: 130, radius: 160, monsters: ['vulpyre', 'dollfin'] },    // south-west forest
];

export function generateMap() {
  MAP_OBJECTS.length = 0;
  COLLISION_RECTS.length = 0;

  const rng = makeRng(0xC0FFEE); // deterministic scatter seed

  for (const p of PATH_DEFS) {
    MAP_OBJECTS.push({
      type: 'path',
      x: t2p(p.tx), y: t2p(p.ty),
      w: t2p(p.tw), h: t2p(p.th),
    });
  }

  for (const w of WATER_DEFS) {
    const rect = { x: t2p(w.tx), y: t2p(w.ty), w: t2p(w.tw), h: t2p(w.th) };
    MAP_OBJECTS.push({ type: 'water', ...rect });
    COLLISION_RECTS.push({ ...rect, source: 'water' });

    const x0 = w.tx - 1, y0 = w.ty - 1;
    const x1 = w.tx + w.tw, y1 = w.ty + w.th; // exclusive outer edge
    for (let tx = x0; tx <= x1; tx++) {
      for (let ty = y0; ty <= y1; ty++) {
        const onEdge = (tx === x0 || tx === x1 || ty === y0 || ty === y1);
        if (!onEdge) continue;
        let side;
        if (tx === x0 && ty === y0) side = 'tl';
        else if (tx === x1 && ty === y0) side = 'tr';
        else if (tx === x0 && ty === y1) side = 'bl';
        else if (tx === x1 && ty === y1) side = 'br';
        else if (ty === y0) side = 'top';
        else if (ty === y1) side = 'bottom';
        else if (tx === x0) side = 'left';
        else side = 'right';
        MAP_OBJECTS.push({
          type: 'pond_stone',
          x: t2p(tx), y: t2p(ty),
          sprite: `pond_stone_${side}`,
        });
      }
    }
  }

  {
    const fx = t2p(FARM_DEF.tx), fy = t2p(FARM_DEF.ty);
    const fw = t2p(FARM_DEF.tw), fh = t2p(FARM_DEF.th);
    MAP_OBJECTS.push({ type: 'farm', x: fx, y: fy, w: fw, h: fh });
  }

  const buildingRects = {}; // id -> pixel rect (+door), for NPC anchoring
  for (const b of BUILDING_DEFS) {
    const rect = { x: t2p(b.tx), y: t2p(b.ty) + (b.offsetY || 0), w: t2p(b.tw), h: t2p(b.th) };
    buildingRects[b.id] = { ...rect, door: b.door };
    MAP_OBJECTS.push({
      type: 'building',
      id: b.id,
      x: rect.x, y: rect.y, w: rect.w, h: rect.h,
      sprite: b.sprite,
      data: (BUILDINGS && BUILDINGS[b.id]) ? BUILDINGS[b.id] : null,
    });

    const doorPxX = t2p(b.tx + b.door.dx);
    if (b.door.dx > 0) {
      COLLISION_RECTS.push({ x: rect.x, y: rect.y, w: doorPxX - rect.x, h: rect.h, source: 'building', id: b.id });
    }
    const rightX = doorPxX + TILE_SIZE;
    if (rightX < rect.x + rect.w) {
      COLLISION_RECTS.push({ x: rightX, y: rect.y, w: rect.x + rect.w - rightX, h: rect.h, source: 'building', id: b.id });
    }
    COLLISION_RECTS.push({ x: doorPxX, y: rect.y, w: TILE_SIZE, h: rect.h - TILE_SIZE, source: 'building', id: b.id });

    if (isHouse(b.id)) {
      // fences removed — open yards
    }
  }

  const blockedRects = [
    ...PATH_DEFS.map(p => ({ x: t2p(p.tx), y: t2p(p.ty), w: t2p(p.tw), h: t2p(p.th) })),
    ...WATER_DEFS.map(w => ({ x: t2p(w.tx - 1), y: t2p(w.ty - 1), w: t2p(w.tw + 2), h: t2p(w.th + 2) })),
    { x: t2p(FARM_DEF.tx), y: t2p(FARM_DEF.ty), w: t2p(FARM_DEF.tw), h: t2p(FARM_DEF.th) },
    ...Object.values(buildingRects).map(r => ({ x: r.x - TILE_SIZE, y: r.y - TILE_SIZE, w: r.w + 2 * TILE_SIZE, h: r.h + 2 * TILE_SIZE })),
  ];

  function canPlaceTree(px, py, pad = 8) {
    const probe = { x: px - pad, y: py - pad, w: TILE_SIZE + 2 * pad, h: TILE_SIZE + 2 * pad };
    for (const r of blockedRects) if (rectsOverlap(probe, r)) return false;
    for (const o of MAP_OBJECTS) {
      if (o.type !== 'tree' && o.type !== 'rock') continue;
      const r = { x: o.x - 4, y: o.y - 4, w: TILE_SIZE + 8, h: TILE_SIZE + 8 };
      if (rectsOverlap(probe, r)) return false;
    }
    return true;
  }

  function inForestBorder(tx, ty) {
    return tx < 8 || tx > 192 || ty < 6 || ty > 144;
  }

  let placedBorder = 0;
  for (let attempt = 0; attempt < 2000 && placedBorder < 120; attempt++) {
    const tx = Math.floor(rng() * MAP_TILES_W);
    const ty = Math.floor(rng() * MAP_TILES_H);
    if (!inForestBorder(tx, ty)) continue;
    const px = t2p(tx), py = t2p(ty);
    if (!canPlaceTree(px, py, 4)) continue;
    const variant = Math.floor(rng() * 11);
    MAP_OBJECTS.push({ type: 'tree', x: px, y: py, sprite: `tree${variant}` });
    placedBorder++;
  }

  let placedInterior = 0;
  for (let attempt = 0; attempt < 1500 && placedInterior < 40; attempt++) {
    const tx = 10 + Math.floor(rng() * (MAP_TILES_W - 20));
    const ty = 8 + Math.floor(rng() * (MAP_TILES_H - 16));
    if (tx >= PLAZA.x0 - 1 && tx <= PLAZA.x1 && ty >= PLAZA.y0 - 1 && ty <= PLAZA.y1) continue;
    const px = t2p(tx), py = t2p(ty);
    if (!canPlaceTree(px, py, 12)) continue;
    const variant = Math.floor(rng() * 11);
    MAP_OBJECTS.push({ type: 'tree', x: px, y: py, sprite: `tree${variant}` });
    placedInterior++;
  }

  for (const o of MAP_OBJECTS) {
    if (o.type !== 'tree') continue;
    COLLISION_RECTS.push({
      x: o.x + 8, y: o.y + TILE_SIZE / 2,
      w: TILE_SIZE - 16, h: TILE_SIZE / 2,
      source: 'tree',
    });
  }

  let placedTufts = 0;
  for (let attempt = 0; attempt < 2000 && placedTufts < 80; attempt++) {
    const tx = 6 + Math.floor(rng() * (MAP_TILES_W - 12));
    const ty = 6 + Math.floor(rng() * (MAP_TILES_H - 12));
    const px = t2p(tx), py = t2p(ty);
    if (!canPlaceTree(px, py, 2)) continue;
    const variant = Math.floor(rng() * 3);
    MAP_OBJECTS.push({ type: 'grass_tuft', x: px, y: py, sprite: `grass_tuft${variant}` });
    placedTufts++;
  }

  const FLOWER_SPRITES = ['flower_red', 'flower_yellow', 'flower_blue', 'flower_white', 'flower_purple'];
  let placedFlowers = 0;
  for (let attempt = 0; attempt < 2200 && placedFlowers < 70; attempt++) {
    const tx = 6 + Math.floor(rng() * (MAP_TILES_W - 12));
    const ty = 6 + Math.floor(rng() * (MAP_TILES_H - 12));
    const px = t2p(tx), py = t2p(ty);
    if (!canPlaceTree(px, py, 2)) continue;
    const sprite = FLOWER_SPRITES[Math.floor(rng() * FLOWER_SPRITES.length)];
    MAP_OBJECTS.push({ type: 'flower', x: px, y: py, sprite });
    placedFlowers++;
  }

  let placedGravel = 0;
  for (let attempt = 0; attempt < 2000 && placedGravel < 48; attempt++) {
    const tx = 6 + Math.floor(rng() * (MAP_TILES_W - 12));
    const ty = 6 + Math.floor(rng() * (MAP_TILES_H - 12));
    const px = t2p(tx), py = t2p(ty);
    if (!canPlaceTree(px, py, 2)) continue;
    const variant = Math.floor(rng() * 3);
    MAP_OBJECTS.push({ type: 'gravel', x: px, y: py, sprite: `gravel${variant}` });
    placedGravel++;
  }

  const rockHotspots = [
    { tx: 142, ty: 90 }, { tx: 161, ty: 90 }, { tx: 150, ty: 106 }, // pond fringe
    { tx: 6, ty: 12 }, { tx: 194, ty: 18 }, { tx: 8, ty: 138 }, { tx: 192, ty: 140 }, // corners
    { tx: 30, ty: 6 }, { tx: 170, ty: 8 }, { tx: 6, ty: 80 }, { tx: 194, ty: 100 },
    { tx: 60, ty: 145 }, { tx: 120, ty: 146 }, { tx: 196, ty: 60 }, { tx: 4, ty: 50 }, { tx: 100, ty: 4 },
  ];
  for (let i = 0; i < rockHotspots.length; i++) {
    const h = rockHotspots[i];
    const jx = Math.floor(rng() * 3) - 1;
    const jy = Math.floor(rng() * 3) - 1;
    const tx = Math.max(0, Math.min(MAP_TILES_W - 1, h.tx + jx));
    const ty = Math.max(0, Math.min(MAP_TILES_H - 1, h.ty + jy));
    const px = t2p(tx), py = t2p(ty);
    if (!canPlaceTree(px, py, 4)) continue;
    const variant = 1 + Math.floor(rng() * 6);
    MAP_OBJECTS.push({ type: 'rock', x: px, y: py, sprite: `rock${variant}` });
    COLLISION_RECTS.push({ x: px + 4, y: py + 8, w: TILE_SIZE - 8, h: TILE_SIZE - 12, source: 'rock' });
  }

  const npcLookup = {};
  if (Array.isArray(NPC_LIST)) {
    for (const n of NPC_LIST) if (n && n.id) npcLookup[n.id] = n;
  }
  for (const np of NPC_PLACEMENTS) {
    let px, py;
    if (np.anchor.kind === 'door') {
      const b = buildingRects[np.anchor.building];
      if (!b) continue;
      px = b.x + b.door.dx * TILE_SIZE;
      py = b.y + b.door.dy * TILE_SIZE;
    } else {
      px = t2p(np.anchor.tx);
      py = t2p(np.anchor.ty);
    }
    MAP_OBJECTS.push({
      type: 'npc',
      id: np.id,
      x: px, y: py,
      sprite: np.sprite,
      facing: np.facing,
      data: npcLookup[np.id] || null,
    });
  }

  {
    const fSize = 3;
    const fx = PLAZA_CX * TILE_SIZE - Math.floor(fSize / 2) * TILE_SIZE;
    const fy = PLAZA_CY * TILE_SIZE - Math.floor(fSize / 2) * TILE_SIZE;
    const fw = TILE_SIZE * fSize;
    const fh = TILE_SIZE * fSize;
    MAP_OBJECTS.push({ type: 'fountain', x: fx, y: fy, w: fw, h: fh, sprite: 'fountain' });
    COLLISION_RECTS.push({ x: fx, y: fy, w: fw, h: fh, source: 'fountain' });
  }

  for (const m of MONSTER_SPAWNS) {
    MAP_OBJECTS.push({
      type: 'monster_spawn',
      x: t2p(m.tx),
      y: t2p(m.ty),
      radius: m.radius,
      monsters: m.monsters,
      pool: Array.isArray(MONSTERS) ? MONSTERS.filter(x => m.monsters.includes(x.id)) : [],
    });
  }

  return {
    objects: MAP_OBJECTS,
    collisions: COLLISION_RECTS,
    spawn: PLAYER_SPAWN,
    width: WORLD_W,
    height: WORLD_H,
  };
}

export function nearestCollisionDistance(px, py) {
  let best = Infinity;
  for (const r of COLLISION_RECTS) {
    const d = pointRectDist(px, py, r);
    if (d < best) best = d;
  }
  return best;
}

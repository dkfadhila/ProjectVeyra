import {
  CLASSES, SOUL_MAIDENS, NPC_LIST, BUILDINGS, INTERIORS, MONSTERS,
  SKILLS, INVENTORY, PROXIMITY_RANGE, TILE_SIZE
} from './data.js';
import { generateMap, WORLD_W, WORLD_H } from './map.js';
import { initRenderer, renderFrame, IMAGES, loadImage, getMinimapBounds } from './render.js';
import { initUI, openDialogue, closeDialogue, showToast, showZoneBanner, updateHUD, openPanel, closePanel, showSleepOverlay } from './ui.js';
import { chatWithNPC } from './ai.js';
import { openMapView, closeMapView, isMapViewOpen } from './mapview.js';
import * as Auth from './auth.js';
import { connectSocket, emitSocket, onSocket, disconnectSocket, getSocket } from './socket.js';


const state = {
  screen: 'loading',
  player: null,
  buildings: [],
  trees: [],
  rocks: [],
  npcs: [],
  monsters: [],
  paths: [],
  water: [],
  farms: [],
  fences: [],
  fountains: [],
  spawnZones: [],
  collisions: [],
  interior: null,
  prevOutdoor: null,
  time: 0,
  nearestNPC: null,
  dialogueOpen: false,
  worldSeed: 1337,
  lastSave: 0,
  serverPlayer: null,
  socketConnected: false,
};
window.__veyraState = state;


const keys = {};
let canvas = null;
function setupInput() {
  window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === 'e' || e.key === 'E') tryInteract();
    if (e.key === 'i' || e.key === 'I') togglePanel('panel-inventory');
    if (e.key === 'c' || e.key === 'C') togglePanel('panel-character');
    if (e.key === 'q' || e.key === 'Q') togglePanel('panel-quest');
    if (e.key === 'p' || e.key === 'P') togglePanel('panel-soulbond');
    if (e.key === 'n' || e.key === 'N') {
      if (state.screen === 'play') {
        if (isMapViewOpen()) closeMapView();
        else openMapView(state);
      }
    }
    if (e.key === 'Escape') {
      if (isMapViewOpen()) { closeMapView(); return; }
      if (state.dialogueOpen) { closeDialogue(); state.dialogueOpen = false; }
      else closePanel();
    }
  });
  window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

  function onCanvasClick(e) {
    if (state.screen !== 'play' || !canvas) return;
    const b = getMinimapBounds();
    if (!b) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const dx = x - b.cx, dy = y - b.cy;
    if (dx * dx + dy * dy <= b.r * b.r) {
      e.preventDefault();
      if (isMapViewOpen()) closeMapView();
      else openMapView(state);
    }
  }

  (canvas || window).addEventListener('click', onCanvasClick);

  (canvas || window).addEventListener('mousemove', (e) => {
    if (state.screen !== 'play' || !canvas) return;
    const b = getMinimapBounds();
    if (!b) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const dx = x - b.cx, dy = y - b.cy;
    canvas.style.cursor = (dx * dx + dy * dy <= b.r * b.r) ? 'pointer' : '';
  });
}

function togglePanel(id) {
  const el = document.getElementById(id);
  if (!el) return;
  if (el.classList.contains('show')) closePanel();
  else openPanel(id, state);
}


async function bootAssets() {
  canvas = document.getElementById('game-canvas');
  if (!canvas) { console.error('canvas missing'); return; }
  await initRenderer(canvas);
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
}
function resizeCanvas() {
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}


function loadOutdoorMap() {
  const { objects, collisions, spawn } = generateMap();
  state.buildings = []; state.trees = []; state.rocks = []; state.npcs = [];
  state.monsters = []; state.paths = []; state.water = []; state.farms = [];
  state.fences = []; state.spawnZones = []; state.grassTufts = [];
  state.flowers = []; state.gravel = [];
  for (const o of objects) {
    switch (o.type) {
      case 'building': state.buildings.push(o); break;
      case 'tree':     state.trees.push(o); break;
      case 'rock':     state.rocks.push(o); break;
      case 'grass_tuft': state.grassTufts.push(o); break;
      case 'flower':   state.flowers.push(o); break;
      case 'gravel':   state.gravel.push(o); break;
      case 'pond_stone': state.pondStones = state.pondStones || []; state.pondStones.push(o); break;
      case 'npc':      state.npcs.push({ ...o, _talkable: false }); break;
      case 'monster_spawn': state.spawnZones.push(o); break;
      case 'path':     state.paths.push(o); break;
      case 'water':    state.water.push(o); break;
      case 'farm':     state.farms.push(o); break;
      case 'fence':    state.fences.push(o); break;
      case 'fountain': state.fountains = state.fountains || []; state.fountains.push(o); break;
    }
  }
  state.collisions = collisions.slice();

  for (const z of state.spawnZones) {
    if (!z.pool || !z.pool.length) continue;
    for (let i=0;i<2;i++) {
      const m = z.pool[Math.floor(Math.random()*z.pool.length)];
      state.monsters.push({
        id: m.id+'_'+i+'_'+z.x, name: m.name, sprite: m.sprite,
        x: z.x + (Math.random()-0.5)*z.radius, y: z.y + (Math.random()-0.5)*z.radius,
        hp: m.hp, maxHp: m.hp, atk: m.atk, exp: m.exp || 10, alive: true
      });
    }
  }
  return spawn;
}


function tryMove(p, dx, dy) {
  const nx = p.x + dx;
  if (!collides(nx, p.y, p.r)) p.x = nx;
  const ny = p.y + dy;
  if (!collides(p.x, ny, p.r)) p.y = ny;

  if (state.interior) {
    const iw = INTERIORS[state.interior]?.w * TILE_SIZE || 384;
    const ih = INTERIORS[state.interior]?.h * TILE_SIZE || 320;
    p.x = Math.max(20, Math.min(iw - 20, p.x));
    p.y = Math.max(20, Math.min(ih - 20, p.y));
  } else {
    p.x = Math.max(20, Math.min(WORLD_W - 20, p.x));
    p.y = Math.max(20, Math.min(WORLD_H - 20, p.y));
  }
}
function collides(x, y, r) {
  if (state.interior) {
    const I = INTERIORS[state.interior];
    if (!I) return false;
    const iw = I.w * TILE_SIZE, ih = I.h * TILE_SIZE;
    if (x-r < 32 || x+r > iw-32 || y-r < 64 || y+r > ih-32) return true;
    for (const f of (I.furniture || [])) {
      const fx = f.x * TILE_SIZE, fy = f.y * TILE_SIZE;
      const fw = f.w || 32, fh = f.h || 32;
      if (x+r > fx && x-r < fx+fw && y+r > fy && y-r < fy+fh) {
        if (f.type === 'bed') return false;
        return true;
      }
    }
    return false;
  }
  for (const c of state.collisions) {
    if (x+r > c.x && x-r < c.x + c.w && y+r > c.y && y-r < c.y + c.h) return true;
  }
  return false;
}


function tryInteract() {
  if (!state.interior) {
    for (const b of state.buildings) {
      const data = b.data || BUILDINGS[b.sprite];
      if (!data) continue;
      const doorX = b.x + (data.doorX || b.w/2);
      const doorY = b.y + (data.doorY || b.h-8);
      const dx = state.player.x - doorX, dy = state.player.y - doorY;
      if (dx*dx + dy*dy < 40*40) {
        enterBuilding(data.interior, b);
        return;
      }
    }
  } else {
    const I = INTERIORS[state.interior];
    if (I && I.exit) {
      const ex = I.exit.x * TILE_SIZE + TILE_SIZE/2;
      const ey = I.exit.y * TILE_SIZE + TILE_SIZE/2;
      const dx = state.player.x - ex, dy = state.player.y - ey;
      if (dx*dx + dy*dy < 40*40) { exitBuilding(); return; }
    }
    if (I) {
      for (const f of (I.furniture || [])) {
        if (f.type !== 'bed') continue;
        const fx = f.x*TILE_SIZE, fy = f.y*TILE_SIZE;
        const cx = fx + (f.w||32)/2, cy = fy + (f.h||32)/2;
        const dx = state.player.x - cx, dy = state.player.y - cy;
        if (dx*dx + dy*dy < 48*48) { sleepInBed(); return; }
      }
    }
  }

  if (state.nearestNPC) {
    talkToNPC(state.nearestNPC);
  }
}

function enterBuilding(interiorId, building) {
  if (!INTERIORS[interiorId]) { showToast('Door locked'); return; }
  state.prevOutdoor = { x: state.player.x, y: state.player.y };
  state.interior = interiorId;
  const I = INTERIORS[interiorId];
  if (I.exit) {
    state.player.x = I.exit.x * TILE_SIZE + TILE_SIZE/2;
    state.player.y = (I.exit.y - 1) * TILE_SIZE + TILE_SIZE/2;
  } else {
    state.player.x = I.w * TILE_SIZE / 2;
    state.player.y = I.h * TILE_SIZE - 64;
  }
  showZoneBanner(I.name || building.data?.name || 'Indoor');
}

function exitBuilding() {
  state.interior = null;
  if (state.prevOutdoor) {
    state.player.x = state.prevOutdoor.x;
    state.player.y = state.prevOutdoor.y + 16;
  }
  showZoneBanner('Lunaris Village');
}

function sleepInBed() {
  showSleepOverlay(() => {
    state.player.hp = state.player.maxHp;
    state.player.mp = state.player.maxMp;
    showToast('You wake up refreshed. HP & MP fully restored.');
    updateHUD(state);
  });
}


function updateProximity() {
  state.nearestNPC = null;
  if (state.interior) return;
  let best = PROXIMITY_RANGE, found = null;
  for (const n of state.npcs) {
    const dx = n.x - state.player.x, dy = n.y - state.player.y;
    const d = Math.hypot(dx, dy);
    n._talkable = d < PROXIMITY_RANGE;
    if (d < best) { best = d; found = n; }
  }
  state.nearestNPC = found;
}


async function talkToNPC(npc) {
  state.dialogueOpen = true;
  const data = npc.data || {};
  const portraitKey = npc.sprite;

  const isMaiden = SOUL_MAIDENS.find(m => m.id === npc.id);
  if (isMaiden) {
    openDialogue({ name: data.name || npc.id, portrait: portraitKey, text: '...', isAI: true, npcId: npc.id });
    try {
      if (Auth.getPlayerId()) {
        const resp = await fetch('/api/lyra/talk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Auth.getToken()}`,
          },
          body: JSON.stringify({
            playerId: Auth.getPlayerId(),
            message: `Hello, I am ${state.player.name} the ${state.player.className}.`,
            npcId: isMaiden.id,
          }),
        });
        const result = await resp.json();
        openDialogue({ name: isMaiden.name, portrait: portraitKey, text: result.message, isAI: true, npcId: npc.id });
        if (result.newResonance !== undefined && state.serverPlayer) {
          state.serverPlayer.resonance = result.newResonance;
        }
      } else {
        const reply = await chatWithNPC(isMaiden.id, isMaiden.persona, state.player);
        openDialogue({ name: isMaiden.name, portrait: portraitKey, text: reply, isAI: true, npcId: npc.id });
      }
    } catch (e) {
      openDialogue({ name: isMaiden.name, portrait: portraitKey, text: 'My thoughts are cloudy... try again later.', isAI: false });
    }
  } else {
    const lines = data.dialogue || ['...'];
    const line = lines[Math.floor(Math.random()*lines.length)];
    openDialogue({ name: data.name || npc.id, portrait: portraitKey, text: line, role: data.role });
  }
}
window.__veyraOpenDialogue = (id) => {
  const n = state.npcs.find(x => x.id === id);
  if (n) talkToNPC(n);
};


let lastTs = 0;
function loop(ts) {
  const dt = Math.min(50, ts - lastTs) / 1000;
  lastTs = ts;
  state.time = ts;

  if (state.screen === 'play' && state.player) {
    update(dt);
    renderFrame(state);
  }
  requestAnimationFrame(loop);
}

function update(dt) {
  const p = state.player;

  const sprinting = !!(keys['shift'] || keys['shiftleft'] || keys['shiftright']);
  const baseSpeed = sprinting ? 256 : 160;
  const sp = baseSpeed * dt;
  p.sprinting = sprinting;
  let dx=0, dy=0;
  if (keys['w'] || keys['arrowup'])    { dy -= sp; p.dir = 'up'; }
  if (keys['s'] || keys['arrowdown'])  { dy += sp; p.dir = 'down'; }
  if (keys['a'] || keys['arrowleft'])  { dx -= sp; p.dir = 'left'; }
  if (keys['d'] || keys['arrowright']) { dx += sp; p.dir = 'right'; }
  if (dx || dy) {
    if (dx && dy) { dx *= 0.707; dy *= 0.707; }
    tryMove(p, dx, dy);
    p.moving = true;
    p.animTime += dt * (sprinting ? 1.6 : 1);

    if (state.socketConnected) {
      emitSocket('player:move', { position: { x: Math.round(p.x), y: Math.round(p.y) } });
    }
  } else {
    p.moving = false;
    p.animTime = 0;
  }
  updateProximity();

  if (ts() - state.lastSave > 15000) save();
}
function ts() { return performance.now(); }


function save() {
  try {
    localStorage.setItem('veyra_save', JSON.stringify({
      player: state.player, screen: state.screen, time: state.time
    }));
    state.lastSave = ts();

    if (Auth.getPlayerId()) {
      Auth.savePlayer({
        position: { x: Math.round(state.player.x), y: Math.round(state.player.y) },
        zone: 'lunaris_village',
      });
    }
  } catch (e) {}
}

function load() {
  try {
    const s = localStorage.getItem('veyra_save');
    if (!s) return null;
    return JSON.parse(s);
  } catch (e) { return null; }
}


function setupSocketHandlers() {
  onSocket('player:state', (player) => {
    state.serverPlayer = player;
    if (player.hp !== undefined) state.player.hp = player.hp;
    if (player.maxHp !== undefined) state.player.maxHp = player.maxHp;
    if (player.mp !== undefined) state.player.mp = player.mp;
    if (player.maxMp !== undefined) state.player.maxMp = player.maxMp;
    if (player.exp !== undefined) state.player.exp = player.exp;
    if (player.level !== undefined) state.player.lv = player.level;
    if (player.gold !== undefined) state.player.gold = player.gold;
    updateHUD(state);
  });

  onSocket('player:moved', (data) => {
    if (data.playerId === Auth.getPlayerId()) return;
  });

  onSocket('monster:spawned', (monster) => {
    if (!state.monsters.find(m => m.id === monster.instanceId)) {
      state.monsters.push({
        id: monster.instanceId,
        serverId: monster.instanceId,
        name: monster.monster.name,
        sprite: monster.monster.sprite,
        x: monster.position.x,
        y: monster.position.y,
        hp: monster.currentHp,
        maxHp: monster.monster.maxHp,
        atk: monster.monster.attack,
        exp: monster.monster.exp,
        alive: true,
      });
    }
  });

  onSocket('monster:died', (data) => {
    const m = state.monsters.find(x => x.id === data.instanceId || x.serverId === data.instanceId);
    if (m) m.alive = false;
  });

  onSocket('combat:update', (combat) => {
    if (combat.playerHp !== undefined) state.player.hp = combat.playerHp;
    updateHUD(state);
  });

  onSocket('combat:result', (result) => {
    if (result.status === 'player_won') {
      showToast(`Victory! +${result.expGained} EXP, +${result.goldGained} Gold`);
      if (result.itemsGained?.length) {
        for (const item of result.itemsGained) {
          showToast(`Obtained: ${item.item.name} x${item.quantity}`);
        }
      }
      if (result.levelUp) {
        showToast(`Level Up! You are now level ${result.newLevel}!`);
      }
    } else if (result.status === 'monster_won') {
      showToast('Defeated... You respawn at the village.');
    }
    updateHUD(state);
  });

  onSocket('player:levelup', (data) => {
    if (data.playerId === Auth.getPlayerId()) {
      state.player.lv = data.newLevel;
      showToast(`Level Up! Level ${data.newLevel}!`);
      updateHUD(state);
    }
  });

  onSocket('notification', (data) => {
    showToast(data.message);
  });

  onSocket('lyra:response', (data) => {
    if (state.dialogueOpen) {
      openDialogue({ name: 'Lyra', portrait: 'oracle', text: data.message, isAI: true, npcId: 'lyra' });
    }
    if (data.newResonance !== undefined && state.serverPlayer) {
      state.serverPlayer.resonance = data.newResonance;
    }
  });

  onSocket('chat:message', (data) => {
    if (data.channel === 'system' || data.channel === 'global') {
      if (data.from !== state.player.name) {
        showToast(`[${data.from}]: ${data.text}`);
      }
    }
  });

  state.socketConnected = true;
}


function startGame(playerData) {
  const spawn = loadOutdoorMap();
  state.player = {
    ...playerData,
    x: spawn.x, y: spawn.y,
    r: 12,
    dir: 'down',
    moving: false,
    animTime: 0,
    hp: playerData.hp || 100, maxHp: playerData.maxHp || 100,
    mp: playerData.mp || 50, maxMp: playerData.maxMp || 50,
    exp: playerData.exp || 0, lv: playerData.lv || playerData.level || 1,
    gold: playerData.gold || 50,
    inventory: playerData.inventory || INVENTORY.slice(0, 4).map(i => ({ id: i.id, qty: 1 })),
    skills: playerData.skills || SKILLS.filter(s => s.classId === playerData.classId).slice(0, 3),
  };
  state.screen = 'play';
  document.getElementById('screen-auth-login')?.classList.remove('show');
  document.getElementById('screen-auth-register')?.classList.remove('show');
  document.getElementById('screen-menu')?.classList.remove('show');
  document.getElementById('screen-create')?.classList.remove('show');
  document.getElementById('hud')?.classList.add('show');
  showZoneBanner('Lunaris Village');
  showToast('Welcome to Veyra. WASD to move, E to interact.');
  updateHUD(state);

  if (Auth.getPlayerId()) {
    setupSocketHandlers();
    connectSocket(Auth.getPlayerId(), state.player.name);
  }
}


function showAuthScreen(screen) {
  document.getElementById('screen-loading')?.classList.remove('show');
  document.getElementById('screen-menu')?.classList.remove('show');
  document.getElementById('screen-create')?.classList.remove('show');
  document.getElementById('screen-auth-login')?.classList.toggle('show', screen === 'login');
  document.getElementById('screen-auth-register')?.classList.toggle('show', screen === 'register');
}

function setupAuthUI() {
  document.getElementById('btn-auth-login').onclick = async () => {
    const login = document.getElementById('auth-login-user').value.trim();
    const pass = document.getElementById('auth-login-pass').value;
    const errEl = document.getElementById('auth-login-error');
    errEl.textContent = '';
    if (!login || !pass) { errEl.textContent = 'Fill all fields'; return; }
    try {
      await Auth.login(login, pass);
      await postAuthFlow();
    } catch (e) {
      errEl.textContent = e.message;
    }
  };

  document.getElementById('btn-auth-register').onclick = async () => {
    const user = document.getElementById('auth-reg-user').value.trim();
    const email = document.getElementById('auth-reg-email').value.trim();
    const pass = document.getElementById('auth-reg-pass').value;
    const errEl = document.getElementById('auth-reg-error');
    errEl.textContent = '';
    if (!user || !email || !pass) { errEl.textContent = 'Fill all fields'; return; }
    if (pass.length < 6) { errEl.textContent = 'Password min 6 characters'; return; }
    try {
      await Auth.register(user, email, pass);
      await postAuthFlow();
    } catch (e) {
      errEl.textContent = e.message;
    }
  };

  document.getElementById('btn-show-register').onclick = () => showAuthScreen('register');
  document.getElementById('btn-show-login').onclick = () => showAuthScreen('login');

  document.getElementById('auth-login-pass').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('btn-auth-login').click();
  });
  document.getElementById('auth-reg-pass').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('btn-auth-register').click();
  });
}

async function postAuthFlow() {
  const data = await Auth.checkAuth();
  if (!data) { showAuthScreen('login'); return; }

  if (data.player) {
    const p = data.player;
    const cls = CLASSES.find(c => c.id === p.class);
    startGame({
      name: p.name,
      classId: p.class,
      className: cls?.name || p.class,
      sprite: cls?.sprite || p.class,
      hp: p.hp, maxHp: p.maxHp, mp: p.mp, maxMp: p.maxMp,
      exp: p.exp, lv: p.level, gold: p.gold,
      inventory: p.inventory || [],
      skin: '1',
    });
  } else {
    goCreate();
  }
}

function goCreate() {
  document.getElementById('screen-auth-login')?.classList.remove('show');
  document.getElementById('screen-auth-register')?.classList.remove('show');
  document.getElementById('screen-menu')?.classList.remove('show');
  document.getElementById('screen-create')?.classList.add('show');
  state.screen = 'create';
}


async function boot() {
  await bootAssets();
  setupInput();
  setupAuthUI();

  initUI({
    state,
    onStartNew: () => { goCreate(); },
    onLoadSave: () => {
      const s = load();
      if (s && s.player) { startGame(s.player); } else { showToast('No save found.'); }
    },
    onCreate: async (data) => {
      try {
        const cls = CLASSES.find(c => c.id === data.classId);
        const serverPlayer = await Auth.createCharacter(data.name, data.classId);
        startGame({
          ...data,
          hp: serverPlayer.hp || cls?.baseStats?.hp || 100,
          maxHp: serverPlayer.maxHp || cls?.baseStats?.hp || 100,
          mp: serverPlayer.mp || cls?.baseStats?.mp || 50,
          maxMp: serverPlayer.maxMp || cls?.baseStats?.mp || 50,
          gold: serverPlayer.gold || 50,
        });
      } catch (e) {
        showToast('Character creation failed: ' + e.message);
      }
    },
  });

  const authData = await Auth.checkAuth();
  if (authData) {
    await postAuthFlow();
  } else {
    showAuthScreen('login');
  }

  requestAnimationFrame(loop);
}

boot();

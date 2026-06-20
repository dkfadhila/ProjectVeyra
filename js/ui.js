
import { CLASSES, SOUL_MAIDENS, NPC_LIST, SKIN_COLORS, QUESTS, INVENTORY, PROXIMITY_RANGE } from './data.js';

let _cfg = null;

export function initUI(cfg) {
  _cfg = cfg;
  buildMenu();
  buildCreate();
  buildPanels();
  buildDialogue();
  buildProximityHint();

  setInterval(() => {
    if (cfg.state && cfg.state.player) updateHUD(cfg.state);
    updateProximityHint(cfg.state);
  }, 100);
}


function buildMenu() {
  const menu = document.getElementById('screen-menu');
  if (!menu) return;
  menu.innerHTML = `
    <div class="menu-card">
      <div class="menu-emblem"></div>
      <h1 class="menu-title">PROJECT VEYRA</h1>
      <p class="menu-tagline">⚜ Chronicles of the Soulbond Realm ⚜</p>
      <button class="btn primary" id="btn-new">Begin Anew</button>
      <button class="btn" id="btn-load">Resume Journey</button>
      <button class="btn" id="btn-settings">Royal Decree</button>
      <p class="menu-footer">⊹ LUNARIS VILLAGE · CHAPTER I · v0.2 ⊹</p>
    </div>`;
  document.getElementById('btn-new').onclick = () => _cfg.onStartNew();
  document.getElementById('btn-load').onclick = () => _cfg.onLoadSave();
  document.getElementById('btn-settings').onclick = () => openPanel('panel-setting', _cfg.state);
}


let createState = { name: 'Wanderer', classIdx: 0, skinIdx: 0 };
function buildCreate() {
  const el = document.getElementById('screen-create');
  if (!el) return;
  el.innerHTML = `
    <div class="create-grid">
      <div class="create-preview">
        <div class="preview-frame">
          <canvas id="create-preview-canvas" width="192" height="192"></canvas>
        </div>
        <div class="preview-name" id="preview-name">Wanderer</div>
        <div class="preview-class" id="preview-class">Astral Knight</div>
      </div>
      <div class="create-form">
        <label>Name of Champion</label>
        <input type="text" id="char-name" value="Wanderer" maxlength="16">
        <label>Sworn Class</label>
        <div class="class-grid" id="class-grid"></div>
        <p class="class-desc" id="class-desc"></p>
        <label>Lineage (Skin)</label>
        <div class="skin-row" id="skin-row"></div>
        <div class="create-actions">
          <button class="btn" id="btn-back">Return</button>
          <button class="btn primary" id="btn-create">Begin Saga</button>
        </div>
      </div>
    </div>`;
  const grid = document.getElementById('class-grid');
  CLASSES.forEach((c, i) => {
    const b = document.createElement('button');
    b.className = 'class-btn' + (i === createState.classIdx ? ' active' : '');
    b.textContent = c.name;
    b.onclick = () => { createState.classIdx = i; refreshCreate(); };
    grid.appendChild(b);
  });
  const skin = document.getElementById('skin-row');
  SKIN_COLORS.forEach((s, i) => {
    const b = document.createElement('button');
    b.className = 'skin-btn' + (i === createState.skinIdx ? ' active' : '');
    b.textContent = s;
    b.onclick = () => { createState.skinIdx = i; refreshCreate(); };
    skin.appendChild(b);
  });
  document.getElementById('char-name').oninput = (e) => {
    createState.name = e.target.value || 'Wanderer';
    document.getElementById('preview-name').textContent = createState.name;
  };
  document.getElementById('btn-back').onclick = () => {
    document.getElementById('screen-create').classList.remove('show');
    document.getElementById('screen-menu').classList.add('show');
  };
  document.getElementById('btn-create').onclick = () => {
    const cls = CLASSES[createState.classIdx];
    _cfg.onCreate({
      name: createState.name,
      classId: cls.id,
      className: cls.name,
      sprite: cls.sprite,
      armor: cls.armor,
      hair: cls.hair,
      weapon: cls.weapon,
      skin: SKIN_COLORS[createState.skinIdx],
    });
  };
  refreshCreate();
}
function refreshCreate() {
  const cls = CLASSES[createState.classIdx];
  document.getElementById('preview-class').textContent = cls.name;
  document.getElementById('class-desc').textContent = cls.desc;
  document.querySelectorAll('#class-grid .class-btn').forEach((b, i) => {
    b.classList.toggle('active', i === createState.classIdx);
  });
  document.querySelectorAll('#skin-row .skin-btn').forEach((b, i) => {
    b.classList.toggle('active', i === createState.skinIdx);
  });

  const canvas = document.getElementById('create-preview-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 192, 192);
    const img = new Image();
    img.onload = () => {

      ctx.drawImage(img, 0, 10*64, 64, 64, 32, 32, 128, 128);
    };
    img.src = `assets/sprites/classes/${cls.sprite}.png`;
  }
}


export function updateHUD(state) {
  if (!state.player) return;
  const p = state.player;
  const set = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
  const bar = (id, val, max) => { const el = document.getElementById(id); if (el) el.style.width = Math.max(0, Math.min(100, (val/max)*100)) + '%'; };
  set('hud-name', p.name);
  set('hud-class', p.className);
  set('hud-lv', 'Lv ' + p.lv);
  set('hud-hp-txt', `${Math.ceil(p.hp)} / ${p.maxHp}`);
  set('hud-mp-txt', `${Math.ceil(p.mp)} / ${p.maxMp}`);
  set('hud-exp-txt', `${p.exp} EXP`);
  set('hud-gold', `${p.gold}⛁`);
  bar('hud-hp-bar', p.hp, p.maxHp);
  bar('hud-mp-bar', p.mp, p.maxMp);
  bar('hud-exp-bar', p.exp % 100, 100);
}


function buildProximityHint() {
  if (document.getElementById('prox-hint')) return;
  const el = document.createElement('div');
  el.id = 'prox-hint';
  el.style.cssText = 'position:fixed;left:50%;bottom:18%;transform:translateX(-50%);background:rgba(13,18,32,0.85);border:1px solid #D9B36C;border-radius:8px;padding:8px 14px;color:#fff;font:13px sans-serif;display:none;z-index:50;backdrop-filter:blur(4px);';
  document.body.appendChild(el);
}
function updateProximityHint(state) {
  const el = document.getElementById('prox-hint');
  if (!el) return;
  if (state.dialogueOpen || state.screen !== 'play') { el.style.display = 'none'; return; }

  let nearBuilding = null;
  if (!state.interior) {
    for (const b of state.buildings) {
      const data = b.data || {};
      const doorX = b.x + (data.doorX || b.w/2);
      const doorY = b.y + (data.doorY || b.h-8);
      const dx = state.player.x - doorX, dy = state.player.y - doorY;
      if (dx*dx + dy*dy < 40*40) { nearBuilding = data.name || 'Building'; break; }
    }
  } else {

    const I = state.interior && window.__veyra_interiors ? window.__veyra_interiors[state.interior] : null;
  }
  if (state.nearestNPC) {
    el.textContent = `[E] Talk to ${state.nearestNPC.data?.name || state.nearestNPC.id}`;
    el.style.display = 'block';
  } else if (nearBuilding) {
    el.textContent = `[E] Enter ${nearBuilding}`;
    el.style.display = 'block';
  } else {
    el.style.display = 'none';
  }
}


function buildDialogue() {
  let el = document.getElementById('dialogue-box');
  if (!el) {
    el = document.createElement('div');
    el.id = 'dialogue-box';
    el.className = 'dialogue';
    document.body.appendChild(el);
  }
  el.innerHTML = `
    <div class="dlg-portrait"><img id="dlg-portrait-img" src="" alt=""></div>
    <div class="dlg-body">
      <div class="dlg-header">
        <span class="dlg-name" id="dlg-name"></span>
        <span class="dlg-role" id="dlg-role"></span>
      </div>
      <div class="dlg-text" id="dlg-text"></div>
      <div class="dlg-input-row" id="dlg-input-row" style="display:none">
        <input type="text" id="dlg-input" placeholder="Type message..." />
        <button class="btn small" id="dlg-send">Send</button>
      </div>
      <div class="dlg-actions">
        <button class="btn small" id="dlg-close">Close [ESC]</button>
      </div>
    </div>`;
  document.getElementById('dlg-close').onclick = () => { closeDialogue(); if (_cfg && _cfg.state) _cfg.state.dialogueOpen = false; };
}
export function openDialogue({ name, portrait, text, role, isAI, npcId }) {
  const el = document.getElementById('dialogue-box');
  if (!el) return;
  el.classList.add('show');
  document.getElementById('dlg-name').textContent = name || '';
  document.getElementById('dlg-role').textContent = role || '';
  document.getElementById('dlg-text').textContent = text || '...';
  const img = document.getElementById('dlg-portrait-img');
  if (portrait) {

    img.src = `assets/npc/${portrait}.png`;



    img.style.objectFit = 'none';
    img.style.objectPosition = '0px 0px';
    img.style.width = '16px';
    img.style.height = '32px';
    img.style.transform = 'scale(3)';
    img.style.transformOrigin = 'top left';
    img.style.imageRendering = 'pixelated';
  }
  const ir = document.getElementById('dlg-input-row');
  ir.style.display = isAI ? 'flex' : 'none';
  if (isAI) {
    const input = document.getElementById('dlg-input');
    const send = document.getElementById('dlg-send');
    input.value = '';
    input.focus();
    send.onclick = async () => {
      const msg = input.value.trim();
      if (!msg) return;
      document.getElementById('dlg-text').textContent = '...';
      try {
        const { sendMessageToNPC } = await import('./ai.js');
        const reply = await sendMessageToNPC(npcId, msg);
        document.getElementById('dlg-text').textContent = reply;
      } catch (e) {
        document.getElementById('dlg-text').textContent = 'Your voice could not reach them... [connection failed]';
      }
      input.value = '';
    };
    input.onkeydown = (e) => { if (e.key === 'Enter') send.click(); };
  }
}
export function closeDialogue() {
  document.getElementById('dialogue-box')?.classList.remove('show');
}


function buildPanels() {
  const layer = document.getElementById('panel-layer') || document.body;
  const ids = ['panel-inventory','panel-character','panel-soulbond','panel-quest','panel-setting'];
  for (const id of ids) {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('div');
      el.id = id;
      el.className = 'panel glass';
      layer.appendChild(el);
    }
  }
}
export function openPanel(id, state) {
  closePanel();
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('show');
  renderPanel(id, state);
}
export function closePanel() {
  document.querySelectorAll('.panel.show').forEach(p => p.classList.remove('show'));
}
function renderPanel(id, state) {
  const el = document.getElementById(id);
  if (!el || !state) return;
  const p = state.player;
  let body = '';
  if (id === 'panel-inventory') {
    body = `<h2>Satchel</h2><div class="inv-grid">` +
      (p?.inventory || []).map(i => {
        const item = INVENTORY.find(x => x.id === i.id) || {};
        return `<div class="inv-slot"><div class="inv-name">${item.name || i.id}</div><div class="inv-qty">×${i.qty}</div></div>`;
      }).join('') + `</div>`;
  } else if (id === 'panel-character') {
    body = `<h2>${p?.name}</h2>
      <p class="cls">⚜ ${p?.className} ⚜</p>
      <h3>Vital Stats</h3>
      <ul class="stats">
        <li>Level · ${p?.lv}</li><li>Gold · ${p?.gold}</li>
        <li>HP · ${Math.ceil(p?.hp)}/${p?.maxHp}</li>
        <li>MP · ${Math.ceil(p?.mp)}/${p?.maxMp}</li>
        <li>EXP · ${p?.exp}</li><li>Skin · ${p?.skin || '—'}</li>
      </ul>
      <h3>Skills</h3><ul class="skills">${(p?.skills||[]).length ? (p.skills.map(s=>`<li><b>${s.name}</b> · ${s.desc||''}</li>`).join('')) : '<li style="font-style:italic;color:#8A6520">No skills mastered yet</li>'}</ul>`;
  } else if (id === 'panel-soulbond') {
    body = `<h2>Soulbond</h2><p style="text-align:center;font-style:italic;color:#B1A07B;margin-bottom:12px">The Three Maidens of Veyra</p>` +
      SOUL_MAIDENS.map(m => `<div class="bond-card"><b>${m.name}</b><i>${m.affinity||m.title||''}</i><p>${(m.persona||'').substring(0,160)}…</p></div>`).join('');
  } else if (id === 'panel-quest') {
    body = `<h2>Royal Quests</h2>` + QUESTS.map(q => `<div class="quest-card"><b>${q.name}</b><p>${q.desc}</p></div>`).join('');
  } else if (id === 'panel-setting') {
    body = `<h2>Royal Decree</h2>
      <button class="btn primary" id="setting-save">Inscribe Tale</button>
      <button class="btn danger" id="setting-clear">Burn the Chronicle</button>
      <h3>Edicts of Movement</h3>
      <p style="font-size:12px;line-height:1.7;color:#B1A07B;font-style:italic">
        ⊹ <b style="color:#F4D17A">WASD</b> &mdash; Traverse the realm<br>
        ⊹ <b style="color:#F4D17A">Shift</b> &mdash; Sprint (move faster)<br>
        ⊹ <b style="color:#F4D17A">E</b> &mdash; Commune / Enter halls<br>
        ⊹ <b style="color:#F4D17A">I</b> &mdash; Open satchel<br>
        ⊹ <b style="color:#F4D17A">C</b> &mdash; View heraldry<br>
        ⊹ <b style="color:#F4D17A">Q</b> &mdash; Royal quests<br>
        ⊹ <b style="color:#F4D17A">M</b> &mdash; Soulbond covenant<br>
        ⊹ <b style="color:#F4D17A">Esc</b> &mdash; Withdraw
      </p>`;
  }
  el.innerHTML = `<button class="panel-close" onclick="document.querySelectorAll('.panel.show').forEach(p=>p.classList.remove('show'))">×</button>${body}`;
  if (id === 'panel-setting') {
    document.getElementById('setting-save').onclick = () => {
      try { localStorage.setItem('veyra_save', JSON.stringify({ player: state.player, screen: state.screen })); showToast('Game saved'); } catch (e) {}
    };
    document.getElementById('setting-clear').onclick = () => {
      localStorage.removeItem('veyra_save'); showToast('Save deleted');
    };
  }
}


export function showToast(msg) {
  let el = document.getElementById('toast-layer');
  if (!el) { el = document.createElement('div'); el.id='toast-layer'; document.body.appendChild(el); }
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  el.appendChild(t);
  setTimeout(() => t.classList.add('fade'), 2200);
  setTimeout(() => t.remove(), 3000);
}
export function showZoneBanner(name) {
  let el = document.getElementById('zone-banner');
  if (!el) { el = document.createElement('div'); el.id='zone-banner'; document.body.appendChild(el); }
  el.textContent = name;
  el.classList.remove('show'); void el.offsetWidth;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2500);
}


export function showSleepOverlay(onWake) {
  let el = document.getElementById('sleep-overlay');
  if (!el) { el = document.createElement('div'); el.id='sleep-overlay'; el.className='sleep-overlay'; document.body.appendChild(el); }
  el.innerHTML = `<div class="sleep-text">Zzz...</div>`;
  el.classList.add('show');
  setTimeout(() => {
    el.classList.remove('show');
    if (onWake) onWake();
  }, 1800);
}

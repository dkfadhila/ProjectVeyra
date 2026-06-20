const API_BASE = '/api';

let token = localStorage.getItem('veyra_token');
let currentUser = null;

export function getToken() { return token; }
export function getPlayerId() { return currentUser?.player?._id || null; }

function setToken(t) {
  token = t;
  localStorage.setItem('veyra_token', t);
}

function clearToken() {
  token = null;
  currentUser = null;
  localStorage.removeItem('veyra_token');
}

async function apiFetch(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
  if (res.status === 401) { clearToken(); throw new Error('Session expired'); }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function register(username, email, password) {
  const data = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  });
  setToken(data.token);
  currentUser = { user: data.user };
  return data;
}

export async function login(loginField, password) {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ login: loginField, password }),
  });
  setToken(data.token);
  currentUser = { user: data.user, player: data.player };
  return data;
}

export async function checkAuth() {
  if (!token) return null;
  try {
    const data = await apiFetch('/auth/me');
    currentUser = data;
    return data;
  } catch (e) {
    clearToken();
    return null;
  }
}

export async function createCharacter(name, classId) {
  const data = await apiFetch('/player/create', {
    method: 'POST',
    body: JSON.stringify({ name, playerClass: classId }),
  });
  if (currentUser) currentUser.player = data;
  return data;
}

export async function savePlayer(updates) {
  try {
    const playerId = getPlayerId();
    await apiFetch('/player/save', {
      method: 'POST',
      body: JSON.stringify({ playerId, ...updates }),
    });
  } catch (e) {}
}

export async function getPlayer() {
  return apiFetch('/player/me');
}

export async function getInventory() {
  return apiFetch('/player/inventory');
}

export async function addToInventory(itemId, quantity) {
  return apiFetch('/player/inventory/add', {
    method: 'POST',
    body: JSON.stringify({ itemId, quantity }),
  });
}

export async function getQuests() {
  return apiFetch('/quests');
}

export async function acceptQuest(questId) {
  return apiFetch(`/quests/${questId}/accept`, { method: 'POST' });
}

export async function completeQuestObjective(questId, objectiveId) {
  return apiFetch(`/quests/${questId}/objective`, {
    method: 'PUT',
    body: JSON.stringify({ objectiveId }),
  });
}

export async function completeQuest(questId) {
  return apiFetch(`/quests/${questId}/complete`, { method: 'POST' });
}

export async function startCombat(monsterInstanceId) {
  return apiFetch('/combat/start', {
    method: 'POST',
    body: JSON.stringify({ monsterInstanceId }),
  });
}

export async function attack(monsterInstanceId) {
  return apiFetch('/combat/attack', {
    method: 'POST',
    body: JSON.stringify({ monsterInstanceId }),
  });
}

export async function useSkill(monsterInstanceId, skillId) {
  return apiFetch('/combat/skill', {
    method: 'POST',
    body: JSON.stringify({ monsterInstanceId, skillId }),
  });
}

export async function flee(monsterInstanceId) {
  return apiFetch('/combat/flee', {
    method: 'POST',
    body: JSON.stringify({ monsterInstanceId }),
  });
}

export async function getMonsters() {
  return apiFetch('/monsters');
}

export async function talkToNpc(npcId, message) {
  return apiFetch('/lyra/talk', {
    method: 'POST',
    body: JSON.stringify({ playerId: getPlayerId(), message, npcId }),
  });
}

export async function getMaidens() {
  return apiFetch('/maiden');
}

export async function getRelationships() {
  return apiFetch('/maiden/relationships');
}

export async function getMemories() {
  return apiFetch('/memory');
}

export async function getPublicMemories(targetId) {
  return apiFetch(`/memory/public/${targetId}`);
}

export async function shareMemory(memoryId, targetPlayerId) {
  return apiFetch('/memory/share', {
    method: 'POST',
    body: JSON.stringify({ memoryId, targetPlayerId }),
  });
}

export async function getMarketplace() {
  return apiFetch('/marketplace');
}

export async function listItem(itemId, price, quantity) {
  return apiFetch('/marketplace/list', {
    method: 'POST',
    body: JSON.stringify({ itemId, price, quantity }),
  });
}

export async function buyItem(listingId, quantity) {
  return apiFetch(`/marketplace/buy/${listingId}`, {
    method: 'POST',
    body: JSON.stringify({ quantity }),
  });
}

export async function get0GStatus() {
  return apiFetch('/storage/0g/status');
}

export async function upload0G(playerId) {
  return apiFetch('/storage/0g/upload', {
    method: 'POST',
    body: JSON.stringify({ playerId }),
  });
}

export async function verify0G(rootHash) {
  return apiFetch(`/storage/0g/verify/${rootHash}`);
}

export async function save0GState(stateData) {
  return apiFetch('/storage/0g/save', {
    method: 'POST',
    body: JSON.stringify({ state: stateData }),
  });
}

export async function load0GState(rootHash) {
  return apiFetch(`/storage/0g/load/${rootHash}`);
}

export async function load0GLatest(playerId) {
  return apiFetch(`/storage/0g/latest/${playerId}`);
}

export function logout() {
  clearToken();
  window.location.reload();
}

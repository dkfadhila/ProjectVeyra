const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `API Error: ${res.status}`);
  }
  return res.json();
}

export const api = {
  createPlayer: (name: string, playerClass: string) =>
    apiFetch('/api/player/create', { method: 'POST', body: JSON.stringify({ name, playerClass }) }),
  getPlayer: (id: string) => apiFetch(`/api/player/${id}`),

  getZones: () => apiFetch('/api/zones'),

  getMonstersInZone: (zoneId: string) => apiFetch(`/api/monsters/zone/${zoneId}`),
  spawnMonster: (monsterId: string, x: number, y: number) =>
    apiFetch('/api/monsters/spawn', { method: 'POST', body: JSON.stringify({ monsterId, x, y }) }),

  startCombat: (playerId: string, monsterInstanceId: string) =>
    apiFetch('/api/combat/start', { method: 'POST', body: JSON.stringify({ playerId, monsterInstanceId }) }),
  attack: (combatId: string) =>
    apiFetch('/api/combat/attack', { method: 'POST', body: JSON.stringify({ combatId }) }),
  heal: (combatId: string) =>
    apiFetch('/api/combat/heal', { method: 'POST', body: JSON.stringify({ combatId }) }),
  flee: (combatId: string) =>
    apiFetch('/api/combat/flee', { method: 'POST', body: JSON.stringify({ combatId }) }),

  getAvailableQuests: (playerId: string) => apiFetch(`/api/quests/available/${playerId}`),
  acceptQuest: (playerId: string, questId: string) =>
    apiFetch('/api/quests/accept', { method: 'POST', body: JSON.stringify({ playerId, questId }) }),
  completeQuest: (playerId: string, questId: string) =>
    apiFetch('/api/quests/complete', { method: 'POST', body: JSON.stringify({ playerId, questId }) }),

  talkToLyra: (playerId: string, message: string) =>
    apiFetch('/api/lyra/talk', { method: 'POST', body: JSON.stringify({ playerId, message }) }),
  giftLyra: (playerId: string, itemId: string) =>
    apiFetch('/api/lyra/gift', { method: 'POST', body: JSON.stringify({ playerId, itemId }) }),

  getMarket: () => apiFetch('/api/market'),
  listItem: (playerId: string, itemId: string, quantity: number, pricePerUnit: number, currency: string) =>
    apiFetch('/api/market/list', { method: 'POST', body: JSON.stringify({ playerId, itemId, quantity, pricePerUnit, currency }) }),
  buyItem: (playerId: string, listingId: string, quantity: number) =>
    apiFetch('/api/market/buy', { method: 'POST', body: JSON.stringify({ playerId, listingId, quantity }) }),

  convertVsToVeya: (playerId: string, amount: number) =>
    apiFetch('/api/exchange/vs-to-veya', { method: 'POST', body: JSON.stringify({ playerId, amount }) }),

  getChronicle: (limit?: number) => apiFetch(`/api/chronicle?limit=${limit || 50}`),

  health: () => apiFetch('/api/health'),
};

import { Router } from 'express';
import { db } from '../db/memory';
import { createPlayer, addItemToInventory } from '../services/playerService';
import { acceptQuest, completeQuest, getActiveQuests, getAvailableQuests } from '../services/questService';
import { getListings } from '../services/marketService';
import { ZONES } from '../data/zones';
import { ITEMS } from '../data/items';
import { QUESTS } from '../data/quests';
import { MONSTERS } from '../data/monsters';

export const apiRouter = Router();

// === Health ===
apiRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    players: db.players.size,
    monsters: db.monsterInstances.size,
    combats: db.combatStates.size,
    listings: db.marketListings.size,
  });
});

// === Player ===
apiRouter.post('/player/create', (req, res) => {
  const { name, class: playerClass } = req.body;
  if (!name || !playerClass) {
    return res.status(400).json({ error: 'Name and class required.' });
  }
  const validClasses = ['knight', 'mage', 'ranger', 'rogue', 'cleric'];
  if (!validClasses.includes(playerClass)) {
    return res.status(400).json({ error: `Invalid class. Choose: ${validClasses.join(', ')}` });
  }
  if (name.length < 2 || name.length > 20) {
    return res.status(400).json({ error: 'Name must be 2-20 characters.' });
  }

  const player = createPlayer(name, playerClass);
  res.json({ player });
});

apiRouter.get('/player/:id', (req, res) => {
  const player = db.getPlayer(req.params.id);
  if (!player) return res.status(404).json({ error: 'Player not found.' });
  res.json({ player });
});

apiRouter.get('/player/:id/quests', (req, res) => {
  const player = db.getPlayer(req.params.id);
  if (!player) return res.status(404).json({ error: 'Player not found.' });

  const active = getActiveQuests(req.params.id);
  const available = getAvailableQuests(player);
  res.json({ active, available });
});

// === Zones ===
apiRouter.get('/zones', (_req, res) => {
  res.json({ zones: Object.values(ZONES) });
});

apiRouter.get('/zones/:id', (req, res) => {
  const zone = ZONES[req.params.id];
  if (!zone) return res.status(404).json({ error: 'Zone not found.' });
  res.json({ zone });
});

// === Items (game data) ===
apiRouter.get('/items', (_req, res) => {
  res.json({ items: Object.values(ITEMS) });
});

apiRouter.get('/items/:id', (req, res) => {
  const item = ITEMS[req.params.id];
  if (!item) return res.status(404).json({ error: 'Item not found.' });
  res.json({ item });
});

// === Monsters (game data) ===
apiRouter.get('/monsters', (_req, res) => {
  res.json({ monsters: Object.values(MONSTERS) });
});

// === Quests (game data) ===
apiRouter.get('/quests', (_req, res) => {
  res.json({ quests: Object.values(QUESTS) });
});

// === Market ===
apiRouter.get('/market', (_req, res) => {
  res.json({ listings: getListings() });
});

// === Chronicle ===
apiRouter.get('/chronicle', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const entries = db.chronicle.slice(-limit).reverse();
  res.json({ entries });
});

// === Leaderboard ===
apiRouter.get('/leaderboard', (_req, res) => {
  const players = Array.from(db.players.values())
    .sort((a, b) => b.level - a.level || b.exp - a.exp)
    .slice(0, 20)
    .map(p => ({
      id: p.id, name: p.name, class: p.class, level: p.level,
      resonance: p.resonance, soulbond: p.soulbond,
    }));
  res.json({ leaderboard: players });
});

// === Online players ===
apiRouter.get('/online', (_req, res) => {
  const online = Array.from(db.playerToSocket.keys())
    .map(id => db.getPlayer(id))
    .filter(Boolean)
    .map(p => ({ id: p!.id, name: p!.name, level: p!.level, zone: p!.zone }));
  res.json({ online, count: online.length });
});

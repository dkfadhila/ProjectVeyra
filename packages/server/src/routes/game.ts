import { Express, Request, Response } from 'express';
import { GameStore } from '../store';
import { LyraAI } from '../services/lyra-ai';
import { CombatEngine } from '../services/combat';
import { MarketplaceService } from '../services/marketplace';
import { PlayerClass, MARKET_TAX_RATE, SOULBOND_TAX_RATE, VS_TO_VEYA_RATE } from '@project-veyra/shared';
import { ITEMS } from '../data/items';
import { MONSTERS } from '../data/monsters';
import { QUESTS, getAvailableQuests } from '../data/quests';
import { ZONES } from '../data/zones';

export function registerRoutes(
  app: Express,
  store: GameStore,
  lyraAI: LyraAI,
  combat: CombatEngine,
  marketplace: MarketplaceService,
) {
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      game: 'Project Veyra',
      players: store.players.size,
      monsters: store.monsterInstances.size,
      listings: store.marketListings.size,
    });
  });

  app.post('/api/player/create', (req: Request, res: Response) => {
    const { name, playerClass } = req.body;
    if (!name || !playerClass) {
      return res.status(400).json({ error: 'name and playerClass required' });
    }
    const validClasses: PlayerClass[] = ['knight', 'mage', 'ranger', 'rogue', 'cleric'];
    if (!validClasses.includes(playerClass)) {
      return res.status(400).json({ error: `Invalid class. Choose: ${validClasses.join(', ')}` });
    }
    const player = store.createPlayer(name, playerClass);
    store.addToChronicle({
      playerId: player.id, playerName: player.name,
      type: 'player_join',
      description: `${player.name} the ${player.class} has arrived in Veyra!`,
    });
    res.json(player);
  });

  app.get('/api/player/:id', (req, res) => {
    const player = store.getPlayer(req.params.id);
    if (!player) return res.status(404).json({ error: 'Player not found' });
    res.json(player);
  });

  app.get('/api/zones', (_req, res) => {
    res.json(Object.values(ZONES));
  });

  app.get('/api/zones/:id', (req, res) => {
    const zone = ZONES[req.params.id];
    if (!zone) return res.status(404).json({ error: 'Zone not found' });
    res.json(zone);
  });

  app.get('/api/monsters', (_req, res) => {
    res.json(Object.values(MONSTERS));
  });

  app.get('/api/monsters/zone/:zoneId', (req, res) => {
    const monsters = Array.from(store.monsterInstances.values())
      .filter(m => m.monster.zone === req.params.zoneId);
    res.json(monsters);
  });

  app.post('/api/monsters/spawn', (req, res) => {
    const { monsterId, x, y } = req.body;
    const monster = MONSTERS[monsterId];
    if (!monster) return res.status(404).json({ error: 'Monster template not found' });
    const instance = store.spawnMonster(monster, { x, y });
    res.json(instance);
  });

  app.get('/api/items', (_req, res) => {
    res.json(Object.values(ITEMS));
  });

  app.post('/api/combat/start', (req, res) => {
    const { playerId, monsterInstanceId } = req.body;
    const player = store.getPlayer(playerId);
    const monster = store.getMonsterInstance(monsterInstanceId);
    if (!player || !monster) return res.status(404).json({ error: 'Player or monster not found' });

    const state = combat.startCombat(player, monster);
    store.addToChronicle({
      playerId: player.id, playerName: player.name,
      type: 'monster_kill',
      description: `${player.name} engaged ${monster.monster.name} in combat!`,
    });
    res.json(state);
  });

  app.post('/api/combat/attack', (req, res) => {
    const { combatId } = req.body;
    const state = store.activeCombats.get(combatId);
    if (!state) return res.status(404).json({ error: 'Combat not found' });
    const player = store.getPlayer(state.playerId);
    if (!player) return res.status(404).json({ error: 'Player not found' });

    const result = combat.playerAttack(state, player);
    if (result.finished && result.result?.status === 'player_won') {
      store.addToChronicle({
        playerId: player.id, playerName: player.name,
        type: 'monster_kill',
        description: `${player.name} defeated ${store.getMonsterInstance(state.monsterInstanceId)?.monster.name || 'a monster'}!`,
      });
    }
    res.json(result);
  });

  app.post('/api/combat/heal', (req, res) => {
    const { combatId, healAmount } = req.body;
    const state = store.activeCombats.get(combatId);
    if (!state) return res.status(404).json({ error: 'Combat not found' });
    const player = store.getPlayer(state.playerId);
    if (!player) return res.status(404).json({ error: 'Player not found' });
    res.json(combat.playerHeal(state, player, healAmount || 30));
  });

  app.post('/api/combat/flee', (req, res) => {
    const { combatId } = req.body;
    const state = store.activeCombats.get(combatId);
    if (!state) return res.status(404).json({ error: 'Combat not found' });
    const player = store.getPlayer(state.playerId);
    if (!player) return res.status(404).json({ error: 'Player not found' });
    res.json(combat.playerFlee(state, player));
  });

  app.get('/api/quests', (_req, res) => {
    res.json(Object.values(QUESTS));
  });

  app.get('/api/quests/available/:playerId', (req, res) => {
    const player = store.getPlayer(req.params.playerId);
    if (!player) return res.status(404).json({ error: 'Player not found' });
    res.json(getAvailableQuests(player.completedQuests));
  });

  app.post('/api/quests/accept', (req, res) => {
    const { playerId, questId } = req.body;
    const player = store.getPlayer(playerId);
    if (!player) return res.status(404).json({ error: 'Player not found' });
    const quest = QUESTS[questId];
    if (!quest) return res.status(404).json({ error: 'Quest not found' });
    if (player.completedQuests.includes(questId)) return res.status(400).json({ error: 'Already completed' });
    if (quest.prerequisite && !player.completedQuests.includes(quest.prerequisite)) {
      return res.status(400).json({ error: 'Prerequisite not met' });
    }

    const pq = { quest: { ...quest }, status: 'active' as const, startedAt: Date.now() };
    const quests = store.playerQuests.get(playerId) || [];
    quests.push(pq);
    store.playerQuests.set(playerId, quests);
    player.activeQuests.push(quest);
    res.json(pq);
  });

  app.post('/api/quests/complete', (req, res) => {
    const { playerId, questId } = req.body;
    const player = store.getPlayer(playerId);
    if (!player) return res.status(404).json({ error: 'Player not found' });

    const quests = store.playerQuests.get(playerId) || [];
    const pq = quests.find(q => q.quest.id === questId && q.status === 'active');
    if (!pq) return res.status(400).json({ error: 'Quest not active' });

    const allDone = pq.quest.objectives.every(o => o.current >= o.required);
    if (!allDone) return res.status(400).json({ error: 'Objectives not complete' });

    pq.status = 'completed';
    pq.completedAt = Date.now();
    player.completedQuests.push(questId);
    player.activeQuests = player.activeQuests.filter(q => q.id !== questId);

    const r = pq.quest.rewards;
    player.exp += r.exp;
    player.gold += r.gold;
    player.vs += r.vs;
    if (r.items) {
      for (const ri of r.items) {
        const item = ITEMS[ri.itemId];
        if (item) {
          const existing = player.inventory.find(i => i.item.id === ri.itemId && i.item.stackable);
          if (existing) existing.quantity += ri.quantity;
          else player.inventory.push({ item, quantity: ri.quantity });
        }
      }
    }

    store.addToChronicle({
      playerId: player.id, playerName: player.name,
      type: 'quest_complete',
      description: `${player.name} completed quest: ${pq.quest.name}!`,
    });

    res.json({ quest: pq, rewards: r });
  });

  app.post('/api/lyra/talk', async (req, res) => {
    const { playerId, message } = req.body;
    const player = store.getPlayer(playerId);
    if (!player) return res.status(404).json({ error: 'Player not found' });
    const memory = store.getLyraMemory(playerId);

    const result = await lyraAI.chat(player, memory, message);
    player.resonance = Math.min(100, player.resonance + result.resonanceChange);

    memory.conversations.push({
      timestamp: Date.now(), playerMessage: message,
      lyraResponse: result.response, resonanceChange: result.resonanceChange,
      context: result.context,
    });
    memory.lastInteraction = Date.now();
    memory.totalInteractions++;

    res.json({
      message: result.response,
      resonanceChange: result.resonanceChange,
      newResonance: player.resonance,
    });
  });

  app.post('/api/lyra/gift', async (req, res) => {
    const { playerId, itemId } = req.body;
    const player = store.getPlayer(playerId);
    if (!player) return res.status(404).json({ error: 'Player not found' });

    const inv = player.inventory.find(i => i.item.id === itemId);
    if (!inv) return res.status(400).json({ error: 'Item not in inventory' });

    const memory = store.getLyraMemory(playerId);
    const result = await lyraAI.reactToGift(player, memory, inv.item.name);

    inv.quantity -= 1;
    if (inv.quantity <= 0) player.inventory = player.inventory.filter(i => i.item.id !== itemId);

    const resonanceGain = result.resonanceChange;
    player.resonance = Math.min(100, player.resonance + resonanceGain);

    memory.gifts.push({
      itemId, itemName: inv.item.name, timestamp: Date.now(),
      reaction: result.reaction, resonanceChange: resonanceGain,
    });
    memory.resonanceEvents.push({
      type: 'gift', description: `Gave ${inv.item.name}`,
      resonanceChange: resonanceGain, newTotal: player.resonance, timestamp: Date.now(),
    });

    res.json({
      reaction: result.reaction, resonanceChange: resonanceGain,
      newResonance: player.resonance,
    });
  });

  app.get('/api/market', (_req, res) => {
    res.json(marketplace.getAllListings());
  });

  app.post('/api/market/list', (req, res) => {
    const { playerId, itemId, quantity, pricePerUnit, currency } = req.body;
    const player = store.getPlayer(playerId);
    if (!player) return res.status(404).json({ error: 'Player not found' });
    const listing = marketplace.list(player, itemId, quantity, pricePerUnit, currency);
    if (!listing) return res.status(400).json({ error: 'Cannot list item' });
    res.json(listing);
  });

  app.post('/api/market/buy', (req, res) => {
    const { playerId, listingId, quantity } = req.body;
    const player = store.getPlayer(playerId);
    if (!player) return res.status(404).json({ error: 'Player not found' });
    const result = marketplace.buy(player, listingId, quantity);
    if (!result.success) return res.status(400).json({ error: result.error });
    res.json({ success: true });
  });

  app.post('/api/market/cancel', (req, res) => {
    const { playerId, listingId } = req.body;
    const player = store.getPlayer(playerId);
    if (!player) return res.status(404).json({ error: 'Player not found' });
    if (!marketplace.cancel(player, listingId)) return res.status(400).json({ error: 'Cannot cancel' });
    res.json({ success: true });
  });

  app.post('/api/exchange/vs-to-veya', (req, res) => {
    const { playerId, amount } = req.body;
    const player = store.getPlayer(playerId);
    if (!player) return res.status(404).json({ error: 'Player not found' });
    if (!marketplace.convertVsToVeya(player, amount)) {
      return res.status(400).json({ error: 'Insufficient VS (min 100)' });
    }
    store.addToChronicle({
      playerId: player.id, playerName: player.name,
      type: 'trade',
      description: `${player.name} converted ${amount} VS to VEYA tokens!`,
    });
    res.json({ vs: player.vs, veya: player.veyA });
  });

  app.get('/api/chronicle', (req, res) => {
    const limit = parseInt(req.query.limit as string) || 50;
    res.json(store.chronicle.slice(-limit).reverse());
  });

  app.get('/api/constants', (_req, res) => {
    res.json({
      marketTax: MARKET_TAX_RATE,
      soulbondTax: SOULBOND_TAX_RATE,
      vsToVeya: VS_TO_VEYA_RATE,
    });
  });
}

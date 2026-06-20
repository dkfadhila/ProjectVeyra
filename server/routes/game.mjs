import { ITEMS } from '../data/items.mjs';
import { MONSTERS } from '../data/monsters.mjs';
import { QUESTS, getAvailableQuests } from '../data/quests.mjs';
import { ZONES } from '../data/zones.mjs';
import { getMaidenByNpcId, processMaidenRequest, transferItemFromPlayerToMaiden, transferItemFromMaidenToPlayer, MAIDENS } from '../services/maiden.mjs';
import { MARKET_TAX_RATE, SOULBOND_TAX_RATE, VS_TO_VEYA_RATE, DEFAULT_APPEARANCE } from '../shared.mjs';

export function registerGameRoutes(app, store, lyraAI, combat, marketplace, ogStorage, requireAuth) {

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok', game: 'New Project Veyra',
      players: store.players.size,
      monsters: store.monsterInstances.size,
      listings: store.marketListings.size,
    });
  });

  app.post('/api/player/save', (req, res) => {
    const { playerId, position, zone, inventory, equippedItems } = req.body;
    if (!playerId) return res.status(400).json({ error: 'playerId required' });
    const player = store.getPlayer(playerId);
    if (!player) return res.status(404).json({ error: 'Player not found' });
    if (position) player.position = position;
    if (zone) player.zone = zone;
    if (inventory) player.inventory = inventory;
    if (equippedItems) player.equippedItems = equippedItems;
    player.lastActive = Date.now();
    store.saveToDisk();
    res.json({ ok: true });
  });

  app.get('/api/gameName/check', (req, res) => {
    const { name } = req.query;
    if (!name || typeof name !== 'string') return res.status(400).json({ error: 'name required' });
    const taken = store.isGameNameTaken(name);
    res.json({ available: !taken });
  });

  app.post('/api/player/create', requireAuth, (req, res) => {
    const { name, playerClass, appearance } = req.body;
    if (!name || !playerClass) {
      return res.status(400).json({ error: 'name and playerClass required' });
    }
    if (name.length < 2 || name.length > 20) {
      return res.status(400).json({ error: 'name must be 2-20 characters' });
    }
    if (store.isGameNameTaken(name)) {
      return res.status(409).json({ error: 'In-game name already taken' });
    }
    const existing = store.getPlayerByUserId(req.userId);
    if (existing) {
      return res.status(409).json({ error: 'Character already exists' });
    }
    const validClasses = ['knight', 'mage', 'ranger', 'rogue', 'cleric', 'alchemist', 'merchant'];
    if (!validClasses.includes(playerClass)) {
      return res.status(400).json({ error: `Invalid class. Choose: ${validClasses.join(', ')}` });
    }
    const validAppearance = appearance || DEFAULT_APPEARANCE;
    const player = store.createPlayer(name, playerClass, req.userId, validAppearance);
    store.addToChronicle({
      playerId: player.id, playerName: player.name,
      type: 'player_join',
      description: `${player.name} the ${player.class} has arrived in Veyra!`,
    });
    res.json(player);
  });

  app.get('/api/player/me', requireAuth, (req, res) => {
    const player = store.getPlayerByUserId(req.userId);
    if (!player) return res.status(404).json({ error: 'No character found' });
    res.json(player);
  });

  app.get('/api/player/:id', (req, res) => {
    const player = store.getPlayer(req.params.id);
    if (!player) return res.status(404).json({ error: 'Player not found' });
    res.json(player);
  });

  app.get('/api/zones', (_req, res) => { res.json(Object.values(ZONES)); });
  app.get('/api/zones/:id', (req, res) => {
    const zone = ZONES[req.params.id];
    if (!zone) return res.status(404).json({ error: 'Zone not found' });
    res.json(zone);
  });

  app.get('/api/monsters', (_req, res) => { res.json(Object.values(MONSTERS)); });
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

  app.get('/api/items', (_req, res) => { res.json(Object.values(ITEMS)); });

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

  app.post('/api/combat/use-potion', (req, res) => {
    const { combatId, itemId } = req.body;
    const state = store.activeCombats.get(combatId);
    if (!state) return res.status(404).json({ error: 'Combat not found' });
    const player = store.getPlayer(state.playerId);
    if (!player) return res.status(404).json({ error: 'Player not found' });
    res.json(combat.usePotion(state, player, itemId));
  });

  app.get('/api/quests', (_req, res) => { res.json(Object.values(QUESTS)); });
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
    const pq = { quest: { ...quest }, status: 'active', startedAt: Date.now() };
    const quests = store.playerQuests.get(playerId) || [];
    quests.push(pq);
    store.playerQuests.set(playerId, quests);
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
    const { playerId, message, npcId } = req.body;
    const player = store.getPlayer(playerId);
    if (!player) {
      return res.json({
        message: "Welcome, traveler! I don't seem to have your records yet.",
        resonanceChange: 0, newResonance: 0, isRequest: false,
      });
    }
    const targetNpc = npcId || 'lyra';
    const maiden = getMaidenByNpcId(targetNpc);

    if (maiden) {
      const lowerMsg = message.toLowerCase();
      const isRequest = maiden.requestKeywords.some(kw => lowerMsg.includes(kw));
      if (isRequest) {
        const result = processMaidenRequest(targetNpc, player.soulbond, player.resonance, message);
        player.resonance = Math.max(0, Math.min(100, player.resonance + result.resonanceChange));
        return res.json({
          message: result.message, resonanceChange: result.resonanceChange,
          newResonance: player.resonance, isRequest: true,
          requestAccepted: result.accepted, action: result.action,
          maidenProfession: maiden.profession,
        });
      }
    }

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

    let storedHash = '';
    try {
      const storageResult = await ogStorage.uploadLyraMemory(playerId, memory);
      storedHash = storageResult.hash || '';
    } catch {}

    res.json({
      message: result.response, resonanceChange: result.resonanceChange,
      newResonance: player.resonance, storedHash, isRequest: false,
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
    player.resonance = Math.min(100, player.resonance + result.resonanceChange);
    memory.gifts.push({
      itemId, itemName: inv.item.name, timestamp: Date.now(),
      reaction: result.reaction, resonanceChange: result.resonanceChange,
    });
    res.json({
      reaction: result.reaction, resonanceChange: result.resonanceChange,
      newResonance: player.resonance,
    });
  });

  app.get('/api/maiden/profiles', (_req, res) => {
    res.json(Object.values(MAIDENS).map(m => ({
      npcId: m.npcId, name: m.name, profession: m.profession, description: m.description, maxInventorySlots: m.maxInventorySlots,
    })));
  });

  app.get('/api/maiden/inventory/:npcId', (req, res) => {
    const { npcId } = req.params;
    const maiden = getMaidenByNpcId(npcId);
    if (!maiden) return res.status(404).json({ error: 'Maiden not found' });
    const items = store.maidenInventories.get(npcId) || [];
    res.json({ npcId, name: maiden.name, items, maxSlots: 7 });
  });

  app.post('/api/maiden/inventory/give', (req, res) => {
    const { playerId, npcId, itemId, quantity } = req.body;
    const player = store.getPlayer(playerId);
    if (!player) return res.status(404).json({ error: 'Player not found' });
    const maiden = getMaidenByNpcId(npcId);
    if (!maiden) return res.status(404).json({ error: 'Maiden not found' });
    if (!player.soulbond) return res.status(403).json({ error: 'You must be married to this maiden.' });
    const maidenItems = store.maidenInventories.get(npcId) || [];
    const result = transferItemFromPlayerToMaiden(player.inventory, maidenItems, itemId, quantity || 1);
    if (!result.success) return res.status(400).json({ error: result.message });
    player.inventory = result.updatedPlayerItems;
    store.maidenInventories.set(npcId, result.updatedMaidenItems);
    res.json({ success: true, message: result.message, playerInventory: player.inventory, maidenInventory: result.updatedMaidenItems });
  });

  app.post('/api/maiden/inventory/take', (req, res) => {
    const { playerId, npcId, itemId, quantity } = req.body;
    const player = store.getPlayer(playerId);
    if (!player) return res.status(404).json({ error: 'Player not found' });
    const maiden = getMaidenByNpcId(npcId);
    if (!maiden) return res.status(404).json({ error: 'Maiden not found' });
    if (!player.soulbond) return res.status(403).json({ error: 'You must be married to this maiden.' });
    const maidenItems = store.maidenInventories.get(npcId) || [];
    const result = transferItemFromMaidenToPlayer(player.inventory, maidenItems, itemId, quantity || 1);
    if (!result.success) return res.status(400).json({ error: result.message });
    player.inventory = result.updatedPlayerItems;
    store.maidenInventories.set(npcId, result.updatedMaidenItems);
    res.json({ success: true, message: result.message, playerInventory: player.inventory, maidenInventory: result.updatedMaidenItems });
  });

  app.get('/api/market', (_req, res) => { res.json(marketplace.getAllListings()); });
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
    const limit = parseInt(req.query.limit) || 50;
    res.json(store.chronicle.slice(-limit).reverse());
  });

  app.get('/api/leaderboard', (_req, res) => {
    const players = Array.from(store.players.values())
      .sort((a, b) => b.level - a.level || b.exp - a.exp)
      .slice(0, 20)
      .map(p => ({
        id: p.id, name: p.name, class: p.class, level: p.level,
        resonance: p.resonance, soulbond: p.soulbond,
      }));
    res.json(players);
  });

  app.get('/api/online', (_req, res) => {
    const online = Array.from(store.connectedSockets.values())
      .map(id => store.getPlayer(id))
      .filter(Boolean)
      .map(p => ({ id: p.id, name: p.name, level: p.level, zone: p.zone }));
    res.json({ online, count: online.length });
  });

  app.get('/api/constants', (_req, res) => {
    res.json({
      marketTax: MARKET_TAX_RATE,
      soulbondTax: SOULBOND_TAX_RATE,
      vsToVeya: VS_TO_VEYA_RATE,
    });
  });

  app.post('/api/storage/chronicle', async (_req, res) => {
    const result = await ogStorage.uploadChronicle(store.chronicle);
    res.json(result);
  });
}

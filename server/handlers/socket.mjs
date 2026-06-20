import { v4 as uuid } from 'uuid';
import { ZONES } from '../data/zones.mjs';
import { MONSTERS } from '../data/monsters.mjs';

export function registerSocketHandlers(io, store, lyraAI, combat, marketplace) {
  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    socket.on('player:join', (data) => {
      const player = store.getPlayer(data.playerId);
      if (!player) {
        socket.emit('notification', { type: 'error', message: 'Player not found.' });
        return;
      }
      store.connectedSockets.set(socket.id, player.id);
      socket.join(player.zone);
      socket.emit('player:state', player);

      const monsters = Array.from(store.monsterInstances.values())
        .filter(m => m.monster.zone === player.zone && m.currentHp > 0);
      for (const m of monsters) {
        socket.emit('monster:spawned', m);
      }

      socket.to(player.zone).emit('notification', {
        type: 'info',
        message: `${player.name} has entered the zone.`,
      });

      console.log(`[Player] ${player.name} (${player.id}) joined zone: ${player.zone}`);
    });

    socket.on('player:move', (data) => {
      const playerId = store.connectedSockets.get(socket.id);
      if (!playerId) return;
      const player = store.getPlayer(playerId);
      if (!player) return;

      player.position = data.position;
      player.lastActive = Date.now();

      const zone = ZONES[player.zone];
      if (zone) {
        for (const exit of zone.exits) {
          if (
            data.position.x >= exit.position.x - exit.size.width / 2 &&
            data.position.x <= exit.position.x + exit.size.width / 2 &&
            data.position.y >= exit.position.y - exit.size.height / 2 &&
            data.position.y <= exit.position.y + exit.size.height / 2
          ) {
            const newZone = ZONES[exit.toZone];
            if (newZone) {
              player.zone = exit.toZone;
              player.position = { ...newZone.spawnPoint };
              socket.emit('notification', {
                type: 'zone_change',
                message: `Entering ${newZone.name}...`,
              });
              spawnZoneMonsters(store, exit.toZone, io);
            }
          }
        }
      }

      io.to(player.zone).emit('player:moved', {
        playerId, position: data.position, zone: player.zone,
      });
    });

    socket.on('player:attack', (data) => {
      const playerId = store.connectedSockets.get(socket.id);
      if (!playerId) return;
      const player = store.getPlayer(playerId);
      const monster = store.getMonsterInstance(data.monsterInstanceId);
      if (!player || !monster) return;

      let activeCombat = Array.from(store.activeCombats.values())
        .find(c => c.playerId === playerId && c.status === 'active');
      if (!activeCombat) {
        activeCombat = combat.startCombat(player, monster);
      }

      const result = combat.playerAttack(activeCombat, player);
      socket.emit('combat:update', result.combat);

      if (result.finished && result.result) {
        socket.emit('combat:result', result.result);
        if (result.result.levelUp) {
          socket.emit('player:levelup', { playerId, newLevel: player.level });
          store.addToChronicle({
            playerId, playerName: player.name,
            type: 'level_up',
            description: `${player.name} reached level ${player.level}!`,
          });
        }
        store.addToChronicle({
          playerId, playerName: player.name,
          type: 'monster_kill',
          description: `${player.name} defeated ${monster.monster.name}`,
        });
      } else if (result.combat.status === 'monster_won') {
        socket.emit('combat:result', {
          status: 'monster_won', expGained: 0, goldGained: 0,
          itemsGained: [], levelUp: false,
        });
      }
    });

    socket.on('player:flee', () => {
      const playerId = store.connectedSockets.get(socket.id);
      if (!playerId) return;
      const player = store.getPlayer(playerId);
      if (!player) return;

      for (const [id, cs] of store.activeCombats) {
        if (cs.playerId === playerId && cs.status === 'active') {
          const result = combat.playerFlee(cs, player);
          socket.emit('combat:update', result.combat);
          if (result.success) {
            store.activeCombats.delete(id);
          }
          break;
        }
      }
    });

    socket.on('player:useItem', (data) => {
      const playerId = store.connectedSockets.get(socket.id);
      if (!playerId) return;
      const player = store.getPlayer(playerId);
      if (!player) return;

      const inv = player.inventory.find(i => i.item.id === data.itemId);
      if (!inv || inv.item.type !== 'consumable') {
        socket.emit('notification', { type: 'error', message: 'Cannot use that item.' });
        return;
      }

      const effect = inv.item.effect;
      if (!effect) return;

      if (effect.type === 'heal') {
        if (data.itemId.includes('mana')) {
          const healed = Math.min(effect.value, player.maxMp - player.mp);
          player.mp += healed;
          socket.emit('notification', { type: 'success', message: `Restored ${healed} MP.` });
        } else {
          const healed = Math.min(effect.value, player.maxHp - player.hp);
          player.hp += healed;
          socket.emit('notification', { type: 'success', message: `Restored ${healed} HP.` });
        }
      }

      inv.quantity -= 1;
      if (inv.quantity <= 0) player.inventory = player.inventory.filter(i => i.item.id !== data.itemId);
      socket.emit('player:state', player);
    });

    socket.on('lyra:talk', async (data) => {
      const playerId = store.connectedSockets.get(socket.id);
      if (!playerId) return;
      const player = store.getPlayer(playerId);
      if (!player) return;
      const memory = store.getLyraMemory(playerId);

      const result = await lyraAI.chat(player, memory, data.message);
      player.resonance = Math.min(100, player.resonance + result.resonanceChange);

      memory.conversations.push({
        timestamp: Date.now(), playerMessage: data.message,
        lyraResponse: result.response, resonanceChange: result.resonanceChange,
        context: result.context,
      });
      memory.lastInteraction = Date.now();
      memory.totalInteractions++;

      socket.emit('lyra:response', {
        message: result.response,
        resonanceChange: result.resonanceChange,
        newResonance: player.resonance,
      });
    });

    socket.on('lyra:gift', async (data) => {
      const playerId = store.connectedSockets.get(socket.id);
      if (!playerId) return;
      const player = store.getPlayer(playerId);
      if (!player) return;

      const inv = player.inventory.find(i => i.item.id === data.itemId);
      if (!inv) return;

      const memory = store.getLyraMemory(playerId);
      const result = await lyraAI.reactToGift(player, memory, inv.item.name);

      inv.quantity -= 1;
      if (inv.quantity <= 0) player.inventory = player.inventory.filter(i => i.item.id !== data.itemId);

      player.resonance = Math.min(100, player.resonance + result.resonanceChange);

      memory.gifts.push({
        itemId: data.itemId, itemName: inv.item.name, timestamp: Date.now(),
        reaction: result.reaction, resonanceChange: result.resonanceChange,
      });

      socket.emit('lyra:response', {
        message: result.reaction,
        resonanceChange: result.resonanceChange,
        newResonance: player.resonance,
      });
    });

    socket.on('chat:join', (data) => {
      socket.join('global');
      io.to('global').emit('chat:message', {
        id: `join-${Date.now()}`, channel: 'global',
        from: 'System', text: `${data.playerName} has entered the world`,
        timestamp: Date.now(),
      });
    });

    socket.on('chat:global', (data) => {
      io.to('global').emit('chat:message', {
        id: `global-${Date.now()}-${Math.random()}`,
        channel: 'global', from: data.from, fromId: data.fromId, text: data.text,
        timestamp: Date.now(),
      });
    });

    socket.on('chat:dm', (data) => {
      const targetEntry = Array.from(store.connectedSockets.entries()).find(([, pid]) => {
        const p = store.getPlayer(pid);
        return p && p.name.toLowerCase() === data.to.toLowerCase();
      });
      if (targetEntry) {
        const [targetSocketId] = targetEntry;
        io.to(targetSocketId).emit('chat:message', {
          id: `dm-${Date.now()}`, channel: 'dm',
          from: data.from, fromId: data.fromId, to: data.to, text: data.text,
          timestamp: Date.now(),
        });
      }
    });

    socket.on('market:listings', () => {
      const listings = marketplace.getAllListings();
      socket.emit('market:update', listings);
    });

    socket.on('exchange:vsToVeya', (data) => {
      const playerId = store.connectedSockets.get(socket.id);
      if (!playerId) return;
      const player = store.getPlayer(playerId);
      if (!player) return;
      if (!marketplace.convertVsToVeya(player, data.amount)) {
        socket.emit('notification', { type: 'error', message: 'Insufficient VS (min 100)' });
        return;
      }
      socket.emit('notification', { type: 'success', message: `Converted ${data.amount} VS to VEYA` });
      socket.emit('player:state', player);
    });

    socket.on('disconnect', () => {
      const playerId = store.connectedSockets.get(socket.id);
      if (playerId) {
        const player = store.getPlayer(playerId);
        if (player) {
          player.lastActive = Date.now();
          store.savePlayer(playerId);
          io.to('global').emit('chat:message', {
            id: `leave-${Date.now()}`, channel: 'system',
            from: 'System', text: `${player.name} has left the world`,
            timestamp: Date.now(),
          });
        }
        store.connectedSockets.delete(socket.id);
      }
      console.log(`[Socket] Disconnected: ${socket.id}`);
    });
  });
}

function spawnZoneMonsters(store, zoneId, io) {
  const zone = ZONES[zoneId];
  if (!zone || zone.monsters.length === 0) return;

  const existing = Array.from(store.monsterInstances.values())
    .filter(m => m.monster.zone === zoneId && m.currentHp > 0);
  if (existing.length >= 5) return;

  for (let i = existing.length; i < 4; i++) {
    const monsterId = zone.monsters[Math.floor(Math.random() * zone.monsters.length)];
    const monster = MONSTERS[monsterId];
    if (!monster) continue;
    const pos = {
      x: 100 + Math.random() * 600,
      y: 100 + Math.random() * 400,
    };
    const inst = store.spawnMonster(monster, pos);
    io.to(zoneId).emit('monster:spawned', inst);
  }
}

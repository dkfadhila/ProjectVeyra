import { Server, Socket } from 'socket.io';
import {
  ServerToClientEvents, ClientToServerEvents,
  Position, getResonanceLevel,
} from '@project-veyra/shared';
import { GameStore } from '../store';
import { LyraAI } from '../services/lyra-ai';
import { CombatEngine } from '../services/combat';
import { MarketplaceService } from '../services/marketplace';
import { ZONES } from '../data/zones';
import { MONSTERS } from '../data/monsters';

export function registerSocketHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  store: GameStore,
  lyraAI: LyraAI,
  combat: CombatEngine,
  marketplace: MarketplaceService,
) {
  io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    socket.on('player:move', ({ position }) => {
      const playerId = store.connectedSockets.get(socket.id);
      if (!playerId) return;
      const player = store.getPlayer(playerId);
      if (!player) return;

      const zone = ZONES[player.zone];
      if (zone) {
        position.x = Math.max(0, Math.min(zone.bounds.width, position.x));
        position.y = Math.max(0, Math.min(zone.bounds.height, position.y));
      }
      player.position = position;
      player.lastActive = Date.now();

      if (zone) {
        for (const exit of zone.exits) {
          if (
            position.x >= exit.position.x - exit.size.width / 2 &&
            position.x <= exit.position.x + exit.size.width / 2 &&
            position.y >= exit.position.y - exit.size.height / 2 &&
            position.y <= exit.position.y + exit.size.height / 2
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

      io.emit('player:moved', { playerId, position, zone: player.zone });
    });

    socket.on('player:attack', ({ monsterInstanceId }) => {
      const playerId = store.connectedSockets.get(socket.id);
      if (!playerId) return;
      const player = store.getPlayer(playerId);
      const monster = store.getMonsterInstance(monsterInstanceId);
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
          socket.emit('player:levelup', { playerId, newLevel: player.level! });
          store.addToChronicle({
            playerId, playerName: player.name,
            type: 'level_up',
            description: `${player.name} reached level ${player.level}!`,
          });
        }
      }
    });

    socket.on('lyra:talk', async ({ message }) => {
      const playerId = store.connectedSockets.get(socket.id);
      if (!playerId) return;
      const player = store.getPlayer(playerId);
      if (!player) return;
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

      socket.emit('lyra:response', {
        message: result.response,
        resonanceChange: result.resonanceChange,
        newResonance: player.resonance,
      });
    });

    socket.on('lyra:gift', async ({ itemId }) => {
      const playerId = store.connectedSockets.get(socket.id);
      if (!playerId) return;
      const player = store.getPlayer(playerId);
      if (!player) return;

      const inv = player.inventory.find(i => i.item.id === itemId);
      if (!inv) return;

      const memory = store.getLyraMemory(playerId);
      const result = await lyraAI.reactToGift(player, memory, inv.item.name);

      inv.quantity -= 1;
      if (inv.quantity <= 0) player.inventory = player.inventory.filter(i => i.item.id !== itemId);

      player.resonance = Math.min(100, player.resonance + result.resonanceChange);

      memory.gifts.push({
        itemId, itemName: inv.item.name, timestamp: Date.now(),
        reaction: result.reaction, resonanceChange: result.resonanceChange,
      });

      socket.emit('lyra:response', {
        message: result.reaction,
        resonanceChange: result.resonanceChange,
        newResonance: player.resonance,
      });
    });

    socket.on('disconnect', () => {
      const playerId = store.connectedSockets.get(socket.id);
      if (playerId) {
        store.connectedSockets.delete(socket.id);
        console.log(`[Socket] Disconnected: ${socket.id} (player: ${playerId})`);
      }
    });
  });

  function registerPlayer(socketId: string, playerId: string) {
    store.connectedSockets.set(socketId, playerId);
  }

  (io as any).registerPlayer = registerPlayer;
}

function spawnZoneMonsters(store: GameStore, zoneId: string, io: Server) {
  const zone = ZONES[zoneId];
  if (!zone || zone.monsters.length === 0) return;

  const existing = Array.from(store.monsterInstances.values()).filter(m => m.monster.zone === zoneId);
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
    io.emit('monster:spawned', inst);
  }
}

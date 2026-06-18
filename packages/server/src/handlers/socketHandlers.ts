import { v4 as uuid } from 'uuid';
import type { Server, Socket } from 'socket.io';
import type {
  ServerToClientEvents, ClientToServerEvents,
  Player, MonsterInstance,
} from '@project-veyra/shared';
import { db } from '../db/memory';
import { ZONES } from '../data/zones';
import { spawnMonsters, getMonstersInZone, startCombat, playerAttack, playerFlee } from '../services/combatService';
import { acceptQuest, completeQuest, updateQuestProgress, getActiveQuests } from '../services/questService';
import { talkToLyra, giveGiftToLyra } from '../services/lyraService';
import { useConsumable, equipItem } from '../services/playerService';
import { createListing, buyListing, cancelListing, exchangeVsToVeya, getListings } from '../services/marketService';

type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type GameServer = Server<ClientToServerEvents, ServerToClientEvents>;

export function registerSocketHandlers(io: GameServer) {
  io.on('connection', (socket: GameSocket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // === PLAYER AUTH / JOIN ===
    socket.on('player:join', (data: { playerId: string }) => {
      const player = db.getPlayer(data.playerId);
      if (!player) {
        socket.emit('notification', { type: 'error', message: 'Player not found.' });
        return;
      }
      db.socketToPlayer.set(socket.id, player.id);
      db.playerToSocket.set(player.id, socket.id);

      // Join zone room
      socket.join(player.zone);

      // Send current state
      socket.emit('player:state', player as any);

      // Send monsters in zone
      const monsters = getMonstersInZone(player.zone);
      for (const m of monsters) {
        socket.emit('monster:spawned', m);
      }

      // Send active quests
      const quests = getActiveQuests(player.id);
      for (const q of quests) {
        socket.emit('quest:updated', q);
      }

      // Notify zone
      socket.to(player.zone).emit('notification', {
        type: 'info',
        message: `${player.name} has entered the zone.`,
      });

      console.log(`[Player] ${player.name} (${player.id}) joined zone: ${player.zone}`);
    });

    // === MOVEMENT ===
    socket.on('player:move', (data) => {
      const playerId = db.socketToPlayer.get(socket.id);
      if (!playerId) return;
      const player = db.getPlayer(playerId);
      if (!player) return;

      player.position = data.position;
      db.savePlayer(player);

      io.to(player.zone).emit('player:moved', {
        playerId: player.id,
        position: data.position,
        zone: player.zone,
      });
    });

    // === ZONE TRANSITION ===
    socket.on('player:changeZone', (data: { zoneId: string }) => {
      const playerId = db.socketToPlayer.get(socket.id);
      if (!playerId) return;
      const player = db.getPlayer(playerId);
      if (!player) return;

      const zone = ZONES[data.zoneId];
      if (!zone) {
        socket.emit('notification', { type: 'error', message: 'Zone not found.' });
        return;
      }

      // Check if zone is accessible from current
      const currentZone = ZONES[player.zone];
      if (!currentZone?.exits.some(e => e.toZone === data.zoneId)) {
        socket.emit('notification', { type: 'error', message: 'Cannot travel there from here.' });
        return;
      }

      socket.leave(player.zone);
      player.zone = data.zoneId;
      player.position = zone.spawnPoint;
      db.savePlayer(player);
      socket.join(data.zoneId);

      // Spawn monsters if needed
      const existing = getMonstersInZone(data.zoneId);
      if (existing.length === 0 && zone.monsters.length > 0) {
        const spawned = spawnMonsters(data.zoneId);
        for (const m of spawned) {
          io.to(data.zoneId).emit('monster:spawned', m);
        }
      }

      socket.emit('player:state', player as any);
      io.to(data.zoneId).emit('player:moved', {
        playerId: player.id,
        position: player.position,
        zone: data.zoneId,
      });
    });

    // === COMBAT ===
    socket.on('player:attack', (data) => {
      const playerId = db.socketToPlayer.get(socket.id);
      if (!playerId) return;

      // Check if already in combat
      let activeCombat = null;
      for (const cs of db.combatStates.values()) {
        if (cs.playerId === playerId && cs.status === 'active') {
          activeCombat = cs;
          break;
        }
      }

      if (!activeCombat) {
        // Start new combat
        activeCombat = startCombat(playerId, data.monsterInstanceId);
        if (!activeCombat) {
          socket.emit('notification', { type: 'error', message: 'Cannot attack that target.' });
          return;
        }
      }

      socket.emit('combat:update', activeCombat);

      // Process attack
      const result = playerAttack(activeCombat.id);
      if (!result) {
        socket.emit('notification', { type: 'error', message: 'Not your turn.' });
        return;
      }

      socket.emit('combat:update', result.combat);

      if (result.result) {
        socket.emit('combat:result', result.result);

        // Update quest progress
        const monster = db.monsterInstances.get(result.combat.monsterInstanceId)?.monster;
        if (monster) {
          const updated = updateQuestProgress(playerId, 'kill', monster.id);
          if (updated) socket.emit('quest:updated', updated);

          // Chronicle
          db.addChronicleEntry({
            id: require('uuid').v4(),
            playerId,
            playerName: db.getPlayer(playerId)?.name || 'Unknown',
            type: 'monster_kill',
            description: `${db.getPlayer(playerId)?.name} defeated ${monster.name}`,
            metadata: { monsterId: monster.id, level: monster.level },
            timestamp: Date.now(),
          });
        }

        if (result.result.levelUp) {
          io.to(db.getPlayer(playerId)?.zone || '').emit('player:levelup', {
            playerId,
            newLevel: result.result.newLevel!,
          });
        }

        // Clean up combat
        db.combatStates.delete(result.combat.id);

        // Notify zone of monster death
        io.to(db.getPlayer(playerId)?.zone || '').emit('monster:died', {
          instanceId: result.combat.monsterInstanceId,
          killerId: playerId,
        });
      } else if (result.combat.status === 'monster_won') {
        socket.emit('combat:result', {
          status: 'monster_won',
          expGained: 0,
          goldGained: 0,
          itemsGained: [],
          levelUp: false,
        });
        db.combatStates.delete(result.combat.id);
      }
    });

    socket.on('player:flee', () => {
      const playerId = db.socketToPlayer.get(socket.id);
      if (!playerId) return;

      for (const [id, cs] of db.combatStates) {
        if (cs.playerId === playerId && cs.status === 'active') {
          const result = playerFlee(id);
          if (result) {
            socket.emit('combat:update', result);
            if (result.status === 'fled') {
              db.combatStates.delete(id);
            }
          }
          break;
        }
      }
    });

    // === ITEMS ===
    socket.on('player:useItem', (data) => {
      const playerId = db.socketToPlayer.get(socket.id);
      if (!playerId) return;
      const player = db.getPlayer(playerId);
      if (!player) return;

      const result = useConsumable(player, data.itemId);
      socket.emit('notification', {
        type: result.success ? 'success' : 'error',
        message: result.message,
      });

      if (result.success) {
        socket.emit('player:state', player as any);
      }
    });

    socket.on('player:equip', (data) => {
      const playerId = db.socketToPlayer.get(socket.id);
      if (!playerId) return;
      const player = db.getPlayer(playerId);
      if (!player) return;

      const result = equipItem(player, data.itemId, data.slot);
      socket.emit('notification', {
        type: result.success ? 'success' : 'error',
        message: result.message,
      });

      if (result.success) {
        socket.emit('player:state', player as any);
      }
    });

    // === QUESTS ===
    socket.on('quest:accept', (data) => {
      const playerId = db.socketToPlayer.get(socket.id);
      if (!playerId) return;

      const result = acceptQuest(playerId, data.questId);
      socket.emit('notification', {
        type: result.success ? 'success' : 'error',
        message: result.message,
      });

      if (result.success && result.quest) {
        socket.emit('quest:updated', {
          quest: result.quest,
          status: 'active',
          startedAt: Date.now(),
        });
      }
    });

    socket.on('quest:complete', (data) => {
      const playerId = db.socketToPlayer.get(socket.id);
      if (!playerId) return;

      const result = completeQuest(playerId, data.questId);
      socket.emit('notification', {
        type: result.success ? 'success' : 'error',
        message: result.message,
      });

      if (result.success && result.rewards) {
        socket.emit('quest:completed', {
          questId: data.questId,
          rewards: result.rewards,
        });
        const player = db.getPlayer(playerId);
        if (player) socket.emit('player:state', player as any);
      }
    });

    // === LYRA AI NPC ===
    socket.on('lyra:talk', async (data) => {
      const playerId = db.socketToPlayer.get(socket.id);
      if (!playerId) return;

      socket.emit('notification', { type: 'info', message: 'Lyra is thinking...' });

      try {
        const result = await talkToLyra(playerId, data.message);
        socket.emit('lyra:response', {
          message: result.response,
          resonanceChange: result.resonanceChange,
          newResonance: result.newResonance,
        });
      } catch (err) {
        console.error('Lyra talk error:', err);
        socket.emit('lyra:response', {
          message: '...something distracts me. Ask again?',
          resonanceChange: 0,
          newResonance: db.getPlayer(playerId)?.resonance || 0,
        });
      }
    });

    socket.on('lyra:gift', (data) => {
      const playerId = db.socketToPlayer.get(socket.id);
      if (!playerId) return;

      const result = giveGiftToLyra(playerId, data.itemId);
      socket.emit('lyra:response', {
        message: result.reaction,
        resonanceChange: result.resonanceChange,
        newResonance: result.newResonance,
      });

      const player = db.getPlayer(playerId);
      if (player) socket.emit('player:state', player as any);
    });

    // === MARKETPLACE ===
    socket.on('market:list', (data) => {
      const playerId = db.socketToPlayer.get(socket.id);
      if (!playerId) return;

      const result = createListing(playerId, data.itemId, data.quantity, data.pricePerUnit, data.currency);
      socket.emit('notification', {
        type: result.success ? 'success' : 'error',
        message: result.message,
      });

      if (result.success) {
        io.emit('market:update', require('../services/marketService').getListings());
        const player = db.getPlayer(playerId);
        if (player) socket.emit('player:state', player as any);
      }
    });

    socket.on('market:buy', (data) => {
      const playerId = db.socketToPlayer.get(socket.id);
      if (!playerId) return;

      const result = buyListing(playerId, data.listingId, data.quantity);
      socket.emit('notification', {
        type: result.success ? 'success' : 'error',
        message: result.message,
      });

      if (result.success) {
        io.emit('market:update', require('../services/marketService').getListings());
        const player = db.getPlayer(playerId);
        if (player) socket.emit('player:state', player as any);
      }
    });

    socket.on('market:cancel', (data) => {
      const playerId = db.socketToPlayer.get(socket.id);
      if (!playerId) return;

      const result = cancelListing(playerId, data.listingId);
      socket.emit('notification', {
        type: result.success ? 'success' : 'error',
        message: result.message,
      });

      if (result.success) {
        io.emit('market:update', require('../services/marketService').getListings());
      }
    });

    socket.on('market:listings', () => {
      const listings = require('../services/marketService').getListings();
      socket.emit('market:update', listings);
    });

    // === EXCHANGE ===
    socket.on('exchange:vsToVeya', (data) => {
      const playerId = db.socketToPlayer.get(socket.id);
      if (!playerId) return;

      const result = exchangeVsToVeya(playerId, data.amount);
      socket.emit('notification', {
        type: result.success ? 'success' : 'error',
        message: result.message,
      });

      if (result.success) {
        const player = db.getPlayer(playerId);
        if (player) socket.emit('player:state', player as any);
      }
    });

    // === DISCONNECT ===
    socket.on('disconnect', () => {
      const playerId = db.socketToPlayer.get(socket.id);
      if (playerId) {
        const player = db.getPlayer(playerId);
        if (player) {
          io.to(player.zone).emit('notification', {
            type: 'info',
            message: `${player.name} has left the zone.`,
          });
        }
        db.playerToSocket.delete(playerId);
      }
      db.socketToPlayer.delete(socket.id);
      console.log(`[Socket] Disconnected: ${socket.id}`);
    });
  });
}

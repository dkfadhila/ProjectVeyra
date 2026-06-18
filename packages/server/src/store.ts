import { v4 as uuid } from 'uuid';
import {
  Player, PlayerClass, Monster, MonsterInstance, Item, InventoryItem,
  Quest, PlayerQuest, MarketListing, CombatState, LyraMemory,
  ChronicleEntry, Position, CLASS_BASE_STATS, getResonanceLevel,
} from '@project-veyra/shared';

export class GameStore {
  players: Map<string, Player> = new Map();
  monsterInstances: Map<string, MonsterInstance> = new Map();
  activeCombats: Map<string, CombatState> = new Map();
  playerQuests: Map<string, PlayerQuest[]> = new Map();
  marketListings: Map<string, MarketListing> = new Map();
  lyraMemory: Map<string, LyraMemory> = new Map();
  chronicle: ChronicleEntry[] = [];
  connectedSockets: Map<string, string> = new Map(); // socketId -> playerId

  createPlayer(name: string, playerClass: PlayerClass): Player {
    const base = CLASS_BASE_STATS[playerClass];
    const player: Player = {
      id: uuid(),
      name,
      class: playerClass,
      ...base,
      position: { x: 400, y: 300 },
      zone: 'lunaris_village',
      inventory: [],
      equippedItems: { weapon: null, armor: null, accessory: null },
      activeQuests: [],
      completedQuests: [],
      resonance: 0,
      resonanceLevel: 'stranger',
      soulbond: false,
      createdAt: Date.now(),
      lastActive: Date.now(),
    };
    this.players.set(player.id, player);
    this.playerQuests.set(player.id, []);
    return player;
  }

  getPlayer(id: string): Player | undefined { return this.players.get(id); }

  spawnMonster(monster: Monster, pos: Position): MonsterInstance {
    const inst: MonsterInstance = {
      instanceId: uuid(),
      monster: { ...monster },
      currentHp: monster.hp,
      position: pos,
    };
    this.monsterInstances.set(inst.instanceId, inst);
    return inst;
  }

  getMonsterInstance(id: string): MonsterInstance | undefined {
    return this.monsterInstances.get(id);
  }

  removeMonsterInstance(id: string) {
    this.monsterInstances.delete(id);
  }

  addToChronicle(entry: Omit<ChronicleEntry, 'id' | 'timestamp'>): ChronicleEntry {
    const full: ChronicleEntry = { ...entry, id: uuid(), timestamp: Date.now() };
    this.chronicle.push(full);
    return full;
  }

  getLyraMemory(playerId: string): LyraMemory {
    if (!this.lyraMemory.has(playerId)) {
      this.lyraMemory.set(playerId, {
        playerId,
        conversations: [],
        gifts: [],
        resonanceEvents: [],
        lastInteraction: 0,
        totalInteractions: 0,
        playerNotes: '',
      });
    }
    return this.lyraMemory.get(playerId)!;
  }
}

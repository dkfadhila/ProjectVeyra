/**
 * In-memory database. Replace with PostgreSQL/Redis later.
 */
import type {
  Player,
  MonsterInstance,
  CombatState,
  MarketListing,
  MarketTransaction,
  LyraMemory,
  ChronicleEntry,
  Quest,
} from '@project-veyra/shared';

class InMemoryDB {
  players: Map<string, Player> = new Map();
  monsterInstances: Map<string, MonsterInstance> = new Map();
  combatStates: Map<string, CombatState> = new Map();
  marketListings: Map<string, MarketListing> = new Map();
  marketTransactions: MarketTransaction[] = [];
  lyraMemory: Map<string, LyraMemory> = new Map();
  chronicle: ChronicleEntry[] = [];
  playerQuests: Map<string, Map<string, { quest: Quest; status: 'active' | 'completed' | 'failed'; startedAt: number; completedAt?: number }>> = new Map();

  // Track online socket -> playerId mapping
  socketToPlayer: Map<string, string> = new Map();
  playerToSocket: Map<string, string> = new Map();

  getPlayer(id: string): Player | undefined {
    return this.players.get(id);
  }

  savePlayer(player: Player): void {
    player.lastActive = Date.now();
    this.players.set(player.id, player);
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

  addChronicleEntry(entry: ChronicleEntry): void {
    this.chronicle.push(entry);
    // Keep last 500
    if (this.chronicle.length > 500) {
      this.chronicle = this.chronicle.slice(-500);
    }
  }
}

export const db = new InMemoryDB();

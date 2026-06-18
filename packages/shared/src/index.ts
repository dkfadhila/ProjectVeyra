

export interface Player {
  id: string;
  name: string;
  class: PlayerClass;
  level: number;
  exp: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  attack: number;
  defense: number;
  speed: number;
  gold: number;
  vs: number;
  veyA: number;
  position: Position;
  zone: string;
  inventory: InventoryItem[];
  equippedItems: EquippedItems;
  activeQuests: Quest[];
  completedQuests: string[];
  resonance: number;
  resonanceLevel: ResonanceLevel;
  soulbond: boolean;
  createdAt: number;
  lastActive: number;
}

export type PlayerClass = 'knight' | 'mage' | 'ranger' | 'rogue' | 'cleric';

export interface Position {
  x: number;
  y: number;
}

export interface EquippedItems {
  weapon: InventoryItem | null;
  armor: InventoryItem | null;
  accessory: InventoryItem | null;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: Rarity;
  stats?: ItemStats;
  effect?: ItemEffect;
  value: number;
  stackable: boolean;
  maxStack: number;
}

export type ItemType = 'weapon' | 'armor' | 'accessory' | 'consumable' | 'material' | 'gift' | 'key';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface ItemStats {
  attack?: number;
  defense?: number;
  speed?: number;
  hp?: number;
  mp?: number;
}

export interface ItemEffect {
  type: 'heal' | 'buff' | 'damage' | 'resonance';
  value: number;
  duration?: number;
}

export interface InventoryItem {
  item: Item;
  quantity: number;
}

export interface Monster {
  id: string;
  name: string;
  description: string;
  level: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  exp: number;
  gold: number;
  drops: DropEntry[];
  zone: string;
  sprite: string;
}

export interface DropEntry {
  itemId: string;
  chance: number;
  minQty: number;
  maxQty: number;
}

export interface MonsterInstance {
  instanceId: string;
  monster: Monster;
  currentHp: number;
  position: Position;
  respawnAt?: number;
}

export interface CombatState {
  id: string;
  playerId: string;
  monsterInstanceId: string;
  playerHp: number;
  monsterHp: number;
  turn: 'player' | 'monster';
  log: CombatLogEntry[];
  startedAt: number;
  status: 'active' | 'player_won' | 'monster_won' | 'fled';
}

export interface CombatLogEntry {
  turn: number;
  actor: 'player' | 'monster';
  action: 'attack' | 'skill' | 'heal' | 'flee';
  damage?: number;
  heal?: number;
  message: string;
  timestamp: number;
}

export interface CombatResult {
  status: 'player_won' | 'monster_won' | 'fled';
  expGained: number;
  goldGained: number;
  itemsGained: InventoryItem[];
  levelUp: boolean;
  newLevel?: number;
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  type: QuestType;
  objectives: QuestObjective[];
  rewards: QuestRewards;
  prerequisite?: string;
  level: number;
  zone: string;
  npcGiver: string;
  dialogue: QuestDialogue;
}

export type QuestType = 'main' | 'side' | 'daily' | 'hidden';

export interface QuestObjective {
  id: string;
  type: 'kill' | 'collect' | 'talk' | 'explore';
  target: string;
  current: number;
  required: number;
  description: string;
}

export interface QuestRewards {
  exp: number;
  gold: number;
  vs: number;
  items?: { itemId: string; quantity: number }[];
}

export interface QuestDialogue {
  offer: string;
  inProgress: string;
  complete: string;
}

export interface PlayerQuest {
  quest: Quest;
  status: 'active' | 'completed' | 'failed';
  startedAt: number;
  completedAt?: number;
}

export interface LyraMemory {
  playerId: string;
  conversations: ConversationEntry[];
  gifts: GiftEntry[];
  resonanceEvents: ResonanceEvent[];
  lastInteraction: number;
  totalInteractions: number;
  playerNotes: string;
  ogStorageHash?: string;
}

export interface ConversationEntry {
  timestamp: number;
  playerMessage: string;
  lyraResponse: string;
  resonanceChange: number;
  context: string;
}

export interface GiftEntry {
  itemId: string;
  itemName: string;
  timestamp: number;
  reaction: string;
  resonanceChange: number;
}

export interface ResonanceEvent {
  type: 'gift' | 'quest' | 'conversation' | 'soulbond';
  description: string;
  resonanceChange: number;
  newTotal: number;
  timestamp: number;
}

export type ResonanceLevel = 'stranger' | 'friend' | 'companion' | 'beloved' | 'soulbond';

export const RESONANCE_THRESHOLDS: Record<ResonanceLevel, [number, number]> = {
  stranger: [0, 20],
  friend: [21, 40],
  companion: [41, 60],
  beloved: [61, 80],
  soulbond: [81, 100],
};

export function getResonanceLevel(resonance: number): ResonanceLevel {
  if (resonance >= 81) return 'soulbond';
  if (resonance >= 61) return 'beloved';
  if (resonance >= 41) return 'companion';
  if (resonance >= 21) return 'friend';
  return 'stranger';
}

export interface MarketListing {
  id: string;
  sellerId: string;
  sellerName: string;
  itemId: string;
  itemName: string;
  quantity: number;
  pricePerUnit: number;
  currency: 'gold' | 'vs' | 'veya';
  listedAt: number;
  expiresAt: number;
}

export interface MarketTransaction {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  itemId: string;
  quantity: number;
  totalPrice: number;
  currency: 'gold' | 'vs' | 'veya';
  tax: number;
  timestamp: number;
}

export const MARKET_TAX_RATE = 0.05;
export const SOULBOND_TAX_RATE = 0.02;
export const VS_TO_VEYA_RATE = 100;

export interface Zone {
  id: string;
  name: string;
  description: string;
  biome: Biome;
  level: [number, number];
  monsters: string[];
  npcs: string[];
  exits: ZoneExit[];
  spawnPoint: Position;
  bounds: { x: number; y: number; width: number; height: number };
}

export type Biome = 'forest' | 'coast' | 'mountain' | 'desert' | 'swamp' | 'city';

export interface ZoneExit {
  toZone: string;
  position: Position;
  size: { width: number; height: number };
}

export interface ChronicleEntry {
  id: string;
  playerId: string;
  playerName: string;
  type: ChronicleEventType;
  description: string;
  metadata?: Record<string, any>;
  timestamp: number;
  ogStorageHash?: string;
}

export type ChronicleEventType =
  | 'player_join'
  | 'level_up'
  | 'monster_kill'
  | 'quest_complete'
  | 'item_craft'
  | 'trade'
  | 'soulbond'
  | 'boss_kill'
  | 'first_clear'
  | 'world_event';

export interface ServerToClientEvents {
  'player:moved': (data: { playerId: string; position: Position; zone: string }) => void;
  'player:state': (data: Player) => void;
  'monster:spawned': (data: MonsterInstance) => void;
  'monster:died': (data: { instanceId: string; killerId: string }) => void;
  'combat:update': (data: CombatState) => void;
  'combat:result': (data: CombatResult) => void;
  'quest:updated': (data: PlayerQuest) => void;
  'quest:completed': (data: { questId: string; rewards: QuestRewards }) => void;
  'lyra:response': (data: { message: string; resonanceChange: number; newResonance: number }) => void;
  'market:update': (data: MarketListing[]) => void;
  'chronicle:new': (data: ChronicleEntry) => void;
  'player:levelup': (data: { playerId: string; newLevel: number }) => void;
  'notification': (data: { type: string; message: string }) => void;
}

export interface ClientToServerEvents {
  'player:move': (data: { position: Position }) => void;
  'player:join': (data: { playerId: string }) => void;
  'player:changeZone': (data: { zoneId: string }) => void;
  'player:attack': (data: { monsterInstanceId: string }) => void;
  'player:flee': () => void;
  'player:useItem': (data: { itemId: string }) => void;
  'player:equip': (data: { itemId: string; slot: 'weapon' | 'armor' | 'accessory' }) => void;
  'quest:accept': (data: { questId: string }) => void;
  'quest:complete': (data: { questId: string }) => void;
  'lyra:talk': (data: { message: string }) => void;
  'lyra:gift': (data: { itemId: string }) => void;
  'market:list': (data: { itemId: string; quantity: number; pricePerUnit: number; currency: 'gold' | 'vs' }) => void;
  'market:buy': (data: { listingId: string; quantity: number }) => void;
  'market:cancel': (data: { listingId: string }) => void;
  'market:listings': () => void;
  'exchange:vsToVeya': (data: { amount: number }) => void;
}

export const CLASS_BASE_STATS: Record<PlayerClass, Omit<Player, 'id' | 'name' | 'class' | 'position' | 'zone' | 'inventory' | 'equippedItems' | 'activeQuests' | 'completedQuests' | 'createdAt' | 'lastActive' | 'soulbond' | 'resonance' | 'resonanceLevel'>> = {
  knight:  { level: 1, exp: 0, hp: 120, maxHp: 120, mp: 30, maxMp: 30, attack: 15, defense: 12, speed: 8,  gold: 100, vs: 0, veyA: 0 },
  mage:    { level: 1, exp: 0, hp: 70,  maxHp: 70,  mp: 100, maxMp: 100, attack: 8,  defense: 5,  speed: 10, gold: 80,  vs: 0, veyA: 0 },
  ranger:  { level: 1, exp: 0, hp: 90,  maxHp: 90,  mp: 50, maxMp: 50, attack: 12, defense: 7,  speed: 14, gold: 90,  vs: 0, veyA: 0 },
  rogue:   { level: 1, exp: 0, hp: 80,  maxHp: 80,  mp: 40, maxMp: 40, attack: 14, defense: 6,  speed: 16, gold: 120, vs: 0, veyA: 0 },
  cleric:  { level: 1, exp: 0, hp: 100, maxHp: 100, mp: 80, maxMp: 80, attack: 6,  defense: 10, speed: 9,  gold: 85,  vs: 0, veyA: 0 },
};

export const EXP_PER_LEVEL = [
  0, 100, 250, 500, 850, 1300, 1900, 2700, 3800, 5200,
  7000, 9200, 12000, 15500, 20000, 25500, 32000, 40000, 50000, 65000,
];

export function getExpForLevel(level: number): number {
  if (level < EXP_PER_LEVEL.length) return EXP_PER_LEVEL[level];
  return Math.floor(EXP_PER_LEVEL[EXP_PER_LEVEL.length - 1] * (level / 20) * 1.5);
}

export const MAX_LEVEL = 50;
export const RESOULDBOND_COST = 1000;

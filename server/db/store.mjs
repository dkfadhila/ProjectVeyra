import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuid } from 'uuid';
import {
  CLASS_BASE_STATS, DEFAULT_APPEARANCE,
  getExpForLevel, MAX_LEVEL, getResonanceLevel,
} from '../shared.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SAVE_FILE = path.join(__dirname, '..', 'data', 'veyra-save.json');
const SAVE_FILE_TMP = SAVE_FILE + '.tmp';
const AUTO_SAVE_INTERVAL = 30_000;

export class GameStore {
  constructor() {
    this.players = new Map();
    this.users = new Map();
    this.passwords = new Map();
    this.monsterInstances = new Map();
    this.activeCombats = new Map();
    this.playerQuests = new Map();
    this.marketListings = new Map();
    this.lyraMemory = new Map();
    this.maidenInventories = new Map();
    this.chronicle = [];
    this.connectedSockets = new Map();
    this._saveTimer = null;

    this.loadFromDisk();
    this._saveTimer = setInterval(() => this.saveToDisk(), AUTO_SAVE_INTERVAL);
  }

  saveToDisk() {
    try {
      const dir = path.dirname(SAVE_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const data = {
        players: Object.fromEntries(this.players),
        users: Object.fromEntries(this.users),
        passwords: Object.fromEntries(this.passwords),
        playerQuests: Object.fromEntries(this.playerQuests),
        marketListings: Object.fromEntries(this.marketListings),
        lyraMemory: Object.fromEntries(this.lyraMemory),
        maidenInventories: Object.fromEntries(this.maidenInventories),
        chronicle: this.chronicle,
      };
      const json = JSON.stringify(data, null, 2);
      fs.writeFileSync(SAVE_FILE_TMP, json, 'utf-8');
      fs.renameSync(SAVE_FILE_TMP, SAVE_FILE);
    } catch (err) {
      console.error('[Store] Save failed:', err);
    }
  }

  loadFromDisk() {
    try {
      if (!fs.existsSync(SAVE_FILE)) return;
      const raw = fs.readFileSync(SAVE_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (data.players) this.players = new Map(Object.entries(data.players));
      if (data.users) this.users = new Map(Object.entries(data.users));
      if (data.passwords) this.passwords = new Map(Object.entries(data.passwords));
      if (data.playerQuests) this.playerQuests = new Map(Object.entries(data.playerQuests));
      if (data.marketListings) this.marketListings = new Map(Object.entries(data.marketListings));
      if (data.lyraMemory) this.lyraMemory = new Map(Object.entries(data.lyraMemory));
      if (data.maidenInventories) this.maidenInventories = new Map(Object.entries(data.maidenInventories));
      if (data.chronicle) this.chronicle = data.chronicle;
      this.recoverOrphanedPlayers();
      console.log(`[Store] Loaded: ${this.players.size} players, ${this.users.size} users`);
    } catch (err) {
      console.error('[Store] Load failed (starting fresh):', err);
    }
  }

  recoverOrphanedPlayers() {
    let recovered = 0;
    for (const player of this.players.values()) {
      if (player.userId && !this.users.has(player.userId)) {
        const placeholderUser = {
          id: player.userId,
          username: player.name,
          email: player.name + '@veyra.game',
          createdAt: Date.now(),
        };
        this.users.set(placeholderUser.id, placeholderUser);
        this.passwords.set(placeholderUser.username, { hash: '__recovery_placeholder__', userId: placeholderUser.id });
        this.passwords.set(placeholderUser.email, { hash: '__recovery_placeholder__', userId: placeholderUser.id });
        recovered++;
      }
    }
    if (recovered > 0) {
      console.log(`[Store] Recovered ${recovered} orphaned player(s)`);
      this.saveToDisk();
    }
  }

  updatePasswordHash(userId, newHash) {
    for (const [key, record] of this.passwords.entries()) {
      if (record.userId === userId) {
        this.passwords.set(key, { hash: newHash, userId });
      }
    }
    this.saveToDisk();
  }

  savePlayer(playerId) {
    this.saveToDisk();
  }

  createUser(user, passwordHash) {
    this.users.set(user.id, user);
    this.passwords.set(user.username, { hash: passwordHash, userId: user.id });
    this.passwords.set(user.email, { hash: passwordHash, userId: user.id });
    this.saveToDisk();
  }

  getUserByUsername(username) {
    const record = this.passwords.get(username);
    if (!record) return undefined;
    return this.users.get(record.userId);
  }

  getUserByEmail(email) {
    const record = this.passwords.get(email);
    if (!record) return undefined;
    return this.users.get(record.userId);
  }

  getUserById(id) {
    return this.users.get(id);
  }

  getPasswordRecord(login) {
    return this.passwords.get(login);
  }

  getPlayerByUserId(userId) {
    for (const player of this.players.values()) {
      if (player.userId === userId) return player;
    }
    return undefined;
  }

  isGameNameTaken(gameName) {
    for (const player of this.players.values()) {
      if (player.name.toLowerCase() === gameName.toLowerCase()) return true;
    }
    return false;
  }

  createPlayer(name, playerClass, userId, appearance) {
    const base = CLASS_BASE_STATS[playerClass] || CLASS_BASE_STATS.knight;
    const player = {
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
      appearance: appearance || DEFAULT_APPEARANCE,
      userId,
      createdAt: Date.now(),
      lastActive: Date.now(),
    };
    this.players.set(player.id, player);
    this.playerQuests.set(player.id, []);
    this.saveToDisk();
    return player;
  }

  getPlayer(id) { return this.players.get(id); }

  spawnMonster(monster, pos) {
    const inst = {
      instanceId: uuid(),
      monster: { ...monster },
      currentHp: monster.hp,
      position: pos,
    };
    this.monsterInstances.set(inst.instanceId, inst);
    return inst;
  }

  getMonsterInstance(id) { return this.monsterInstances.get(id); }
  removeMonsterInstance(id) { this.monsterInstances.delete(id); }

  addToChronicle(entry) {
    const full = { ...entry, id: uuid(), timestamp: Date.now() };
    this.chronicle.push(full);
    if (this.chronicle.length > 500) this.chronicle = this.chronicle.slice(-500);
    return full;
  }

  getLyraMemory(playerId) {
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
    return this.lyraMemory.get(playerId);
  }
}

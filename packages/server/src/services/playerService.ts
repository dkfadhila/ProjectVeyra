import { v4 as uuid } from 'uuid';
import type {
  Player, PlayerClass, InventoryItem, Position,
  CLASS_BASE_STATS, getResonanceLevel,
} from '@project-veyra/shared';
import { db } from '../db/memory';
import { ITEMS } from '../data/items';

export function createPlayer(name: string, playerClass: PlayerClass): Player {
  const base = {
    level: 1, exp: 0,
    hp: 120, maxHp: 120, mp: 30, maxMp: 30,
    attack: 15, defense: 12, speed: 8,
    gold: 100, vs: 0, veyA: 0,
  };

  const classStats: Record<PlayerClass, typeof base> = {
    knight: { level: 1, exp: 0, hp: 120, maxHp: 120, mp: 30, maxMp: 30, attack: 15, defense: 12, speed: 8, gold: 100, vs: 0, veyA: 0 },
    mage:   { level: 1, exp: 0, hp: 70,  maxHp: 70,  mp: 100, maxMp: 100, attack: 8, defense: 5, speed: 10, gold: 80, vs: 0, veyA: 0 },
    ranger: { level: 1, exp: 0, hp: 90,  maxHp: 90,  mp: 50, maxMp: 50, attack: 12, defense: 7, speed: 14, gold: 90, vs: 0, veyA: 0 },
    rogue:  { level: 1, exp: 0, hp: 80,  maxHp: 80,  mp: 40, maxMp: 40, attack: 14, defense: 6, speed: 16, gold: 120, vs: 0, veyA: 0 },
    cleric: { level: 1, exp: 0, hp: 100, maxHp: 100, mp: 80, maxMp: 80, attack: 6, defense: 10, speed: 9, gold: 85, vs: 0, veyA: 0 },
  };

  const stats = classStats[playerClass];

  const player: Player = {
    id: uuid(),
    name,
    class: playerClass,
    ...stats,
    position: { x: 5, y: 5 },
    zone: 'azure_coast',
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

  db.savePlayer(player);

  db.addChronicleEntry({
    id: uuid(),
    playerId: player.id,
    playerName: player.name,
    type: 'player_join',
    description: `${player.name} the ${playerClass} has arrived in Veyra!`,
    timestamp: Date.now(),
  });

  return player;
}

export function addExp(player: Player, amount: number): boolean {
  player.exp += amount;
  const expTable = [0, 100, 250, 500, 850, 1300, 1900, 2700, 3800, 5200, 7000, 9200, 12000, 15500, 20000, 25500, 32000, 40000, 50000, 65000];
  let leveledUp = false;

  while (player.level < 50) {
    const needed = player.level < expTable.length
      ? expTable[player.level]
      : Math.floor(expTable[expTable.length - 1] * (player.level / 20) * 1.5);
    if (player.exp >= needed) {
      player.exp -= needed;
      player.level++;
      player.maxHp += 10 + player.level;
      player.hp = player.maxHp;
      player.maxMp += 5;
      player.mp = player.maxMp;
      player.attack += 2;
      player.defense += 1;
      player.speed += 1;
      leveledUp = true;
    } else {
      break;
    }
  }

  db.savePlayer(player);
  return leveledUp;
}

export function addItemToInventory(player: Player, itemId: string, quantity: number = 1): boolean {
  const itemDef = ITEMS[itemId];
  if (!itemDef) return false;

  const existing = player.inventory.find(i => i.item.id === itemId);
  if (existing && itemDef.stackable) {
    existing.quantity += quantity;
  } else {
    player.inventory.push({ item: { ...itemDef }, quantity });
  }
  db.savePlayer(player);
  return true;
}

export function removeItemFromInventory(player: Player, itemId: string, quantity: number = 1): boolean {
  const existing = player.inventory.find(i => i.item.id === itemId);
  if (!existing || existing.quantity < quantity) return false;

  existing.quantity -= quantity;
  if (existing.quantity <= 0) {
    player.inventory = player.inventory.filter(i => i.item.id !== itemId);
  }
  db.savePlayer(player);
  return true;
}

export function useConsumable(player: Player, itemId: string): { success: boolean; message: string } {
  const invItem = player.inventory.find(i => i.item.id === itemId);
  if (!invItem || invItem.item.type !== 'consumable') {
    return { success: false, message: 'Item not found or not consumable.' };
  }

  const effect = invItem.item.effect;
  if (!effect) return { success: false, message: 'This item has no effect.' };

  if (effect.type === 'heal') {
    const healed = Math.min(effect.value, player.maxHp - player.hp);
    player.hp = Math.min(player.maxHp, player.hp + effect.value);
    removeItemFromInventory(player, itemId, 1);
    return { success: true, message: `Restored ${healed} HP. HP: ${player.hp}/${player.maxHp}` };
  }

  if (effect.type === 'buff') {
    const restored = Math.min(effect.value, player.maxMp - player.mp);
    player.mp = Math.min(player.maxMp, player.mp + effect.value);
    removeItemFromInventory(player, itemId, 1);
    return { success: true, message: `Restored ${restored} MP. MP: ${player.mp}/${player.maxMp}` };
  }

  return { success: false, message: 'Unknown effect type.' };
}

export function equipItem(player: Player, itemId: string, slot: 'weapon' | 'armor' | 'accessory'): { success: boolean; message: string } {
  const invItem = player.inventory.find(i => i.item.id === itemId);
  if (!invItem) return { success: false, message: 'Item not in inventory.' };

  const validSlot = invItem.item.type === slot || (slot === 'accessory' && invItem.item.type === 'accessory');
  if (!validSlot) return { success: false, message: `Cannot equip ${invItem.item.name} in ${slot} slot.` };

  const current = player.equippedItems[slot];
  if (current) {
    if (current.item.stats) {
      if (current.item.stats.attack) player.attack -= current.item.stats.attack;
      if (current.item.stats.defense) player.defense -= current.item.stats.defense;
      if (current.item.stats.speed) player.speed -= current.item.stats.speed;
      if (current.item.stats.hp) { player.maxHp -= current.item.stats.hp; player.hp = Math.min(player.hp, player.maxHp); }
      if (current.item.stats.mp) { player.maxMp -= current.item.stats.mp; player.mp = Math.min(player.mp, player.maxMp); }
    }
    addItemToInventory(player, current.item.id, 1);
  }

  player.equippedItems[slot] = { item: invItem.item, quantity: 1 };
  removeItemFromInventory(player, itemId, 1);

  if (invItem.item.stats) {
    if (invItem.item.stats.attack) player.attack += invItem.item.stats.attack;
    if (invItem.item.stats.defense) player.defense += invItem.item.stats.defense;
    if (invItem.item.stats.speed) player.speed += invItem.item.stats.speed;
    if (invItem.item.stats.hp) { player.maxHp += invItem.item.stats.hp; player.hp += invItem.item.stats.hp; }
    if (invItem.item.stats.mp) { player.maxMp += invItem.item.stats.mp; player.mp += invItem.item.stats.mp; }
  }

  db.savePlayer(player);
  return { success: true, message: `Equipped ${invItem.item.name} in ${slot} slot.` };
}

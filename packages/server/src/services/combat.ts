import { v4 as uuid } from 'uuid';
import {
  Player, MonsterInstance, CombatState, CombatResult, CombatLogEntry,
  InventoryItem, Item, getExpForLevel, MAX_LEVEL,
} from '@project-veyra/shared';
import { GameStore } from '../store';
import { getItem } from '../data/items';

export class CombatEngine {
  constructor(private store: GameStore) {}

  startCombat(player: Player, monster: MonsterInstance): CombatState {
    const state: CombatState = {
      id: uuid(),
      playerId: player.id,
      monsterInstanceId: monster.instanceId,
      playerHp: player.hp,
      monsterHp: monster.currentHp,
      turn: player.speed >= monster.monster.speed ? 'player' : 'monster',
      log: [],
      startedAt: Date.now(),
      status: 'active',
    };
    this.store.activeCombats.set(state.id, state);
    return state;
  }

  playerAttack(combat: CombatState, player: Player): { combat: CombatState; finished: boolean; result?: CombatResult } {
    const monster = this.store.getMonsterInstance(combat.monsterInstanceId);
    if (!monster || combat.status !== 'active') return { combat, finished: false };

    // Player attacks
    const pAtk = player.attack + (player.equippedItems.weapon?.item.stats?.attack || 0);
    const mDef = monster.monster.defense;
    const damage = Math.max(1, pAtk - mDef + Math.floor(Math.random() * 5));
    combat.monsterHp = Math.max(0, combat.monsterHp - damage);
    combat.log.push({
      turn: combat.log.length + 1, actor: 'player', action: 'attack', damage,
      message: `${player.name} attacks ${monster.monster.name} for ${damage} damage!`,
      timestamp: Date.now(),
    });

    if (combat.monsterHp <= 0) {
      combat.status = 'player_won';
      const result = this.resolveCombat(combat, player, monster);
      return { combat, finished: true, result };
    }

    // Monster attacks back
    const mAtk = monster.monster.attack;
    const pDef = player.defense + (player.equippedItems.armor?.item.stats?.defense || 0);
    const mDmg = Math.max(1, mAtk - pDef + Math.floor(Math.random() * 3));
    combat.playerHp = Math.max(0, combat.playerHp - mDmg);
    combat.log.push({
      turn: combat.log.length + 1, actor: 'monster', action: 'attack', damage: mDmg,
      message: `${monster.monster.name} attacks ${player.name} for ${mDmg} damage!`,
      timestamp: Date.now(),
    });

    if (combat.playerHp <= 0) {
      combat.status = 'monster_won';
      return { combat, finished: true, result: this.resolveDefeat(combat, player) };
    }

    return { combat, finished: false };
  }

  playerHeal(combat: CombatState, player: Player, healAmount: number): CombatState {
    const healed = Math.min(healAmount, player.maxHp - combat.playerHp);
    combat.playerHp += healed;
    combat.log.push({
      turn: combat.log.length + 1, actor: 'player', action: 'heal', heal: healed,
      message: `${player.name} heals for ${healed} HP!`,
      timestamp: Date.now(),
    });
    return combat;
  }

  playerFlee(combat: CombatState, player: Player): { combat: CombatState; success: boolean } {
    const chance = 0.4 + (player.speed * 0.02);
    if (Math.random() < chance) {
      combat.status = 'fled';
      return { combat, success: true };
    }
    // Failed flee, monster gets free attack
    const monster = this.store.getMonsterInstance(combat.monsterInstanceId);
    if (monster) {
      const mDmg = Math.max(1, monster.monster.attack - player.defense);
      combat.playerHp = Math.max(0, combat.playerHp - mDmg);
      combat.log.push({
        turn: combat.log.length + 1, actor: 'monster', action: 'attack', damage: mDmg,
        message: `Failed to flee! ${monster.monster.name} attacks for ${mDmg}!`,
        timestamp: Date.now(),
      });
    }
    return { combat, success: false };
  }

  private resolveCombat(combat: CombatState, player: Player, monster: MonsterInstance): CombatResult {
    const drops: InventoryItem[] = [];
    for (const drop of monster.monster.drops) {
      if (Math.random() <= drop.chance) {
        const item = getItem(drop.itemId);
        if (item) {
          const qty = drop.minQty + Math.floor(Math.random() * (drop.maxQty - drop.minQty + 1));
          drops.push({ item, quantity: qty });
        }
      }
    }

    const expGained = monster.monster.exp;
    const goldGained = monster.monster.gold + Math.floor(Math.random() * 10);
    const oldLevel = player.level;

    player.exp += expGained;
    player.gold += goldGained;

    // Add drops to inventory
    for (const drop of drops) {
      const existing = player.inventory.find(i => i.item.id === drop.item.id && i.item.stackable);
      if (existing) {
        existing.quantity += drop.quantity;
      } else {
        player.inventory.push({ ...drop });
      }
    }

    // Level up check
    let levelUp = false;
    while (player.level < MAX_LEVEL && player.exp >= getExpForLevel(player.level + 1)) {
      player.level++;
      player.maxHp += 10;
      player.maxMp += 5;
      player.attack += 2;
      player.defense += 1;
      player.speed += 1;
      player.hp = player.maxHp;
      player.mp = player.maxMp;
      levelUp = true;
    }

    this.store.removeMonsterInstance(monster.instanceId);
    this.store.activeCombats.delete(combat.id);

    return {
      status: 'player_won', expGained, goldGained, itemsGained: drops,
      levelUp, newLevel: levelUp ? player.level : undefined,
    };
  }

  private resolveDefeat(combat: CombatState, player: Player): CombatResult {
    player.hp = Math.floor(player.maxHp * 0.3);
    player.gold = Math.max(0, player.gold - Math.floor(player.gold * 0.1));
    this.store.activeCombats.delete(combat.id);
    return {
      status: 'monster_won', expGained: 0, goldGained: 0,
      itemsGained: [], levelUp: false,
    };
  }
}

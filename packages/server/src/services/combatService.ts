import { v4 as uuid } from 'uuid';
import type {
  Monster, MonsterInstance, CombatState, CombatLogEntry, CombatResult, Position, Player, InventoryItem,
} from '@project-veyra/shared';
import { db } from '../db/memory';
import { MONSTERS } from '../data/monsters';
import { ITEMS } from '../data/items';
import { addExp, addItemToInventory } from './playerService';

const MONSTER_RESPAWN_MS = 30000;

export function spawnMonsters(zone: string): MonsterInstance[] {
  const spawned: MonsterInstance[] = [];
  const monsterDefs = MONSTERS;
  const zoneMonsters = Object.values(monsterDefs).filter(m => m.zone === zone);

  for (const monsterDef of zoneMonsters) {
    // Spawn 2-3 of each type
    const count = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) {
      const inst: MonsterInstance = {
        instanceId: uuid(),
        monster: { ...monsterDef },
        currentHp: monsterDef.maxHp,
        position: {
          x: 10 + Math.floor(Math.random() * 80),
          y: 10 + Math.floor(Math.random() * 80),
        },
      };
      db.monsterInstances.set(inst.instanceId, inst);
      spawned.push(inst);
    }
  }
  return spawned;
}

export function getMonstersInZone(zone: string): MonsterInstance[] {
  return Array.from(db.monsterInstances.values()).filter(
    m => m.monster.zone === zone && m.currentHp > 0
  );
}

export function startCombat(playerId: string, monsterInstanceId: string): CombatState | null {
  const player = db.getPlayer(playerId);
  const monsterInst = db.monsterInstances.get(monsterInstanceId);
  if (!player || !monsterInst || monsterInst.currentHp <= 0) return null;

  // Check if player already in combat
  for (const cs of db.combatStates.values()) {
    if (cs.playerId === playerId && cs.status === 'active') return null;
  }

  const combat: CombatState = {
    id: uuid(),
    playerId,
    monsterInstanceId,
    playerHp: player.hp,
    monsterHp: monsterInst.currentHp,
    turn: player.speed >= monsterInst.monster.speed ? 'player' : 'monster',
    log: [],
    startedAt: Date.now(),
    status: 'active',
  };

  db.combatStates.set(combat.id, combat);
  return combat;
}

export function playerAttack(combatId: string): { combat: CombatState; result?: CombatResult } | null {
  const combat = db.combatStates.get(combatId);
  if (!combat || combat.status !== 'active' || combat.turn !== 'player') return null;

  const player = db.getPlayer(combat.playerId);
  const monsterInst = db.monsterInstances.get(combat.monsterInstanceId);
  if (!player || !monsterInst) return null;

  const turn = combat.log.length + 1;

  // Player attacks
  const rawDmg = Math.max(1, player.attack - Math.floor(monsterInst.monster.defense * 0.5));
  const variance = 0.8 + Math.random() * 0.4;
  const damage = Math.floor(rawDmg * variance);

  combat.monsterHp = Math.max(0, combat.monsterHp - damage);
  combat.log.push({
    turn,
    actor: 'player',
    action: 'attack',
    damage,
    message: `${player.name} attacks ${monsterInst.monster.name} for ${damage} damage!`,
    timestamp: Date.now(),
  });

  if (combat.monsterHp <= 0) {
    // Player wins
    combat.status = 'player_won';
    monsterInst.currentHp = 0;
    monsterInst.respawnAt = Date.now() + MONSTER_RESPAWN_MS;
    db.combatStates.set(combat.id, combat);

    const result = resolveCombatVictory(player, monsterInst.monster, combat);
    return { combat, result };
  }

  // Monster attacks back
  const mRawDmg = Math.max(1, monsterInst.monster.attack - Math.floor(player.defense * 0.5));
  const mVariance = 0.8 + Math.random() * 0.4;
  const mDamage = Math.floor(mRawDmg * mVariance);

  combat.playerHp = Math.max(0, combat.playerHp - mDamage);
  player.hp = combat.playerHp;
  db.savePlayer(player);

  combat.log.push({
    turn,
    actor: 'monster',
    action: 'attack',
    damage: mDamage,
    message: `${monsterInst.monster.name} attacks ${player.name} for ${mDamage} damage!`,
    timestamp: Date.now(),
  });

  if (combat.playerHp <= 0) {
    combat.status = 'monster_won';
    // Restore player to 1 HP at village
    player.hp = 1;
    player.position = { x: 50, y: 50 };
    player.zone = 'lunaris_village';
    db.savePlayer(player);
  }

  combat.turn = 'player';
  db.combatStates.set(combat.id, combat);
  return { combat };
}

export function playerFlee(combatId: string): CombatState | null {
  const combat = db.combatStates.get(combatId);
  if (!combat || combat.status !== 'active') return null;

  const fleeChance = 0.5 + Math.random() * 0.3;
  if (Math.random() < fleeChance) {
    combat.status = 'fled';
    combat.log.push({
      turn: combat.log.length + 1,
      actor: 'player',
      action: 'flee',
      message: 'You fled from battle!',
      timestamp: Date.now(),
    });
  } else {
    combat.log.push({
      turn: combat.log.length + 1,
      actor: 'player',
      action: 'flee',
      message: 'Failed to flee!',
      timestamp: Date.now(),
    });
    // Monster gets a free hit
    const monsterInst = db.monsterInstances.get(combat.monsterInstanceId);
    const player = db.getPlayer(combat.playerId);
    if (monsterInst && player) {
      const dmg = Math.max(1, monsterInst.monster.attack - Math.floor(player.defense * 0.5));
      combat.playerHp = Math.max(0, combat.playerHp - dmg);
      player.hp = combat.playerHp;
      db.savePlayer(player);
      combat.log.push({
        turn: combat.log.length + 1,
        actor: 'monster',
        action: 'attack',
        damage: dmg,
        message: `${monsterInst.monster.name} attacks ${player.name} for ${dmg} damage!`,
        timestamp: Date.now(),
      });
      if (combat.playerHp <= 0) {
        combat.status = 'monster_won';
        player.hp = 1;
        player.position = { x: 50, y: 50 };
        player.zone = 'lunaris_village';
        db.savePlayer(player);
      }
    }
    combat.turn = 'player';
  }

  db.combatStates.set(combat.id, combat);
  return combat;
}

function resolveCombatVictory(player: Player, monster: Monster, combat: CombatState): CombatResult {
  const expGained = monster.exp;
  const goldGained = monster.gold;
  const itemsGained: InventoryItem[] = [];

  // Roll drops
  for (const drop of monster.drops) {
    if (Math.random() < drop.chance) {
      const qty = drop.minQty + Math.floor(Math.random() * (drop.maxQty - drop.minQty + 1));
      const item = ITEMS[drop.itemId];
      if (item) {
        addItemToInventory(player, drop.itemId, qty);
        itemsGained.push({ item: { ...item }, quantity: qty });
      }
    }
  }

  player.gold += goldGained;
  const levelUp = addExp(player, expGained);

  db.savePlayer(player);

  return {
    status: 'player_won',
    expGained,
    goldGained,
    itemsGained,
    levelUp,
    newLevel: levelUp ? player.level : undefined,
  };
}

// Respawn monsters periodically
export function tickMonsterRespawns(): void {
  const now = Date.now();
  for (const [id, inst] of db.monsterInstances) {
    if (inst.currentHp <= 0 && inst.respawnAt && now >= inst.respawnAt) {
      inst.currentHp = inst.monster.maxHp;
      inst.position = {
        x: 10 + Math.floor(Math.random() * 80),
        y: 10 + Math.floor(Math.random() * 80),
      };
      inst.respawnAt = undefined;
      db.monsterInstances.set(id, inst);
    }
  }
}

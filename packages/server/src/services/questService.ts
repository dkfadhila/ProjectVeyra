import { v4 as uuid } from 'uuid';
import type { Player, Quest, PlayerQuest, QuestObjective } from '@project-veyra/shared';
import { db } from '../db/memory';
import { QUESTS } from '../data/quests';
import { addExp, addItemToInventory } from './playerService';

export function getAvailableQuests(player: Player): Quest[] {
  const available: Quest[] = [];
  for (const quest of Object.values(QUESTS)) {
    // Skip already active or completed
    const existing = getPlayerQuestStatus(player.id, quest.id);
    if (existing && (existing.status === 'active' || existing.status === 'completed')) continue;

    // Check prerequisite
    if (quest.prerequisite && !player.completedQuests.includes(quest.prerequisite)) continue;

    available.push(quest);
  }
  return available;
}

export function acceptQuest(playerId: string, questId: string): { success: boolean; message: string; quest?: Quest } {
  const player = db.getPlayer(playerId);
  if (!player) return { success: false, message: 'Player not found.' };

  const quest = QUESTS[questId];
  if (!quest) return { success: false, message: 'Quest not found.' };

  // Check prerequisite
  if (quest.prerequisite && !player.completedQuests.includes(quest.prerequisite)) {
    return { success: false, message: 'Prerequisite quest not completed.' };
  }

  // Check if already active or completed
  const existing = getPlayerQuestStatus(playerId, questId);
  if (existing && existing.status === 'active') return { success: false, message: 'Quest already active.' };
  if (existing && existing.status === 'completed') return { success: false, message: 'Quest already completed.' };

  // Deep copy objectives so progress is independent
  const questCopy: Quest = {
    ...quest,
    objectives: quest.objectives.map(o => ({ ...o, current: 0 })),
  };

  if (!db.playerQuests.has(playerId)) db.playerQuests.set(playerId, new Map());
  db.playerQuests.get(playerId)!.set(questId, {
    quest: questCopy,
    status: 'active',
    startedAt: Date.now(),
  });

  player.activeQuests.push(questCopy);
  db.savePlayer(player);

  return { success: true, message: `Accepted quest: ${quest.name}`, quest: questCopy };
}

export function updateQuestProgress(playerId: string, type: 'kill' | 'collect' | 'talk' | 'explore', target: string, amount: number = 1): PlayerQuest | null {
  const quests = db.playerQuests.get(playerId);
  if (!quests) return null;

  let updated: PlayerQuest | null = null;

  for (const [questId, pq] of quests) {
    if (pq.status !== 'active') continue;

    for (const obj of pq.quest.objectives) {
      if (obj.type === type && obj.target === target && obj.current < obj.required) {
        obj.current = Math.min(obj.required, obj.current + amount);
        updated = { quest: pq.quest, status: pq.status, startedAt: pq.startedAt };
      }
    }
  }

  return updated;
}

export function completeQuest(playerId: string, questId: string): { success: boolean; message: string; rewards?: any } {
  const player = db.getPlayer(playerId);
  if (!player) return { success: false, message: 'Player not found.' };

  const quests = db.playerQuests.get(playerId);
  if (!quests) return { success: false, message: 'No quests.' };

  const pq = quests.get(questId);
  if (!pq || pq.status !== 'active') return { success: false, message: 'Quest not active.' };

  // Check all objectives complete
  const allDone = pq.quest.objectives.every(o => o.current >= o.required);
  if (!allDone) return { success: false, message: 'Not all objectives completed.' };

  // Give rewards
  const rewards = pq.quest.rewards;
  player.gold += rewards.gold;
  player.vs += rewards.vs;
  addExp(player, rewards.exp);

  if (rewards.items) {
    for (const ri of rewards.items) {
      addItemToInventory(player, ri.itemId, ri.quantity);
    }
  }

  pq.status = 'completed';
  pq.completedAt = Date.now();
  player.completedQuests.push(questId);
  player.activeQuests = player.activeQuests.filter(q => q.id !== questId);
  db.savePlayer(player);

  // Chronicle
  db.addChronicleEntry({
    id: uuid(),
    playerId,
    playerName: player.name,
    type: 'quest_complete',
    description: `${player.name} completed "${pq.quest.name}"`,
    metadata: { questId, rewards },
    timestamp: Date.now(),
  });

  return { success: true, message: `Quest "${pq.quest.name}" completed!`, rewards };
}

export function getPlayerQuestStatus(playerId: string, questId: string): { quest: Quest; status: 'active' | 'completed' | 'failed'; startedAt: number; completedAt?: number } | undefined {
  return db.playerQuests.get(playerId)?.get(questId);
}

export function getActiveQuests(playerId: string): PlayerQuest[] {
  const quests = db.playerQuests.get(playerId);
  if (!quests) return [];
  const result: PlayerQuest[] = [];
  for (const [, pq] of quests) {
    if (pq.status === 'active') {
      result.push({ quest: pq.quest, status: pq.status, startedAt: pq.startedAt });
    }
  }
  return result;
}

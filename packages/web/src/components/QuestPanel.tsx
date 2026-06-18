"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { Player, Quest } from "@project-veyra/shared";

interface Props { player: Player; onClose: () => void; }

export default function QuestPanel({ player, onClose }: Props) {
  const [available, setAvailable] = useState<Quest[]>([]);

  useEffect(() => {
    api.getAvailableQuests(player.id).then(setAvailable).catch(() => {});
  }, [player.id]);

  const acceptQuest = async (questId: string) => {
    try {
      await api.acceptQuest(player.id, questId);
      setAvailable((prev) => prev.filter((q) => q.id !== questId));
    } catch {}
  };

  return (
    <div className="w-80 bg-veyra-navy/95 border-l border-veyra-purple/20 p-4 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold">Quests</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
      </div>

      {/* Active Quests */}
      {player.activeQuests.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs text-gray-400 mb-2">ACTIVE</h4>
          {player.activeQuests.map((q) => (
            <div key={q.id} className="p-3 bg-veyra-dark/60 rounded border border-veyra-purple/30 mb-2">
              <div className="text-sm font-bold">{q.name}</div>
              <div className="text-xs text-gray-400 mt-1">{q.description}</div>
              <div className="mt-2 text-xs text-yellow-400">
                Rewards: {q.rewards.exp} EXP, {q.rewards.gold} Gold, {q.rewards.vs} VS
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Available Quests */}
      <h4 className="text-xs text-gray-400 mb-2">AVAILABLE</h4>
      {available.length === 0 ? (
        <div className="text-sm text-gray-500 text-center py-4">No quests available</div>
      ) : (
        available.map((q) => (
          <div key={q.id} className="p-3 bg-veyra-dark/60 rounded border border-gray-700/50 mb-2">
            <div className="text-sm font-bold">{q.name}</div>
            <div className="text-xs text-gray-400 mt-1">{q.description}</div>
            <div className="mt-2 text-xs text-yellow-400">
              Rewards: {q.rewards.exp} EXP, {q.rewards.gold} Gold, {q.rewards.vs} VS
            </div>
            <button
              onClick={() => acceptQuest(q.id)}
              className="mt-2 px-3 py-1 bg-veyra-purple/60 rounded text-xs hover:bg-veyra-purple"
            >
              Accept Quest
            </button>
          </div>
        ))
      )}
    </div>
  );
}

"use client";
import type { Player } from "@project-veyra/shared";

interface Props { player: Player; }

export default function HUD({ player }: Props) {
  const hpPct = (player.hp / player.maxHp) * 100;
  const mpPct = (player.mp / player.maxMp) * 100;
  const resLevel = player.resonanceLevel || "stranger";

  return (
    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between pointer-events-none z-20">
      {/* Stats */}
      <div className="bg-veyra-navy/90 border border-veyra-purple/30 rounded-lg p-4 min-w-[220px]">
        <div className="text-sm font-bold mb-2">{player.name} <span className="text-gray-400">Lv.{player.level}</span></div>

        {/* HP Bar */}
        <div className="mb-1">
          <div className="flex justify-between text-xs text-gray-400 mb-0.5">
            <span>HP</span><span>{player.hp}/{player.maxHp}</span>
          </div>
          <div className="h-2 bg-gray-700 rounded overflow-hidden">
            <div className="h-full bg-red-500 transition-all" style={{ width: `${hpPct}%` }} />
          </div>
        </div>

        {/* MP Bar */}
        <div className="mb-2">
          <div className="flex justify-between text-xs text-gray-400 mb-0.5">
            <span>MP</span><span>{player.mp}/{player.maxMp}</span>
          </div>
          <div className="h-2 bg-gray-700 rounded overflow-hidden">
            <div className="h-full bg-blue-500 transition-all" style={{ width: `${mpPct}%` }} />
          </div>
        </div>

        {/* Currency */}
        <div className="flex gap-4 text-xs">
          <span className="text-yellow-400">💰 {player.gold}</span>
          <span className="text-cyan-400">💎 {player.vs} VS</span>
          <span className="text-purple-400">🪙 {player.veyA} VEYA</span>
        </div>
      </div>

      {/* Resonance */}
      <div className="bg-veyra-navy/90 border border-veyra-purple/30 rounded-lg p-3 min-w-[160px]">
        <div className="text-xs text-gray-400 mb-1">Lyra Resonance</div>
        <div className="text-sm font-bold capitalize text-veyra-purple">{resLevel}</div>
        <div className="h-1.5 bg-gray-700 rounded overflow-hidden mt-1">
          <div
            className="h-full bg-gradient-to-r from-veyra-purple to-veyra-pink transition-all"
            style={{ width: `${player.resonance}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 mt-0.5">{player.resonance}/100</div>
      </div>
    </div>
  );
}

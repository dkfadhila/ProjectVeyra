"use client";
import type { Player, CombatState, CombatResult } from "@project-veyra/shared";

interface Props {
  combat: CombatState;
  player: Player;
  result: CombatResult | null;
  onAttack: () => void;
  onHeal: () => void;
  onFlee: () => void;
  onClose: () => void;
}

export default function CombatOverlay({ combat, player, result, onAttack, onHeal, onFlee, onClose }: Props) {
  const lastLog = combat.log[combat.log.length - 1];

  if (result) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="bg-veyra-navy border border-veyra-purple/40 rounded-xl p-8 max-w-md text-center">
          {result.status === "player_won" ? (
            <>
              <div className="text-4xl mb-4">⚔️ Victory!</div>
              <div className="space-y-2 text-sm mb-6">
                <div className="text-yellow-400">+{result.expGained} EXP</div>
                <div className="text-yellow-300">+{result.goldGained} Gold</div>
                {result.itemsGained.map((item, i) => (
                  <div key={i} className="text-cyan-400">+{item.quantity}x {item.item.name}</div>
                ))}
                {result.levelUp && (
                  <div className="text-green-400 font-bold text-lg mt-2">LEVEL UP! Now Lv.{result.newLevel}</div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="text-4xl mb-4">💀 Defeated</div>
              <div className="text-sm text-gray-400 mb-4">You lost 10% gold. HP restored to 30%.</div>
            </>
          )}
          <button onClick={onClose} className="px-6 py-2 bg-veyra-purple rounded-lg hover:bg-veyra-purple/80">
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-veyra-navy border border-veyra-purple/40 rounded-xl p-6 max-w-lg w-full">
        <div className="text-center mb-4">
          <div className="text-2xl font-bold">⚔️ Combat</div>
        </div>

        {/* HP bars */}
        <div className="flex justify-between mb-4 gap-4">
          <div className="flex-1">
            <div className="text-sm font-bold mb-1">{player.name}</div>
            <div className="h-3 bg-gray-700 rounded overflow-hidden">
              <div className="h-full bg-green-500 transition-all" style={{ width: `${(combat.playerHp / player.maxHp) * 100}%` }} />
            </div>
            <div className="text-xs text-gray-400 mt-0.5">{combat.playerHp}/{player.maxHp}</div>
          </div>
          <div className="flex-1 text-right">
            <div className="text-sm font-bold mb-1">Monster</div>
            <div className="h-3 bg-gray-700 rounded overflow-hidden">
              <div className="h-full bg-red-500 transition-all" style={{ width: `${(combat.monsterHp / 200) * 100}%` }} />
            </div>
            <div className="text-xs text-gray-400 mt-0.5">{combat.monsterHp}</div>
          </div>
        </div>

        {/* Combat log */}
        <div className="h-24 overflow-y-auto bg-veyra-dark/60 rounded p-2 mb-4 text-xs text-gray-300">
          {combat.log.map((entry, i) => (
            <div key={i} className={entry.actor === "player" ? "text-green-400" : "text-red-400"}>
              {entry.message}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={onAttack} className="flex-1 py-2 bg-red-600 rounded hover:bg-red-500 text-sm font-bold">
            ⚔️ Attack
          </button>
          <button onClick={onHeal} className="flex-1 py-2 bg-green-600 rounded hover:bg-green-500 text-sm font-bold">
            💚 Heal
          </button>
          <button onClick={onFlee} className="flex-1 py-2 bg-gray-600 rounded hover:bg-gray-500 text-sm font-bold">
            🏃 Flee
          </button>
        </div>
      </div>
    </div>
  );
}

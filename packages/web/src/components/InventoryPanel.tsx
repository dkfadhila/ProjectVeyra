"use client";
import type { Player } from "@project-veyra/shared";

interface Props { player: Player; onClose: () => void; }

export default function InventoryPanel({ player, onClose }: Props) {
  return (
    <div className="w-72 bg-veyra-navy/95 border-l border-veyra-purple/20 p-4 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold">Inventory</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
      </div>
      {player.inventory.length === 0 ? (
        <div className="text-sm text-gray-500 text-center py-8">Empty inventory</div>
      ) : (
        <div className="space-y-2">
          {player.inventory.map((inv, i) => (
            <div key={i} className="flex items-center gap-3 p-2 bg-veyra-dark/60 rounded border border-gray-700/50">
              <div className="w-8 h-8 rounded bg-veyra-purple/20 flex items-center justify-center text-xs">
                {inv.item.type === "weapon" ? "⚔️" : inv.item.type === "armor" ? "🛡️" : inv.item.type === "consumable" ? "🧪" : inv.item.type === "gift" ? "🎁" : "📦"}
              </div>
              <div className="flex-1">
                <div className="text-sm">{inv.item.name}</div>
                <div className="text-xs text-gray-400">x{inv.quantity}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <h4 className="text-sm font-bold mb-2">Stats</h4>
        <div className="grid grid-cols-2 gap-1 text-xs text-gray-400">
          <span>ATK: {player.attack}</span>
          <span>DEF: {player.defense}</span>
          <span>SPD: {player.speed}</span>
          <span>EXP: {player.exp}</span>
        </div>
      </div>
    </div>
  );
}

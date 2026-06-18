"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { Player, MarketListing, VS_TO_VEYA_RATE } from "@project-veyra/shared";

interface Props { player: Player; onClose: () => void; }

export default function MarketPanel({ player, onClose }: Props) {
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [tab, setTab] = useState<"market" | "exchange">("market");
  const [convertAmount, setConvertAmount] = useState(100);

  useEffect(() => {
    api.getMarket().then(setListings).catch(() => {});
  }, []);

  const handleBuy = async (listingId: string) => {
    try {
      await api.buyItem(player.id, listingId, 1);
      const updated = await api.getPlayer(player.id);
      localStorage.setItem("veyra_player", JSON.stringify(updated));
      api.getMarket().then(setListings);
    } catch {}
  };

  const handleConvert = async () => {
    try {
      await api.convertVsToVeya(player.id, convertAmount);
      const updated = await api.getPlayer(player.id);
      localStorage.setItem("veyra_player", JSON.stringify(updated));
    } catch {}
  };

  return (
    <div className="w-80 bg-veyra-navy/95 border-l border-veyra-purple/20 p-4 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold">Marketplace</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab("market")} className={`flex-1 py-1 text-xs rounded ${tab === "market" ? "bg-veyra-purple" : "bg-veyra-dark"}`}>
          Market
        </button>
        <button onClick={() => setTab("exchange")} className={`flex-1 py-1 text-xs rounded ${tab === "exchange" ? "bg-veyra-purple" : "bg-veyra-dark"}`}>
          VS → VEYA
        </button>
      </div>

      {tab === "market" ? (
        listings.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-8">No listings yet</div>
        ) : (
          listings.map((l) => (
            <div key={l.id} className="p-3 bg-veyra-dark/60 rounded border border-gray-700/50 mb-2">
              <div className="flex justify-between">
                <span className="text-sm">{l.itemName}</span>
                <span className="text-xs text-yellow-400">{l.pricePerUnit} {l.currency}</span>
              </div>
              <div className="text-xs text-gray-400">x{l.quantity} • by {l.sellerName}</div>
              <button onClick={() => handleBuy(l.id)} className="mt-1 px-3 py-1 bg-green-600/60 rounded text-xs hover:bg-green-600">
                Buy
              </button>
            </div>
          ))
        )
      ) : (
        <div className="p-4 bg-veyra-dark/60 rounded border border-gray-700/50">
          <div className="text-sm mb-2">Convert VS to VEYA Token</div>
          <div className="text-xs text-gray-400 mb-3">Rate: 100 VS = 1 VEYA</div>
          <div className="text-xs mb-2">Your VS: <span className="text-cyan-400">{player.vs}</span></div>
          <input
            type="number"
            value={convertAmount}
            onChange={(e) => setConvertAmount(Number(e.target.value))}
            min={100}
            step={100}
            className="w-full px-3 py-2 bg-veyra-dark border border-gray-600 rounded text-sm mb-2"
          />
          <div className="text-xs text-gray-400 mb-3">
            You'll get: <span className="text-purple-400">{Math.floor(convertAmount / 100)} VEYA</span>
          </div>
          <button onClick={handleConvert} className="w-full py-2 bg-veyra-purple rounded text-sm hover:bg-veyra-purple/80">
            Convert
          </button>
        </div>
      )}
    </div>
  );
}

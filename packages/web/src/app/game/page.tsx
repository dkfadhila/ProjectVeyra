"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import GameCanvas from "@/components/GameCanvas";
import HUD from "@/components/HUD";
import DialogueBox from "@/components/DialogueBox";
import CombatOverlay from "@/components/CombatOverlay";
import InventoryPanel from "@/components/InventoryPanel";
import QuestPanel from "@/components/QuestPanel";
import MarketPanel from "@/components/MarketPanel";
import type { Player, MonsterInstance, CombatState, CombatResult } from "@project-veyra/shared";

export default function GamePage() {
  const router = useRouter();
  const [player, setPlayer] = useState<Player | null>(null);
  const [monsters, setMonsters] = useState<MonsterInstance[]>([]);
  const [combat, setCombat] = useState<CombatState | null>(null);
  const [combatResult, setCombatResult] = useState<CombatResult | null>(null);
  const [showDialogue, setShowDialogue] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showQuests, setShowQuests] = useState(false);
  const [showMarket, setShowMarket] = useState(false);
  const [notifications, setNotifications] = useState<{ id: number; msg: string }[]>([]);
  const notifId = useRef(0);

  // Load player
  useEffect(() => {
    const saved = localStorage.getItem("veyra_player");
    if (!saved) { router.push("/"); return; }
    const p = JSON.parse(saved) as Player;
    setPlayer(p);

    // Load monsters in zone
    api.getMonstersInZone(p.zone).then(setMonsters).catch(() => {});

    // Spawn initial monsters
    const spawnMonsters = async () => {
      try {
        const zoneMonsters = ["tide_slime", "sand_crab"];
        for (const mId of zoneMonsters) {
          await api.spawnMonster(mId, 200 + Math.random() * 400, 150 + Math.random() * 300);
        }
        const updated = await api.getMonstersInZone(p.zone);
        setMonsters(updated);
      } catch {}
    };
    spawnMonsters();
  }, [router]);

  // Socket
  useEffect(() => {
    const socket = getSocket();
    socket.on("monster:spawned", (m) => setMonsters((prev) => [...prev, m]));
    socket.on("monster:died", ({ instanceId }) =>
      setMonsters((prev) => prev.filter((m) => m.instanceId !== instanceId))
    );
    socket.on("notification", ({ message }) => {
      const id = ++notifId.current;
      setNotifications((prev) => [...prev, { id, msg: message }]);
      setTimeout(() => setNotifications((prev) => prev.filter((n) => n.id !== id)), 3000);
    });
    return () => { socket.off("monster:spawned"); socket.off("monster:died"); socket.off("notification"); };
  }, []);

  const addNotification = useCallback((msg: string) => {
    const id = ++notifId.current;
    setNotifications((prev) => [...prev, { id, msg }]);
    setTimeout(() => setNotifications((prev) => prev.filter((n) => n.id !== id)), 3000);
  }, []);

  const handleMonsterClick = async (monster: MonsterInstance) => {
    if (!player || combat) return;
    try {
      const state = await api.startCombat(player.id, monster.instanceId);
      setCombat(state);
      setCombatResult(null);
    } catch (err: any) {
      addNotification(err.message);
    }
  };

  const handleAttack = async () => {
    if (!combat || !player) return;
    try {
      const result = await api.attack(combat.id);
      setCombat(result.combat);
      if (result.finished && result.result) {
        setCombatResult(result.result);
        if (result.result.levelUp) addNotification(`Level Up! Now level ${result.result.newLevel}!`);
        // Refresh player
        const updated = await api.getPlayer(player.id);
        setPlayer(updated);
        localStorage.setItem("veyra_player", JSON.stringify(updated));
      }
    } catch (err: any) {
      addNotification(err.message);
    }
  };

  const handleHeal = async () => {
    if (!combat || !player) return;
    try {
      const result = await api.heal(combat.id);
      setCombat(result);
    } catch {}
  };

  const handleFlee = async () => {
    if (!combat || !player) return;
    try {
      const result = await api.flee(combat.id);
      setCombat(result.combat);
      if (result.success) {
        addNotification("Escaped!");
        setCombat(null);
      } else {
        addNotification("Can't escape!");
      }
    } catch {}
  };

  const closeCombat = () => {
    setCombat(null);
    setCombatResult(null);
    // Refresh monsters
    if (player) api.getMonstersInZone(player.zone).then(setMonsters).catch(() => {});
  };

  if (!player) return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between p-2 bg-veyra-navy/90 border-b border-veyra-purple/20">
        <div className="flex items-center gap-4">
          <span className="text-veyra-purple font-bold">PROJECT VEYRA</span>
          <span className="text-sm text-gray-400">{player.name} • Lv.{player.level} {player.class}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowInventory(!showInventory)} className="px-3 py-1 text-xs bg-veyra-dark rounded hover:bg-veyra-purple/30">Inventory</button>
          <button onClick={() => setShowQuests(!showQuests)} className="px-3 py-1 text-xs bg-veyra-dark rounded hover:bg-veyra-purple/30">Quests</button>
          <button onClick={() => setShowMarket(!showMarket)} className="px-3 py-1 text-xs bg-veyra-dark rounded hover:bg-veyra-purple/30">Market</button>
          <button onClick={() => setShowDialogue(true)} className="px-3 py-1 text-xs bg-veyra-purple/60 rounded hover:bg-veyra-purple">Talk to Lyra</button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Game Area */}
        <div className="flex-1 relative">
          <GameCanvas player={player} monsters={monsters} onMonsterClick={handleMonsterClick} />

          {/* HUD */}
          <HUD player={player} />

          {/* Notifications */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-30">
            {notifications.map((n) => (
              <div key={n.id} className="px-4 py-2 bg-veyra-purple/80 rounded text-sm animate-pulse">
                {n.msg}
              </div>
            ))}
          </div>
        </div>

        {/* Side Panels */}
        {showInventory && <InventoryPanel player={player} onClose={() => setShowInventory(false)} />}
        {showQuests && <QuestPanel player={player} onClose={() => setShowQuests(false)} />}
        {showMarket && <MarketPanel player={player} onClose={() => setShowMarket(false)} />}
      </div>

      {/* Dialogue */}
      {showDialogue && (
        <DialogueBox
          player={player}
          onClose={() => setShowDialogue(false)}
          onUpdatePlayer={(p) => { setPlayer(p); localStorage.setItem("veyra_player", JSON.stringify(p)); }}
        />
      )}

      {/* Combat Overlay */}
      {combat && (
        <CombatOverlay
          combat={combat}
          player={player}
          result={combatResult}
          onAttack={handleAttack}
          onHeal={handleHeal}
          onFlee={handleFlee}
          onClose={closeCombat}
        />
      )}
    </div>
  );
}

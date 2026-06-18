"use client";

import { useRef, useEffect, useCallback } from "react";
import type { Player, MonsterInstance, Position } from "@project-veyra/shared";

interface Props {
  player: Player;
  monsters: MonsterInstance[];
  onMonsterClick: (monster: MonsterInstance) => void;
}

export default function GameCanvas({ player, monsters, onMonsterClick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerPos = useRef<Position>({ ...player.position });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear
    ctx.fillStyle = "#0a0e1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid
    ctx.strokeStyle = "rgba(124, 58, 237, 0.08)";
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // Zone label
    ctx.fillStyle = "rgba(124, 58, 237, 0.15)";
    ctx.font = "bold 48px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(player.zone === "lunaris_village" ? "Lunaris Village" : "Azure Coast", canvas.width / 2, 60);

    // Draw monsters
    for (const m of monsters) {
      const mx = m.position.x;
      const my = m.position.y;

      // Monster circle
      ctx.fillStyle = m.monster.level > player.level ? "#ef4444" : "#f59e0b";
      ctx.beginPath();
      ctx.arc(mx, my, 18, 0, Math.PI * 2);
      ctx.fill();

      // Monster name
      ctx.fillStyle = "#fff";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(m.monster.name, mx, my - 24);

      // HP bar
      const hpPct = m.currentHp / m.monster.maxHp;
      ctx.fillStyle = "#333";
      ctx.fillRect(mx - 15, my + 22, 30, 4);
      ctx.fillStyle = hpPct > 0.5 ? "#22c55e" : hpPct > 0.25 ? "#f59e0b" : "#ef4444";
      ctx.fillRect(mx - 15, my + 22, 30 * hpPct, 4);
    }

    // Draw player
    const px = playerPos.current.x;
    const py = playerPos.current.y;

    // Player glow
    const gradient = ctx.createRadialGradient(px, py, 0, px, py, 30);
    gradient.addColorStop(0, "rgba(124, 58, 237, 0.3)");
    gradient.addColorStop(1, "rgba(124, 58, 237, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(px, py, 30, 0, Math.PI * 2);
    ctx.fill();

    // Player body
    ctx.fillStyle = "#7c3aed";
    ctx.beginPath();
    ctx.arc(px, py, 14, 0, Math.PI * 2);
    ctx.fill();

    // Player name
    ctx.fillStyle = "#fff";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(player.name, px, py - 20);
    ctx.font = "10px sans-serif";
    ctx.fillStyle = "#a78bfa";
    ctx.fillText(`Lv.${player.level}`, px, py + 28);
  }, [player, monsters]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 800;
    canvas.height = 600;

    const loop = () => { draw(); requestAnimationFrame(loop); };
    const animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [draw]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    // Check monster click
    for (const m of monsters) {
      const dx = x - m.position.x;
      const dy = y - m.position.y;
      if (dx * dx + dy * dy < 400) { // 20px radius
        onMonsterClick(m);
        return;
      }
    }

    // Move player
    playerPos.current = { x, y };
  };

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      className="game-canvas w-full h-full cursor-crosshair"
      style={{ maxHeight: "calc(100vh - 48px)" }}
    />
  );
}

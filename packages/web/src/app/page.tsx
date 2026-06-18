"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MainMenu() {
  const router = useRouter();
  const [hovered, setHovered] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [particles, setParticles] = useState<{ x: number; y: number; size: number; speed: number; opacity: number }[]>([]);

  useEffect(() => {
    const p = Array.from({ length: 40 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      speed: Math.random() * 0.3 + 0.1,
      opacity: Math.random() * 0.5 + 0.2,
    }));
    setParticles(p);
  }, []);

  const menuItems = [
    { id: "play", label: "Play Game", action: () => router.push("/intro") },
    { id: "settings", label: "Settings", action: () => setShowSettings(true) },
    { id: "about", label: "About", action: () => setShowAbout(true) },
  ];

  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-veyra-purple"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            animation: `float ${8 + p.speed * 10}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}

      <div className="relative z-10 text-center">
        <div className="mb-2 text-sm tracking-[0.4em] text-veyra-purple/60 uppercase">A World of Memory</div>
        <h1 className="text-7xl font-bold mb-2 bg-gradient-to-r from-veyra-purple via-veyra-cyan to-veyra-pink bg-clip-text text-transparent drop-shadow-2xl">
          PROJECT VEYRA
        </h1>
        <p className="text-lg text-gray-400 mb-16 tracking-wide">Where your story is never forgotten</p>

        <div className="flex flex-col items-center gap-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={item.action}
              onMouseEnter={() => setHovered(item.id)}
              onMouseLeave={() => setHovered("")}
              className={`
                w-64 py-4 text-lg font-semibold rounded-lg border transition-all duration-300
                ${hovered === item.id
                  ? "border-veyra-purple bg-veyra-purple/20 text-white shadow-lg shadow-veyra-purple/20 scale-105"
                  : "border-gray-700 bg-veyra-navy/40 text-gray-300 hover:border-gray-500"
                }
              `}
            >
              {item.label}
            </button>
          ))}
        </div>

        <p className="mt-16 text-xs text-gray-600">v0.1.0 — Built for 0G Zero Cup</p>
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}

      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          100% { transform: translateY(-20px); }
        }
      `}</style>
    </main>
  );
}

function SettingsModal({ onClose }: { onClose: () => void }) {
  const [volume, setVolume] = useState(() => {
    if (typeof window !== "undefined") return parseInt(localStorage.getItem("veyra_volume") || "70");
    return 70;
  });
  const [textSpeed, setTextSpeed] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("veyra_text_speed") || "normal";
    return "normal";
  });

  const save = () => {
    localStorage.setItem("veyra_volume", String(volume));
    localStorage.setItem("veyra_text_speed", textSpeed);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md bg-veyra-navy border border-veyra-purple/30 rounded-xl p-8">
        <h2 className="text-2xl font-bold mb-6 text-veyra-purple">Settings</h2>

        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-2">Music Volume</label>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setVolume(parseInt(e.target.value))}
            className="w-full accent-veyra-purple"
          />
          <div className="text-xs text-gray-500 text-right">{volume}%</div>
        </div>

        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-2">Text Speed</label>
          <div className="flex gap-2">
            {["slow", "normal", "fast"].map((s) => (
              <button
                key={s}
                onClick={() => setTextSpeed(s)}
                className={`flex-1 py-2 rounded text-sm capitalize ${
                  textSpeed === s
                    ? "bg-veyra-purple text-white"
                    : "bg-veyra-dark border border-gray-700 text-gray-400"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 border border-gray-700 rounded text-gray-400 hover:border-gray-500">
            Cancel
          </button>
          <button onClick={save} className="flex-1 py-2 bg-veyra-purple rounded text-white hover:bg-veyra-purple/80">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function AboutModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-veyra-navy border border-veyra-purple/30 rounded-xl p-8">
        <h2 className="text-2xl font-bold mb-4 text-veyra-purple">About Project Veyra</h2>

        <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
          <p>
            <strong className="text-white">Project Veyra</strong> is an AI-native MMORPG where NPCs remember your story.
            Every conversation, every gift, every battle shapes how the world remembers you.
          </p>
          <p>
            Unlike traditional MMOs where NPCs repeat the same lines forever, the Soul Maidens of Veyra
            build a living memory of your journey. They recall your words, react to your choices,
            and grow alongside you.
          </p>
          <p>
            Built on decentralized storage infrastructure, your memories persist beyond any single server.
            Your story belongs to you.
          </p>

          <div className="border-t border-gray-700 pt-4 mt-4">
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
              <div>Engine: Next.js + PixiJS</div>
              <div>Backend: Node.js + Express</div>
              <div>AI: MIMO v2.5 Pro</div>
              <div>Storage: 0G Network</div>
              <div>Version: 0.1.0 Demo</div>
              <div>Hackathon: 0G Zero Cup</div>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-2 bg-veyra-purple/20 border border-veyra-purple/40 rounded text-veyra-purple hover:bg-veyra-purple/30"
        >
          Close
        </button>
      </div>
    </div>
  );
}

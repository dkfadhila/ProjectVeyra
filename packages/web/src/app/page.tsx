"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

const CLASSES = [
  { id: "knight", name: "Knight", desc: "Balanced warrior. High HP and defense.", emoji: "⚔️" },
  { id: "mage", name: "Mage", desc: "Powerful spells. Low HP, high MP.", emoji: "🔮" },
  { id: "ranger", name: "Ranger", desc: "Fast and precise. Good at dodging.", emoji: "🏹" },
  { id: "rogue", name: "Rogue", desc: "Swift strikes. High speed and crit.", emoji: "🗡️" },
  { id: "cleric", name: "Cleric", desc: "Holy healer. High HP and MP.", emoji: "✨" },
];

export default function HomePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [selectedClass, setSelectedClass] = useState("knight");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) return setError("Enter a name!");
    setLoading(true);
    setError("");
    try {
      const player = await api.createPlayer(name.trim(), selectedClass);
      localStorage.setItem("veyra_player", JSON.stringify(player));
      router.push("/game");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      {/* Title */}
      <div className="text-center mb-12">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-veyra-purple via-veyra-cyan to-veyra-pink bg-clip-text text-transparent mb-4">
          PROJECT VEYRA
        </h1>
        <p className="text-xl text-gray-400">AI-Native MMORPG on 0G Infrastructure</p>
        <p className="text-sm text-gray-500 mt-2">Where NPCs remember your story</p>
      </div>

      {/* Character Creation */}
      <div className="w-full max-w-lg bg-veyra-navy/80 rounded-xl border border-veyra-purple/30 p-8">
        <h2 className="text-2xl font-semibold mb-6 text-center">Create Your Character</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Name */}
        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-2">Character Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name..."
            className="w-full px-4 py-3 bg-veyra-dark border border-gray-600 rounded-lg focus:border-veyra-purple focus:outline-none text-white"
            maxLength={20}
          />
        </div>

        {/* Class Selection */}
        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-3">Choose Class</label>
          <div className="grid grid-cols-1 gap-2">
            {CLASSES.map((cls) => (
              <button
                key={cls.id}
                onClick={() => setSelectedClass(cls.id)}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                  selectedClass === cls.id
                    ? "border-veyra-purple bg-veyra-purple/20"
                    : "border-gray-700 hover:border-gray-500"
                }`}
              >
                <span className="text-2xl">{cls.emoji}</span>
                <div className="text-left">
                  <div className="font-medium">{cls.name}</div>
                  <div className="text-xs text-gray-400">{cls.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Create Button */}
        <button
          onClick={handleCreate}
          disabled={loading}
          className="w-full py-3 bg-veyra-purple hover:bg-veyra-purple/80 disabled:opacity-50 rounded-lg font-semibold text-lg transition-all"
        >
          {loading ? "Creating..." : "Enter Veyra"}
        </button>
      </div>

      {/* Footer */}
      <p className="mt-8 text-xs text-gray-600">
        Built on 0G Storage + 0G Chain | Hackathon Demo
      </p>
    </main>
  );
}

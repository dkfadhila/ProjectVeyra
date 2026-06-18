"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const router = useRouter();
  const [volume, setVolume] = useState(70);
  const [textSpeed, setTextSpeed] = useState("normal");

  useEffect(() => {
    setVolume(parseInt(localStorage.getItem("veyra_volume") || "70"));
    setTextSpeed(localStorage.getItem("veyra_text_speed") || "normal");
  }, []);

  const save = () => {
    localStorage.setItem("veyra_volume", String(volume));
    localStorage.setItem("veyra_text_speed", textSpeed);
    router.push("/");
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md bg-veyra-navy border border-veyra-purple/30 rounded-xl p-8">
        <h2 className="text-2xl font-bold mb-6 text-veyra-purple">Settings</h2>

        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-2">Music Volume</label>
          <input type="range" min="0" max="100" value={volume}
            onChange={(e) => setVolume(parseInt(e.target.value))}
            className="w-full accent-veyra-purple" />
          <div className="text-xs text-gray-500 text-right">{volume}%</div>
        </div>

        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-2">Text Speed</label>
          <div className="flex gap-2">
            {["slow", "normal", "fast"].map((s) => (
              <button key={s} onClick={() => setTextSpeed(s)}
                className={`flex-1 py-2 rounded text-sm capitalize ${
                  textSpeed === s ? "bg-veyra-purple text-white" : "bg-veyra-dark border border-gray-700 text-gray-400"
                }`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => router.push("/")} className="flex-1 py-2 border border-gray-700 rounded text-gray-400">Cancel</button>
          <button onClick={save} className="flex-1 py-2 bg-veyra-purple rounded text-white">Save</button>
        </div>
      </div>
    </main>
  );
}

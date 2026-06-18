"use client";

import { useRouter } from "next/navigation";

export default function AboutPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-lg bg-veyra-navy border border-veyra-purple/30 rounded-xl p-8">
        <button onClick={() => router.push("/")} className="text-xs text-gray-600 hover:text-gray-400 mb-4 block">
          ← Back
        </button>
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
      </div>
    </main>
  );
}

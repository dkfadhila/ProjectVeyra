"use client";

import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";
import type { Player } from "@project-veyra/shared";

interface Props {
  player: Player;
  onClose: () => void;
  onUpdatePlayer: (player: Player) => void;
}

interface Message {
  role: "player" | "lyra";
  text: string;
}

export default function DialogueBox({ player, onClose, onUpdatePlayer }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "lyra", text: `Welcome back, ${player.name}! What brings you to my shop today?` },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "player", text: msg }]);
    setLoading(true);

    try {
      const result = await api.talkToLyra(player.id, msg);
      setMessages((prev) => [...prev, { role: "lyra", text: result.message }]);
      if (result.resonanceChange > 0) {
        onUpdatePlayer({ ...player, resonance: result.newResonance });
      }
    } catch {
      setMessages((prev) => [...prev, { role: "lyra", text: "Hmm, I couldn't quite hear you. Try again?" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pb-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-2xl dialogue-box rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-veyra-purple/20 border-b border-veyra-purple/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-veyra-purple/40 flex items-center justify-center text-sm">🌙</div>
            <div>
              <div className="text-sm font-bold">Lyra</div>
              <div className="text-xs text-gray-400">Merchant of Lunaris</div>
            </div>
          </div>
          <div className="text-xs text-gray-400">
            Resonance: {player.resonance}/100
          </div>
        </div>

        {/* Messages */}
        <div className="h-64 overflow-y-auto p-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "player" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                  m.role === "player"
                    ? "bg-veyra-purple/40 text-white"
                    : "bg-gray-700/60 text-gray-200"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="px-3 py-2 rounded-lg bg-gray-700/60 text-sm text-gray-400 animate-pulse">
                Lyra is thinking...
              </div>
            </div>
          )}
          <div ref={messagesEnd} />
        </div>

        {/* Input */}
        <div className="flex gap-2 p-3 border-t border-gray-700">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Say something to Lyra..."
            className="flex-1 px-3 py-2 bg-veyra-dark border border-gray-600 rounded-lg text-sm focus:border-veyra-purple focus:outline-none"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="px-4 py-2 bg-veyra-purple rounded-lg text-sm hover:bg-veyra-purple/80 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

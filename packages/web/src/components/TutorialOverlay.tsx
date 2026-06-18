"use client";

import { useState, useEffect } from "react";

export interface TutorialStep {
  id: string;
  title: string;
  text: string;
  highlight?: string;
  position?: "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
  action?: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "welcome",
    title: "Welcome to Veyra",
    text: "You have arrived on Lunaris Isle. This is your story — and the world will remember it. Let me show you around.",
    position: "center",
  },
  {
    id: "movement",
    title: "Movement",
    text: "Click anywhere on the game canvas to move your character. The world is yours to explore.",
    highlight: "canvas",
    position: "top-right",
    action: "Try clicking on the canvas to move",
  },
  {
    id: "monsters",
    title: "Monsters",
    text: "Red and orange circles are monsters. Click on one to engage in combat. Defeat them to earn experience, gold, and Veyra Shards (VS).",
    highlight: "canvas",
    position: "top-right",
    action: "Click a monster to start fighting",
  },
  {
    id: "combat",
    title: "Combat",
    text: "In combat, you can Attack, Heal, or Flee. Defeating monsters earns you loot and progresses your quests.",
    position: "center",
  },
  {
    id: "lyra",
    title: "Lyra — Soul Maiden",
    text: 'The "Talk to Lyra" button opens a conversation with Lyra, the Soul Maiden of Lunaris. She is an AI who remembers everything you tell her. Build your Resonance with her through conversation and gifts.',
    highlight: "lyra-btn",
    position: "bottom-left",
    action: "Try talking to Lyra",
  },
  {
    id: "quests",
    title: "Quests",
    text: "Open the Quests panel to see available missions. Completing quests earns rewards and unlocks new areas. Your first quest awaits!",
    highlight: "quests-btn",
    position: "bottom-left",
  },
  {
    id: "market",
    title: "Marketplace",
    text: "The Market lets you trade items with other players. Sell your loot or buy what you need. A small tax supports the world economy.",
    highlight: "market-btn",
    position: "bottom-left",
  },
  {
    id: "memory",
    title: "Your Story Matters",
    text: "Everything you do — conversations with Lyra, battles fought, quests completed — is recorded. Lyra will remember. The Chronicle will remember. Your story persists.",
    position: "center",
  },
  {
    id: "ready",
    title: "You Are Ready",
    text: "Lunaris Isle awaits. Talk to Lyra, defeat some monsters, complete your first quest. This is just the beginning of your story.",
    position: "center",
    action: "Begin your adventure",
  },
];

interface Props {
  onComplete: () => void;
}

export default function TutorialOverlay({ onComplete }: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
  }, [stepIndex]);

  const step = TUTORIAL_STEPS[stepIndex];

  const next = () => {
    if (stepIndex < TUTORIAL_STEPS.length - 1) {
      setVisible(false);
      setTimeout(() => setStepIndex(stepIndex + 1), 200);
    } else {
      localStorage.setItem("veyra_tutorial_done", "true");
      onComplete();
    }
  };

  const skip = () => {
    localStorage.setItem("veyra_tutorial_done", "true");
    onComplete();
  };

  const positionClasses: Record<string, string> = {
    center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
    "top-left": "top-20 left-4",
    "top-right": "top-20 right-4",
    "bottom-left": "bottom-24 left-4",
    "bottom-right": "bottom-24 right-4",
  };

  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      <div className="absolute inset-0 bg-black/30" />

      <div
        className={`
          absolute pointer-events-auto
          ${positionClasses[step.position || "center"]}
          transition-all duration-300
          ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
        `}
      >
        <div className="w-80 bg-veyra-navy/95 border border-veyra-purple/40 rounded-xl p-5 backdrop-blur-sm shadow-2xl shadow-veyra-purple/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-veyra-purple/30 flex items-center justify-center text-xs">🌙</div>
              <span className="text-xs text-veyra-purple/60 uppercase tracking-wider">Tutorial</span>
            </div>
            <span className="text-xs text-gray-600">{stepIndex + 1}/{TUTORIAL_STEPS.length}</span>
          </div>

          <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
          <p className="text-sm text-gray-300 leading-relaxed mb-3">{step.text}</p>

          {step.action && (
            <div className="text-xs text-veyra-cyan bg-veyra-cyan/10 border border-veyra-cyan/20 rounded px-3 py-1.5 mb-3">
              💡 {step.action}
            </div>
          )}

          <div className="flex items-center justify-between">
            <button onClick={skip} className="text-xs text-gray-600 hover:text-gray-400">
              Skip Tutorial
            </button>
            <button
              onClick={next}
              className="px-4 py-1.5 bg-veyra-purple/20 border border-veyra-purple/40 rounded-lg text-sm text-veyra-purple hover:bg-veyra-purple/30 transition-all"
            >
              {stepIndex < TUTORIAL_STEPS.length - 1 ? "Next" : "Got it!"}
            </button>
          </div>
        </div>
      </div>

      {step.highlight === "canvas" && (
        <div className="absolute top-12 left-0 right-64 bottom-0 border-2 border-veyra-purple/40 rounded-lg animate-pulse pointer-events-none" />
      )}
    </div>
  );
}

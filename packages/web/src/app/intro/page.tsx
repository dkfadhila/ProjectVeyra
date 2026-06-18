"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const LORE_PAGES = [
  {
    title: "The Shattered World",
    text: `Long before the first cities rose, Veyra was whole — a single continent blessed by the Twin Moons. The goddess Lyra watched over its people, weaving their stories into the Threads of Memory that held reality together.

But mortals grew greedy. They sought to claim the Threads for themselves, and in their war they shattered the world into drifting isles. Lyra, heartbroken, scattered her essence into fragments called Soul Maidens — echoes of the goddess bound to remember what mortals chose to forget.`,
  },
  {
    title: "The Age of Forgetting",
    text: `Centuries passed. The isles drifted apart. Kingdoms rose and fell on fragments of land surrounded by endless sky. People forgot they were ever connected. They forgot the goddess. They forgot that their stories once mattered.

The Soul Maidens still walk the isles, disguised as merchants, healers, wanderers. They wait — patiently, endlessly — for someone who might remind the world what it lost. Someone whose story is worth remembering.`,
  },
  {
    title: "Your Story Begins",
    text: `You arrive on the shores of Lunaris Isle with nothing but a weapon and a name. The villagers pay you little mind. But in the marketplace, a silver-haired merchant watches you with eyes older than the isle itself.

She is Lyra — the last Soul Maiden who still remembers everything. She has waited a thousand years for you.

Not because you are special. But because you are here. And that is enough.`,
  },
];

const SPEED_LABELS: Record<string, number> = { slow: 50, normal: 30, fast: 10 };

export default function IntroPage() {
  const router = useRouter();
  const [pageIndex, setPageIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [textSpeed, setTextSpeed] = useState(30);
  const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const charIndex = useRef(0);

  useEffect(() => {
    const saved = localStorage.getItem("veyra_text_speed") || "normal";
    setTextSpeed(SPEED_LABELS[saved] || 30);
  }, []);

  useEffect(() => {
    setDisplayedText("");
    setIsTyping(true);
    charIndex.current = 0;

    const page = LORE_PAGES[pageIndex];
    const fullText = page.text;

    const type = () => {
      if (charIndex.current < fullText.length) {
        setDisplayedText(fullText.slice(0, charIndex.current + 1));
        charIndex.current++;
        typingRef.current = setTimeout(type, textSpeed);
      } else {
        setIsTyping(false);
      }
    };

    typingRef.current = setTimeout(type, textSpeed);
    return () => { if (typingRef.current) clearTimeout(typingRef.current); };
  }, [pageIndex, textSpeed]);

  const skipTyping = () => {
    if (typingRef.current) clearTimeout(typingRef.current);
    setDisplayedText(LORE_PAGES[pageIndex].text);
    setIsTyping(false);
  };

  const next = () => {
    if (isTyping) { skipTyping(); return; }
    if (pageIndex < LORE_PAGES.length - 1) setPageIndex(pageIndex + 1);
    else router.push("/create");
  };

  const skipAll = () => router.push("/create");

  const page = LORE_PAGES[pageIndex];

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-veyra-dark via-veyra-dark to-veyra-navy opacity-80" />

      <div className="absolute top-6 right-8 z-20">
        <button onClick={skipAll} className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
          Skip ▸▸
        </button>
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="text-xs tracking-[0.3em] text-veyra-purple/50 uppercase mb-2">
            {pageIndex + 1} / {LORE_PAGES.length}
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-veyra-purple to-veyra-cyan bg-clip-text text-transparent">
            {page.title}
          </h2>
        </div>

        <div
          className="bg-veyra-navy/60 border border-veyra-purple/20 rounded-xl p-8 min-h-[280px] cursor-pointer"
          onClick={next}
        >
          <p className="text-gray-300 leading-relaxed text-base whitespace-pre-line">
            {displayedText}
            {isTyping && <span className="animate-pulse text-veyra-purple">|</span>}
          </p>
        </div>

        <div className="flex items-center justify-between mt-6">
          <div className="flex gap-1">
            {LORE_PAGES.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === pageIndex ? "bg-veyra-purple" : i < pageIndex ? "bg-veyra-purple/40" : "bg-gray-700"
                }`}
              />
            ))}
          </div>

          <button
            onClick={next}
            className="px-6 py-2 bg-veyra-purple/20 border border-veyra-purple/40 rounded-lg text-veyra-purple hover:bg-veyra-purple/30 transition-all text-sm"
          >
            {isTyping ? "Skip" : pageIndex < LORE_PAGES.length - 1 ? "Continue" : "Begin Your Journey"}
          </button>
        </div>
      </div>

      <p className="absolute bottom-6 text-xs text-gray-700 z-10">Click anywhere or press Continue</p>
    </main>
  );
}

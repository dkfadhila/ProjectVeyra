
import { SOUL_MAIDENS } from './data.js';

const memory = {};

function getMaiden(id) { return SOUL_MAIDENS.find(m => m.id === id); }

function sysFor(id, persona, player) {
  return `${persona}

CONTEXT:
- The player you speak with is named "${player?.name || 'traveler'}", a ${player?.className || 'wanderer'}.
- Setting: Lunaris Village in the world of Veyra. Mystical, soulbond magic, soft fantasy.
- Stay fully in character. Never mention being an AI, model, or system. Never break character.
- Speak in 1-3 sentences. No stage directions, no asterisks.`;
}

async function callAI(messages) {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, max_tokens: 220, temperature: 0.85 }),
  });
  const j = await res.json();
  return (j.message || j.content || '').trim();
}


export async function chatWithNPC(npcId, persona, player) {
  if (!memory[npcId]) memory[npcId] = [];
  const opener = (memory[npcId].length === 0)
    ? `Greet ${player?.name || 'traveler'} warmly.`
    : `Continue the conversation with the same tone.`;
  const messages = [
    { role: 'system', content: sysFor(npcId, persona, player) },
    ...memory[npcId].slice(-6),
    { role: 'user', content: opener },
  ];
  let text = '';
  try { text = await callAI(messages); } catch (e) { console.warn('[ai] fail', e); }
  if (!text) {
    const m = getMaiden(npcId);
    text = m ? `Welcome, ${player?.name || 'traveler'}. I am ${m.name}.` : 'Greetings.';
  }
  memory[npcId].push({ role: 'assistant', content: text });
  if (memory[npcId].length > 12) memory[npcId].splice(0, memory[npcId].length - 12);
  return text;
}


export async function sendMessageToNPC(npcId, playerMessage) {
  if (!memory[npcId]) memory[npcId] = [];
  const m = getMaiden(npcId);
  const persona = m?.persona || 'You are a mysterious NPC.';
  const messages = [
    { role: 'system', content: sysFor(npcId, persona, window.__veyraState?.player) },
    ...memory[npcId].slice(-8),
    { role: 'user', content: playerMessage },
  ];
  let text = '';
  try { text = await callAI(messages); } catch (e) { console.warn('[ai] fail', e); }
  if (!text) text = 'Hmm... my thoughts are blocked. Could you say that again?';
  memory[npcId].push({ role: 'user', content: playerMessage });
  memory[npcId].push({ role: 'assistant', content: text });
  if (memory[npcId].length > 16) memory[npcId].splice(0, memory[npcId].length - 16);
  return text;
}

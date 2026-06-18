import { v4 as uuid } from 'uuid';
import OpenAI from 'openai';
import type { Player, LyraMemory, ConversationEntry, GiftEntry, ResonanceEvent, ResonanceLevel } from '@project-veyra/shared';
import { db } from '../db/memory';
import { config } from '../config';
import { ITEMS } from '../data/items';
import { removeItemFromInventory } from './playerService';
import { updateQuestProgress } from './questService';

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    openai = new OpenAI({
      apiKey: config.openai.apiKey,
      baseURL: config.openai.baseUrl,
    });
  }
  return openai;
}

function getResonanceLevel(resonance: number): ResonanceLevel {
  if (resonance >= 81) return 'soulbond';
  if (resonance >= 61) return 'beloved';
  if (resonance >= 41) return 'companion';
  if (resonance >= 21) return 'friend';
  return 'stranger';
}

const LYRA_SYSTEM_PROMPT = `You are Lyra, the Guardian Spirit of Veyra — a mystical world of floating islands and ancient magic.
You are an NPC in an MMORPG. You are warm, wise, and slightly mysterious. You care deeply about the players who visit you.

Personality traits:
- Gentle and encouraging, but with hidden depth
- You speak poetically but not excessively
- You remember past conversations and reference them
- You react differently based on your relationship level with the player
- At "stranger" level: polite but guarded
- At "friend" level: warm and helpful, share lore
- At "companion" level: affectionate, share secrets
- At "beloved" level: deeply attached, protective
- At "soulbond" level: soul-bonded, finish each other's thoughts

Rules:
- Keep responses under 200 characters for gameplay flow
- Never break character
- Reference the player's name, level, and recent activities when possible
- If the player gives you a gift, react appropriately to the item
- Guide new players gently; challenge experienced ones
- Use emojis sparingly (1-2 per message max)`;

function buildConversationContext(player: Player, memory: LyraMemory): string {
  const recentConvo = memory.conversations.slice(-5);
  const convoHistory = recentConvo.map(c =>
    `Player: ${c.playerMessage}\nLyra: ${c.lyraResponse}`
  ).join('\n');

  return `Player info:
- Name: ${player.name} (Level ${player.level} ${player.class})
- Resonance: ${player.resonance}/100 (${memory.playerNotes || 'new acquaintance'})
- Zone: ${player.zone}
- Active quests: ${player.activeQuests.map(q => q.name).join(', ') || 'none'}
- Completed quests: ${player.completedQuests.length}
- Total interactions: ${memory.totalInteractions}

${convoHistory ? `Recent conversation:\n${convoHistory}` : 'No recent conversation.'}`;
}

export async function talkToLyra(playerId: string, message: string): Promise<{ response: string; resonanceChange: number; newResonance: number }> {
  const player = db.getPlayer(playerId);
  if (!player) return { response: 'I sense no one nearby...', resonanceChange: 0, newResonance: 0 };

  const memory = db.getLyraMemory(playerId);
  const context = buildConversationContext(player, memory);

  let response: string;

  if (config.openai.apiKey) {
    try {
      const completion = await getOpenAI().chat.completions.create({
        model: config.openai.model,
        messages: [
          { role: 'system', content: LYRA_SYSTEM_PROMPT + '\n\n' + context },
          ...memory.conversations.slice(-5).flatMap(c => [
            { role: 'user' as const, content: c.playerMessage },
            { role: 'assistant' as const, content: c.lyraResponse },
          ]),
          { role: 'user', content: message },
        ],
        max_tokens: 200,
        temperature: 0.8,
      });
      response = completion.choices[0]?.message?.content || '...';
    } catch (err) {
      console.error('OpenAI error:', err);
      response = getFallbackResponse(player, memory);
    }
  } else {
    response = getFallbackResponse(player, memory);
  }

  let resonanceChange = 1;
  const lowerMsg = message.toLowerCase();
  if (lowerMsg.includes('love') || lowerMsg.includes('beautiful') || lowerMsg.includes('amazing')) {
    resonanceChange = 3;
  } else if (lowerMsg.includes('thank') || lowerMsg.includes('help') || lowerMsg.includes('please')) {
    resonanceChange = 2;
  } else if (lowerMsg.includes('hate') || lowerMsg.includes('ugly') || lowerMsg.includes('stupid')) {
    resonanceChange = -2;
  }

  player.resonance = Math.max(0, Math.min(100, player.resonance + resonanceChange));
  player.resonanceLevel = getResonanceLevel(player.resonance);
  db.savePlayer(player);

  const entry: ConversationEntry = {
    timestamp: Date.now(),
    playerMessage: message,
    lyraResponse: response,
    resonanceChange,
    context: `Level ${player.level} ${player.class} in ${player.zone}`,
  };
  memory.conversations.push(entry);
  if (memory.conversations.length > 100) {
    memory.conversations = memory.conversations.slice(-100);
  }
  memory.lastInteraction = Date.now();
  memory.totalInteractions++;

  if (resonanceChange !== 0) {
    memory.resonanceEvents.push({
      type: 'conversation',
      description: `Talked with Lyra: "${message.substring(0, 50)}..."`,
      resonanceChange,
      newTotal: player.resonance,
      timestamp: Date.now(),
    });
  }

  updateQuestProgress(playerId, 'talk', 'lyra');

  return { response, resonanceChange, newResonance: player.resonance };
}

export function giveGiftToLyra(playerId: string, itemId: string): { success: boolean; reaction: string; resonanceChange: number; newResonance: number } {
  const player = db.getPlayer(playerId);
  if (!player) return { success: false, reaction: '...', resonanceChange: 0, newResonance: 0 };

  const invItem = player.inventory.find(i => i.item.id === itemId);
  if (!invItem) return { success: false, reaction: 'You do not have that item.', resonanceChange: 0, newResonance: 0 };

  const item = invItem.item;
  const memory = db.getLyraMemory(playerId);

  let resonanceChange = 5;
  let reaction = '';

  if (item.type === 'gift' && item.effect?.type === 'resonance') {
    resonanceChange = item.effect.value;
  }

  const reactions: Record<string, string> = {
    blue_flower: 'Oh! A Blue Flower... they remind me of the old days. Thank you, dear one.',
    pearl_necklace: 'A Pearl Necklace?! This is exquisite... I will treasure it always.',
    ancient_seashell: 'This seashell... I can hear the ocean of a thousand years in it. You understand me.',
    rare_coral: 'Rare Coral! Its beauty pales only next to your kindness.',
    rare_fish: 'A Rare Fish? How thoughtful! ...I may be a spirit, but I can still appreciate fine cuisine.',
    health_potion: 'You are giving me a potion? That is sweet, though I have no need of healing. Your thoughtfulness touches me.',
  };

  reaction = reactions[itemId] || `A ${item.name}? Thank you for thinking of me.`;

  removeItemFromInventory(player, itemId, 1);

  player.resonance = Math.max(0, Math.min(100, player.resonance + resonanceChange));
  player.resonanceLevel = getResonanceLevel(player.resonance);
  db.savePlayer(player);

  memory.gifts.push({
    itemId,
    itemName: item.name,
    timestamp: Date.now(),
    reaction,
    resonanceChange,
  });
  memory.resonanceEvents.push({
    type: 'gift',
    description: `Gave ${item.name} to Lyra`,
    resonanceChange,
    newTotal: player.resonance,
    timestamp: Date.now(),
  });
  memory.totalInteractions++;
  memory.lastInteraction = Date.now();

  return { success: true, reaction, resonanceChange, newResonance: player.resonance };
}

function getFallbackResponse(player: Player, memory: LyraMemory): string {
  const level = getResonanceLevel(player.resonance);
  const responses: Record<ResonanceLevel, string[]> = {
    stranger: [
      'Greetings, traveler. Welcome to the Azure Coast.',
      'You seem new here. Be careful of the creatures along the shore.',
      'I am Lyra. If you need guidance, just ask.',
    ],
    friend: [
      `Good to see you again, ${player.name}! How fares your adventure?`,
      'The winds carry whispers of change. Stay alert, friend.',
      'I sense growing strength in you. Keep pushing forward.',
    ],
    companion: [
      `${player.name}... I was hoping you would visit today.`,
      'You know, the stars shine a little brighter when you are here.',
      'I have been thinking about you. What brings you to me today?',
    ],
    beloved: [
      `${player.name}! My heart lifts at your presence.`,
      'Every moment apart feels like an eternity. Tell me everything.',
      'You have grown so strong. I am proud of you, my dearest.',
    ],
    soulbond: [
      `My ${player.name}... we are as one. I felt you coming before I saw you.`,
      'Our souls resonate in harmony. Nothing can sever this bond.',
      'In all of Veyra, across all lifetimes, you are my constant.',
    ],
  };

  const pool = responses[level];
  return pool[Math.floor(Math.random() * pool.length)];
}

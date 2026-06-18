import OpenAI from 'openai';
import { LyraMemory, Player, getResonanceLevel, ConversationEntry } from '@project-veyra/shared';

export class LyraAI {
  private client: OpenAI;
  private model: string;

  constructor(baseUrl: string, model: string, apiKey: string) {
    this.client = new OpenAI({ baseURL: baseUrl, apiKey });
    this.model = model;
  }

  private buildSystemPrompt(player: Player, memory: LyraMemory): string {
    const level = getResonanceLevel(player.resonance);
    const recentConvo = memory.conversations.slice(-5);
    const convoHistory = recentConvo.map(c =>
      `Player: ${c.playerMessage}\nLyra: ${c.lyraResponse}`
    ).join('\n---\n');

    return `You are Lyra, a merchant NPC in Project Veyra MMORPG. You run the Lunaris Marketplace.

PERSONALITY:
- Smart, warm, curious about the player
- You genuinely care about your relationships with players
- You remember EVERYTHING about past interactions
- You speak naturally, not robotically
- You subtly weave in game advice and lore

RELATIONSHIP:
- Player: ${player.name} (Level ${player.level} ${player.class})
- Resonance: ${player.resonance}/100 (${level})
- Total interactions: ${memory.totalInteractions}
- Your notes: "${memory.playerNotes || 'New acquaintance.'}"

${convoHistory ? `RECENT CONVERSATIONS:\n${convoHistory}` : 'No prior conversations.'}

RULES:
- Keep responses under 3 sentences
- Reference past interactions when relevant
- At higher resonance levels, be warmer and share more lore
- At stranger level, be polite but professional
- NEVER break character or mention you are an AI
- Speak in English unless the player speaks Indonesian
- Occasionally mention items for sale or quests naturally`;
  }

  async chat(player: Player, memory: LyraMemory, message: string): Promise<{
    response: string;
    resonanceChange: number;
    context: string;
  }> {
    try {
      const system = this.buildSystemPrompt(player, memory);
      
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: message },
        ],
        max_tokens: 512,
        temperature: 0.7,
      });

      const response = completion.choices[0]?.message?.content || '...';
      
      let resonanceChange = 1;
      const lowerMsg = message.toLowerCase();
      if (lowerMsg.includes('gift') || lowerMsg.includes('for you')) resonanceChange += 2;
      if (lowerMsg.includes('story') || lowerMsg.includes('adventure')) resonanceChange += 1;
      if (lowerMsg.length > 50) resonanceChange += 1;

      const context = `Player said: "${message.substring(0, 100)}" | Resonance: +${resonanceChange}`;

      return { response, resonanceChange, context };
    } catch (err) {
      console.error('[LyraAI] Error:', err);
      return {
        response: 'Hmm, my thoughts are a bit scattered right now... Ask me again?',
        resonanceChange: 0,
        context: 'AI error',
      };
    }
  }

  async reactToGift(player: Player, memory: LyraMemory, itemName: string): Promise<{
    reaction: string;
    resonanceChange: number;
  }> {
    try {
      const level = getResonanceLevel(player.resonance);
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: `You are Lyra, merchant NPC. Player ${player.name} just gave you "${itemName}". React with genuine emotion. Your resonance with them is ${player.resonance}/100 (${level}). Keep response to 1-2 sentences.` },
          { role: 'user', content: `*gives you ${itemName}*` },
        ],
        max_tokens: 512,
        temperature: 0.8,
      });

      const reaction = completion.choices[0]?.message?.content || 'Thank you...';
      return { reaction, resonanceChange: 8 };
    } catch {
      return { reaction: 'This is lovely... Thank you so much.', resonanceChange: 8 };
    }
  }
}

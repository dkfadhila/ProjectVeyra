const AI_BASE_URL = process.env.AI_BASE_URL || 'http://localhost:20128/v1';
const AI_MODEL = process.env.AI_MODEL || 'virtuals/anthropic-claude-sonnet-4-5';
const AI_API_KEY = process.env.AI_API_KEY || 'not-needed';

function buildSystemPrompt(player, memory) {
  const recentConvos = memory.conversations.slice(-5).map(c =>
    `Player: ${c.playerMessage}\nLyra: ${c.lyraResponse}`
  ).join('\n');

  return `You are Lyra, the Soul Maiden of Lunaris Village in the game Project Veyra. You are a moonlit merchant with silver hair and golden eyes. You speak warmly, with curiosity and gentle wit.

Player: ${player.name} (Level ${player.level} ${player.class})
Resonance: ${player.resonance}/100 (${player.resonanceLevel})
${player.soulbond ? 'This player is your soulbond partner.' : ''}

Recent conversations:
${recentConvos || 'None yet.'}

Guidelines:
- Stay in character as Lyra, the game NPC
- Keep responses under 3 sentences
- Reference the player's progress and resonance level
- Be warm but not overly affectionate unless resonance is high
- If asked about game mechanics, give in-character hints
- Never break character or acknowledge you are an AI`;
}

export class LyraAI {
  constructor(baseUrl, model, apiKey) {
    this.baseUrl = baseUrl || AI_BASE_URL;
    this.model = model || AI_MODEL;
    this.apiKey = apiKey || AI_API_KEY;
  }

  async chat(player, memory, message) {
    try {
      const systemPrompt = buildSystemPrompt(player, memory);
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message },
          ],
          max_tokens: 200,
          temperature: 0.8,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('[LyraAI] API error:', response.status, text);
        return {
          response: "Hmm... the stars are quiet right now. Try again in a moment.",
          resonanceChange: 0,
          context: 'api_error',
        };
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content?.trim() || '...';

      let resonanceChange = 1;
      const lowerMsg = message.toLowerCase();
      if (lowerMsg.includes('love') || lowerMsg.includes('soulbond')) resonanceChange = 3;
      else if (lowerMsg.includes('gift') || lowerMsg.includes('present')) resonanceChange = 2;
      else if (lowerMsg.includes('help') || lowerMsg.includes('quest')) resonanceChange = 1;

      return {
        response: reply,
        resonanceChange,
        context: 'conversation',
      };
    } catch (err) {
      console.error('[LyraAI] Error:', err.message);
      return {
        response: "The wind carries no answer... Perhaps try again?",
        resonanceChange: 0,
        context: 'error',
      };
    }
  }

  async reactToGift(player, memory, itemName) {
    try {
      const systemPrompt = buildSystemPrompt(player, memory);
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `[Gift: ${itemName}] I'd like to give you this ${itemName}.` },
          ],
          max_tokens: 100,
          temperature: 0.9,
        }),
      });

      if (!response.ok) {
        return { reaction: `Oh! A ${itemName}... How thoughtful. Thank you.`, resonanceChange: 8 };
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content?.trim() || 'Thank you...';
      return { reaction: reply, resonanceChange: 8 };
    } catch {
      return { reaction: 'This is lovely... Thank you so much.', resonanceChange: 8 };
    }
  }
}

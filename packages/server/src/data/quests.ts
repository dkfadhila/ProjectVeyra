import { Quest } from '@project-veyra/shared';

export const QUESTS: Record<string, Quest> = {
  welcome_to_veyra: {
    id: 'welcome_to_veyra', name: 'Welcome to Veyra',
    description: 'Meet Lyra at the Lunaris Marketplace to begin your journey.',
    type: 'main', level: 1, zone: 'lunaris_village', npcGiver: 'lyra',
    objectives: [
      { id: 'talk_lyra', type: 'talk', target: 'lyra', current: 0, required: 1, description: 'Talk to Lyra at the marketplace' },
    ],
    rewards: { exp: 50, gold: 50, vs: 10 },
    dialogue: {
      offer: 'Welcome, traveler! I am Lyra, merchant of Lunaris. Every great adventure begins with a conversation. Tell me your story.',
      inProgress: 'Come speak with me at the marketplace. I\'ve been waiting for someone interesting.',
      complete: 'Wonderful! You\'ve taken your first step. The Azure Coast awaits — but return often. I\'ll remember you.',
    },
  },
  first_hunt: {
    id: 'first_hunt', name: 'First Hunt',
    description: 'Prove your worth by defeating Tide Slimes on the Azure Coast.',
    type: 'main', level: 1, zone: 'azure_coast', npcGiver: 'lyra',
    objectives: [
      { id: 'kill_slimes', type: 'kill', target: 'tide_slime', current: 0, required: 3, description: 'Defeat 3 Tide Slimes' },
    ],
    rewards: { exp: 100, gold: 75, vs: 25, items: [{ itemId: 'rusty_sword', quantity: 1 }] },
    prerequisite: 'welcome_to_veyra',
    dialogue: {
      offer: 'The Tide Slimes have been troubling the coast merchants. Would you help? I\'ll make it worth your while.',
      inProgress: 'Still hunting those slimes? Be careful out there.',
      complete: 'Impressive work! Here\'s a reward worthy of a true adventurer.',
    },
  },
  crab_crisis: {
    id: 'crab_crisis', name: 'Crab Crisis',
    description: 'The Sand Crabs are getting aggressive. Clear them out.',
    type: 'main', level: 3, zone: 'azure_coast', npcGiver: 'lyra',
    objectives: [
      { id: 'kill_crabs', type: 'kill', target: 'sand_crab', current: 0, required: 5, description: 'Defeat 5 Sand Crabs' },
      { id: 'collect_shells', type: 'collect', target: 'crab_shell', current: 0, required: 3, description: 'Collect 3 Crab Shells' },
    ],
    rewards: { exp: 200, gold: 150, vs: 50, items: [{ itemId: 'leather_vest', quantity: 1 }] },
    prerequisite: 'first_hunt',
    dialogue: {
      offer: 'The Sand Crabs are swarming! The traders can\'t get through. We need someone brave enough to thin their numbers.',
      inProgress: 'How goes the crab hunt? Those shells would make fine armor.',
      complete: 'The coast is safer thanks to you. This vest should serve you well.',
    },
  },
};

export function getQuest(id: string): Quest | undefined {
  return QUESTS[id];
}

export function getAvailableQuests(completedQuests: string[]): Quest[] {
  return Object.values(QUESTS).filter(q => {
    if (completedQuests.includes(q.id)) return false;
    if (q.prerequisite && !completedQuests.includes(q.prerequisite)) return false;
    return true;
  });
}

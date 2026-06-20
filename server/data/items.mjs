export const ITEMS = {
  slime_core: {
    id: 'slime_core', name: 'Slime Core', description: 'A glowing core from a Tide Slime.',
    type: 'material', rarity: 'common', value: 15, stackable: true, maxStack: 99,
  },
  blue_gel: {
    id: 'blue_gel', name: 'Blue Gel', description: 'Sticky gel useful for crafting.',
    type: 'material', rarity: 'common', value: 8, stackable: true, maxStack: 99,
  },
  crab_shell: {
    id: 'crab_shell', name: 'Crab Shell', description: 'Hard shell from a Sand Crab.',
    type: 'material', rarity: 'common', value: 20, stackable: true, maxStack: 99,
  },
  sea_fang: {
    id: 'sea_fang', name: 'Sea Fang', description: 'Sharp fang from a Reef Serpent.',
    type: 'material', rarity: 'uncommon', value: 45, stackable: true, maxStack: 99,
  },
  serpent_scale: {
    id: 'serpent_scale', name: 'Serpent Scale', description: 'Iridescent scale from the deep.',
    type: 'material', rarity: 'uncommon', value: 55, stackable: true, maxStack: 99,
  },
  rusty_sword: {
    id: 'rusty_sword', name: 'Rusty Sword', description: 'A basic but reliable sword.',
    type: 'weapon', rarity: 'common', value: 100, stackable: false, maxStack: 1,
    stats: { attack: 5 },
  },
  iron_blade: {
    id: 'iron_blade', name: 'Iron Blade', description: 'A solid iron sword.',
    type: 'weapon', rarity: 'uncommon', value: 350, stackable: false, maxStack: 1,
    stats: { attack: 12 },
  },
  coral_dagger: {
    id: 'coral_dagger', name: 'Coral Dagger', description: 'A dagger made from enchanted coral.',
    type: 'weapon', rarity: 'rare', value: 800, stackable: false, maxStack: 1,
    stats: { attack: 20, speed: 3 },
  },
  leather_vest: {
    id: 'leather_vest', name: 'Leather Vest', description: 'Basic leather protection.',
    type: 'armor', rarity: 'common', value: 120, stackable: false, maxStack: 1,
    stats: { defense: 4 },
  },
  shell_armor: {
    id: 'shell_armor', name: 'Shell Armor', description: 'Armor reinforced with crab shells.',
    type: 'armor', rarity: 'uncommon', value: 400, stackable: false, maxStack: 1,
    stats: { defense: 10 },
  },
  health_potion: {
    id: 'health_potion', name: 'Health Potion', description: 'Restores 50 HP.',
    type: 'consumable', rarity: 'common', value: 30, stackable: true, maxStack: 20,
    effect: { type: 'heal', value: 50 },
  },
  mini_health_potion: {
    id: 'mini_health_potion', name: 'Mini Health Potion', description: 'Restores 20 HP.',
    type: 'consumable', rarity: 'common', value: 10, stackable: true, maxStack: 30,
    effect: { type: 'heal', value: 20 },
  },
  large_health_potion: {
    id: 'large_health_potion', name: 'Large Health Potion', description: 'Restores 120 HP.',
    type: 'consumable', rarity: 'uncommon', value: 80, stackable: true, maxStack: 10,
    effect: { type: 'heal', value: 120 },
  },
  mana_potion: {
    id: 'mana_potion', name: 'Mana Potion', description: 'Restores 30 MP.',
    type: 'consumable', rarity: 'common', value: 35, stackable: true, maxStack: 20,
    effect: { type: 'heal', value: 30 },
  },
  moonflower: {
    id: 'moonflower', name: 'Moonflower', description: 'A rare flower that blooms under moonlight.',
    type: 'gift', rarity: 'uncommon', value: 200, stackable: true, maxStack: 10,
    effect: { type: 'resonance', value: 5 },
  },
  starlight_pendant: {
    id: 'starlight_pendant', name: 'Starlight Pendant', description: 'An exquisite pendant shimmering with starlight.',
    type: 'gift', rarity: 'rare', value: 600, stackable: true, maxStack: 5,
    effect: { type: 'resonance', value: 12 },
  },
  ancient_coin: {
    id: 'ancient_coin', name: 'Ancient Coin', description: 'A mysterious coin from a forgotten era.',
    type: 'gift', rarity: 'rare', value: 500, stackable: true, maxStack: 10,
    effect: { type: 'resonance', value: 10 },
  },
};

export function getItem(id) {
  return ITEMS[id];
}

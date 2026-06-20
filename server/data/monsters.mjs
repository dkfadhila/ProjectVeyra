export const MONSTERS = {
  tide_slime: {
    id: 'tide_slime', name: 'Tide Slime', description: 'A squishy slime infused with seawater.',
    level: 1, hp: 30, maxHp: 30, attack: 5, defense: 2, speed: 3,
    exp: 15, gold: 8, zone: 'azure_coast', sprite: 'tide_slime',
    drops: [
      { itemId: 'slime_core', chance: 0.6, minQty: 1, maxQty: 1 },
      { itemId: 'blue_gel', chance: 0.8, minQty: 1, maxQty: 2 },
    ],
  },
  sand_crab: {
    id: 'sand_crab', name: 'Sand Crab', description: 'A feisty crab with sharp claws.',
    level: 3, hp: 60, maxHp: 60, attack: 10, defense: 8, speed: 4,
    exp: 35, gold: 20, zone: 'azure_coast', sprite: 'sand_crab',
    drops: [
      { itemId: 'crab_shell', chance: 0.5, minQty: 1, maxQty: 2 },
      { itemId: 'health_potion', chance: 0.3, minQty: 1, maxQty: 1 },
    ],
  },
  reef_serpent: {
    id: 'reef_serpent', name: 'Reef Serpent', description: 'A cunning serpent lurking in the reef.',
    level: 5, hp: 100, maxHp: 100, attack: 16, defense: 6, speed: 12,
    exp: 65, gold: 40, zone: 'azure_coast', sprite: 'reef_serpent',
    drops: [
      { itemId: 'sea_fang', chance: 0.4, minQty: 1, maxQty: 1 },
      { itemId: 'serpent_scale', chance: 0.5, minQty: 1, maxQty: 2 },
    ],
  },
  coral_ravager: {
    id: 'coral_ravager', name: 'Coral Ravager', description: 'A fearsome beast made of living coral.',
    level: 8, hp: 200, maxHp: 200, attack: 25, defense: 15, speed: 8,
    exp: 150, gold: 100, zone: 'azure_coast', sprite: 'coral_ravager',
    drops: [
      { itemId: 'coral_dagger', chance: 0.15, minQty: 1, maxQty: 1 },
      { itemId: 'serpent_scale', chance: 0.8, minQty: 2, maxQty: 4 },
      { itemId: 'health_potion', chance: 0.5, minQty: 1, maxQty: 2 },
    ],
  },
};

export function getMonster(id) {
  return MONSTERS[id];
}

export const ZONES = {
  lunaris_village: {
    id: 'lunaris_village', name: 'Lunaris Village',
    description: 'A peaceful village bathed in perpetual twilight. Home to merchants, crafters, and the mysterious Lyra.',
    biome: 'city', level: [1, 5],
    monsters: [], npcs: ['lyra'],
    exits: [
      { toZone: 'azure_coast', position: { x: 780, y: 300 }, size: { width: 40, height: 80 } },
    ],
    spawnPoint: { x: 400, y: 300 },
    bounds: { x: 0, y: 0, width: 800, height: 600 },
  },
  azure_coast: {
    id: 'azure_coast', name: 'Azure Coast',
    description: 'A beautiful but dangerous coastline where sea creatures lurk beneath the waves.',
    biome: 'coast', level: [1, 8],
    monsters: ['tide_slime', 'sand_crab', 'reef_serpent', 'coral_ravager'],
    npcs: [],
    exits: [
      { toZone: 'lunaris_village', position: { x: 20, y: 300 }, size: { width: 40, height: 80 } },
    ],
    spawnPoint: { x: 100, y: 300 },
    bounds: { x: 0, y: 0, width: 800, height: 600 },
  },
};

export function getZone(id) {
  return ZONES[id];
}

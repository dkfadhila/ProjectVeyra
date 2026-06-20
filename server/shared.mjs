export const MARKET_TAX_RATE = 0.05;
export const SOULBOND_TAX_RATE = 0.02;
export const VS_TO_VEYA_RATE = 100;
export const MAX_LEVEL = 50;
export const RESOULDBOND_COST = 1000;

export const CLASS_BASE_STATS = {
  knight:  { level: 1, exp: 0, hp: 120, maxHp: 120, mp: 30, maxMp: 30, attack: 15, defense: 12, speed: 8,  gold: 100, vs: 0, veyA: 0 },
  mage:    { level: 1, exp: 0, hp: 70,  maxHp: 70,  mp: 100, maxMp: 100, attack: 8,  defense: 5,  speed: 10, gold: 80,  vs: 0, veyA: 0 },
  ranger:  { level: 1, exp: 0, hp: 90,  maxHp: 90,  mp: 50, maxMp: 50, attack: 12, defense: 7,  speed: 14, gold: 90,  vs: 0, veyA: 0 },
  rogue:   { level: 1, exp: 0, hp: 80,  maxHp: 80,  mp: 40, maxMp: 40, attack: 14, defense: 6,  speed: 16, gold: 120, vs: 0, veyA: 0 },
  cleric:  { level: 1, exp: 0, hp: 100, maxHp: 100, mp: 80, maxMp: 80, attack: 6,  defense: 10, speed: 9,  gold: 85,  vs: 0, veyA: 0 },
  alchemist: { level: 1, exp: 0, hp: 80, maxHp: 80, mp: 80, maxMp: 80, attack: 8, defense: 8, speed: 11, gold: 100, vs: 0, veyA: 0 },
  merchant:  { level: 1, exp: 0, hp: 90, maxHp: 90, mp: 50, maxMp: 50, attack: 10, defense: 10, speed: 10, gold: 150, vs: 0, veyA: 0 },
};

export const EXP_PER_LEVEL = [
  0, 100, 250, 500, 850, 1300, 1900, 2700, 3800, 5200,
  7000, 9200, 12000, 15500, 20000, 25500, 32000, 40000, 50000, 65000,
];

export function getExpForLevel(level) {
  if (level < EXP_PER_LEVEL.length) return EXP_PER_LEVEL[level];
  return Math.floor(EXP_PER_LEVEL[EXP_PER_LEVEL.length - 1] * (level / 20) * 1.5);
}

export function getResonanceLevel(resonance) {
  if (resonance >= 81) return 'soulbond';
  if (resonance >= 61) return 'beloved';
  if (resonance >= 41) return 'companion';
  if (resonance >= 21) return 'friend';
  return 'stranger';
}

export const RESONANCE_THRESHOLDS = {
  stranger: [0, 20],
  friend: [21, 40],
  companion: [41, 60],
  beloved: [61, 80],
  soulbond: [81, 100],
};

export const DEFAULT_APPEARANCE = {
  skinColor: 'fair',
  hairStyle: 'short',
  hairColor: 'black',
  shirtStyle: 'tunic',
  shirtColor: 'white',
  pantsStyle: 'trousers',
  pantsColor: 'brown',
  shoesStyle: 'boots',
  shoesColor: 'brown',
};

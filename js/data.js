
export const TILE_SIZE = 32;
export const PROXIMITY_RANGE = 48;

export const SKIN_COLORS = ['1', '2', '3', '4', '5'];

export const CLASSES = [
    {
        id: 'knight',
        name: 'Astral Knight',
        desc: 'A stalwart warrior who channels starlight into blade and shield. '
            + 'Knights stand at the front line, absorbing punishment so others need not.',
        sprite: 'knight',
        armor: 'armor_plate',
        hair: 'hair_brown',
        weapon: 'weapon_sword',
        baseStats: { hp: 120, mp: 30, atk: 14, def: 16, spd: 8, luk: 6 }
    },
    {
        id: 'ranger',
        name: 'Voidborn Ranger',
        desc: 'Born under a moonless sky, Voidborn Rangers strike from the shadows. '
            + 'Their arrows carry whispers of the void, piercing both flesh and spirit.',
        sprite: 'ranger',
        armor: 'armor_leather',
        hair: 'hair_black',
        weapon: 'weapon_bow',
        baseStats: { hp: 85, mp: 40, atk: 13, def: 9, spd: 15, luk: 10 }
    },
    {
        id: 'mage',
        name: 'Aether Mage',
        desc: 'Scholars of the celestial currents, Aether Mages weave raw starfire '
            + 'into devastating spells. Fragile in body, boundless in power.',
        sprite: 'mage',
        armor: 'tunic_brown',
        hair: 'hair_blond',
        weapon: 'weapon_staff',
        baseStats: { hp: 70, mp: 100, atk: 6, def: 7, spd: 10, luk: 8 }
    },
    {
        id: 'alchemist',
        name: 'Star Alchemist',
        desc: 'Part healer, part mad scientist. Star Alchemists brew elixirs from '
            + 'fallen starlight, mending wounds or melting armour with equal ease.',
        sprite: 'alchemist',
        armor: 'shirt_white',
        hair: 'hair_brown',
        weapon: 'weapon_staff',
        baseStats: { hp: 80, mp: 80, atk: 8, def: 8, spd: 11, luk: 12 }
    },
    {
        id: 'merchant',
        name: 'Astral Merchant',
        desc: 'Gold is a weapon sharper than any sword. Astral Merchants charm, '
            + 'barter, and — when cornered — fight with surprising ferocity.',
        sprite: 'merchant',
        armor: 'armor_chain',
        hair: 'hair_black',
        weapon: 'weapon_sword',
        baseStats: { hp: 90, mp: 50, atk: 10, def: 10, spd: 10, luk: 18 }
    }
];

export const SOUL_MAIDENS = [
    {
        id: 'lyra',
        name: 'Lyra',
        npcSprite: 'oracle',
        persona: 'A gentle, all-knowing oracle spirit who speaks in riddles and '
               + 'starlit metaphors. She values patience, curiosity, and the '
               + 'pursuit of hidden truths.',
        affinity: 'wisdom',
        skills: [
            { id: 'insight',       name: 'Celestial Insight',   type: 'buff',   mp: 12, desc: 'Reveals enemy weaknesses for 3 turns.' },
            { id: 'starward',      name: 'Starward Blessing',   type: 'heal',   mp: 18, desc: 'Restores moderate HP and cures poison.' },
            { id: 'moonveil',      name: 'Moonveil Barrier',    type: 'shield', mp: 22, desc: 'Reduces incoming damage by 40% for 2 turns.' },
            { id: 'oracle_vision', name: 'Oracle\'s Vision',    type: 'passive',mp: 0,  desc: 'Increases EXP gain by 10% while Lyra is active.' }
        ],
        greetings: [
            'The stars whisper of your arrival, traveller.',
            'Hmm… the constellations shift. Something approaches.',
            'Seek, and the cosmos shall answer — in its own time.'
        ]
    },
    {
        id: 'seraphine',
        name: 'Seraphine',
        npcSprite: 'warrior',
        persona: 'A fierce, proud warrior spirit forged in the heart of a dying '
               + 'star. She respects strength, honour, and those who refuse to '
               + 'kneel before adversity.',
        affinity: 'combat',
        skills: [
            { id: 'starslash',    name: 'Star Slash',          type: 'attack', mp: 10, desc: 'A blazing slash dealing 150% ATK damage.' },
            { id: 'nova_burst',   name: 'Nova Burst',          type: 'aoe',    mp: 25, desc: 'Damages all enemies with a stellar explosion.' },
            { id: 'iron_aura',    name: 'Iron Aura',           type: 'buff',   mp: 15, desc: 'Boosts player ATK and DEF by 20% for 3 turns.' },
            { id: 'unyielding',   name: 'Unyielding Spirit',   type: 'passive',mp: 0,  desc: 'Survive a lethal blow with 1 HP once per battle.' }
        ],
        greetings: [
            'Stand tall. I did not bind my soul to a coward.',
            'Steel your resolve — our enemies grow restless.',
            'Every scar is proof you survived. Wear them proudly.'
        ]
    },
    {
        id: 'elowen',
        name: 'Elowen',
        npcSprite: 'woodnymph',
        persona: 'A playful, nurturing nature spirit who delights in flowers, '
               + 'rain, and small woodland creatures. Beneath her warmth lies '
               + 'the unyielding power of ancient forests.',
        affinity: 'nature',
        skills: [
            { id: 'bloom',         name: 'Verdant Bloom',      type: 'heal',   mp: 14, desc: 'Regenerates HP over 4 turns.' },
            { id: 'thornlash',     name: 'Thorn Lash',         type: 'attack', mp: 12, desc: 'Whips the enemy with enchanted vines.' },
            { id: 'natures_grace', name: 'Nature\'s Grace',    type: 'cure',   mp: 8,  desc: 'Removes all status ailments from the player.' },
            { id: 'photosynthesis', name: 'Photosynthesis',    type: 'passive',mp: 0,  desc: 'Slowly restores MP while standing in sunlight.' }
        ],
        greetings: [
            'The forest hums a welcome. Can you hear it?',
            'Oh! A ladybug! …Ahem. Yes, I am paying attention.',
            'Every root remembers. Every leaf listens. Tread gently.'
        ]
    }
];

export const NPC_LIST = [
    {
        id: 'innkeeper',
        name: 'Marta',
        npcSprite: 'barmaid',
        role: 'Innkeeper',
        x: 0, y: 0,
        dialogue: [
            'Welcome to the Moonrise Inn! Rest your bones — you look half-dead.',
            'A warm bed and a hot meal will cure most ailments. The rest? That\'s what ale is for.',
            'Careful wandering at night. The Spectera grow bolder when the moons are dim.',
            'If you need a room, just say the word. First night\'s on the house for new adventurers.'
        ]
    },
    {
        id: 'innkeeper_north',
        name: 'Suki',
        npcSprite: 'barmaid',
        role: 'Innkeeper',
        x: 0, y: 0,
        dialogue: [
            'Welcome to the Hearthside Inn! Coziest beds north of the plaza.',
            'The morning bread here is fresh — wake up early and you\'ll smell it from the road.',
            'Travelers from Verdant Wilds often stay here. They bring the strangest stories.',
            'Room\'s clean, water\'s hot. What more could you want?'
        ]
    },
    {
        id: 'innkeeper_north2',
        name: 'Elma',
        npcSprite: 'barmaid',
        role: 'Innkeeper',
        x: 0, y: 0,
        dialogue: [
            'The Amber Rest welcomes you! Simple rooms, fair prices.',
            'I brew my own honey mead. Care for a taste?',
            'Quiet neighborhood up here. Perfect if you need a proper night\'s sleep.',
            'The guild folks are just down the road. Good place to find work.'
        ]
    },
    {
        id: 'innkeeper_south',
        name: 'Vespa',
        npcSprite: 'barmaid',
        role: 'Innkeeper',
        x: 0, y: 0,
        dialogue: [
            'The Gilded Pillow — finest inn in the south quarter!',
            'Our luxury suites overlook the pond. Very romantic, if you\'re into that.',
            'We serve imported Aether Dunes wine. A sip and you\'ll forget your troubles.',
            'Adventurers who stay here never want to leave. Can\'t blame them.'
        ]
    },
    {
        id: 'blacksmith',
        name: 'Korrin',
        npcSprite: 'knight',
        role: 'Blacksmith',
        x: 0, y: 0,
        dialogue: [
            'Steel don\'t lie, friend. Bring me ore and I\'ll make something worth swinging.',
            'This forge has been in my family four generations. The anvil remembers every blade.',
            'I once forged a dagger from a fallen star. Burned my hands for a week. Worth it.',
            'Need repairs? Don\'t let your gear rust — a dull blade is worse than no blade at all.'
        ]
    },
    {
        id: 'merchant_npc',
        name: 'Doran',
        npcSprite: 'shopkeeper',
        role: 'Merchant',
        x: 0, y: 0,
        dialogue: [
            'Finest goods in Lunaris! Well… the only goods in Lunaris, but still the finest!',
            'I travel the caravan routes every new moon. You\'d be surprised what washes up from the plains.',
            'Buy something or move along — I don\'t charge for browsing, but I\'d like to.',
            'Got some rare stock from the eastern provinces. Interested?'
        ]
    },
    {
        id: 'farmer_npc',
        name: 'Old Harlan',
        npcSprite: 'farmer',
        role: 'Farmer',
        x: 0, y: 0,
        dialogue: [
            'These fields fed Lunaris through three famines. They\'ll feed us through three more.',
            'The Vivicinder burned half my crop last harvest. If you see one, give it a wallop for me.',
            'Nothing like honest work under the open sky. You adventurers are all the same — restless.',
            'My scarecrow keeps the crows away, but it does nothing against monsters. Useless thing.'
        ]
    },
    {
        id: 'professor_npc',
        name: 'Sage Aldric',
        npcSprite: 'professor',
        role: 'Scholar',
        x: 0, y: 0,
        dialogue: [
            'Fascinating! The ley-line convergence beneath Lunaris is unlike any I\'ve studied.',
            'Soul Maidens are echoes of ancient celestial beings. Treat yours with respect.',
            'The Starfall Plains weren\'t always plains, you know. Once, there was a city here — before the fall.',
            'Knowledge is the one treasure that grows heavier the more you carry. Delightfully so.'
        ]
    }
];

export const BUILDINGS = {
    inn: {
        name: 'Moonrise Inn',
        sprite: 'inn',
        w: 138, h: 202,
        doorX: 69, doorY: 185,
        interior: 'inn_interior'
    },
    market: {
        name: 'Star Market',
        sprite: 'market',
        w: 124, h: 118,
        doorX: 62, doorY: 110,
        interior: 'market_interior'
    },
    house1: {
        name: 'Cottage',
        sprite: 'house1',
        w: 76, h: 122,
        doorX: 38, doorY: 112,
        interior: 'house_interior'
    },
    house2: {
        name: 'Cottage',
        sprite: 'house2',
        w: 76, h: 122,
        doorX: 38, doorY: 112,
        interior: 'house_interior'
    },
    house3: {
        name: 'Small House',
        sprite: 'house3',
        w: 76, h: 90,
        doorX: 38, doorY: 82,
        interior: 'house_interior'
    },
    house4: {
        name: 'Small House',
        sprite: 'house4',
        w: 76, h: 90,
        doorX: 38, doorY: 82,
        interior: 'house_interior'
    },
    blacksmith: {
        name: 'Forge',
        sprite: 'blacksmith',
        w: 76, h: 90,
        doorX: 38, doorY: 82,
        interior: 'forge_interior'
    },
    inn_basic: {
        name: 'Traveller\'s Rest',
        sprite: 'inn_basic',
        w: 107, h: 190,
        doorX: 53, doorY: 180,
        interior: 'inn_basic_interior'
    },
    inn_medium: {
        name: 'Silver Moon Lodge',
        sprite: 'inn_medium',
        w: 124, h: 118,
        doorX: 62, doorY: 110,
        interior: 'inn_medium_interior'
    },
    inn_luxury: {
        name: 'Golden Griffon Inn',
        sprite: 'inn_luxury',
        w: 138, h: 202,
        doorX: 69, doorY: 192,
        interior: 'inn_luxury_interior'
    },
    house5: {
        name: 'Cottage',
        sprite: 'house5',
        w: 76, h: 122,
        doorX: 38, doorY: 114,
        interior: 'house_interior'
    },
    house6: {
        name: 'Cottage',
        sprite: 'house6',
        w: 76, h: 122,
        doorX: 38, doorY: 114,
        interior: 'house_interior'
    },
    house9: {
        name: 'Cottage',
        sprite: 'house9',
        w: 76, h: 122,
        doorX: 38, doorY: 114,
        interior: 'house_interior'
    },
    house10: {
        name: 'Cottage',
        sprite: 'house10',
        w: 76, h: 122,
        doorX: 38, doorY: 114,
        interior: 'house_interior'
    },
    house7: {
        name: 'Townhouse',
        sprite: 'house7',
        w: 76, h: 90,
        doorX: 38, doorY: 82,
        interior: 'townhouse_interior'
    },
    house8: {
        name: 'Townhouse',
        sprite: 'house8',
        w: 76, h: 90,
        doorX: 38, doorY: 82,
        interior: 'townhouse_interior'
    }
};

export const INTERIORS = {
    inn_interior: {
        w: 12, h: 10,
        name: 'Moonrise Inn',
        floor: 'floor_wood',
        walls: 'wall_stone',
        furniture: [
            { type: 'bed',     x: 1,  y: 1, w: 32, h: 48, interact: 'sleep' },
            { type: 'bed',     x: 3,  y: 1, w: 32, h: 48, interact: 'sleep' },
            { type: 'bed',     x: 1,  y: 4, w: 32, h: 48, interact: 'sleep' },
            { type: 'bed',     x: 3,  y: 4, w: 32, h: 48, interact: 'sleep' },
            { type: 'table',   x: 6,  y: 4, w: 48, h: 32 },
            { type: 'table',   x: 6,  y: 6, w: 48, h: 32 },
            { type: 'chair',   x: 5,  y: 4, w: 16, h: 16 },
            { type: 'chair',   x: 9,  y: 4, w: 16, h: 16 },
            { type: 'chair',   x: 5,  y: 6, w: 16, h: 16 },
            { type: 'chair',   x: 9,  y: 6, w: 16, h: 16 },
            { type: 'counter', x: 5,  y: 8, w: 64, h: 16, interact: 'shop_inn' },
            { type: 'barrel',  x: 10, y: 8, w: 16, h: 16 },
            { type: 'barrel',  x: 11, y: 8, w: 16, h: 16 }
        ],
        exit: { x: 6, y: 9 }
    },
    market_interior: {
        w: 8, h: 6,
        name: 'Star Market',
        floor: 'floor_stone',
        walls: 'wall_plaster',
        furniture: [
            { type: 'stall',   x: 1, y: 1, w: 48, h: 32, interact: 'shop_general' },
            { type: 'stall',   x: 5, y: 1, w: 48, h: 32, interact: 'shop_equipment' },
            { type: 'crate',   x: 0, y: 0, w: 16, h: 16 },
            { type: 'crate',   x: 0, y: 1, w: 16, h: 16 },
            { type: 'crate',   x: 7, y: 0, w: 16, h: 16 },
            { type: 'barrel',  x: 7, y: 1, w: 16, h: 16 },
            { type: 'rug',     x: 3, y: 3, w: 64, h: 32 },
            { type: 'sign',    x: 3, y: 0, w: 32, h: 16 }
        ],
        exit: { x: 4, y: 5 }
    },

    house_interior: {
        w: 6, h: 6,
        name: 'Cottage',
        floor: 'floor_wood',
        walls: 'wall_plaster',
        furniture: [
            { type: 'bed',       x: 0, y: 0, w: 32, h: 48, interact: 'sleep' },
            { type: 'table',     x: 3, y: 1, w: 32, h: 32 },
            { type: 'chair',     x: 2, y: 1, w: 16, h: 16 },
            { type: 'chair',     x: 5, y: 1, w: 16, h: 16 },
            { type: 'wardrobe',  x: 5, y: 0, w: 32, h: 32 },
            { type: 'fireplace', x: 0, y: 4, w: 32, h: 32 },
            { type: 'rug',       x: 2, y: 3, w: 48, h: 32 }
        ],
        exit: { x: 3, y: 5 }
    },

    forge_interior: {
        w: 6, h: 6,
        name: 'Korrin\'s Forge',
        floor: 'floor_stone',
        walls: 'wall_brick',
        furniture: [
            { type: 'anvil',      x: 2, y: 1, w: 32, h: 32, interact: 'craft' },
            { type: 'furnace',    x: 0, y: 0, w: 48, h: 32 },
            { type: 'workbench',  x: 4, y: 0, w: 48, h: 32, interact: 'craft' },
            { type: 'barrel',     x: 5, y: 3, w: 16, h: 16 },
            { type: 'crate',      x: 5, y: 4, w: 16, h: 16 },
            { type: 'weapon_rack',x: 0, y: 3, w: 16, h: 48 },
            { type: 'trough',     x: 3, y: 3, w: 32, h: 16 }
        ],
        exit: { x: 3, y: 5 }
    },


    inn_basic_interior: {
        w: 8, h: 8,
        name: 'Traveller\'s Rest',
        floor: 'floor_wood',
        walls: 'wall_plaster',
        furniture: [
            { type: 'bed',        x: 0, y: 1, w: 32, h: 48, interact: 'sleep' },
            { type: 'bed',        x: 2, y: 1, w: 32, h: 48, interact: 'sleep' },
            { type: 'table',      x: 5, y: 3, w: 48, h: 32 },
            { type: 'chair',      x: 4, y: 3, w: 16, h: 16 },
            { type: 'chair',      x: 7, y: 3, w: 16, h: 16 },
            { type: 'counter',    x: 4, y: 6, w: 64, h: 16, interact: 'shop_inn' },
            { type: 'barrel',     x: 0, y: 6, w: 16, h: 16 }
        ],
        exit: { x: 4, y: 7 }
    },

    inn_medium_interior: {
        w: 10, h: 10,
        name: 'Silver Moon Lodge',
        floor: 'floor_wood',
        walls: 'wall_stone',
        furniture: [
            { type: 'bed',        x: 0, y: 1, w: 32, h: 48, interact: 'sleep' },
            { type: 'bed',        x: 2, y: 1, w: 32, h: 48, interact: 'sleep' },
            { type: 'bed',        x: 7, y: 1, w: 32, h: 48, interact: 'sleep' },
            { type: 'bed',        x: 9, y: 1, w: 32, h: 48, interact: 'sleep' },
            { type: 'table',      x: 4, y: 4, w: 48, h: 32 },
            { type: 'table',      x: 4, y: 6, w: 48, h: 32 },
            { type: 'chair',      x: 3, y: 4, w: 16, h: 16 },
            { type: 'chair',      x: 7, y: 4, w: 16, h: 16 },
            { type: 'chair',      x: 3, y: 6, w: 16, h: 16 },
            { type: 'chair',      x: 7, y: 6, w: 16, h: 16 },
            { type: 'counter',    x: 3, y: 8, w: 80, h: 16, interact: 'shop_inn' },
            { type: 'barrel',     x: 0, y: 8, w: 16, h: 16 },
            { type: 'barrel',     x: 9, y: 8, w: 16, h: 16 },
            { type: 'fireplace',  x: 0, y: 4, w: 32, h: 32 }
        ],
        exit: { x: 5, y: 9 }
    },
    inn_luxury_interior: {
        w: 10, h: 10,
        name: 'Golden Griffon Inn',
        floor: 'floor_wood',
        walls: 'wall_stone',
        furniture: [
            { type: 'bed',        x: 0, y: 1, w: 32, h: 48, interact: 'sleep' },
            { type: 'bed',        x: 2, y: 1, w: 32, h: 48, interact: 'sleep' },
            { type: 'bed',        x: 7, y: 1, w: 32, h: 48, interact: 'sleep' },
            { type: 'bed',        x: 9, y: 1, w: 32, h: 48, interact: 'sleep' },
            { type: 'table',      x: 4, y: 4, w: 48, h: 32 },
            { type: 'table',      x: 4, y: 6, w: 48, h: 32 },
            { type: 'chair',      x: 3, y: 4, w: 16, h: 16 },
            { type: 'chair',      x: 7, y: 4, w: 16, h: 16 },
            { type: 'chair',      x: 3, y: 6, w: 16, h: 16 },
            { type: 'chair',      x: 7, y: 6, w: 16, h: 16 },
            { type: 'counter',    x: 3, y: 8, w: 80, h: 16, interact: 'shop_inn' },
            { type: 'barrel',     x: 0, y: 8, w: 16, h: 16 },
            { type: 'barrel',     x: 9, y: 8, w: 16, h: 16 },
            { type: 'fireplace',  x: 0, y: 4, w: 32, h: 32 }
        ],
        exit: { x: 5, y: 9 }
    },

    townhouse_interior: {
        w: 6, h: 8,
        name: 'Townhouse',
        floor: 'floor_wood',
        walls: 'wall_plaster',
        furniture: [
            { type: 'bed',        x: 0, y: 1, w: 32, h: 48, interact: 'sleep' },
            { type: 'wardrobe',   x: 4, y: 0, w: 32, h: 32 },
            { type: 'table',      x: 2, y: 3, w: 48, h: 32 },
            { type: 'chair',      x: 1, y: 3, w: 16, h: 16 },
            { type: 'chair',      x: 5, y: 3, w: 16, h: 16 },
            { type: 'bookshelf',  x: 0, y: 5, w: 32, h: 48 },
            { type: 'fireplace',  x: 4, y: 5, w: 32, h: 32 },
            { type: 'rug',        x: 2, y: 5, w: 48, h: 32 }
        ],
        exit: { x: 3, y: 7 }
    }
};

export const MONSTERS = [
    {
        id: 'dollfin',
        name: 'Dollfin',
        sprite: 'dollfin',
        hp: 25, atk: 6, def: 4, spd: 12,
        exp: 10, gold: 5,
        desc: 'A tiny, doll-like aquatic creature that floats eerily above ponds.',
        drops: [{ item: 'fin_scale', chance: 0.4 }]
    },
    {
        id: 'spectera',
        name: 'Spectera',
        sprite: 'spectera',
        hp: 30, atk: 8, def: 5, spd: 14,
        exp: 15, gold: 8,
        desc: 'A wispy phantom born from lingering starfall energy.',
        drops: [{ item: 'ectoplasm', chance: 0.35 }]
    },
    {
        id: 'vulpyre',
        name: 'Vulpyre',
        sprite: 'vulpyre',
        hp: 40, atk: 10, def: 7, spd: 16,
        exp: 20, gold: 12,
        desc: 'A fox-like predator with ember-tipped tails and a foul temper.',
        drops: [{ item: 'ember_fur', chance: 0.3 }]
    },
    {
        id: 'vivicinder',
        name: 'Vivicinder',
        sprite: 'vivicinder',
        hp: 45, atk: 12, def: 8, spd: 10,
        exp: 25, gold: 15,
        desc: 'A living cinder that smoulders through fields, scorching everything it touches.',
        drops: [{ item: 'cinder_core', chance: 0.25 }]
    },
    {
        id: 'devidra',
        name: 'Devidra',
        sprite: 'devidra',
        hp: 60, atk: 15, def: 12, spd: 9,
        exp: 35, gold: 22,
        desc: 'A serpentine devil-dragon hybrid that lurks in shadowed ravines.',
        drops: [{ item: 'dark_fang', chance: 0.2 }, { item: 'dragon_scale', chance: 0.1 }]
    },
    {
        id: 'eruptibus',
        name: 'Eruptibus',
        sprite: 'eruptibus',
        hp: 80, atk: 18, def: 15, spd: 6,
        exp: 50, gold: 35,
        desc: 'A hulking volcanic beast whose hide cracks with molten fury. Rare and dangerous.',
        drops: [{ item: 'magma_heart', chance: 0.15 }, { item: 'obsidite_shard', chance: 0.1 }]
    }
];

export const SKILLS = [
    { id: 'shield_bash',    name: 'Shield Bash',       class: 'knight',    type: 'attack', mp: 8,  power: 110, desc: 'A forceful shield strike that may stun the target.' },
    { id: 'holy_guard',     name: 'Holy Guard',        class: 'knight',    type: 'buff',   mp: 12, power: 0,   desc: 'Raises DEF by 30% for 3 turns.' },
    { id: 'valor_strike',   name: 'Valor Strike',      class: 'knight',    type: 'attack', mp: 15, power: 150, desc: 'A righteous blow infused with astral energy.' },

    { id: 'void_arrow',     name: 'Void Arrow',        class: 'ranger',    type: 'attack', mp: 8,  power: 120, desc: 'A shadow-imbued arrow that ignores 20% DEF.' },
    { id: 'smoke_bomb',     name: 'Smoke Bomb',        class: 'ranger',    type: 'debuff', mp: 10, power: 0,   desc: 'Blinds the enemy, reducing their accuracy for 2 turns.' },
    { id: 'snipe',          name: 'Snipe',             class: 'ranger',    type: 'attack', mp: 18, power: 200, desc: 'A precise long-range shot with high critical chance.' },

    { id: 'starfire',       name: 'Starfire',          class: 'mage',      type: 'magic',  mp: 10, power: 130, desc: 'Hurls a bolt of condensed starlight at the foe.' },
    { id: 'frost_nova',     name: 'Frost Nova',        class: 'mage',      type: 'magic',  mp: 16, power: 100, desc: 'Freezes all enemies, dealing damage and slowing them.' },
    { id: 'meteor_shower',  name: 'Meteor Shower',     class: 'mage',      type: 'magic',  mp: 28, power: 180, desc: 'Calls down a barrage of celestial stones.' },

    { id: 'acid_flask',     name: 'Acid Flask',        class: 'alchemist', type: 'attack', mp: 8,  power: 100, desc: 'Throws corrosive liquid that lowers enemy DEF.' },
    { id: 'healing_salve',  name: 'Healing Salve',     class: 'alchemist', type: 'heal',   mp: 12, power: 60,  desc: 'Applies a regenerating herbal salve.' },
    { id: 'volatile_mix',   name: 'Volatile Mixture',  class: 'alchemist', type: 'magic',  mp: 20, power: 160, desc: 'An unstable concoction that explodes on impact.' },

    { id: 'gold_toss',      name: 'Gold Toss',         class: 'merchant',  type: 'attack', mp: 5,  power: 90,  desc: 'Flings a handful of coins. Damage scales with gold held.' },
    { id: 'haggle',         name: 'Haggle',            class: 'merchant',  type: 'debuff', mp: 10, power: 0,   desc: 'Demoralises the enemy, lowering ATK for 2 turns.' },
    { id: 'jackpot',        name: 'Jackpot',           class: 'merchant',  type: 'special',mp: 22, power: 140, desc: 'A lucky strike — random chance of double damage or zero.' }
];

export const QUESTS = [
    {
        id: 'q_welcome',
        name: 'A New Dawn',
        giver: 'professor_npc',
        type: 'main',
        desc: 'Speak with Sage Aldric at the Adventurer Guild to begin your journey.',
        objectives: [
            { type: 'talk', target: 'professor_npc', count: 1, label: 'Speak with Sage Aldric' }
        ],
        rewards: { exp: 20, gold: 50, items: [] },
        next: 'q_first_hunt'
    },
    {
        id: 'q_first_hunt',
        name: 'First Hunt',
        giver: 'professor_npc',
        type: 'main',
        desc: 'Prove your mettle by defeating 3 Spectera in the Starfall Plains.',
        objectives: [
            { type: 'kill', target: 'spectera', count: 3, label: 'Defeat Spectera (0/3)' }
        ],
        rewards: { exp: 50, gold: 80, items: ['potion'] },
        next: 'q_forge_ahead'
    },
    {
        id: 'q_forge_ahead',
        name: 'Forge Ahead',
        giver: 'blacksmith',
        type: 'main',
        desc: 'Korrin needs Cinder Cores to repair the village gate. Hunt Vivicinder for materials.',
        objectives: [
            { type: 'collect', target: 'cinder_core', count: 2, label: 'Collect Cinder Cores (0/2)' }
        ],
        rewards: { exp: 80, gold: 120, items: ['iron_sword'] },
        next: 'q_soul_bond'
    },
    {
        id: 'q_soul_bond',
        name: 'The Soul Bond',
        giver: 'professor_npc',
        type: 'main',
        desc: 'Aldric senses a Soul Maiden resonance near the Moonrise Shrine. Investigate.',
        objectives: [
            { type: 'explore', target: 'moonrise_shrine', count: 1, label: 'Visit the Moonrise Shrine' },
            { type: 'talk', target: 'lyra', count: 1, label: 'Bond with a Soul Maiden' }
        ],
        rewards: { exp: 150, gold: 200, items: ['soul_crystal'] },
        next: null
    },
    {
        id: 'q_herb_gather',
        name: 'Healing Hands',
        giver: 'merchant_npc',
        type: 'side',
        desc: 'Elara is running low on medicinal herbs. Gather Starbloom from the luminescent forest.',
        objectives: [
            { type: 'collect', target: 'starbloom', count: 5, label: 'Gather Starbloom (0/5)' }
        ],
        rewards: { exp: 30, gold: 40, items: ['potion', 'potion', 'antidote'] },
        next: null
    },
    {
        id: 'q_pest_control',
        name: 'Pest Control',
        giver: 'farmer_npc',
        type: 'side',
        desc: 'Old Harlan\'s fields are overrun with Vulpyre. Clear them out before harvest is lost.',
        objectives: [
            { type: 'kill', target: 'vulpyre', count: 4, label: 'Defeat Vulpyre (0/4)' }
        ],
        rewards: { exp: 60, gold: 90, items: ['bread', 'bread'] },
        next: null
    },
    {
        id: 'q_lake_mystery',
        name: 'Glimmer in the Deep',
        giver: 'merchant_npc',
        type: 'side',
        desc: 'Nessa spotted a strange glow beneath Starfall Lake. Dive in and find its source.',
        objectives: [
            { type: 'explore', target: 'starfall_lake_deep', count: 1, label: 'Investigate the lake\'s glow' },
            { type: 'kill', target: 'dollfin', count: 3, label: 'Defeat aggressive Dollfin (0/3)' }
        ],
        rewards: { exp: 45, gold: 60, items: ['fish', 'pearl'] },
        next: null
    }
];

export const INVENTORY = [
    { id: 'potion',        name: 'Potion',            type: 'consumable', effect: 'heal',    value: 30,  price: 25,  desc: 'Restores 30 HP.' },
    { id: 'hi_potion',     name: 'Hi-Potion',         type: 'consumable', effect: 'heal',    value: 80,  price: 80,  desc: 'Restores 80 HP.' },
    { id: 'ether',         name: 'Ether',             type: 'consumable', effect: 'mp_heal', value: 20,  price: 40,  desc: 'Restores 20 MP.' },
    { id: 'antidote',      name: 'Antidote',          type: 'consumable', effect: 'cure',    value: 0,   price: 15,  desc: 'Cures poison.' },
    { id: 'bread',         name: 'Bread',             type: 'consumable', effect: 'heal',    value: 10,  price: 5,   desc: 'A simple loaf. Restores 10 HP.' },
    { id: 'fish',          name: 'Grilled Fish',      type: 'consumable', effect: 'heal',    value: 20,  price: 12,  desc: 'Freshly grilled lake fish. Restores 20 HP.' },

    { id: 'iron_sword',    name: 'Iron Sword',        type: 'weapon',     slot: 'weapon',    atk: 8,   price: 120,  desc: 'A sturdy iron blade.' },
    { id: 'steel_sword',   name: 'Steel Sword',       type: 'weapon',     slot: 'weapon',    atk: 14,  price: 280,  desc: 'A well-tempered steel longsword.' },
    { id: 'oak_bow',       name: 'Oak Bow',           type: 'weapon',     slot: 'weapon',    atk: 7,   price: 100,  desc: 'A reliable shortbow carved from oak.' },
    { id: 'willow_staff',  name: 'Willow Staff',      type: 'weapon',     slot: 'weapon',    atk: 5,   price: 90,   desc: 'A staff humming with faint magical resonance.' },

    { id: 'leather_vest',  name: 'Leather Vest',      type: 'armour',     slot: 'body',      def: 5,   price: 80,   desc: 'Light and flexible hide armour.' },
    { id: 'chain_mail',    name: 'Chain Mail',        type: 'armour',     slot: 'body',      def: 10,  price: 200,  desc: 'Interlocking metal rings offer solid protection.' },
    { id: 'iron_helm',     name: 'Iron Helm',         type: 'armour',     slot: 'head',      def: 3,   price: 60,   desc: 'A simple iron helmet.' },

    { id: 'soul_crystal',  name: 'Soul Crystal',      type: 'key',        desc: 'A radiant crystal that resonates with Soul Maiden energy.' },
    { id: 'pearl',         name: 'Starfall Pearl',    type: 'material',   price: 50,  desc: 'A luminous pearl from the depths of Starfall Lake.' },

    { id: 'ectoplasm',     name: 'Ectoplasm',         type: 'material',   price: 10,  desc: 'Ghostly residue left by Spectera.' },
    { id: 'ember_fur',     name: 'Ember Fur',         type: 'material',   price: 18,  desc: 'Singed fur from a Vulpyre. Warm to the touch.' },
    { id: 'cinder_core',   name: 'Cinder Core',       type: 'material',   price: 25,  desc: 'The smouldering heart of a Vivicinder.' },
    { id: 'dark_fang',     name: 'Dark Fang',         type: 'material',   price: 30,  desc: 'A venomous fang pried from a Devidra.' },
    { id: 'dragon_scale',  name: 'Dragon Scale',      type: 'material',   price: 45,  desc: 'A tough, iridescent scale from a Devidra.' },
    { id: 'magma_heart',   name: 'Magma Heart',       type: 'material',   price: 60,  desc: 'A pulsing core of volcanic energy from an Eruptibus.' },
    { id: 'obsidite_shard',name: 'Obsidite Shard',    type: 'material',   price: 55,  desc: 'Glassy volcanic crystal. Used in high-end forging.' },
    { id: 'fin_scale',     name: 'Fin Scale',         type: 'material',   price: 6,   desc: 'A tiny opalescent scale from a Dollfin.' },
    { id: 'starbloom',     name: 'Starbloom',         type: 'material',   price: 8,   desc: 'A bioluminescent flower found in the forests near Lunaris.' }
];

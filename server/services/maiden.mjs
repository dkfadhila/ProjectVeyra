export const MAIDENS = {
  lyra: {
    npcId: 'lyra',
    name: 'Lyra',
    profession: 'merchant',
    location: 'Lunaris Marketplace',
    personality: ['warm', 'curious', 'clever', 'moonlit'],
    requestKeywords: ['buy', 'sell', 'trade', 'shop', 'price', 'cheap', 'discount', 'deal', 'purchase', 'merchant', 'beli', 'jual', 'toko', 'negotiate', 'find item'],
    description: 'A moonlit merchant with silver hair and golden eyes. Soul Maiden of the Marketplace.',
    maxInventorySlots: 7,
    available: true,
  },
  seraphine: {
    npcId: 'seraphine',
    name: 'Seraphine',
    profession: 'priestess',
    location: 'Temple of Resonance',
    personality: ['calm', 'patient', 'kind', 'gentle', 'devoted'],
    requestKeywords: ['heal', 'cure', 'bless', 'pray', 'purify', 'resurrect', 'restore', 'cleanse', 'holy'],
    description: 'A devoted priestess of the Temple of Resonance. Her gentle hands can heal wounds.',
    maxInventorySlots: 7,
    available: false,
  },
  elowen: {
    npcId: 'elowen',
    name: 'Elowen',
    profession: 'hunter',
    location: "Hunter's Lodge",
    personality: ['energetic', 'independent', 'adventurous', 'wild', 'sharp-eyed'],
    requestKeywords: ['track', 'hunt', 'scout', 'find', 'trap', 'animal', 'beast', 'explore', 'wilderness'],
    description: 'A fearless hunter from the Lodge. She can track any creature across the wilds.',
    maxInventorySlots: 7,
    available: false,
  },
};

export function getMaidenByNpcId(npcId) {
  return MAIDENS[npcId] || null;
}

export function processMaidenRequest(npcId, isMarried, resonance, request) {
  const maiden = MAIDENS[npcId];
  if (!maiden) return { accepted: false, message: 'Unknown maiden.', resonanceChange: 0 };

  const lowerReq = request.toLowerCase();
  const isRequest = maiden.requestKeywords.some(kw => lowerReq.includes(kw));

  if (!isRequest) {
    return { accepted: false, message: `${maiden.name} tilts her head curiously. "What was that, dear?"`, resonanceChange: 0 };
  }

  if (resonance < 20) {
    return {
      accepted: false,
      message: `"I appreciate your interest, but we barely know each other." (Resonance too low: ${resonance}/100)`,
      resonanceChange: -1,
    };
  }

  let resonanceChange = 2;
  let message = '';
  let action = null;

  switch (maiden.profession) {
    case 'merchant':
      message = `"Of course! Let me see what I can find for you." Lyra examines her wares with a knowing smile.`;
      action = { type: 'buy_item', payload: { npcId } };
      break;
    case 'priestess':
      message = `"May the light of Resonance wash over you." Seraphine places her hands together in prayer.`;
      action = { type: 'heal', payload: { healAmount: 50 } };
      resonanceChange = 3;
      break;
    case 'hunter':
      message = `"The wilds call to those who listen. I'll track your quarry." Elowen adjusts her bow.`;
      action = { type: 'track', payload: { npcId } };
      break;
    default:
      message = `${maiden.name} nods thoughtfully.`;
  }

  if (isMarried) {
    resonanceChange += 2;
    message += ` Her devotion to you shines in her eyes.`;
  }

  return { accepted: true, message, resonanceChange, action };
}

export function transferItemFromPlayerToMaiden(playerInventory, maidenItems, itemId, quantity) {
  const invIdx = playerInventory.findIndex(i => i.item.id === itemId);
  if (invIdx === -1) return { success: false, message: 'Item not in inventory.', updatedPlayerItems: playerInventory, updatedMaidenItems: maidenItems };

  const inv = playerInventory[invIdx];
  if (inv.quantity < quantity) return { success: false, message: 'Not enough quantity.', updatedPlayerItems: playerInventory, updatedMaidenItems: maidenItems };

  if (maidenItems.length >= 7) return { success: false, message: 'Maiden inventory full.', updatedPlayerItems: playerInventory, updatedMaidenItems: maidenItems };

  const newPlayerItems = [...playerInventory];
  newPlayerItems[invIdx] = { ...inv, quantity: inv.quantity - quantity };
  if (newPlayerItems[invIdx].quantity <= 0) newPlayerItems.splice(invIdx, 1);

  const existingMaiden = maidenItems.find(i => i.item.id === itemId && i.item.stackable);
  let newMaidenItems;
  if (existingMaiden) {
    newMaidenItems = maidenItems.map(i => i.item.id === itemId ? { ...i, quantity: i.quantity + quantity } : i);
  } else {
    newMaidenItems = [...maidenItems, { item: { ...inv.item }, quantity }];
  }

  return { success: true, message: `Gave ${quantity}x ${inv.item.name} to maiden.`, updatedPlayerItems: newPlayerItems, updatedMaidenItems: newMaidenItems };
}

export function transferItemFromMaidenToPlayer(playerInventory, maidenItems, itemId, quantity) {
  const maidIdx = maidenItems.findIndex(i => i.item.id === itemId);
  if (maidIdx === -1) return { success: false, message: 'Item not in maiden inventory.', updatedPlayerItems: playerInventory, updatedMaidenItems: maidenItems };

  const maid = maidenItems[maidIdx];
  if (maid.quantity < quantity) return { success: false, message: 'Not enough quantity.', updatedPlayerItems: playerInventory, updatedMaidenItems: maidenItems };

  const newMaidenItems = [...maidenItems];
  newMaidenItems[maidIdx] = { ...maid, quantity: maid.quantity - quantity };
  if (newMaidenItems[maidIdx].quantity <= 0) newMaidenItems.splice(maidIdx, 1);

  const existingPlayer = playerInventory.find(i => i.item.id === itemId && i.item.stackable);
  let newPlayerItems;
  if (existingPlayer) {
    newPlayerItems = playerInventory.map(i => i.item.id === itemId ? { ...i, quantity: i.quantity + quantity } : i);
  } else {
    newPlayerItems = [...playerInventory, { item: { ...maid.item }, quantity }];
  }

  return { success: true, message: `Took ${quantity}x ${maid.item.name} from maiden.`, updatedPlayerItems: newPlayerItems, updatedMaidenItems: newMaidenItems };
}

import { v4 as uuid } from 'uuid';
import type { MarketListing, MarketTransaction, Player, InventoryItem } from '@project-veyra/shared';
import { db } from '../db/memory';
import { ITEMS } from '../data/items';
import { removeItemFromInventory, addItemToInventory } from './playerService';

const MARKET_TAX_RATE = 0.05;
const SOULBOND_TAX_RATE = 0.02;
const LISTING_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function createListing(
  sellerId: string,
  itemId: string,
  quantity: number,
  pricePerUnit: number,
  currency: 'gold' | 'vs'
): { success: boolean; message: string; listing?: MarketListing } {
  const player = db.getPlayer(sellerId);
  if (!player) return { success: false, message: 'Player not found.' };

  const invItem = player.inventory.find(i => i.item.id === itemId);
  if (!invItem || invItem.quantity < quantity) {
    return { success: false, message: 'Not enough items.' };
  }

  if (pricePerUnit <= 0) return { success: false, message: 'Invalid price.' };

  removeItemFromInventory(player, itemId, quantity);

  const listing: MarketListing = {
    id: uuid(),
    sellerId,
    sellerName: player.name,
    itemId,
    itemName: invItem.item.name,
    quantity,
    pricePerUnit,
    currency,
    listedAt: Date.now(),
    expiresAt: Date.now() + LISTING_DURATION_MS,
  };

  db.marketListings.set(listing.id, listing);
  return { success: true, message: `Listed ${quantity}x ${invItem.item.name} at ${pricePerUnit} ${currency} each.`, listing };
}

export function buyListing(
  buyerId: string,
  listingId: string,
  quantity: number
): { success: boolean; message: string; transaction?: MarketTransaction } {
  const buyer = db.getPlayer(buyerId);
  if (!buyer) return { success: false, message: 'Buyer not found.' };

  const listing = db.marketListings.get(listingId);
  if (!listing) return { success: false, message: 'Listing not found.' };
  if (listing.sellerId === buyerId) return { success: false, message: 'Cannot buy your own listing.' };
  if (quantity > listing.quantity) return { success: false, message: 'Not enough quantity available.' };
  if (Date.now() > listing.expiresAt) return { success: false, message: 'Listing expired.' };

  const totalPrice = listing.pricePerUnit * quantity;
  const taxRate = buyer.soulbond ? SOULBOND_TAX_RATE : MARKET_TAX_RATE;
  const tax = Math.floor(totalPrice * taxRate);
  const sellerReceives = totalPrice - tax;

  // Check buyer has enough currency
  if (listing.currency === 'gold' && buyer.gold < totalPrice) {
    return { success: false, message: 'Not enough gold.' };
  }
  if (listing.currency === 'vs' && buyer.vs < totalPrice) {
    return { success: false, message: 'Not enough VS.' };
  }

  // Transfer currency
  if (listing.currency === 'gold') {
    buyer.gold -= totalPrice;
  } else {
    buyer.vs -= totalPrice;
  }
  db.savePlayer(buyer);

  const seller = db.getPlayer(listing.sellerId);
  if (seller) {
    if (listing.currency === 'gold') {
      seller.gold += sellerReceives;
    } else {
      seller.vs += sellerReceives;
    }
    db.savePlayer(seller);
  }

  // Transfer items
  addItemToInventory(buyer, listing.itemId, quantity);

  // Update listing
  listing.quantity -= quantity;
  if (listing.quantity <= 0) {
    db.marketListings.delete(listingId);
  } else {
    db.marketListings.set(listingId, listing);
  }

  const transaction: MarketTransaction = {
    id: uuid(),
    listingId,
    buyerId,
    sellerId: listing.sellerId,
    itemId: listing.itemId,
    quantity,
    totalPrice,
    currency: listing.currency,
    tax,
    timestamp: Date.now(),
  };
  db.marketTransactions.push(transaction);

  return { success: true, message: `Bought ${quantity}x ${listing.itemName} for ${totalPrice} ${listing.currency}.`, transaction };
}

export function cancelListing(playerId: string, listingId: string): { success: boolean; message: string } {
  const listing = db.marketListings.get(listingId);
  if (!listing) return { success: false, message: 'Listing not found.' };
  if (listing.sellerId !== playerId) return { success: false, message: 'Not your listing.' };

  const player = db.getPlayer(playerId);
  if (!player) return { success: false, message: 'Player not found.' };

  addItemToInventory(player, listing.itemId, listing.quantity);
  db.marketListings.delete(listingId);

  return { success: true, message: `Cancelled listing. ${listing.quantity}x ${listing.itemName} returned to inventory.` };
}

export function getListings(): MarketListing[] {
  return Array.from(db.marketListings.values())
    .filter(l => Date.now() < l.expiresAt)
    .sort((a, b) => b.listedAt - a.listedAt);
}

export function exchangeVsToVeya(playerId: string, amount: number): { success: boolean; message: string } {
  const VS_TO_VEYA_RATE = 100;
  const player = db.getPlayer(playerId);
  if (!player) return { success: false, message: 'Player not found.' };
  if (amount < VS_TO_VEYA_RATE) return { success: false, message: `Minimum exchange is ${VS_TO_VEYA_RATE} VS.` };
  if (player.vs < amount) return { success: false, message: 'Not enough VS.' };

  const veyaAmount = Math.floor(amount / VS_TO_VEYA_RATE);
  player.vs -= veyaAmount * VS_TO_VEYA_RATE;
  player.veyA += veyaAmount;
  db.savePlayer(player);

  return { success: true, message: `Exchanged ${veyaAmount * VS_TO_VEYA_RATE} VS for ${veyaAmount} VEYA.` };
}

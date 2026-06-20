import { v4 as uuid } from 'uuid';
import { MARKET_TAX_RATE, SOULBOND_TAX_RATE, VS_TO_VEYA_RATE } from '../shared.mjs';

export class MarketplaceService {
  constructor(store) {
    this.store = store;
  }

  list(player, itemId, quantity, pricePerUnit, currency) {
    const inv = player.inventory.find(i => i.item.id === itemId);
    if (!inv || inv.quantity < quantity) return null;

    inv.quantity -= quantity;
    if (inv.quantity <= 0) {
      player.inventory = player.inventory.filter(i => i.item.id !== itemId);
    }

    const listing = {
      id: uuid(), sellerId: player.id, sellerName: player.name,
      itemId, itemName: inv.item.name, quantity, pricePerUnit,
      currency, listedAt: Date.now(), expiresAt: Date.now() + 86400000,
    };
    this.store.marketListings.set(listing.id, listing);
    return listing;
  }

  buy(buyer, listingId, quantity) {
    const listing = this.store.marketListings.get(listingId);
    if (!listing) return { success: false, error: 'Listing not found' };
    if (quantity > listing.quantity) return { success: false, error: 'Not enough stock' };

    const totalPrice = listing.pricePerUnit * quantity;
    const taxRate = buyer.soulbond ? SOULBOND_TAX_RATE : MARKET_TAX_RATE;
    const tax = Math.floor(totalPrice * taxRate);
    const totalCost = totalPrice + tax;

    if (listing.currency === 'gold' && buyer.gold < totalCost) return { success: false, error: 'Not enough gold' };
    if (listing.currency === 'vs' && buyer.vs < totalCost) return { success: false, error: 'Not enough VS' };

    if (listing.currency === 'gold') buyer.gold -= totalCost;
    else buyer.vs -= totalCost;

    const seller = this.store.getPlayer(listing.sellerId);
    if (seller) {
      if (listing.currency === 'gold') seller.gold += totalPrice;
      else seller.vs += totalPrice;
    }

    const existingBuyerItem = buyer.inventory.find(i => i.item.id === listing.itemId && i.item.stackable);
    if (existingBuyerItem) {
      existingBuyerItem.quantity += quantity;
    } else {
      buyer.inventory.push({ item: { id: listing.itemId, name: listing.itemName }, quantity });
    }

    listing.quantity -= quantity;
    if (listing.quantity <= 0) this.store.marketListings.delete(listingId);

    return { success: true };
  }

  cancel(player, listingId) {
    const listing = this.store.marketListings.get(listingId);
    if (!listing || listing.sellerId !== player.id) return false;

    const existing = player.inventory.find(i => i.item.id === listing.itemId && i.item.stackable);
    if (existing) existing.quantity += listing.quantity;
    else player.inventory.push({ item: { id: listing.itemId, name: listing.itemName }, quantity: listing.quantity });

    this.store.marketListings.delete(listingId);
    return true;
  }

  getAllListings() {
    return Array.from(this.store.marketListings.values())
      .filter(l => l.expiresAt > Date.now())
      .sort((a, b) => a.listedAt - b.listedAt);
  }

  convertVsToVeya(player, amount) {
    if (amount < VS_TO_VEYA_RATE || player.vs < amount) return false;
    const veyaAmount = Math.floor(amount / VS_TO_VEYA_RATE);
    player.vs -= veyaAmount * VS_TO_VEYA_RATE;
    player.veyA += veyaAmount;
    return true;
  }
}

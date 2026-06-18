import { v4 as uuid } from 'uuid';
import {
  Player, MarketListing, MarketTransaction, InventoryItem,
  MARKET_TAX_RATE, SOULBOND_TAX_RATE, VS_TO_VEYA_RATE,
} from '@project-veyra/shared';
import { GameStore } from '../store';

export class MarketplaceService {
  constructor(private store: GameStore) {}

  list(player: Player, itemId: string, quantity: number, pricePerUnit: number, currency: 'gold' | 'vs'): MarketListing | null {
    const inv = player.inventory.find(i => i.item.id === itemId);
    if (!inv || inv.quantity < quantity) return null;

    inv.quantity -= quantity;
    if (inv.quantity <= 0) {
      player.inventory = player.inventory.filter(i => i.item.id !== itemId);
    }

    const listing: MarketListing = {
      id: uuid(), sellerId: player.id, sellerName: player.name,
      itemId, itemName: inv.item.name, quantity, pricePerUnit,
      currency, listedAt: Date.now(), expiresAt: Date.now() + 86400000,
    };
    this.store.marketListings.set(listing.id, listing);
    return listing;
  }

  buy(buyer: Player, listingId: string, quantity: number): { success: boolean; error?: string } {
    const listing = this.store.marketListings.get(listingId);
    if (!listing) return { success: false, error: 'Listing not found' };
    if (quantity > listing.quantity) return { success: false, error: 'Not enough stock' };

    const totalPrice = listing.pricePerUnit * quantity;
    const taxRate = buyer.soulbond ? SOULBOND_TAX_RATE : MARKET_TAX_RATE;
    const tax = Math.floor(totalPrice * taxRate);
    const totalCost = totalPrice + tax;

    // Check currency
    if (listing.currency === 'gold' && buyer.gold < totalCost) return { success: false, error: 'Not enough gold' };
    if (listing.currency === 'vs' && buyer.vs < totalCost) return { success: false, error: 'Not enough VS' };

    // Deduct from buyer
    if (listing.currency === 'gold') buyer.gold -= totalCost;
    else buyer.vs -= totalCost;

    // Pay seller
    const seller = this.store.getPlayer(listing.sellerId);
    if (seller) {
      if (listing.currency === 'gold') seller.gold += totalPrice;
      else seller.vs += totalPrice;
    }

    // Add item to buyer inventory
    const existing = buyer.inventory.find(i => i.item.id === listing.itemId && i.item.stackable);
    if (existing) {
      existing.quantity += quantity;
    } else {
      buyer.inventory.push({ item: existing?.item || { id: listing.itemId, name: listing.itemName } as any, quantity });
    }

    // Update listing
    listing.quantity -= quantity;
    if (listing.quantity <= 0) this.store.marketListings.delete(listingId);

    return { success: true };
  }

  cancel(player: Player, listingId: string): boolean {
    const listing = this.store.marketListings.get(listingId);
    if (!listing || listing.sellerId !== player.id) return false;

    // Return item to seller
    const existing = player.inventory.find(i => i.item.id === listing.itemId && i.item.stackable);
    if (existing) existing.quantity += listing.quantity;
    else player.inventory.push({ item: { id: listing.itemId, name: listing.itemName } as any, quantity: listing.quantity });

    this.store.marketListings.delete(listingId);
    return true;
  }

  getAllListings(): MarketListing[] {
    return Array.from(this.store.marketListings.values())
      .filter(l => l.expiresAt > Date.now())
      .sort((a, b) => a.listedAt - b.listedAt);
  }

  convertVsToVeya(player: Player, amount: number): boolean {
    if (amount < VS_TO_VEYA_RATE || player.vs < amount) return false;
    const veyaAmount = Math.floor(amount / VS_TO_VEYA_RATE);
    player.vs -= veyaAmount * VS_TO_VEYA_RATE;
    player.veyA += veyaAmount;
    return true;
  }
}

import SteamItemEntity from '@domain/entities/steam-item.entity';
import { SteamInventory } from '@domain/types/steam-inventory.type';
import { SUPPORTED_CURRENCIES } from '@domain/types/supported-currencies.type';

export interface SteamItemView {
  id: string;
  name: string;
  marketHashName: string;
  prices?: Partial<Record<SUPPORTED_CURRENCIES, number>>;
  tags?: string[];
  type: string;
}

export class SteamItemAdapter {
  public adapt(inventory: SteamInventory): SteamItemView[] {
    return inventory.map((item) => this.transform(item));
  }

  private transform(item: SteamItemEntity): SteamItemView {
    return {
      id: item.id,
      name: item.name,
      marketHashName: item.marketHashName,
      prices: item.prices,
      tags: item.tags.map((tag) => tag.name),
      type: item.type,
    };
  }
} 
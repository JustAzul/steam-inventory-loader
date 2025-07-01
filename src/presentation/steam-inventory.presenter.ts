import SteamItemEntity from '@domain/entities/steam-item.entity';

// ===========================================================================
// NOTE: The following types and classes are defined locally here due to
// inconsistencies in the project structure. They should be moved to
// their correct files once the structure is clarified.
// ===========================================================================

/**
 * Represents a user's inventory, which is an array of SteamItemEntity.
 * The entity may be augmented with a `prices` property dynamically.
 */
export type SteamInventory = (SteamItemEntity & {
  prices?: Partial<Record<SupportedCurrencies, number>>;
})[];

/**
 * Supported currency types.
 */
export type SupportedCurrencies = 'USD' | 'EUR' | 'BRL';

/**
 * A plain object representing a Steam item for presentation purposes.
 */
export interface SteamItemView {
  id: string;
  marketHashName: string;
  name: string;
  prices?: Partial<Record<SupportedCurrencies, number>>;
  tags?: string[];
  type: string;
}

/**
 * Adapts SteamInventory domain entities into a simpler format for the presenter.
 */
class SteamItemAdapter {
  public adapt(inventory: SteamInventory): SteamItemView[] {
    return inventory.map((item) => this.transform(item));
  }

  private transform(
    item: SteamItemEntity & {
      prices?: Partial<Record<SupportedCurrencies, number>>;
    },
  ): SteamItemView {
    return {
      id: item.id,
      marketHashName: item.adapter.market_hash_name,
      name: item.adapter.name,
      prices: item.prices,
      tags: item.tags?.flatMap((tag) => {
        if (typeof tag.name === 'string' && tag.name.length > 0) {
          return [tag.name];
        }
        return [];
      }),
      type: item.adapter.type,
    };
  }
}

// ===========================================================================

export class SteamInventoryPresenter {
  private readonly adapter = new SteamItemAdapter();

  constructor(private readonly props: { inventory: SteamInventory }) {}

  public get plain(): SteamItemView[] {
    return this.adapter.adapt(this.props.inventory);
  }

  public get inventory(): SteamInventory {
    return this.props.inventory;
  }

  public get totalItems(): number {
    const inventory = this.adapter.adapt(this.props.inventory);
    return inventory.length;
  }

  public getTotalValue(currency: SupportedCurrencies): string {
    const inventory = this.adapter.adapt(this.props.inventory);
    const total = inventory.reduce((acc, item) => {
      if (typeof item.prices?.[currency] === 'number') {
        return acc + item.prices[currency];
      }
      return acc;
    }, 0);
    return new Intl.NumberFormat('en-US', {
      currency,
      style: 'currency',
    }).format(total);
  }

  public filter(predicate: (item: SteamItemView) => boolean): SteamItemView[] {
    const inventory = this.adapter.adapt(this.props.inventory);
    return inventory.filter(predicate);
  }
} 
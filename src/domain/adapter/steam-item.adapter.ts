import { InventoryPageAsset } from '../types/inventory-page-asset.type';
import { InventoryPageDescription } from '../types/inventory-page-description.type';

export class SteamItemAdapter {
  constructor(
    private readonly asset: InventoryPageAsset,
    private readonly description: InventoryPageDescription,
  ) {}

  public get classid(): string {
    return this.asset.classid;
  }

  public get instanceid(): string {
    return this.asset.instanceid || '0';
  }

  public get amount(): number {
    return Number(this.asset.amount);
  }

  public get contextid(): string {
    return this.asset.contextid;
  }

  public get tradable(): boolean {
    return Boolean(this.description?.tradable);
  }

  public get marketable(): boolean {
    return Boolean(this.description?.marketable);
  }

  public get commodity(): boolean {
    return Boolean(this.description?.commodity);
  }

  public get market_hash_name(): string {
    return this.description.market_hash_name;
  }

  public get icon_url(): string {
    return this.description.icon_url;
  }
  
  public get icon_url_large(): string {
    return this.description.icon_url_large;
  }

  public get type(): string {
    return this.description.type;
  }
  
  public get name(): string {
    return this.description.name;
  }

  public get background_color(): string {
    return this.description.background_color;
  }

  public get descriptions(): InventoryPageDescription['descriptions'] {
    return this.description.descriptions;
  }
} 
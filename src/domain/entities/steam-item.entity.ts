import { SteamItemAdapter } from '../adapter/steam-item.adapter';
import { IAppSpecificLogic } from '../strategies/app-specific/IAppSpecificLogic';
import { InnerItemDescription } from '../types/inner-item-description.type';
import { InventoryPageAsset } from '../types/inventory-page-asset.type';
import { InventoryPageDescription } from '../types/inventory-page-description.type';
import { ItemActions } from '../types/item-actions.type';
import SteamItemTag from './steam-item-tag.entity';

export enum CardBorderInternalName {
  FOIL = 'cardborder_1',
  NORMAL = 'cardborder_0',
}

export type SteamItemProps = {
  asset: InventoryPageAsset;
  description: InventoryPageDescription;
  strategy: IAppSpecificLogic;
  tags?: SteamItemTag[];
};

export default class SteamItemEntity {
  public readonly adapter: SteamItemAdapter;
  private readonly asset: InventoryPageAsset;
  private readonly description: InventoryPageDescription;
  private readonly strategy: IAppSpecificLogic;
  private readonly tagsInternal?: SteamItemTag[];

  public constructor({ asset, description, strategy, tags }: SteamItemProps) {
    this.asset = asset;
    this.description = description;
    this.strategy = strategy;
    this.tagsInternal = tags;
    this.adapter = new SteamItemAdapter(asset, description);
  }

  public get is_currency(): boolean {
    return (
      Boolean(this.asset.is_currency) ||
      Boolean(this.asset.currency) ||
      typeof this.asset.currencyid !== 'undefined'
    );
  }

  public get id(): string {
    if (
      this.is_currency &&
      this.asset?.currencyid !== undefined &&
      this.asset.currencyid !== null
    ) {
      return this.asset.currencyid;
    }

    return this.asset.assetid;
  }

  public getAppId(): number {
    return Number(this.asset.appid);
  }

  public get assetid(): string {
    return this.asset.assetid;
  }

  public get owner_descriptions(): InnerItemDescription[] | undefined {
    return this.description?.owner_descriptions;
  }

  public get item_expiration(): string | undefined {
    return this.description?.item_expiration;
  }

  public get fraudwarnings(): unknown[] {
    return this.description?.fraudwarnings ?? [];
  }

  public get descriptions(): InnerItemDescription[] {
    return this.description?.descriptions ?? [];
  }

  public getMarketTradableRestriction(): number {
    return Number(this.description?.market_tradable_restriction) || 0;
  }

  public getMarketMarketableRestriction(): number {
    return Number(this.description?.market_marketable_restriction) || 0;
  }

  public get actions(): ItemActions[] {
    return this.description?.actions ?? [];
  }

  public getCurrency(): number {
    return Number(this.description?.currency) || 0;
  }

  public get market_name(): string {
    return this.description.market_name;
  }

  public get owner(): Record<string, unknown> | undefined {
    if (Object.prototype.hasOwnProperty.call(this.description, 'owner')) {
      if (
        typeof this.description.owner !== 'object' ||
        !this.description.owner ||
        JSON.stringify(this.description.owner) === '{}'
      ) {
        return undefined;
      }

      return this.description.owner as Record<string, unknown>;
    }

    return undefined;
  }

  public get tags(): SteamItemTag[] | undefined {
    return this.tagsInternal;
  }

  public findTag(categoryToFind: string): SteamItemTag | undefined {
    return this.tagsInternal?.find(
      ({ category }) => category === categoryToFind,
    );
  }

  public getStrategy(): IAppSpecificLogic {
    return this.strategy;
  }
}

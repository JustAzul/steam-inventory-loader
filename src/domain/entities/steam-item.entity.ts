import DomainException from '../exceptions/domain.exception';
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
  public readonly asset: InventoryPageAsset;
  public readonly description: InventoryPageDescription;
  private readonly strategy: IAppSpecificLogic;
  private readonly tagsInternal?: SteamItemTag[];

  private constructor({ asset, description, strategy, tags }: SteamItemProps) {
    this.asset = asset;
    this.description = description;
    this.strategy = strategy;
    this.tagsInternal = tags;
  }

  public static create({
    asset,
    description,
    strategy,
    tags,
  }: SteamItemProps): SteamItemEntity {
    if (!asset.assetid) {
      throw new DomainException('SteamItemEntity', 'assetid is required');
    }
    if (!asset.appid) {
      throw new DomainException('SteamItemEntity', 'appid is required');
    }
    if (!asset.classid) {
      throw new DomainException('SteamItemEntity', 'classid is required');
    }
    if (!description.market_hash_name) {
      throw new DomainException(
        'SteamItemEntity',
        'market_hash_name is required',
      );
    }
    return new SteamItemEntity({ asset, description, strategy, tags });
  }

  private get is_currency(): boolean {
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

  public get classid(): string {
    return this.asset.classid;
  }

  public get assetid(): string {
    return this.asset.assetid;
  }

  public getInstanceId(): string {
    return this.asset.instanceid || '0';
  }

  public getAmount(): number {
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

  public get market_hash_name(): string {
    return this.description.market_hash_name;
  }

  public get actions(): ItemActions[] {
    return this.description?.actions ?? [];
  }

  public get background_color(): string {
    return this.description.background_color;
  }

  public getCurrency(): number {
    return Number(this.description?.currency) || 0;
  }

  public get icon_url(): string {
    return this.description.icon_url;
  }

  public get icon_url_large(): string {
    return this.description.icon_url_large;
  }

  public get market_name(): string {
    return this.description.market_name;
  }

  public get type(): string {
    return this.description.type;
  }

  public get name(): string {
    return this.description.name;
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

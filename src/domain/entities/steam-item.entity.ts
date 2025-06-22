/* eslint-disable camelcase */
import { InnerItemDescription } from '../types/inner-item-description.type';
import { InventoryPageAsset } from '../types/inventory-page-asset.type';
import { InventoryPageDescription } from '../types/inventory-page-description.type';
import { ItemActions } from '../types/item-actions.type';

import SteamItemTag from './steam-item-tag.entity';

export type SteamItemProps = {
  asset: InventoryPageAsset;
  description: InventoryPageDescription;
  tags?: SteamItemTag[];
};

export default class SteamItemEntity {
  private readonly asset: InventoryPageAsset;
  private readonly description: InventoryPageDescription;
  private readonly tagsInternal?: SteamItemTag[];

  public constructor({ asset, description, tags }: SteamItemProps) {
    this.asset = asset;
    this.description = description;
    this.tagsInternal = tags;
  }

  private get is_currency(): boolean {
    return (
      Boolean(this.asset.is_currency) ||
      Boolean(this.asset.currency) ||
      typeof this.asset.currencyid !== 'undefined'
    );
  }

  private get listingKey(): string {
    return `${this.asset.classid}_${this.asset.instanceid}`;
  }

  public get id(): string {
    if (this.is_currency && !!this.asset?.currencyid) {
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
    return this.description?.owner_descriptions || undefined;
  }

  public get item_expiration(): string | undefined {
    return this.description?.item_expiration || undefined;
  }

  public get fraudwarnings(): unknown[] {
    return this.description?.fraudwarnings || [];
  }

  public get descriptions(): InnerItemDescription[] {
    return this.description?.descriptions || [];
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
    return this.description?.actions || [];
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
      if (JSON.stringify(this.description.owner) === '{}') {
        return undefined;
      }

      return this.description.owner as Record<string, unknown>;
    }

    return undefined;
  }

  public get tags(): SteamItemTag[] | undefined {
    return this.tagsInternal;
  }
}

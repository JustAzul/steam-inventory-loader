/* eslint-disable camelcase */
import { InnerItemDescription } from '../types/inner-item-description.type';
import { ItemActions } from '../types/item-actions.type';
import { ItemAsset } from '../types/item-asset.type';
import { ItemDescription } from '../types/item-description.type';
import SteamItemTag from './steam-item-tag.entity';

export default class SteamItemEntity {
  private asset: ItemAsset;

  private description: ItemDescription;

  public constructor(asset: ItemAsset, description: ItemDescription) {
    this.asset = asset;

    if (Object.prototype.hasOwnProperty.call(description, this.listingKey))
      this.description = description[
        this.listingKey as never
      ] as ItemDescription;
    else this.description = description;
  }

  private get is_currency(): boolean {
    return (
      !!this.asset.is_currency ||
      !!this.asset.currency ||
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

  public get appid(): number {
    return Number(this.asset.appid);
  }

  public get classid(): string {
    return this.asset.classid;
  }

  public get assetid(): string {
    return this.asset.assetid;
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
    return !!this.description?.tradable;
  }

  public get marketable(): boolean {
    return !!this.description?.marketable;
  }

  public get commodity(): boolean {
    return !!this.description?.commodity;
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

  public get market_tradable_restriction(): number {
    return Number(this.description?.market_tradable_restriction) || 0;
  }

  public get market_marketable_restriction(): number {
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

  public get currency(): number {
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

  public get owner(): unknown | undefined {
    if (Object.prototype.hasOwnProperty.call(this.description, 'owner')) {
      if (JSON.stringify(this.description.owner) === '{}') {
        return undefined;
      }

      return this.description.owner;
    }

    return undefined;
  }

  public get tags(): SteamItemTag[] | undefined {
    if (Object.prototype.hasOwnProperty.call(this.description, 'tags')) {
      const tags: SteamItemTag[] = [];

      for (let i = 0; i < this.description.tags.length; i += 1) {
        tags.push(new SteamItemTag(this.description.tags[i]));
      }

      return tags;
    }

    return undefined;
  }

  public get market_fee_app(): number | undefined {
    if (
      this.appid === 753 &&
      this.contextid === '6' &&
      !!this.market_hash_name
    ) {
      const matchResult = /^(\d+)-/.exec(this.market_hash_name);
      if (matchResult) return parseInt(matchResult[1], 10);
    }

    return undefined;
  }

  public get cache_expiration(): string | undefined {
    if (this.item_expiration) return this.item_expiration;

    if (
      this.appid === 730 &&
      this.contextid === '2' &&
      this.owner_descriptions
    ) {
      const tradableDescription = this.owner_descriptions.find(
        (description) =>
          description.value &&
          description.value.indexOf('Tradable After ') === 0,
      );

      if (tradableDescription) {
        const date: Date = new Date(
          tradableDescription.value.substring(15).replace(/[,()]/g, ''),
        );

        return date.toISOString();
      }
    }

    return undefined;
  }
}

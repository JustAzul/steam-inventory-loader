/* eslint-disable camelcase */
import { SteamTag } from '../types/steam-tag.type';

export default class SteamItemTag {
  private tag: SteamTag;

  public constructor(tag: SteamTag) {
    this.tag = tag;
  }

  public get internal_name(): string {
    return this.tag.internal_name;
  }

  public get name(): string | undefined {
    return this.tag?.localized_tag_name || this.tag.name;
  }

  public get category(): string | undefined {
    return this.tag?.category;
  }

  public get color(): string | undefined {
    return this.tag.color;
  }

  public get category_name(): string | undefined {
    return this.tag?.localized_category_name || this.tag.category_name;
  }
}

import DomainException from '../exceptions/domain.exception';
import { SteamTag } from '../types/steam-tag.type';

export default class SteamItemTag {
  private readonly tag: SteamTag;

  private constructor(tag: SteamTag) {
    this.tag = tag;
  }

  public static create(tag: SteamTag): SteamItemTag {
    if (!tag.internal_name || tag.internal_name.length === 0) {
      throw new DomainException(
        `SteamItemTag`,
        `Tag internal_name cannot be empty`,
      );
    }
    if (!tag.category || tag.category.length === 0) {
      throw new DomainException(`SteamItemTag`, `Tag category cannot be empty`);
    }
    return new SteamItemTag(tag);
  }

  public get internal_name(): string {
    return this.tag.internal_name;
  }

  public get name(): string | undefined {
    return this.tag?.localized_tag_name ?? this.tag.name;
  }

  public get category(): string | undefined {
    return this.tag?.category;
  }

  public get color(): string | undefined {
    return this.tag.color;
  }

  public get category_name(): string | undefined {
    return this.tag?.localized_category_name ?? this.tag.category_name;
  }
}

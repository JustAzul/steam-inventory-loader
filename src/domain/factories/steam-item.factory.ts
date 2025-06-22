/* eslint-disable camelcase */
import { InventoryPageAsset } from '../types/inventory-page-asset.type';
import { InventoryPageDescription } from '../types/inventory-page-description.type';
import SteamItemTag from '../entities/steam-item-tag.entity';
import SteamItemEntity from '../entities/steam-item.entity';

export default class SteamItemFactory {
  public static createFromInventoryPage(
    assets: InventoryPageAsset[],
    descriptions: InventoryPageDescription[],
  ): SteamItemEntity[] {
    const descriptionsMap = descriptions.reduce(
      (acc, desc) => {
        const key = `${desc.classid}_${desc.instanceid}`;
        acc[key] = desc;
        return acc;
      },
      {} as Record<string, InventoryPageDescription>,
    );

    const items: SteamItemEntity[] = [];
    for (const asset of assets) {
      const key = `${asset.classid}_${asset.instanceid}`;
      const description = descriptionsMap[key];
      if (description) {
        const processedDescription = this.processDescription(
          asset,
          description,
        );
        const tags = this.createTags(processedDescription);
        const entity = new SteamItemEntity({
          asset,
          description: processedDescription,
          tags,
        });
        items.push(entity);
      }
    }
    return items;
  }

  private static processDescription(
    asset: InventoryPageAsset,
    description: InventoryPageDescription,
  ): InventoryPageDescription {
    const listingKey = `${asset.classid}_${asset.instanceid}`;
    if (Object.prototype.hasOwnProperty.call(description, listingKey)) {
      return description[listingKey as never] as InventoryPageDescription;
    }
    return description;
  }

  private static createTags(
    description: InventoryPageDescription,
  ): SteamItemTag[] | undefined {
    if (Object.prototype.hasOwnProperty.call(description, 'tags')) {
      return description.tags.map((tag) => new SteamItemTag(tag));
    }
    return undefined;
  }
} 
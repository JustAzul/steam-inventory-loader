import SteamItemEntity from '@domain/entities/steam-item.entity';
import { InventoryPageAsset } from '@domain/types/inventory-page-asset.type';
import { InventoryPageDescription } from '@domain/types/inventory-page-description.type';

export interface MapAssetsToSteamItemsUseCaseProps {
  assets: InventoryPageAsset[];
  descriptions: InventoryPageDescription[];
}

export default class MapAssetsToSteamItemsUseCase {
  public execute({
    assets,
    descriptions,
  }: MapAssetsToSteamItemsUseCaseProps): SteamItemEntity[] {
    if (!assets || !descriptions) {
      return [];
    }

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
        const item = new SteamItemEntity({ asset, description });
        items.push(item);
      }
    }

    return items;
  }
} 
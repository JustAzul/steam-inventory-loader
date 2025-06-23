import SteamItemEntity from '@domain/entities/steam-item.entity';
import SteamItemFactory from '@domain/factories/steam-item.factory';
import { InventoryPageAsset } from '@domain/types/inventory-page-asset.type';
import { InventoryPageDescription } from '@domain/types/inventory-page-description.type';
import { injectable } from 'tsyringe';

export interface MapAssetsToSteamItemsUseCaseProps {
  assets: InventoryPageAsset[];
  descriptions: InventoryPageDescription[];
}

@injectable()
export default class MapAssetsToSteamItemsUseCase {
  public execute({
    assets,
    descriptions,
  }: MapAssetsToSteamItemsUseCaseProps): SteamItemEntity[] {
    if (!assets || !descriptions) {
      return [];
    }

    return SteamItemFactory.createFromInventoryPage(assets, descriptions);
  }
}

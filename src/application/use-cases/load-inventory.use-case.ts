import SteamItemEntity from '@domain/entities/steam-item.entity';
import { LoaderConfig } from '@domain/types/loader-config.type';
import GetInventoryPageResultUseCase from './get-inventory-page-result.use-case';
import MapAssetsToSteamItemsUseCase from './map-assets-to-steam-items.use-case';

export interface LoadInventoryUseCaseProps {
  steamID64: string;
  appID: string;
  contextID: string;
  config: LoaderConfig;
}

export interface LoadInventoryUseCaseInterfaces {
  getInventoryPage: GetInventoryPageResultUseCase;
  mapAssetsToSteamItems: MapAssetsToSteamItemsUseCase;
}

export default class LoadInventoryUseCase {
  private readonly props: LoadInventoryUseCaseProps;
  private readonly getInventoryPage: GetInventoryPageResultUseCase;
  private readonly mapAssetsToSteamItems: MapAssetsToSteamItemsUseCase;

  constructor({
    props,
    interfaces,
  }: {
    props: LoadInventoryUseCaseProps;
    interfaces: LoadInventoryUseCaseInterfaces;
  }) {
    this.props = props;
    this.getInventoryPage = interfaces.getInventoryPage;
    this.mapAssetsToSteamItems = interfaces.mapAssetsToSteamItems;
  }
  public async execute(): Promise<SteamItemEntity[]> {
    const { config } = this.props;
    const allItems: SteamItemEntity[] = [];
    let lastAssetID: string | undefined;
    let moreItems = true;

    do {
      const pageResult = await this.getInventoryPage.execute(lastAssetID);

      if (pageResult?.assets && pageResult?.descriptions) {
        const items = this.mapAssetsToSteamItems.execute({
          assets: pageResult.assets,
          descriptions: pageResult.descriptions,
        });
        allItems.push(...items);
      }

      moreItems = !!pageResult?.more_items;
      lastAssetID = pageResult?.last_assetid;
    } while (moreItems);

    if (config.tradableOnly) {
      return allItems.filter((item) => item.tradable);
    }
    return allItems;
  }
} 
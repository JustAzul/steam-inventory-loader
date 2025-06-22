import GetInventoryPageResultUseCase from '../get-inventory-page-result.use-case';
import MapAssetsToSteamItemsUseCase from '../map-assets-to-steam-items.use-case';
import SteamItemEntity from '@domain/entities/steam-item.entity';
import { inventoryPageResultMock } from './mocks';

export const createGetInventoryPageMock = (): jest.Mocked<GetInventoryPageResultUseCase> => {
  return {
    execute: jest
      .fn()
      .mockResolvedValueOnce(inventoryPageResultMock.page1)
      .mockResolvedValueOnce(inventoryPageResultMock.page2),
  } as unknown as jest.Mocked<GetInventoryPageResultUseCase>;
};

export const createMapAssetsToSteamItemsMock = (): jest.Mocked<MapAssetsToSteamItemsUseCase> => {
  return {
    execute: jest
      .fn()
      .mockImplementationOnce(() => [
        new SteamItemEntity({
          asset: inventoryPageResultMock.page1.assets[0],
          description: inventoryPageResultMock.page1.descriptions[0],
        }),
      ])
      .mockImplementationOnce(() => [
        new SteamItemEntity({
          asset: inventoryPageResultMock.page2.assets[0],
          description: inventoryPageResultMock.page2.descriptions[0],
        }),
      ]),
  } as unknown as jest.Mocked<MapAssetsToSteamItemsUseCase>;
}; 
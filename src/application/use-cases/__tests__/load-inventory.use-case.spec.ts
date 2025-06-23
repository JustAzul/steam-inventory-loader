import 'reflect-metadata';
import PrivateProfileException from '@application/exceptions/private-profile.exception';
import { InventoryPageAsset } from '@domain/types/inventory-page-asset.type';
import { CookieJar } from 'tough-cookie';
import { container } from 'tsyringe';

import InventoryPageService from '../../services/inventory-page.service';
import LoadInventoryUseCase, {
  LoadInventoryUseCaseProps,
} from '../load-inventory.use-case';
import MapAssetsToSteamItemsUseCase from '../map-assets-to-steam-items.use-case';

import { inventoryPageResultMock, steamItemsMocks } from './mocks';
import {
  createInventoryPageServiceMock,
  createMapAssetsToSteamItemsMock,
} from './use-case.mocks';


describe('Application :: UseCases :: LoadInventoryUseCase', () => {
  let useCase: LoadInventoryUseCase;
  let inventoryService: jest.Mocked<InventoryPageService>;
  let mapAssetsToSteamItems: jest.Mocked<MapAssetsToSteamItemsUseCase>;

  const baseProps: LoadInventoryUseCaseProps = {
    appID: '730',
    contextID: '2',
    steamID64: '123456789',
    config: {
      SteamCommunity_Jar: new CookieJar(),
      tradableOnly: false,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    inventoryService = createInventoryPageServiceMock();
    mapAssetsToSteamItems = createMapAssetsToSteamItemsMock();

    container.registerInstance(InventoryPageService, inventoryService);
    container.registerInstance(
      MapAssetsToSteamItemsUseCase,
      mapAssetsToSteamItems,
    );
    useCase = container.resolve(LoadInventoryUseCase);
  });

  it('should load multiple pages and map results correctly', async () => {
    // Arrange
    inventoryService.getInventoryPage
      .mockResolvedValueOnce(inventoryPageResultMock.page1)
      .mockResolvedValueOnce(inventoryPageResultMock.page2)
      .mockResolvedValueOnce(inventoryPageResultMock.emptyPage);
    mapAssetsToSteamItems.execute
      .mockReturnValueOnce(steamItemsMocks.page1)
      .mockReturnValueOnce(steamItemsMocks.page2)
      .mockReturnValueOnce([]);

    // Act
    const result = await useCase.execute(baseProps);

    // Assert
    expect(inventoryService.getInventoryPage).toHaveBeenCalledTimes(3);
    expect(mapAssetsToSteamItems.execute).toHaveBeenCalledTimes(3);
    expect(result).toEqual([
      ...steamItemsMocks.page1,
      ...steamItemsMocks.page2,
    ]);
    expect(result.length).toBe(2);
  });

  it('should filter for tradable items only when tradableOnly is true', async () => {
    // Arrange
    const props = {
      ...baseProps,
      config: { ...baseProps.config, tradableOnly: true },
    };
    inventoryService.getInventoryPage.mockResolvedValueOnce(
      inventoryPageResultMock.mixedTradablePage,
    );
    mapAssetsToSteamItems.execute.mockReturnValueOnce(
      steamItemsMocks.mixedTradablePage.filter((item) => item.tradable),
    );

    // Act
    const result = await useCase.execute(props);

    // Assert
    expect(mapAssetsToSteamItems.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        assets: inventoryPageResultMock.mixedTradablePage.assets.filter(
          (a: InventoryPageAsset) =>
            inventoryPageResultMock.mixedTradablePage.descriptions.find(
              (d) => d.classid === a.classid && d.instanceid === a.instanceid,
            )?.tradable === 1,
        ),
      }),
    );
    expect(result.length).toBe(1); // Only the tradable item should be left
  });

  it('should throw a PrivateProfileException when the inventory service fails', async () => {
    // Arrange
    inventoryService.getInventoryPage.mockRejectedValue(
      new PrivateProfileException({ request: { url: '' }, response: {} }),
    );

    // Act & Assert
    await expect(useCase.execute(baseProps)).rejects.toThrow(
      PrivateProfileException,
    );
  });
});

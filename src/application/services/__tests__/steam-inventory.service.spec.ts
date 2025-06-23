import 'reflect-metadata';
import { CookieJar as ToughCookieJar } from 'tough-cookie';
import { container } from 'tsyringe';

import SteamItemFactory from '@domain/factories/steam-item.factory';

import { inventoryPageResultMock } from '../../use-cases/__tests__/mocks';
import InventoryPageService from '../inventory-page.service';
import SteamInventoryService, {
  LoadInventoryParams,
} from '../steam-inventory.service';

describe('Application :: Services :: SteamInventoryService', () => {
  let service: SteamInventoryService;
  let inventoryPageService: jest.Mocked<InventoryPageService>;

  beforeEach(() => {
    jest.clearAllMocks();
    inventoryPageService = {
      getInventoryPage: jest.fn(),
    } as unknown as jest.Mocked<InventoryPageService>;
    container.registerInstance(InventoryPageService, inventoryPageService);
    service = container.resolve(SteamInventoryService);
  });

  const defaultParams: LoadInventoryParams = {
    appID: '730',
    contextID: '2',
    steamID64: 'steamId64',
    config: {
      itemsPerPage: 100,
      Language: 'en',
      tradableOnly: false,
      SteamCommunity_Jar: new ToughCookieJar(),
    },
  };

  it('should load a single page inventory', async () => {
    inventoryPageService.getInventoryPage.mockResolvedValueOnce({
      ...inventoryPageResultMock.page1,
      more_items: 0,
    });
    const items = await service.loadInventory(defaultParams);
    const expectedItems = SteamItemFactory.createFromInventoryPage(
      inventoryPageResultMock.page1.assets,
      inventoryPageResultMock.page1.descriptions,
    );
    expect(inventoryPageService.getInventoryPage).toHaveBeenCalledTimes(1);
    expect(items).toEqual(expectedItems);
  });

  it('should load a multi-page inventory', async () => {
    inventoryPageService.getInventoryPage
      .mockResolvedValueOnce({
        ...inventoryPageResultMock.page1,
        more_items: 1,
      })
      .mockResolvedValueOnce({
        ...inventoryPageResultMock.page2,
        more_items: 0,
      });

    const items = await service.loadInventory(defaultParams);

    const expectedItems1 = SteamItemFactory.createFromInventoryPage(
      inventoryPageResultMock.page1.assets,
      inventoryPageResultMock.page1.descriptions,
    );
    const expectedItems2 = SteamItemFactory.createFromInventoryPage(
      inventoryPageResultMock.page2.assets,
      inventoryPageResultMock.page2.descriptions,
    );

    expect(inventoryPageService.getInventoryPage).toHaveBeenCalledTimes(2);
    expect(inventoryPageService.getInventoryPage).toHaveBeenCalledWith(
      expect.objectContaining({
        lastAssetID: undefined,
      }),
    );
    expect(inventoryPageService.getInventoryPage).toHaveBeenCalledWith(
      expect.objectContaining({
        lastAssetID: inventoryPageResultMock.page1.last_assetid,
      }),
    );
    expect(items).toEqual([...expectedItems1, ...expectedItems2]);
  });

  it('should filter for tradable items only', async () => {
    const pageWithUntradable = {
      ...inventoryPageResultMock.page1,
      descriptions: [
        ...inventoryPageResultMock.page1.descriptions,
        {
          ...inventoryPageResultMock.page1.descriptions[0],
          classid: 'untradable_classid',
          tradable: 0,
        },
      ],
      more_items: 0,
    };
    inventoryPageService.getInventoryPage.mockResolvedValueOnce(
      pageWithUntradable,
    );
    const params: LoadInventoryParams = {
      ...defaultParams,
      config: { ...defaultParams.config, tradableOnly: true },
    };
    const items = await service.loadInventory(params);
    const expectedItems = SteamItemFactory.createFromInventoryPage(
      inventoryPageResultMock.page1.assets,
      inventoryPageResultMock.page1.descriptions.filter((d) => d.tradable),
    );
    expect(items).toEqual(expectedItems);
    expect(items.length).toBeLessThan(
      pageWithUntradable.descriptions.length,
    );
  });
}); 
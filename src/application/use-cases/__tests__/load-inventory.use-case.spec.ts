import { IFetcher } from '@application/ports/fetcher.port';
import SteamItemEntity from '@domain/entities/steam-item.entity';
import { CookieJar } from 'tough-cookie';
import GetInventoryPageResultUseCase from '../get-inventory-page-result.use-case';
import LoadInventoryUseCase, {
  LoadInventoryUseCaseInterfaces,
  LoadInventoryUseCaseProps,
} from '../load-inventory.use-case';
import MapAssetsToSteamItemsUseCase from '../map-assets-to-steam-items.use-case';
import { inventoryPageResultMock } from './mocks';
import PrivateProfileException from '@application/exceptions/private-profile.exception';

describe('Application :: UseCases :: LoadInventoryUseCase', () => {
  let getInventoryPageMock: GetInventoryPageResultUseCase;
  let mapAssetsToSteamItemsMock: MapAssetsToSteamItemsUseCase;

  it('should process and return a full inventory, respecting pagination', async () => {
    getInventoryPageMock = {
      execute: jest
        .fn()
        .mockResolvedValueOnce(inventoryPageResultMock.page1)
        .mockResolvedValueOnce(inventoryPageResultMock.page2),
    } as any;

    mapAssetsToSteamItemsMock = {
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
    } as any;

    const useCaseProps: LoadInventoryUseCaseProps = {
      steamID64: '76561197994150794',
      appID: '730',
      contextID: '2',
      config: {
        SteamCommunity_Jar: new CookieJar(),
        Language: 'english',
        itemsPerPage: 1,
        tradableOnly: false,
      },
    };

    const useCaseInterfaces: LoadInventoryUseCaseInterfaces = {
      getInventoryPage: getInventoryPageMock,
      mapAssetsToSteamItems: mapAssetsToSteamItemsMock,
    };

    const useCase = new LoadInventoryUseCase({
      props: useCaseProps,
      interfaces: useCaseInterfaces,
    });

    const inventory = await useCase.execute();

    expect(inventory).toHaveLength(2);
    expect(inventory[0]).toBeInstanceOf(SteamItemEntity);
    expect(inventory[1]).toBeInstanceOf(SteamItemEntity);
    expect(getInventoryPageMock.execute).toHaveBeenCalledTimes(2);
    expect(getInventoryPageMock.execute).toHaveBeenCalledWith(undefined);
    expect(getInventoryPageMock.execute).toHaveBeenCalledWith('1');
    expect(mapAssetsToSteamItemsMock.execute).toHaveBeenCalledTimes(2);
  });

  it('should filter for tradable items only', async () => {
    getInventoryPageMock = {
      execute: jest
        .fn()
        .mockResolvedValueOnce(inventoryPageResultMock.page1)
        .mockResolvedValueOnce(inventoryPageResultMock.page2),
    } as any;

    mapAssetsToSteamItemsMock = {
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
    } as any;

    const useCaseProps: LoadInventoryUseCaseProps = {
      steamID64: '76561197994150794',
      appID: '730',
      contextID: '2',
      config: {
        SteamCommunity_Jar: new CookieJar(),
        Language: 'english',
        itemsPerPage: 1,
        tradableOnly: true,
      },
    };

    const useCaseInterfaces: LoadInventoryUseCaseInterfaces = {
      getInventoryPage: getInventoryPageMock,
      mapAssetsToSteamItems: mapAssetsToSteamItemsMock,
    };

    const useCase = new LoadInventoryUseCase({
      props: useCaseProps,
      interfaces: useCaseInterfaces,
    });

    const inventory = await useCase.execute();

    expect(inventory).toHaveLength(1);
    expect(inventory[0].tradable).toBe(true);
  });

  it('should throw a private profile exception', async () => {
    getInventoryPageMock = {
      execute: jest.fn().mockRejectedValue(
        new PrivateProfileException({
          request: { url: 'http://test.com' },
          response: {},
        }),
      ),
    } as any;

    mapAssetsToSteamItemsMock = {
      execute: jest.fn(),
    } as any;

    const useCaseProps: LoadInventoryUseCaseProps = {
      steamID64: '76561197994150794',
      appID: '730',
      contextID: '2',
      config: {
        SteamCommunity_Jar: new CookieJar(),
        Language: 'english',
        itemsPerPage: 1,
      },
    };

    const useCaseInterfaces: LoadInventoryUseCaseInterfaces = {
      getInventoryPage: getInventoryPageMock,
      mapAssetsToSteamItems: mapAssetsToSteamItemsMock,
    };

    const useCase = new LoadInventoryUseCase({
      props: useCaseProps,
      interfaces: useCaseInterfaces,
    });

    await expect(useCase.execute()).rejects.toThrow(PrivateProfileException);
  });
}); 
import 'reflect-metadata';
import { CookieJar } from 'tough-cookie';

import { IFetcher } from '@application/ports/fetcher.port';
import { SteamItemFactory } from '@domain/factories/steam-item.factory';
import {
  inventoryPageResultMock,
  steamItemsMocks,
} from '@domain/test/__mocks__';

import LoadInventoryUseCase from '../load-inventory.use-case';

describe('LoadInventoryUseCase', () => {
  let useCase: LoadInventoryUseCase;
  let fetcherMock: jest.Mocked<IFetcher>;
  let factoryMock: jest.Mocked<SteamItemFactory>;
  let cookieJarMock: CookieJar;

  beforeEach(() => {
    fetcherMock = {
      execute: jest.fn(),
    };
    factoryMock = {
      createFromInventoryPage: jest.fn(),
    } as unknown as jest.Mocked<SteamItemFactory>;
    useCase = new LoadInventoryUseCase(fetcherMock, factoryMock);
    cookieJarMock = new CookieJar();
  });

  it('should load all items from inventory', async () => {
    fetcherMock.execute
      .mockResolvedValueOnce({
        ...inventoryPageResultMock.page1,
        total_inventory_count: 2,
      })
      .mockResolvedValueOnce({
        ...inventoryPageResultMock.page2,
        last_assetid: undefined,
        total_inventory_count: 2,
      });
    factoryMock.createFromInventoryPage
      .mockReturnValueOnce(steamItemsMocks.page1)
      .mockReturnValueOnce(steamItemsMocks.page2);

    const result = await useCase.execute({
      appID: 730,
      config: {
        itemsPerPage: 1,
        language: 'en',
        steamCommunityJar: cookieJarMock,
        tradableOnly: false,
      },
      contextID: '2',
      steamID64: '123',
    });
    expect(result).toHaveLength(2);
    expect(fetcherMock.execute).toHaveBeenCalledTimes(2);
    expect(factoryMock.createFromInventoryPage).toHaveBeenCalledTimes(2);
  });

  it('should load only tradable items when tradableOnly is true', async () => {
    fetcherMock.execute.mockResolvedValueOnce({
      ...inventoryPageResultMock.mixedTradablePage,
      last_assetid: undefined,
      total_inventory_count: 1,
    });
    factoryMock.createFromInventoryPage.mockReturnValueOnce(
      steamItemsMocks.mixedTradablePage.filter((i) => i.adapter.tradable),
    );

    const result = await useCase.execute({
      appID: 730,
      config: {
        itemsPerPage: 2,
        language: 'en',
        steamCommunityJar: cookieJarMock,
        tradableOnly: true,
      },
      contextID: '2',
      steamID64: '123',
    });

    expect(result).toHaveLength(1);
    expect(result[0].adapter.tradable).toBe(true);
    expect(fetcherMock.execute).toHaveBeenCalledTimes(1);
    expect(factoryMock.createFromInventoryPage).toHaveBeenCalledTimes(1);
  });

  it('should return an empty array if inventory is empty', async () => {
    fetcherMock.execute.mockResolvedValueOnce(
      inventoryPageResultMock.emptyPage,
    );
    factoryMock.createFromInventoryPage.mockReturnValue([]);

    const result = await useCase.execute({
      appID: 730,
      config: {
        itemsPerPage: 1,
        language: 'en',
        steamCommunityJar: cookieJarMock,
        tradableOnly: false,
      },
      contextID: '2',
      steamID64: '123',
    });

    expect(result).toHaveLength(0);
    expect(fetcherMock.execute).toHaveBeenCalledTimes(1);
    expect(factoryMock.createFromInventoryPage).toHaveBeenCalledTimes(0);
  });

  it('should throw an error if steamID64 is invalid', async () => {
    const props = {
      appID: 730,
      config: {
        itemsPerPage: 1,
        language: 'en',
        steamCommunityJar: cookieJarMock,
        tradableOnly: false,
      },
      contextID: '2',
      steamID64: 'invalid',
    };
    await expect(useCase.execute(props)).rejects.toThrow(
      'steamID64 is invalid',
    );
  });

  it('should throw an error if appID is invalid', async () => {
    const props = {
      appID: 0,
      config: {
        itemsPerPage: 1,
        language: 'en',
        steamCommunityJar: cookieJarMock,
        tradableOnly: false,
      },
      contextID: '2',
      steamID64: '123',
    };
    await expect(useCase.execute(props)).rejects.toThrow(
      'appID must be a positive number',
    );
  });

  it('should throw an error if contextID is invalid', async () => {
    const props = {
      appID: 730,
      config: {
        itemsPerPage: 1,
        language: 'en',
        steamCommunityJar: cookieJarMock,
        tradableOnly: false,
      },
      contextID: '',
      steamID64: '123',
    };
    await expect(useCase.execute(props)).rejects.toThrow(
      'contextID is required',
    );
  });

  it('should throw an error if steamID64 is empty', async () => {
    const props = {
      appID: 730,
      config: {
        itemsPerPage: 1,
        language: 'en',
        steamCommunityJar: new CookieJar(),
        tradableOnly: false,
      },
      contextID: '2',
      steamID64: '',
    };
    await expect(useCase.execute(props)).rejects.toThrow(
      'steamID64 is required',
    );
  });

  it('should stop fetching when there are no more items', async () => {
    fetcherMock.execute.mockResolvedValueOnce({
      ...inventoryPageResultMock.page1,
      last_assetid: undefined,
    });
    factoryMock.createFromInventoryPage.mockReturnValueOnce(
      steamItemsMocks.page1,
    );

    const result = await useCase.execute({
      appID: 730,
      config: {
        itemsPerPage: 1,
        language: 'en',
        steamCommunityJar: cookieJarMock,
        tradableOnly: false,
      },
      contextID: '2',
      steamID64: '123',
    });

    expect(result).toHaveLength(steamItemsMocks.page1.length);
    expect(fetcherMock.execute).toHaveBeenCalledTimes(1);
    expect(factoryMock.createFromInventoryPage).toHaveBeenCalledTimes(1);
  });
});

import 'reflect-metadata';
import { CookieJar } from 'tough-cookie';

import { IFetcher } from '@application/ports/fetcher.port';
import { inventoryPageResultMock } from '@domain/test/__mocks__';

import LoadInventoryUseCase from '../load-inventory.use-case';

describe('LoadInventoryUseCase', () => {
  let useCase: LoadInventoryUseCase;
  let fetcherMock: jest.Mocked<IFetcher>;
  let cookieJarMock: CookieJar;

  beforeEach(() => {
    fetcherMock = {
      execute: jest.fn(),
    };
    useCase = new LoadInventoryUseCase(fetcherMock);
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
  });

  it('should load only tradable items when tradableOnly is true', async () => {
    fetcherMock.execute.mockResolvedValueOnce({
      ...inventoryPageResultMock.mixedTradablePage,
      last_assetid: undefined,
      total_inventory_count: 1,
    });

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
    expect(result[0].tradable).toBe(true);
    expect(fetcherMock.execute).toHaveBeenCalledTimes(1);
  });

  it('should return an empty array if inventory is empty', async () => {
    fetcherMock.execute.mockResolvedValueOnce(
      inventoryPageResultMock.emptyPage,
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

    expect(result).toHaveLength(0);
    expect(fetcherMock.execute).toHaveBeenCalledTimes(1);
  });
});

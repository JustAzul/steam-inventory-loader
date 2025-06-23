import 'reflect-metadata';
import { CookieJar } from 'tough-cookie';

import { IFetcher } from '@application/ports/fetcher.port';
import { inventoryPageResultMock } from '@shared/test/__mocks__';

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
      .mockResolvedValueOnce(inventoryPageResultMock.page1)
      .mockResolvedValueOnce(inventoryPageResultMock.page2)
      .mockResolvedValueOnce(inventoryPageResultMock.emptyPage);

    const result = await useCase.execute({
      steamID64: '123',
      appID: 730,
      contextID: '2',
      config: {
        SteamCommunity_Jar: cookieJarMock,
        itemsPerPage: 1,
        Language: 'en',
        tradableOnly: false,
      },
    });
    expect(result).toHaveLength(2);
    expect(fetcherMock.execute).toHaveBeenCalledTimes(3);
  });

  it('should load only tradable items when tradableOnly is true', async () => {
    fetcherMock.execute.mockResolvedValueOnce(
      inventoryPageResultMock.mixedTradablePage,
    );

    const result = await useCase.execute({
      steamID64: '123',
      appID: 730,
      contextID: '2',
      config: {
        SteamCommunity_Jar: cookieJarMock,
        itemsPerPage: 2,
        Language: 'en',
        tradableOnly: true,
      },
    });

    expect(result).toHaveLength(1);
    expect(result[0].tradable).toBe(true);
    expect(fetcherMock.execute).toHaveBeenCalledTimes(1);
  });

  it('should return an empty array if inventory is empty', async () => {
    fetcherMock.execute.mockResolvedValueOnce(inventoryPageResultMock.emptyPage);

    const result = await useCase.execute({
      steamID64: '123',
      appID: 730,
      contextID: '2',
      config: {
        SteamCommunity_Jar: cookieJarMock,
        itemsPerPage: 1,
        Language: 'en',
        tradableOnly: false,
      },
    });

    expect(result).toHaveLength(0);
    expect(fetcherMock.execute).toHaveBeenCalledTimes(1);
  });
}); 
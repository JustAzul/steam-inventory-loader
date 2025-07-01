import 'reflect-metadata';

import { CookieJar } from 'tough-cookie';

import AzulSteamInventoryLoaderFacade from '@src/main';
import { AzulSteamInventoryLoader } from '@src/presentation/azul-steam-inventory-loader';
import {
  mockError,
  mockInventory,
  mockResponse,
  mockSteamCommunity,
} from '@src/shared/test/mocks/infra';

jest.mock('axios-cookiejar-support', () => ({
  wrapper: jest.fn(),
}));
jest.mock('hpagent', () => ({
  HttpsProxyAgent: jest.fn(),
}));
jest.mock('@src/presentation/azul-steam-inventory-loader');

describe('AzulSteamInventoryLoaderFacade', () => {
  const steamid = '123456789';
  const appid = 440;
  const contextid = '2';

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call the loader with correct parameters and return the mapped inventory', async () => {
    const mockLoad = jest.fn().mockResolvedValueOnce(mockResponse);
    AzulSteamInventoryLoader.prototype.load = mockLoad;

    const inventory = await AzulSteamInventoryLoaderFacade.Loader(
      steamid,
      appid,
      contextid,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      {
        SteamCommunity_Jar: mockSteamCommunity.jar(),
      },
    );

    expect(mockLoad).toHaveBeenCalledWith({
      appID: appid,
      config: {
        steamCommunityJar: expect.any(CookieJar),
      },
      contextID: contextid,
      steamID64: steamid,
    });
    expect(inventory).toEqual(mockInventory);
  });

  it('should throw an error if steamcommunity is not provided', () => {
    expect(() =>
      AzulSteamInventoryLoaderFacade.Loader(steamid, appid, contextid),
    ).toThrow(
      '[AzulSteamInventoryLoader] Breaking Change: `SteamCommunity_Jar` is now a required property in `optionalConfig`. Please provide a valid `tough-cookie` CookieJar.',
    );
  });

  it('should return the error if the loader promise is rejected', async () => {
    const mockLoad = jest.fn().mockRejectedValueOnce(mockError);
    AzulSteamInventoryLoader.prototype.load = mockLoad;
    await expect(
      AzulSteamInventoryLoaderFacade.Loader(
        steamid,
        appid,
        contextid,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        {
          SteamCommunity_Jar: mockSteamCommunity.jar(),
        },
      ),
    ).rejects.toEqual(mockError);
  });
}); 
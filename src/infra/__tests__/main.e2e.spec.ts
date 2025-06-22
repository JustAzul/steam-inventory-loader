import { CookieJar } from 'tough-cookie';
import AzulSteamInventoryLoader from '../main';
import PrivateProfileException from '@application/exceptions/private-profile.exception';

describe('E2E :: AzulSteamInventoryLoader', () => {
  it(
    'should throw a private profile exception',
    async () => {
      const steamID64 = '76561197994150794';
      const appID = '730';
      const contextID = '2';
      await expect(
        AzulSteamInventoryLoader.Loader(steamID64, appID, contextID, {
          SteamCommunity_Jar: new CookieJar(),
        }),
      ).rejects.toThrow(PrivateProfileException);
    },
    30 * 1000,
  );
}); 
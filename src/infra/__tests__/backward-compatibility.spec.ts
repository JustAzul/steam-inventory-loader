import { CookieJar } from 'tough-cookie';
import AzulSteamInventoryLoader from '../main';
import PrivateProfileException from '@application/exceptions/private-profile.exception';

describe('Backward Compatibility', () => {
  it('should maintain the public API signature from the production branch', async () => {
    const steamID64 = '76561197994150794';
    const appID = '730';
    const contextID = '2';

    // This test call uses the exact same signature as the old implementation.
    // If it runs without a type error and throws the expected exception,
    // it confirms that the public API is backward compatible.
    await expect(
      AzulSteamInventoryLoader.Loader(steamID64, appID, contextID, {
        SteamCommunity_Jar: new CookieJar(),
      }),
    ).rejects.toThrow(PrivateProfileException);
  });
}); 
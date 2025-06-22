import { CookieJar } from 'tough-cookie';
import AzulSteamInventoryLoader from '../main';
import SteamItemEntity from '@domain/entities/steam-item.entity';

describe('E2E :: AzulSteamInventoryLoader', () => {
  it.skip(
    'should load a real inventory from steam',
    async () => {
      const steamID64 = '76561197994150794';
      const appID = '730';
      const contextID = '2';
      const inventory: SteamItemEntity[] = await AzulSteamInventoryLoader.Loader(
        steamID64,
        appID,
        contextID,
        {
          SteamCommunity_Jar: new CookieJar(),
        },
      );
      expect(inventory).toBeInstanceOf(Array);
      expect(inventory.length).toBeGreaterThan(0);
      const item = inventory[0];
      expect(item).toHaveProperty('appid');
      expect(item).toHaveProperty('contextid');
      expect(item).toHaveProperty('assetid');
      expect(item).toHaveProperty('classid');
      expect(item).toHaveProperty('instanceid');
      expect(item).toHaveProperty('amount');
      expect(item.appid).toEqual(Number(appID));
      expect(item.contextid).toEqual(contextID);
    },
    30 * 1000,
  );
});
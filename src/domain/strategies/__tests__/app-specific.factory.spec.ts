import { STEAM_APP_IDS } from '@domain/constants';

import { CounterStrike2Logic } from '../app-specific/counter-strike2.logic';
import { DefaultLogic } from '../app-specific/default.logic';
import { SteamCommunityLogic } from '../app-specific/steam-community.logic';
import { AppSpecificLogicFactory } from '../app-specific.factory';

describe('Domain :: Strategies :: AppSpecificLogicFactory', () => {
  it('should return CounterStrike2Logic for CS2 appID', () => {
    const strategy = AppSpecificLogicFactory.create(
      STEAM_APP_IDS.COUNTER_STRIKE_2,
    );
    expect(strategy).toBeInstanceOf(CounterStrike2Logic);
  });

  it('should return SteamCommunityLogic for Steam appID', () => {
    const strategy = AppSpecificLogicFactory.create(
      STEAM_APP_IDS.STEAM_COMMUNITY,
    );
    expect(strategy).toBeInstanceOf(SteamCommunityLogic);
  });

  it('should return DefaultLogic for an unknown appID', () => {
    const strategy = AppSpecificLogicFactory.create(999999);
    expect(strategy).toBeInstanceOf(DefaultLogic);
  });

  // It's also a good practice to test the logic within each strategy here
  // For brevity in this example, we are focusing on the factory.
  // A full implementation would have separate describe blocks for each strategy's methods.
});

import { STEAM_APP_IDS } from '@domain/constants';

import { CounterStrike2Logic } from './app-specific/counter-strike2.logic';
import { DefaultLogic } from './app-specific/default.logic';
import { IAppSpecificLogic } from './app-specific/IAppSpecificLogic';
import { SteamCommunityLogic } from './app-specific/steam-community.logic';

export class AppSpecificLogicFactory {
  private static readonly strategies: Record<number, IAppSpecificLogic> = {
    [STEAM_APP_IDS.COUNTER_STRIKE_2]: new CounterStrike2Logic(),
    [STEAM_APP_IDS.STEAM_COMMUNITY]: new SteamCommunityLogic(),
  };

  public static create(appID: number): IAppSpecificLogic {
    const strategy = AppSpecificLogicFactory.strategies[appID];
    if (strategy !== undefined) {
      return strategy;
    }
    return new DefaultLogic();
  }
}

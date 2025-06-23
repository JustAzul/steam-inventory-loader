import 'reflect-metadata';
import { STEAM_APP_IDS, STEAM_CONTEXT_IDS } from '@domain/constants';
import SteamItemEntity from '@domain/entities/steam-item.entity';

import GetItemCacheExpirationUseCase from '../get-item-cache-expiration.use-case';

describe('Application :: UseCases :: GetItemCacheExpirationUseCase', () => {
  let useCase: GetItemCacheExpirationUseCase;

  beforeEach(() => {
    useCase = new GetItemCacheExpirationUseCase();
  });

  it('should return undefined if no expiration is found', () => {
    const item = {
      getAppId: () => 12345,
    } as SteamItemEntity;
    const expiration = useCase.execute(item);
    expect(expiration).toBeUndefined();
  });

  it('should return item_expiration if it exists', () => {
    const expirationDate = new Date('2025-01-01T00:00:00.000Z');
    const item = {
      item_expiration: expirationDate.toISOString(),
    } as SteamItemEntity;
    const expiration = useCase.execute(item);
    expect(expiration).toEqual(expirationDate.toISOString());
  });

  it('should parse tradable_after for CSGO items', () => {
    const expirationDate = new Date('2025-01-01T00:00:00.000Z');
    const item = {
      contextid: STEAM_CONTEXT_IDS.INVENTORY,
      getAppId: () => STEAM_APP_IDS.COUNTER_STRIKE_2,
      owner_descriptions: [
        { value: `Tradable After ${expirationDate.toDateString()}` },
      ],
    } as unknown as SteamItemEntity;
    const expiration = useCase.execute(item);
    expect(expiration).toBeDefined();
  });

  it('should return undefined for invalid tradable_after date', () => {
    const item = {
      contextid: STEAM_CONTEXT_IDS.INVENTORY,
      getAppId: () => STEAM_APP_IDS.COUNTER_STRIKE_2,
      owner_descriptions: [{ value: 'Tradable After Invalid Date' }],
    } as unknown as SteamItemEntity;
    const expiration = useCase.execute(item);
    expect(expiration).toBeUndefined();
  });
});

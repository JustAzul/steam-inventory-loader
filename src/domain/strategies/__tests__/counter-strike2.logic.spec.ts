import 'reflect-metadata';

import SteamItemEntity from '@domain/entities/steam-item.entity';
import { steamItemsMocks } from '@domain/test/__mocks__';

import { CounterStrike2Logic } from '../app-specific/counter-strike2.logic';

describe('CounterStrike2Logic', () => {
  let logic: CounterStrike2Logic;

  beforeEach(() => {
    logic = new CounterStrike2Logic();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return item_expiration if it exists', () => {
    const { adapter } = steamItemsMocks.page1[0];
    const { asset } = adapter as any;
    const { description: baseDescription } = adapter as any;
    const description = {
      ...baseDescription,
      item_expiration: '2024-01-01T00:00:00.000Z',
    };
    const item = new SteamItemEntity({
      asset,
      description,
      strategy: new CounterStrike2Logic(),
    });

    const expiration = logic.getCacheExpiration(item);
    expect(expiration).toBe('2024-01-01T00:00:00.000Z');
  });

  it('should return tradable date from owner_descriptions', () => {
    const { adapter } = steamItemsMocks.page1[0];
    const { asset } = adapter as any;
    const { description: baseDescription } = adapter as any;
    const description = {
      ...baseDescription,
      descriptions: [
        {
          color: 'z',
          type: 'text',
          value: 'Tradable after Jan 01, 2025 (00:00:00) GMT',
        },
      ],
    };
    const item = new SteamItemEntity({
      asset,
      description,
      strategy: new CounterStrike2Logic(),
    });
    jest.spyOn(item.adapter, 'contextid', 'get').mockReturnValue('2');
    const expiration = logic.getCacheExpiration(item);
    expect(expiration).toBe('2025-01-01T00:00:00.000Z');
  });

  it('should return undefined if no expiration is found', () => {
    const { adapter } = steamItemsMocks.page1[0];
    const { asset } = adapter as any;
    const { description: baseDescription } = adapter as any;
    const description = {
      ...baseDescription,
      descriptions: [],
    };
    const item = new SteamItemEntity({
      asset,
      description,
      strategy: new CounterStrike2Logic(),
    });
    jest.spyOn(item.adapter, 'contextid', 'get').mockReturnValue('2');
    const expiration = logic.getCacheExpiration(item);
    expect(expiration).toBeUndefined();
  });

  it('should return undefined if the date is invalid', () => {
    const { adapter } = steamItemsMocks.page1[0];
    const { asset } = adapter as any;
    const { description: baseDescription } = adapter as any;
    const description = {
      ...baseDescription,
      descriptions: [
        {
          color: 'z',
          type: 'text',
          value: 'Tradable after an invalid date',
        },
      ],
    };
    const item = new SteamItemEntity({
      asset,
      description,
      strategy: new CounterStrike2Logic(),
    });
    jest.spyOn(item.adapter, 'contextid', 'get').mockReturnValue('2');
    const expiration = logic.getCacheExpiration(item);
    expect(expiration).toBeUndefined();
  });
});

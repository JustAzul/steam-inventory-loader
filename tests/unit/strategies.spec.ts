import { describe, it, expect } from 'vitest';
import { CS2Strategy } from '../../src/strategies/cs2.js';
import { CommunityStrategy } from '../../src/strategies/community.js';
import { DefaultStrategy } from '../../src/strategies/default.js';
import { StrategyRegistry } from '../../src/strategies/registry.js';
import type { ItemDetails, IStrategy } from '../../src/types.js';

function makeItem(overrides: Partial<ItemDetails> = {}): ItemDetails {
  return {
    actions: [], amount: 1, appid: 753, assetid: '1', background_color: '',
    classid: '1', commodity: true, contextid: '6', currency: null,
    descriptions: [], fraudwarnings: [], icon_url: '', icon_url_large: '',
    id: '1', instanceid: '0', is_currency: false,
    market_hash_name: '753-Test', market_marketable_restriction: 0,
    market_name: 'Test', market_tradable_restriction: 0, marketable: true,
    name: 'Test', tradable: true, type: 'Test',
    ...overrides,
  };
}

describe('CS2Strategy', () => {
  const strategy = new CS2Strategy();

  it('extracts tradable date from owner_descriptions (FR21)', () => {
    const item = makeItem({
      owner_descriptions: [
        { value: 'Tradable After Jan 01, 2027 (00:00:00) GMT' },
      ],
    });
    const result = strategy.apply(item);
    expect(result.cache_expiration).toBe('2027-01-01T00:00:00.000Z');
  });

  it('handles "Tradable After" with various date formats', () => {
    const item = makeItem({
      owner_descriptions: [
        { value: 'Tradable After Mar 15, 2026 (12:30:00) GMT' },
      ],
    });
    const result = strategy.apply(item);
    expect(result.cache_expiration).toBeTruthy();
    expect(new Date(result.cache_expiration!).getFullYear()).toBe(2026);
  });

  it('leaves item unchanged when no tradable date found', () => {
    const item = makeItem({ owner_descriptions: [{ value: 'Some other text' }] });
    const result = strategy.apply(item);
    expect(result.cache_expiration).toBeUndefined();
  });

  it('leaves item unchanged when no owner_descriptions', () => {
    const item = makeItem();
    const result = strategy.apply(item);
    expect(result.cache_expiration).toBeUndefined();
  });
});

describe('CommunityStrategy', () => {
  const strategy = new CommunityStrategy();

  it('extracts market_fee_app from market_hash_name (FR22)', () => {
    const item = makeItem({ market_hash_name: '753-Gems' });
    const result = strategy.apply(item);
    expect(result.market_fee_app).toBe(753);
  });

  it('extracts multi-digit market_fee_app', () => {
    const item = makeItem({ market_hash_name: '278360-Samuel in the Village' });
    const result = strategy.apply(item);
    expect(result.market_fee_app).toBe(278360);
  });

  it('no match → no market_fee_app', () => {
    const item = makeItem({ market_hash_name: 'NoDigits' });
    const result = strategy.apply(item);
    expect(result.market_fee_app).toBeUndefined();
  });
});

describe('DefaultStrategy', () => {
  const strategy = new DefaultStrategy();

  it('sets cache_expiration from item_expiration (FR23)', () => {
    const item = makeItem({ item_expiration: '2027-06-01T00:00:00Z' });
    const result = strategy.apply(item);
    expect(result.cache_expiration).toBe('2027-06-01T00:00:00Z');
  });

  it('leaves item unchanged when no item_expiration', () => {
    const item = makeItem();
    const result = strategy.apply(item);
    expect(result.cache_expiration).toBeUndefined();
  });
});

describe('StrategyRegistry', () => {
  it('returns CS2 strategy for app 730, ctx 2', () => {
    const registry = new StrategyRegistry();
    const strategy = registry.get(730, 2);
    expect(strategy).toBeInstanceOf(CS2Strategy);
  });

  it('returns Community strategy for app 753, ctx 6', () => {
    const registry = new StrategyRegistry();
    const strategy = registry.get(753, 6);
    expect(strategy).toBeInstanceOf(CommunityStrategy);
  });

  it('returns Default strategy for unknown app', () => {
    const registry = new StrategyRegistry();
    const strategy = registry.get(440, 2);
    expect(strategy).toBeInstanceOf(DefaultStrategy);
  });

  it('allows registering custom strategy (FR68)', () => {
    const registry = new StrategyRegistry();
    const custom: IStrategy = { apply: (item) => ({ ...item, name: 'custom' }) };
    registry.register(440, 2, custom);
    const strategy = registry.get(440, 2);
    expect(strategy).toBe(custom);
  });

  it('custom strategy overrides default', () => {
    const registry = new StrategyRegistry();
    const custom: IStrategy = { apply: (item) => ({ ...item, name: 'override' }) };
    registry.register(753, 6, custom);
    const strategy = registry.get(753, 6);
    const result = strategy.apply(makeItem());
    expect(result.name).toBe('override');
  });
});

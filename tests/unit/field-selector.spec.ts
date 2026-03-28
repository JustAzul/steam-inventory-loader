import { describe, it, expect } from 'vitest';
import { selectFields } from '../../src/pipeline/field-selector.js';
import { Fields } from '../../src/types.js';
import type { ItemDetails } from '../../src/types.js';

function makeItem(): ItemDetails {
  return {
    actions: [], amount: 1, appid: 753, assetid: '1', background_color: '',
    classid: '1', commodity: true, contextid: '6', currency: null,
    descriptions: [], fraudwarnings: [], icon_url: 'url', icon_url_large: 'url',
    id: '1', instanceid: '0', is_currency: false,
    market_hash_name: '753-Test', market_marketable_restriction: 7,
    market_name: 'Test', market_tradable_restriction: 7, marketable: true,
    name: 'Test', tradable: true, type: 'Test Type',
    tags: [{ category: 'a', internal_name: 'b', name: 'c', category_name: 'd', color: '' }],
  };
}

describe('selectFields', () => {
  it('returns full item when fields is undefined (FR48)', () => {
    const item = makeItem();
    const result = selectFields(item);
    expect(result).toBe(item); // same reference, no copy
  });

  it('returns only selected fields + assetid (FR47)', () => {
    const item = makeItem();
    const result = selectFields(item, [Fields.MARKET_HASH_NAME, Fields.TRADABLE, Fields.TAGS]);

    expect(result.assetid).toBe('1');
    expect(result.market_hash_name).toBe('753-Test');
    expect(result.tradable).toBe(true);
    expect(result.tags).toBeDefined();
    // Fields not selected should be absent
    expect('name' in result).toBe(false);
    expect('amount' in result).toBe(false);
    expect('icon_url' in result).toBe(false);
  });

  it('6-field selection (Bluebot pattern)', () => {
    const item = makeItem();
    const result = selectFields(item, [
      Fields.MARKET_HASH_NAME, Fields.TRADABLE, Fields.TAGS,
      Fields.TYPE, Fields.APPID, Fields.AMOUNT,
    ]);

    expect(Object.keys(result).sort()).toEqual([
      'amount', 'appid', 'assetid', 'market_hash_name', 'tags', 'tradable', 'type',
    ]);
  });

  it('empty fields array → only assetid (FR47 minimum identity)', () => {
    const item = makeItem();
    const result = selectFields(item, []);
    expect(Object.keys(result)).toEqual(['assetid']);
    expect(result.assetid).toBe('1');
  });

  it('Fields enum values are accessible', () => {
    expect(Fields.MARKET_HASH_NAME).toBe('market_hash_name');
    expect(Fields.TRADABLE).toBe('tradable');
    expect(Fields.TAGS).toBe('tags');
  });

  it('field selection with optional fields that are undefined', () => {
    const item = makeItem();
    delete (item as any).cache_expiration;
    const result = selectFields(item, [Fields.CACHE_EXPIRATION, Fields.NAME]);
    expect(result.name).toBe('Test');
    // cache_expiration wasn't on item, so not in result
    expect('cache_expiration' in result).toBe(false);
  });
});

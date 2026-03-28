import { describe, it, expect } from 'vitest';
import { coerceSteamId, coerceNumber, mapV3Config } from '../../src/compat/v3-compat.js';
import { getTag, getLargeImageURL, isCardType } from '../../src/compat/utils.js';
import type { Tag, ItemDetails } from '../../src/types.js';

describe('coerceSteamId', () => {
  it('string passthrough (FR40)', () => {
    expect(coerceSteamId('76561198356905764')).toBe('76561198356905764');
  });

  it('number → string (note: large IDs lose precision)', () => {
    // SteamID64 exceeds Number.MAX_SAFE_INTEGER — real usage is always string
    expect(coerceSteamId(12345)).toBe('12345');
  });

  it('SteamID object → .getSteamID64() (FR40)', () => {
    const obj = { getSteamID64: () => '76561198356905764' };
    expect(coerceSteamId(obj)).toBe('76561198356905764');
  });
});

describe('coerceNumber', () => {
  it('string → number (FR41)', () => {
    expect(coerceNumber('753')).toBe(753);
  });

  it('number passthrough', () => {
    expect(coerceNumber(6)).toBe(6);
  });
});

describe('mapV3Config', () => {
  it('maps Language → language', () => {
    const config = mapV3Config({ Language: 'pt' });
    expect(config.language).toBe('pt');
  });

  it('maps SteamCommunity_Jar → cookies (CookieJar string extraction)', () => {
    // Simulate tough-cookie jar with getCookieStringSync
    const jar = {
      getCookieStringSync: (url: string) => 'sessionid=abc123; steamLoginSecure=xyz',
    };
    const config = mapV3Config({ SteamCommunity_Jar: jar });
    expect(config.cookies).toContain('sessionid=abc123; steamLoginSecure=xyz');
  });

  it('maps SteamCommunity_Jar with _jar wrapper (FR34)', () => {
    const innerJar = {
      getCookieStringSync: (url: string) => 'sessionid=inner',
    };
    const config = mapV3Config({ SteamCommunity_Jar: { _jar: innerJar } });
    expect(config.cookies).toContain('sessionid=inner');
  });

  it('passes through non-v3 config keys unchanged', () => {
    const config = mapV3Config({ tradableOnly: false, steamApisKey: 'key123' });
    expect(config.tradableOnly).toBe(false);
    expect(config.steamApisKey).toBe('key123');
  });
});

describe('getTag', () => {
  const tags: Tag[] = [
    { category: 'droprate', internal_name: 'droprate_0', name: 'Common', category_name: 'Rarity', color: '' },
    { category: 'Game', internal_name: 'app_570', name: 'Dota 2', category_name: 'Game', color: '' },
  ];

  // Happy path covered by integration test — only edge cases here
  it('returns null when not found', () => {
    expect(getTag(tags, 'Nonexistent')).toBeNull();
  });

  it('returns null for undefined tags', () => {
    expect(getTag(undefined, 'Game')).toBeNull();
  });
});

describe('getLargeImageURL', () => {
  // Happy path covered by integration test — only edge case here
  it('falls back to icon_url when icon_url_large is empty', () => {
    const item = { icon_url_large: '', icon_url: 'fallback' } as ItemDetails;
    expect(getLargeImageURL(item)).toBe('https://steamcommunity-a.akamaihd.net/economy/image/fallback');
  });
});

describe('isCardType', () => {
  // Normal card covered by integration test — only non-happy paths here
  it('detects Foil card (FR45)', () => {
    const tags: Tag[] = [
      { category: 'item_class', internal_name: 'item_class_2', name: 'Trading Card', category_name: 'Item Type', color: '' },
      { category: 'cardborder', internal_name: 'cardborder_1', name: 'Foil', category_name: 'Card Border', color: '' },
    ];
    expect(isCardType(tags)).toBe('Foil');
  });

  it('returns null when not a card', () => {
    const tags: Tag[] = [
      { category: 'item_class', internal_name: 'item_class_3', name: 'Profile Background', category_name: 'Item Type', color: '' },
    ];
    expect(isCardType(tags)).toBeNull();
  });

  it('returns null for undefined tags', () => {
    expect(isCardType(undefined)).toBeNull();
  });
});

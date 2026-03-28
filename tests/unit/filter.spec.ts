import { describe, it, expect } from 'vitest';
import { shouldInclude } from '../../src/pipeline/filter.js';
import type { ItemAsset, ItemDescription } from '../../src/types.js';

describe('shouldInclude', () => {
  it('excludes currency items by currencyid (FR19)', () => {
    const asset: ItemAsset = {
      appid: 753, contextid: '6', assetid: '1', classid: '1', instanceid: '0',
      amount: '1', currencyid: '2001',
    };
    expect(shouldInclude(asset, makeDesc(), { tradableOnly: false })).toBe(false);
  });

  it('excludes items without matching description (FR20)', () => {
    const asset: ItemAsset = {
      appid: 753, contextid: '6', assetid: '1', classid: '1', instanceid: '0', amount: '1',
    };
    expect(shouldInclude(asset, undefined, { tradableOnly: false })).toBe(false);
  });

  it('excludes non-tradable when tradableOnly=true (FR18)', () => {
    const desc = makeDesc();
    desc.tradable = 0;
    expect(shouldInclude(makeAsset(), desc, { tradableOnly: true })).toBe(false);
  });

  it('includes non-tradable when tradableOnly=false (FR18)', () => {
    const desc = makeDesc();
    desc.tradable = 0;
    expect(shouldInclude(makeAsset(), desc, { tradableOnly: false })).toBe(true);
  });

  it('includes tradable item when tradableOnly=true', () => {
    const desc = makeDesc();
    desc.tradable = 1;
    expect(shouldInclude(makeAsset(), desc, { tradableOnly: true })).toBe(true);
  });
});

function makeAsset(): ItemAsset {
  return { appid: 753, contextid: '6', assetid: '1', classid: '1', instanceid: '0', amount: '1' };
}

function makeDesc(): ItemDescription {
  return { appid: 753, classid: '1', instanceid: '0', tradable: 1 };
}

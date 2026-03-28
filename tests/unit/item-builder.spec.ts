import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { buildItem } from '../../src/pipeline/item-builder.js';
import type { ItemAsset, ItemDescription } from '../../src/types.js';

const FIXTURES = join(import.meta.dirname, '../../fixtures');

function loadFixturePair(): { asset: ItemAsset; desc: ItemDescription } {
  const page = JSON.parse(readFileSync(join(FIXTURES, 'page-01.json'), 'utf8'));
  // Use second item (trading card, not gems)
  const asset = page.assets[1];
  const desc = page.descriptions.find(
    (d: ItemDescription) => d.classid === asset.classid && d.instanceid === asset.instanceid,
  );
  return { asset, desc };
}

describe('buildItem', () => {
  it('maps all 30+ fields from asset + description (v3 parity)', () => {
    const { asset, desc } = loadFixturePair();
    const item = buildItem(asset, desc, 6);

    expect(item.assetid).toBe('28043977395');
    expect(item.appid).toBe(753);
    expect(item.contextid).toBe('6');
    expect(item.classid).toBe('149743988');
    expect(item.instanceid).toBe('0');
    expect(item.amount).toBe(1);
    expect(item.id).toBe('28043977395');
    expect(item.name).toBe('Bounty Hunter (Trading Card)');
    expect(item.type).toBe('Dota 2 Trading Card');
    expect(item.market_name).toBe('Bounty Hunter (Trading Card)');
    expect(item.market_hash_name).toBe('570-Bounty Hunter (Trading Card)');
    expect(item.market_fee_app).toBe(570);
    expect(item.icon_url).toBeTruthy();
    expect(item.icon_url_large).toBeTruthy();
    expect(item.tradable).toBe(true);
    expect(item.marketable).toBe(true);
    expect(item.commodity).toBe(true);
    expect(item.market_tradable_restriction).toBe(7);
    expect(item.market_marketable_restriction).toBe(7);
    expect(item.background_color).toBe('');
    expect(item.currency).toBeNull();
    expect(item.is_currency).toBe(false);
    expect(item.descriptions).toEqual([{ value: '' }]);
    expect(item.sealed).toBe(0);
    expect(item.sealed_type).toBe(0);
  });

  it('normalizes tags: localized_tag_name → name, localized_category_name → category_name (FR09)', () => {
    const { asset, desc } = loadFixturePair();
    const item = buildItem(asset, desc, 6);

    expect(item.tags).toBeDefined();
    expect(item.tags!.length).toBe(4);
    const tag = item.tags![0];
    expect(tag.name).toBe('Common');
    expect(tag.category_name).toBe('Rarity');
    expect(tag.category).toBe('droprate');
    expect(tag.internal_name).toBe('droprate_0');
    expect(tag.color).toBe('');
  });

  it('amount string → number (FR11)', () => {
    const asset: ItemAsset = {
      appid: 753, contextid: '6', assetid: '1', classid: '1', instanceid: '0', amount: '4780',
    };
    const desc = makeMinimalDesc();
    const item = buildItem(asset, desc, 6);
    expect(item.amount).toBe(4780);
  });

  it('instanceid defaults to "0" when empty string (FR10)', () => {
    const asset: ItemAsset = {
      appid: 753, contextid: '6', assetid: '1', classid: '1', instanceid: '', amount: '1',
    };
    const desc = makeMinimalDesc();
    const item = buildItem(asset, desc, 6);
    expect(item.instanceid).toBe('0');
  });

  it('instanceid defaults to "0" when null-ish (FR10)', () => {
    const asset: ItemAsset = {
      appid: 753, contextid: '6', assetid: '1', classid: '1',
      instanceid: null as unknown as string, amount: '1',
    };
    const desc = makeMinimalDesc();
    const item = buildItem(asset, desc, 6);
    expect(item.instanceid).toBe('0');
  });

  it('restriction NaN defaults to 0 (FR12)', () => {
    const desc = makeMinimalDesc();
    desc.market_tradable_restriction = 'abc' as unknown as number;
    desc.market_marketable_restriction = undefined;
    const item = buildItem(makeMinimalAsset(), desc, 6);
    expect(item.market_tradable_restriction).toBe(0);
    expect(item.market_marketable_restriction).toBe(0);
  });

  it('restriction string → int (FR12)', () => {
    const desc = makeMinimalDesc();
    desc.market_tradable_restriction = '7';
    desc.market_marketable_restriction = '3';
    const item = buildItem(makeMinimalAsset(), desc, 6);
    expect(item.market_tradable_restriction).toBe(7);
    expect(item.market_marketable_restriction).toBe(3);
  });

  it('empty owner via for..in → undefined (FR13)', () => {
    const desc = makeMinimalDesc();
    desc.owner = {};
    const item = buildItem(makeMinimalAsset(), desc, 6);
    expect(item.owner).toBeUndefined();
  });

  it('non-empty owner preserved', () => {
    const desc = makeMinimalDesc();
    desc.owner = { id: 123 };
    const item = buildItem(makeMinimalAsset(), desc, 6);
    expect(item.owner).toEqual({ id: 123 });
  });

  it('currency item detection: is_currency flag (FR15)', () => {
    const asset: ItemAsset = {
      appid: 753, contextid: '6', assetid: '1', classid: '1', instanceid: '0',
      amount: '1', currencyid: '2001', is_currency: true,
    };
    const desc = makeMinimalDesc();
    const item = buildItem(asset, desc, 6);
    expect(item.is_currency).toBe(true);
    expect(item.id).toBe('2001'); // currencyid as id (FR16)
  });

  it('currency item without currencyid uses assetid as id (FR16)', () => {
    const asset: ItemAsset = {
      appid: 753, contextid: '6', assetid: '99', classid: '1', instanceid: '0',
      amount: '1', is_currency: true,
    };
    const desc = makeMinimalDesc();
    const item = buildItem(asset, desc, 6);
    expect(item.is_currency).toBe(true);
    expect(item.id).toBe('99');
  });

  it('currency = null post-processing (FR17)', () => {
    const desc = makeMinimalDesc();
    desc.currency = 0;
    const item = buildItem(makeMinimalAsset(), desc, 6);
    expect(item.currency).toBeNull();
  });

  it('tags with legacy name field preferred over localized_tag_name', () => {
    const desc = makeMinimalDesc();
    desc.tags = [{
      category: 'droprate',
      internal_name: 'droprate_0',
      localized_category_name: 'Rarity',
      localized_tag_name: 'Common',
      name: 'Legacy Name',
      category_name: 'Legacy Category',
    }];
    const item = buildItem(makeMinimalAsset(), desc, 6);
    // PRD says prefer localized_tag_name (new API format)
    expect(item.tags![0].name).toBe('Common');
    expect(item.tags![0].category_name).toBe('Rarity');
  });

  it('tags without any name → empty string', () => {
    const desc = makeMinimalDesc();
    desc.tags = [{
      category: 'droprate',
      internal_name: 'droprate_0',
    } as any];
    const item = buildItem(makeMinimalAsset(), desc, 6);
    expect(item.tags![0].name).toBe('');
    expect(item.tags![0].category_name).toBe('');
    expect(item.tags![0].color).toBe('');
  });

  it('no tags array → no tags on output', () => {
    const desc = makeMinimalDesc();
    delete (desc as any).tags;
    const item = buildItem(makeMinimalAsset(), desc, 6);
    expect(item.tags).toBeUndefined();
  });

  it('sealed and sealed_type fields present (FR08)', () => {
    const desc = makeMinimalDesc();
    desc.sealed = 1;
    desc.sealed_type = 2;
    const item = buildItem(makeMinimalAsset(), desc, 6);
    expect(item.sealed).toBe(1);
    expect(item.sealed_type).toBe(2);
  });

  it('contextid comes from function param, not asset (for listing format)', () => {
    const asset = makeMinimalAsset();
    asset.contextid = '99'; // ignored
    const item = buildItem(asset, makeMinimalDesc(), 6);
    expect(item.contextid).toBe('6');
  });
});

// ─── Helpers ──────────────────────────────────────────────────────────────

function makeMinimalAsset(): ItemAsset {
  return {
    appid: 753, contextid: '6', assetid: '1', classid: '1', instanceid: '0', amount: '1',
  };
}

function makeMinimalDesc(): ItemDescription {
  return {
    appid: 753, classid: '1', instanceid: '0',
    currency: 0, background_color: '', icon_url: 'test', icon_url_large: 'test',
    descriptions: [], tradable: 1, name: 'Test', type: 'Test Type',
    market_name: 'Test', market_hash_name: '753-Test', commodity: 1,
    market_tradable_restriction: 7, market_marketable_restriction: 7,
    marketable: 1, tags: [], sealed: 0, sealed_type: 0,
  };
}

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { processAssets } from '../../src/pipeline/process-assets.js';
import { DescriptionStore } from '../../src/repository/description-store.js';
import { DefaultStrategy } from '../../src/strategies/default.js';
import { CommunityStrategy } from '../../src/strategies/community.js';
import { InMemoryInventoryRepository } from '../../src/repository/inventory.js';
import { parseInventoryPage } from '../../src/pipeline/parser.js';
import { Fields } from '../../src/types.js';
import type { ItemAsset, ItemDescription, IStrategy } from '../../src/types.js';

const FIXTURES = join(import.meta.dirname, '../../fixtures');

function makeMinimalAsset(overrides?: Partial<ItemAsset>): ItemAsset {
  return {
    appid: 753, contextid: '6', assetid: '1', classid: '1', instanceid: '0', amount: '1',
    ...overrides,
  };
}

function makeMinimalDesc(overrides?: Partial<ItemDescription>): ItemDescription {
  return {
    appid: 753, classid: '1', instanceid: '0',
    currency: 0, background_color: '', icon_url: 'test', icon_url_large: 'test',
    descriptions: [], tradable: 1, name: 'Test', type: 'Test Type',
    market_name: 'Test', market_hash_name: '753-Test', commodity: 1,
    market_tradable_restriction: 7, market_marketable_restriction: 7,
    marketable: 1, tags: [], sealed: 0, sealed_type: 0,
    ...overrides,
  };
}

function loadPage(num: number) {
  const json = readFileSync(join(FIXTURES, `page-${String(num).padStart(2, '0')}.json`), 'utf8');
  return parseInventoryPage(json);
}

describe('processAssets', () => {
  it('processes single includable asset through full pipeline with field selection', () => {
    const assets = [makeMinimalAsset()];
    const descStore = new DescriptionStore();
    descStore.addPage([makeMinimalDesc()]);

    const items = processAssets(assets, descStore, {
      tradableOnly: false,
      strategy: new DefaultStrategy(),
      fields: [Fields.MARKET_HASH_NAME, Fields.TRADABLE],
      contextId: 6,
    });

    expect(items).toHaveLength(1);
    expect(items[0].assetid).toBe('1');
    expect(items[0].market_hash_name).toBe('753-Test');
    expect(items[0].tradable).toBe(true);
    // Fields not selected should be absent
    expect('name' in items[0]).toBe(false);
    expect('type' in items[0]).toBe(false);
  });

  it('filters currency items — strategy never called', () => {
    const strategySpy: IStrategy = {
      apply: () => { throw new Error('should not be called'); },
    };

    const assets = [makeMinimalAsset({ currencyid: '2001' })];
    const descStore = new DescriptionStore();
    descStore.addPage([makeMinimalDesc()]);

    const items = processAssets(assets, descStore, {
      tradableOnly: false,
      strategy: strategySpy,
      contextId: 6,
    });

    expect(items).toHaveLength(0);
  });

  it('filters non-tradable items when tradableOnly=true', () => {
    const assets = [
      makeMinimalAsset({ assetid: '1', classid: '1' }),
      makeMinimalAsset({ assetid: '2', classid: '2' }),
    ];
    const descStore = new DescriptionStore();
    descStore.addPage([
      makeMinimalDesc({ classid: '1', tradable: 1 }),
      makeMinimalDesc({ classid: '2', tradable: 0 }),
    ]);

    const items = processAssets(assets, descStore, {
      tradableOnly: true,
      strategy: new DefaultStrategy(),
      contextId: 6,
    });

    expect(items).toHaveLength(1);
    expect(items[0].assetid).toBe('1');
  });

  it('applies CommunityStrategy before field-select, preserves extracted market_fee_app', () => {
    const assets = [makeMinimalAsset()];
    const descStore = new DescriptionStore();
    descStore.addPage([makeMinimalDesc({ market_hash_name: '570-Dota Card' })]);

    const items = processAssets(assets, descStore, {
      tradableOnly: false,
      strategy: new CommunityStrategy(),
      fields: [Fields.MARKET_FEE_APP, Fields.MARKET_HASH_NAME],
      contextId: 6,
    });

    expect(items[0].market_fee_app).toBe(570);
    expect(items[0].market_hash_name).toBe('570-Dota Card');
  });

  it('field selection to empty array yields only assetid', () => {
    const assets = [makeMinimalAsset()];
    const descStore = new DescriptionStore();
    descStore.addPage([makeMinimalDesc()]);

    const items = processAssets(assets, descStore, {
      tradableOnly: false,
      strategy: new DefaultStrategy(),
      fields: [],
      contextId: 6,
    });

    expect(items).toHaveLength(1);
    expect(Object.keys(items[0])).toEqual(['assetid']);
  });

  it('excludes assets without matching description in store', () => {
    const assets = [makeMinimalAsset({ classid: '999' })];
    const descStore = new DescriptionStore(); // empty — no descriptions

    const items = processAssets(assets, descStore, {
      tradableOnly: false,
      strategy: new DefaultStrategy(),
      contextId: 6,
    });

    expect(items).toHaveLength(0);
  });

  it('uses config contextId, not asset.contextid', () => {
    const assets = [makeMinimalAsset({ contextid: '99' })];
    const descStore = new DescriptionStore();
    descStore.addPage([makeMinimalDesc()]);

    const items = processAssets(assets, descStore, {
      tradableOnly: false,
      strategy: new DefaultStrategy(),
      contextId: 6,
    });

    expect(items[0].contextid).toBe('6');
  });

  it('fixture parity: processAssets output matches InMemoryInventoryRepository.addPage', () => {
    const page = loadPage(1);

    // Via repository
    const repo = new InMemoryInventoryRepository();
    repo.addPage(page, {
      tradableOnly: false,
      strategy: new CommunityStrategy(),
      contextId: 6,
    });
    const repoItems = repo.getItems();

    // Via processAssets directly
    const descStore = new DescriptionStore();
    descStore.addPage(page.descriptions);
    const pipelineItems = processAssets(page.assets, descStore, {
      tradableOnly: false,
      strategy: new CommunityStrategy(),
      contextId: 6,
    });

    expect(pipelineItems.length).toBe(repoItems.length);
    expect(pipelineItems).toEqual(repoItems);
  });
});

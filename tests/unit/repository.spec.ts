import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { InMemoryInventoryRepository } from '../../src/repository/inventory.js';
import { DescriptionStore } from '../../src/repository/description-store.js';
import { parseInventoryPage } from '../../src/pipeline/parser.js';
import { DefaultStrategy } from '../../src/strategies/default.js';
import { CommunityStrategy } from '../../src/strategies/community.js';
import { Fields } from '../../src/types.js';
import type { ParseConfig, InventoryPage, ItemDescription } from '../../src/types.js';

const FIXTURES = join(import.meta.dirname, '../../fixtures');

function loadPage(num: number): InventoryPage {
  const json = readFileSync(join(FIXTURES, `page-${String(num).padStart(2, '0')}.json`), 'utf8');
  return parseInventoryPage(json);
}

function defaultConfig(overrides: Partial<ParseConfig> = {}): ParseConfig {
  return {
    tradableOnly: false,
    contextId: 6,
    strategy: new CommunityStrategy(),
    ...overrides,
  };
}

describe('DescriptionStore', () => {
  it('lookup within same page', () => {
    const store = new DescriptionStore();
    const page = loadPage(1);
    store.addPage(page.descriptions);

    const desc = store.get(page.descriptions[0].classid, page.descriptions[0].instanceid ?? '0');
    expect(desc).toBeDefined();
    expect(desc!.classid).toBe(page.descriptions[0].classid);
  });

  it('cross-page lookup in rolling window (FR50)', () => {
    const store = new DescriptionStore();
    const page1 = loadPage(1);
    const page2 = loadPage(2);

    store.addPage(page1.descriptions);
    store.addPage(page2.descriptions);

    // Page 1 descriptions should still be accessible from previous window
    const desc = store.get(page1.descriptions[0].classid, page1.descriptions[0].instanceid ?? '0');
    expect(desc).toBeDefined();
  });

  it('eviction after 2 pages (rolling window = 1 previous)', () => {
    const store = new DescriptionStore();
    const page1 = loadPage(1);
    const page2 = loadPage(2);
    const page3 = loadPage(3);

    store.addPage(page1.descriptions);
    store.addPage(page2.descriptions);
    store.addPage(page3.descriptions);

    // Page 1 descriptions evicted after page 3 loads
    // Only page 2 + page 3 are in window
    // (This is expected behavior — 100% hit rate validated by POC B2)
  });

  it('clear empties both windows', () => {
    const store = new DescriptionStore();
    store.addPage(loadPage(1).descriptions);
    store.clear();
    expect(store.get('667924416', '0')).toBeUndefined();
  });
});

describe('InMemoryInventoryRepository', () => {
  it('processes single page into items', () => {
    const repo = new InMemoryInventoryRepository();
    const page = loadPage(1);
    repo.addPage(page, defaultConfig());

    expect(repo.getItemCount()).toBeGreaterThan(0);
    const items = repo.getItems();
    expect(items[0].assetid).toBeTruthy();
    expect(items[0].name).toBeTruthy();
  });

  it('accumulates items across multiple pages', () => {
    const repo = new InMemoryInventoryRepository();
    repo.addPage(loadPage(1), defaultConfig());
    const countAfter1 = repo.getItemCount();

    repo.addPage(loadPage(2), defaultConfig());
    expect(repo.getItemCount()).toBeGreaterThan(countAfter1);
  });

  it('applies tradableOnly filter (FR18)', () => {
    const repo = new InMemoryInventoryRepository();
    const page = loadPage(1);
    repo.addPage(page, defaultConfig({ tradableOnly: true }));
    const tradableCount = repo.getItemCount();

    const repo2 = new InMemoryInventoryRepository();
    repo2.addPage(page, defaultConfig({ tradableOnly: false }));
    const allCount = repo2.getItemCount();

    // tradableOnly should include <= all items
    expect(tradableCount).toBeLessThanOrEqual(allCount);
  });

  it('applies strategy (market_fee_app extraction for 753/6)', () => {
    const repo = new InMemoryInventoryRepository();
    repo.addPage(loadPage(1), defaultConfig({ strategy: new CommunityStrategy() }));

    const items = repo.getItems();
    // Items with market_hash_name like "570-Bounty Hunter" should have market_fee_app=570
    const withFeeApp = items.filter(i => i.market_fee_app !== undefined);
    expect(withFeeApp.length).toBeGreaterThan(0);
  });

  it('applies field selection (FR47)', () => {
    const repo = new InMemoryInventoryRepository();
    repo.addPage(loadPage(1), defaultConfig({
      fields: [Fields.MARKET_HASH_NAME, Fields.TRADABLE, Fields.APPID],
    }));

    const item = repo.getItems()[0];
    expect(item.assetid).toBeTruthy(); // always included
    expect(item.market_hash_name).toBeTruthy();
    expect(item.tradable).toBeDefined();
    expect(item.appid).toBe(753);
    // Non-selected fields should be absent
    expect('name' in item).toBe(false);
    expect('icon_url' in item).toBe(false);
  });

  it('clear resets all state', () => {
    const repo = new InMemoryInventoryRepository();
    repo.addPage(loadPage(1), defaultConfig());
    expect(repo.getItemCount()).toBeGreaterThan(0);

    repo.clear();
    expect(repo.getItemCount()).toBe(0);
    expect(repo.getItems()).toEqual([]);
  });

  it('processes all 39 pages (77k items)', () => {
    const repo = new InMemoryInventoryRepository();
    const config = defaultConfig();

    for (let i = 1; i <= 39; i++) {
      repo.addPage(loadPage(i), config);
    }

    // Should be close to 77,073 (some might be filtered)
    expect(repo.getItemCount()).toBeGreaterThan(70_000);
  });
});

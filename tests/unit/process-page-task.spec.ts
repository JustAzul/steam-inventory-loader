import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { processPage } from '../../src/worker/process-page-task.js';
import type { ProcessPageData } from '../../src/worker/process-page-task.js';
import { InMemoryInventoryRepository } from '../../src/repository/inventory.js';
import { StrategyRegistry } from '../../src/strategies/registry.js';
import { Fields } from '../../src/types.js';
import type { InventoryPage, ParseConfig } from '../../src/types.js';

const FIXTURES = join(import.meta.dirname, '../../fixtures');

function loadFixturePage(num: number): InventoryPage {
  const raw = JSON.parse(readFileSync(join(FIXTURES, `page-${String(num).padStart(2, '0')}.json`), 'utf8'));
  return {
    success: true,
    assets: raw.assets ?? [],
    descriptions: raw.descriptions ?? [],
    totalInventoryCount: raw.total_inventory_count ?? 0,
    moreItems: raw.more_items === 1,
    lastAssetId: raw.last_assetid ?? null,
    fakeRedirect: false,
  };
}

describe('processPage', () => {
  it('produces same output as InMemoryInventoryRepository.addPage for page 1', () => {
    const page = loadFixturePage(1);
    const strategy = new StrategyRegistry().get(753, 6);

    // Repository path (main thread)
    const repo = new InMemoryInventoryRepository();
    repo.addPage(page, { tradableOnly: false, strategy, contextId: 6 });
    const repoItems = repo.getItems();

    // Worker path
    const workerItems = processPage({
      assets: page.assets,
      descriptions: page.descriptions,
      previousDescriptions: [],
      config: { tradableOnly: false, contextId: 6, appId: 753 },
    });

    expect(workerItems.length).toBe(repoItems.length);
    // Spot-check first and last items
    expect(workerItems[0].assetid).toBe(repoItems[0].assetid);
    expect(workerItems[0].name).toBe(repoItems[0].name);
    expect(workerItems[workerItems.length - 1].assetid).toBe(repoItems[repoItems.length - 1].assetid);
  });

  it('parity for page 2 with previous descriptions from page 1', () => {
    const page1 = loadFixturePage(1);
    const page2 = loadFixturePage(2);
    const strategy = new StrategyRegistry().get(753, 6);

    // Repository path — processes page 1 then page 2
    const repo = new InMemoryInventoryRepository();
    repo.addPage(page1, { tradableOnly: false, strategy, contextId: 6 });
    const page1Count = repo.getItemCount();
    repo.addPage(page2, { tradableOnly: false, strategy, contextId: 6 });
    const repoPage2Items = repo.getItems().slice(page1Count);

    // Worker path for page 2 — receives page 1 descriptions as previous
    const workerItems = processPage({
      assets: page2.assets,
      descriptions: page2.descriptions,
      previousDescriptions: page1.descriptions,
      config: { tradableOnly: false, contextId: 6, appId: 753 },
    });

    expect(workerItems.length).toBe(repoPage2Items.length);
    expect(workerItems[0].assetid).toBe(repoPage2Items[0].assetid);
  });

  it('applies tradableOnly filter', () => {
    const page = loadFixturePage(1);

    const allItems = processPage({
      assets: page.assets,
      descriptions: page.descriptions,
      previousDescriptions: [],
      config: { tradableOnly: false, contextId: 6, appId: 753 },
    });

    const tradableItems = processPage({
      assets: page.assets,
      descriptions: page.descriptions,
      previousDescriptions: [],
      config: { tradableOnly: true, contextId: 6, appId: 753 },
    });

    expect(tradableItems.length).toBeLessThanOrEqual(allItems.length);
    for (const item of tradableItems) {
      expect(item.tradable).toBe(true);
    }
  });

  it('applies field selection', () => {
    const page = loadFixturePage(1);
    const fields = [Fields.MARKET_HASH_NAME, Fields.TRADABLE, Fields.TYPE];

    const items = processPage({
      assets: page.assets,
      descriptions: page.descriptions,
      previousDescriptions: [],
      config: { tradableOnly: false, fields, contextId: 6, appId: 753 },
    });

    expect(items.length).toBeGreaterThan(0);
    const keys = Object.keys(items[0]);
    // assetid (always) + 3 selected = 4
    expect(keys.length).toBe(4);
    expect(keys.sort()).toEqual(['assetid', 'market_hash_name', 'tradable', 'type']);
  });

  it('handles empty assets array', () => {
    const items = processPage({
      assets: [],
      descriptions: [],
      previousDescriptions: [],
      config: { tradableOnly: false, contextId: 6, appId: 753 },
    });

    expect(items).toEqual([]);
  });

  it('applies CommunityStrategy for app 753/context 6', () => {
    const page = loadFixturePage(1);

    const items = processPage({
      assets: page.assets,
      descriptions: page.descriptions,
      previousDescriptions: [],
      config: { tradableOnly: false, contextId: 6, appId: 753 },
    });

    // Community strategy sets market_fee_app from market_hash_name prefix
    const dota2Item = items.find(i => i.market_hash_name?.startsWith('570-'));
    if (dota2Item) {
      expect(dota2Item.market_fee_app).toBe(570);
    }
  });
});

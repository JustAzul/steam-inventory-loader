/**
 * Synthetic HTTP client that cycles through fixture pages to generate
 * inventories larger than the 77k-item fixture set (e.g., 500k items).
 * Rewrites assetids per cycle to avoid deduplication.
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname_ = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(__dirname_, '../../fixtures');
const TOTAL_FIXTURE_PAGES = 39;

export class SyntheticHttpClient {
  #pages;
  #pageNum = 0;
  #targetItems;
  #cumulativeItems = 0;

  /**
   * @param {number} targetItems - Total items to generate (default: 500,000)
   */
  constructor(targetItems = 500_000) {
    this.#targetItems = targetItems;
    // Pre-load all 39 fixture pages
    this.#pages = [];
    for (let i = 1; i <= TOTAL_FIXTURE_PAGES; i++) {
      const file = join(FIXTURES, `page-${String(i).padStart(2, '0')}.json`);
      this.#pages.push(JSON.parse(readFileSync(file, 'utf8')));
    }
  }

  async execute(_request) {
    this.#pageNum++;
    const fixtureIdx = (this.#pageNum - 1) % TOTAL_FIXTURE_PAGES;
    const cycle = Math.floor((this.#pageNum - 1) / TOTAL_FIXTURE_PAGES);

    // Deep copy the page
    const data = JSON.parse(JSON.stringify(this.#pages[fixtureIdx]));

    // Rewrite assetids to avoid dedup across cycles
    if (cycle > 0 && data.assets) {
      for (const asset of data.assets) {
        asset.assetid = `${asset.assetid}_c${cycle}`;
        asset.id = asset.assetid;
      }
    }

    // Track cumulative items
    const pageItems = data.assets?.length ?? 0;
    this.#cumulativeItems += pageItems;

    // Set total_inventory_count to target
    data.total_inventory_count = this.#targetItems;

    // Terminate when we've reached the target
    if (this.#cumulativeItems >= this.#targetItems) {
      data.more_items = 0;
      delete data.last_assetid;
    } else {
      data.more_items = 1;
      // Ensure there's a cursor for pagination
      if (!data.last_assetid && data.assets?.length > 0) {
        data.last_assetid = data.assets[data.assets.length - 1].assetid;
      }
    }

    return { status: 200, data, headers: {} };
  }

  destroy() {}
}

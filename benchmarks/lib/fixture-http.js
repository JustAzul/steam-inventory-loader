/**
 * Mock HTTP client serving fixture pages for benchmarks.
 * Pre-loads fixture files into memory to avoid I/O during measurement.
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname_ = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(__dirname_, '../../fixtures');

export class FixtureHttpClient {
  #pages;
  #pageNum = 0;
  #maxPages;

  /**
   * @param {number} maxPages - Number of pages to serve (default: 39 = all fixtures)
   */
  constructor(maxPages = 39) {
    this.#maxPages = maxPages;
    // Pre-load all needed fixture files into memory
    this.#pages = [];
    for (let i = 1; i <= Math.min(maxPages, 39); i++) {
      const file = join(FIXTURES, `page-${String(i).padStart(2, '0')}.json`);
      this.#pages.push(JSON.parse(readFileSync(file, 'utf8')));
    }
  }

  async execute(_request) {
    this.#pageNum++;

    if (this.#pageNum > this.#maxPages) {
      return {
        status: 200,
        data: { success: 1, total_inventory_count: 0, assets: [], descriptions: [] },
        headers: {},
      };
    }

    // Serve from memory (deep copy to avoid mutation)
    const idx = Math.min(this.#pageNum, this.#pages.length) - 1;
    const data = JSON.parse(JSON.stringify(this.#pages[idx]));

    if (this.#pageNum >= this.#maxPages) {
      data.more_items = 0;
      delete data.last_assetid;
    }

    return { status: 200, data, headers: {} };
  }

  destroy() {}
}

/** HTTP client returning empty inventory. */
export class EmptyHttpClient {
  async execute() {
    return {
      status: 200,
      data: { success: 1, total_inventory_count: 0, assets: [], descriptions: [] },
      headers: {},
    };
  }
  destroy() {}
}

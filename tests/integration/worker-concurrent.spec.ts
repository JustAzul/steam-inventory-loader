import { describe, it, expect, afterAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Loader } from '../../src/loader/loader.js';
import { PiscinaWorkerPool } from '../../src/worker/piscina-worker-pool.js';
import type { IHttpClient, HttpRequest, HttpResponse } from '../../src/types.js';

const FIXTURES = join(import.meta.dirname, '../../fixtures');
const WORKER_FILE = join(import.meta.dirname, '../../dist/process-page-task.js');
const TOTAL_PAGES = 39;

class FullFixtureHttpClient implements IHttpClient {
  private pageNum = 0;

  async execute(_request: HttpRequest): Promise<HttpResponse> {
    this.pageNum++;
    if (this.pageNum > TOTAL_PAGES) {
      return { status: 200, data: { success: 1, total_inventory_count: 0 }, headers: {} };
    }
    const data = JSON.parse(
      readFileSync(join(FIXTURES, `page-${String(this.pageNum).padStart(2, '0')}.json`), 'utf8'),
    );
    return { status: 200, data, headers: {} };
  }

  destroy(): void {}
}

describe('Concurrent loads with real Piscina workers', () => {
  const pool = new PiscinaWorkerPool({ maxWorkers: 2, filename: WORKER_FILE });

  afterAll(async () => {
    await pool.destroy();
  });

  it('5 concurrent loads produce correct results via workers', async () => {
    const loaders = Array.from({ length: 5 }, () =>
      new Loader(new FullFixtureHttpClient(), undefined, pool),
    );

    const results = await Promise.all(
      loaders.map(l => l.load('76561198356905764', 753, 6, {
        cache: false, requestDelay: 0, tradableOnly: false,
      })),
    );

    for (const result of results) {
      expect(result.success).toBe(true);
      expect(result.count).toBeGreaterThanOrEqual(77_000);
      expect(result.inventory.length).toBe(result.count);
      // Spot-check item structure
      expect(result.inventory[0].assetid).toBeTruthy();
      expect(result.inventory[0].name).toBeTruthy();
    }
  }, 30_000);

  it('worker pool destroy completes cleanly', async () => {
    const tempPool = new PiscinaWorkerPool({ maxWorkers: 1, filename: WORKER_FILE });
    const loader = new Loader(new FullFixtureHttpClient(), undefined, tempPool);

    // Trigger pool init by loading (even if workers aren't used for single load)
    await loader.load('76561198356905764', 753, 6, {
      cache: false, requestDelay: 0,
    });

    await expect(tempPool.destroy()).resolves.toBeUndefined();
  });
});

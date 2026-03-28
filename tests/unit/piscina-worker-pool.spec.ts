import { describe, it, expect, vi } from 'vitest';
import { cpus } from 'os';

/**
 * Unit tests for PiscinaWorkerPool configuration logic.
 * These test the clamping/defaults without spawning real Piscina instances.
 * Integration tests with real workers are in tests/integration/.
 */

// We test the clamping logic by instantiating the pool and checking the
// maxWorkers value. The pool is lazy — no Piscina instance is created
// until run() is called, so construction is safe in unit tests.

describe('PiscinaWorkerPool', () => {
  it('defaults maxWorkers to cpus - 1, clamped to [1, 8]', async () => {
    const { PiscinaWorkerPool } = await import('../../src/worker/piscina-worker-pool.js');
    const pool = new PiscinaWorkerPool();
    const expected = Math.max(1, Math.min(cpus().length - 1, 8));
    // Access via any since maxWorkers is private — this is a unit test
    expect((pool as any).maxWorkers).toBe(expected);
  });

  it('respects explicit maxWorkers override', async () => {
    const { PiscinaWorkerPool } = await import('../../src/worker/piscina-worker-pool.js');
    const pool = new PiscinaWorkerPool({ maxWorkers: 4 });
    expect((pool as any).maxWorkers).toBe(4);
  });

  it('clamps maxWorkers below 1 to 1', async () => {
    const { PiscinaWorkerPool } = await import('../../src/worker/piscina-worker-pool.js');
    const pool = new PiscinaWorkerPool({ maxWorkers: 0 });
    expect((pool as any).maxWorkers).toBe(1);
  });

  it('clamps maxWorkers above 8 to 8', async () => {
    const { PiscinaWorkerPool } = await import('../../src/worker/piscina-worker-pool.js');
    const pool = new PiscinaWorkerPool({ maxWorkers: 16 });
    expect((pool as any).maxWorkers).toBe(8);
  });

  it('destroy on uninitialized pool does not throw', async () => {
    const { PiscinaWorkerPool } = await import('../../src/worker/piscina-worker-pool.js');
    const pool = new PiscinaWorkerPool();
    // Pool not yet initialized (no run() call) — destroy should be safe
    await expect(pool.destroy()).resolves.toBeUndefined();
  });
});

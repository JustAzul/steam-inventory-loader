/**
 * Piscina-based worker pool adapter (FR58, FR61).
 * Lazily initializes the pool — spawn overhead (~80ms) is hidden
 * behind the page-2 network fetch (200ms-4s).
 */
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { cpus } from 'os';
import type { IWorkerPool } from '../types.js';

export interface WorkerPoolOptions {
  /** Max worker threads. Default: cpus - 1, clamped to [1, 8] (FR61). */
  maxWorkers?: number;
  /** Override worker filename. Default: resolves process-page-task.js relative to this module. */
  filename?: string;
}

export class PiscinaWorkerPool implements IWorkerPool {
  // Typed as any to avoid Piscina namespace/class DTS re-export issues.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private pool: any = null;
  private readonly maxWorkers: number;
  private readonly filename: string;

  constructor(options?: WorkerPoolOptions) {
    const cpuCount = cpus().length;
    this.maxWorkers = Math.max(1, Math.min(options?.maxWorkers ?? cpuCount - 1, 8));
    this.filename = options?.filename ?? resolve(
      dirname(fileURLToPath(import.meta.url)),
      'process-page-task.js',
    );
  }

  private async getPool(): Promise<any> {
    if (!this.pool) {
      const { Piscina } = await import('piscina');
      this.pool = new Piscina({
        filename: this.filename,
        maxThreads: this.maxWorkers,
        minThreads: 1,
      });
    }
    return this.pool;
  }

  async run<T>(task: string, data: unknown): Promise<T> {
    const pool = await this.getPool();
    return pool.run(data, { name: task }) as Promise<T>;
  }

  async destroy(): Promise<void> {
    if (this.pool) {
      await this.pool.destroy();
      this.pool = null;
    }
  }
}

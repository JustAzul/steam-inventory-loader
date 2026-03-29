import type {
  IWorkerPool, ItemDetails, ItemDescription, LoaderConfig,
  ParseConfig, InventoryPage,
} from '../types.js';
import { DescriptionStore } from '../repository/description-store.js';
import { processAssets } from '../pipeline/process-assets.js';
import { selectFields } from '../pipeline/field-selector.js';
import { shouldUseWorker } from '../worker/adaptive-decision.js';
import type { ProcessPageData } from '../worker/process-page-task.js';

const WORKER_CONSECUTIVE_FAILURE_LIMIT = 2;

export class PageProcessor {
  private readonly pool: IWorkerPool | null;
  private readonly parseConfig: ParseConfig;
  private readonly config: LoaderConfig;
  private readonly activeLoadsGetter: () => number;
  private readonly customStrategy: boolean;

  private descStore = new DescriptionStore();
  private useWorker = false;
  private workerFailures = 0;
  private isFirstPage = true;
  private previousDescriptions: ItemDescription[] = [];

  constructor(
    pool: IWorkerPool | null,
    parseConfig: ParseConfig,
    config: LoaderConfig,
    activeLoadsGetter: () => number,
    customStrategy: boolean,
  ) {
    this.pool = pool;
    this.parseConfig = parseConfig;
    this.config = config;
    this.activeLoadsGetter = activeLoadsGetter;
    this.customStrategy = customStrategy;
  }

  async processPage(page: InventoryPage): Promise<ItemDetails[]> {
    let items: ItemDetails[];

    if (!this.useWorker || this.isFirstPage) {
      items = this.processOnMainThread(page);

      if (this.isFirstPage) {
        if (this.pool && shouldUseWorker(page.totalInventoryCount, this.activeLoadsGetter())) {
          this.useWorker = true;
        }
        this.isFirstPage = false;
      }
    } else {
      const result = await this.processWithWorker(page);
      items = result.items;
      if (result.failed) {
        this.workerFailures++;
        if (this.workerFailures >= WORKER_CONSECUTIVE_FAILURE_LIMIT) this.useWorker = false;
      } else {
        this.workerFailures = 0;
      }
    }

    this.previousDescriptions = page.descriptions;
    return items;
  }

  private processOnMainThread(page: InventoryPage): ItemDetails[] {
    this.descStore.addPage(page.descriptions);
    return processAssets(page.assets, this.descStore, this.parseConfig);
  }

  private async processWithWorker(
    page: InventoryPage,
  ): Promise<{ items: ItemDetails[]; failed: boolean }> {
    try {
      const items = await this.runWorkerTask(page);
      return { items, failed: false };
    } catch (err) {
      if (isTransientWorkerError(err)) {
        try {
          const items = await this.runWorkerTask(page);
          return { items, failed: false };
        } catch {
          return { items: this.processOnMainThread(page), failed: false };
        }
      }
      return { items: this.processOnMainThread(page), failed: true };
    }
  }

  private async runWorkerTask(page: InventoryPage): Promise<ItemDetails[]> {
    const pageData: ProcessPageData = {
      assets: page.assets,
      descriptions: page.descriptions,
      previousDescriptions: this.previousDescriptions,
      config: {
        tradableOnly: this.config.tradableOnly,
        fields: this.customStrategy ? undefined : this.config.fields,
        contextId: this.config.contextId,
        appId: this.config.appId,
        skipStrategy: this.customStrategy,
      },
    };
    let items = await this.pool!.run<ItemDetails[]>('processPage', pageData);

    if (this.customStrategy) {
      items = items.map(item => {
        let processed = this.parseConfig.strategy.apply(item);
        if (this.config.fields) processed = selectFields(processed, this.config.fields) as ItemDetails;
        return processed;
      });
    }

    return items;
  }
}

function isTransientWorkerError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return msg.includes('timed out') || msg.includes('task queue');
}

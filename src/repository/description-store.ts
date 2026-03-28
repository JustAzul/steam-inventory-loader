import type { ItemDescription } from '../types.js';

/**
 * Rolling 1-page description window (FR50).
 * Maintains descriptions from the current and previous page only.
 * POC B2 validated 100% hit rate with 1-page window.
 */
export class DescriptionStore {
  private current = new Map<string, ItemDescription>();
  private previous = new Map<string, ItemDescription>();

  private key(classid: string, instanceid: string): string {
    return `${classid}_${instanceid}`;
  }

  /**
   * Load a new page of descriptions, rotating the window.
   * Previous page is evicted, current becomes previous, new page becomes current.
   */
  addPage(descriptions: ItemDescription[]): void {
    this.previous = this.current;
    this.current = new Map();
    for (const desc of descriptions) {
      this.current.set(this.key(desc.classid, desc.instanceid ?? '0'), desc);
    }
  }

  /**
   * Lookup a description by classid + instanceid.
   * Checks current page first, then previous page (rolling window).
   */
  get(classid: string, instanceid: string): ItemDescription | undefined {
    const k = this.key(classid, instanceid || '0');
    return this.current.get(k) ?? this.previous.get(k);
  }

  clear(): void {
    this.current.clear();
    this.previous.clear();
  }
}

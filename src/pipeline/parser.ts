import type { InventoryPage, ItemAsset, ItemDescription } from '../types.js';

const ERESULT_PATTERN = /^(.+) \((\d+)\)$/;

/**
 * Parse raw JSON string from Steam API into a typed InventoryPage.
 * Pure function — no side effects or external dependencies.
 */
export function parseInventoryPage(json: string): InventoryPage {
  let raw: Record<string, unknown>;

  try {
    raw = JSON.parse(json) as Record<string, unknown>;
  } catch {
    return {
      success: false,
      assets: [],
      descriptions: [],
      moreItems: false,
      lastAssetId: null,
      totalInventoryCount: 0,
      error: 'Failed to parse JSON response',
      eresult: null,
      fakeRedirect: false,
    };
  }

  const success = Boolean(raw.success);

  // Error extraction: prefer lowercase `error` over uppercase `Error`
  let error: string | null = null;
  let eresult: number | null = null;

  const rawError = (raw.error ?? raw.Error) as string | undefined;
  if (rawError) {
    // If both exist, prefer lowercase
    error = typeof raw.error === 'string' ? raw.error : String(rawError);

    // Extract eresult from pattern like "Failure (2)"
    const match = error.match(ERESULT_PATTERN);
    if (match) {
      error = match[1];
      eresult = parseInt(match[2], 10);
    }
  }

  const assets = (Array.isArray(raw.assets) ? raw.assets : []) as ItemAsset[];
  const descriptions = (Array.isArray(raw.descriptions) ? raw.descriptions : []) as ItemDescription[];

  const moreItems = Boolean(raw.more_items);
  const lastAssetId = raw.last_assetid ? String(raw.last_assetid) : null;
  const totalInventoryCount = typeof raw.total_inventory_count === 'number'
    ? raw.total_inventory_count
    : 0;

  const fakeRedirect = Boolean(raw.fake_redirect);

  return {
    success,
    assets,
    descriptions,
    moreItems,
    lastAssetId,
    totalInventoryCount,
    error,
    eresult,
    fakeRedirect,
  };
}

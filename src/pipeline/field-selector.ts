import type { Fields, ItemDetails } from '../types.js';

/**
 * Project item to only the selected fields (+ assetid always included).
 * When fields is undefined, returns the original item unchanged (v3 compat).
 * Pure function — no side effects.
 */
export function selectFields(
  item: ItemDetails,
  fields?: readonly Fields[],
): ItemDetails {
  if (!fields) return item;

  const result: Record<string, unknown> = { assetid: item.assetid };
  const source = item as unknown as Record<string, unknown>;

  for (const field of fields) {
    if (field in source) {
      result[field] = source[field];
    }
  }

  return result as unknown as ItemDetails;
}

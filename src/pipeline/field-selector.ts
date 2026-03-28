import type { Fields, ItemDetails, PartialItem } from '../types.js';

/**
 * Project item to only the selected fields (+ assetid always included).
 * When fields is undefined, returns the original item unchanged (v3 compat).
 * Pure function — no side effects.
 */
export function selectFields(item: ItemDetails): ItemDetails;
export function selectFields<const F extends readonly Fields[]>(
  item: ItemDetails, fields: F,
): Pick<ItemDetails, 'assetid' | (F[number] & keyof ItemDetails)>;
export function selectFields(
  item: ItemDetails,
  fields?: readonly Fields[],
): PartialItem {
  if (!fields) return item;

  const result: Record<string, unknown> = { assetid: item.assetid };
  const source = item as unknown as Record<string, unknown>;

  for (const field of fields) {
    if (field in source) {
      result[field] = source[field];
    }
  }

  return result as unknown as PartialItem;
}

import type { ItemAsset, ItemDescription, ItemDetails, Tag, SteamTag } from '../types.js';

/**
 * Build a flat ItemDetails object from an asset + description pair.
 * Pure function — no side effects. Handles all v3 field mapping + new fields.
 *
 * @param asset    - Asset reference from Steam API
 * @param desc     - Matching description from Steam API
 * @param contextId - Context ID (from config, not asset — for listing format compat)
 */
export function buildItem(asset: ItemAsset, desc: ItemDescription, contextId: number): ItemDetails {
  const isCurrency = Boolean(
    asset.is_currency || asset.currency || typeof asset.currencyid !== 'undefined',
  );

  const id = isCurrency && asset.currencyid
    ? asset.currencyid
    : asset.assetid;

  const instanceid = asset.instanceid || '0';

  return {
    actions: desc.actions ?? [],
    amount: parseInt(String(asset.amount), 10) || 0,
    appid: asset.appid,
    assetid: asset.assetid,
    background_color: desc.background_color ?? '',
    classid: asset.classid,
    commodity: Boolean(desc.commodity),
    contextid: String(contextId),
    currency: null, // always null post-processing (FR17)
    descriptions: desc.descriptions ?? [],
    fraudwarnings: desc.fraudwarnings ?? [],
    icon_url: desc.icon_url ?? '',
    icon_url_large: desc.icon_url_large ?? '',
    id,
    instanceid,
    is_currency: isCurrency,
    market_fee_app: desc.market_fee_app,
    market_hash_name: desc.market_hash_name ?? '',
    market_marketable_restriction: parseRestriction(desc.market_marketable_restriction),
    market_name: desc.market_name ?? '',
    market_tradable_restriction: parseRestriction(desc.market_tradable_restriction),
    marketable: Boolean(desc.marketable),
    name: desc.name ?? '',
    owner: normalizeOwner(desc.owner),
    owner_actions: desc.owner_actions,
    owner_descriptions: desc.owner_descriptions,
    sealed: desc.sealed,
    sealed_type: desc.sealed_type,
    tags: desc.tags ? normalizeTags(desc.tags) : undefined,
    tradable: Boolean(desc.tradable),
    type: desc.type ?? '',
    ...(desc.item_expiration ? { item_expiration: desc.item_expiration } : {}),
  };
}

function parseRestriction(value: number | string | undefined): number {
  if (value == null) return 0;
  const parsed = parseInt(String(value), 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Empty owner detection via for..in (FR13).
 * If the owner object has no enumerable properties, return undefined.
 */
function normalizeOwner(owner: unknown): unknown | undefined {
  if (owner == null) return undefined;
  if (typeof owner !== 'object') return owner;

  for (const _ in owner as Record<string, unknown>) {
    return owner; // has at least one property
  }
  return undefined; // empty object
}

/**
 * Normalize tags from Steam API format to v3 output format (FR09).
 * Prefers localized_tag_name over legacy name field.
 */
function normalizeTags(tags: SteamTag[]): Tag[] {
  return tags.map(tag => ({
    category: tag.category ?? '',
    internal_name: tag.internal_name ?? '',
    name: tag.localized_tag_name ?? tag.name ?? '',
    category_name: tag.localized_category_name ?? tag.category_name ?? '',
    color: tag.color ?? '',
  }));
}

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parseInventoryPage } from '../../src/pipeline/parser.js';

const FIXTURES = join(import.meta.dirname, '../../fixtures');

describe('parseInventoryPage', () => {
  it('parses a real fixture page with assets and descriptions', () => {
    const json = readFileSync(join(FIXTURES, 'page-01.json'), 'utf8');
    const page = parseInventoryPage(json);

    expect(page.success).toBe(true);
    expect(page.assets.length).toBe(2000);
    expect(page.descriptions.length).toBeGreaterThan(0);
    expect(page.moreItems).toBe(true);
    expect(page.lastAssetId).toBeTruthy();
    expect(page.totalInventoryCount).toBeGreaterThan(0);
    expect(page.error).toBeNull();
    expect(page.eresult).toBeNull();
    expect(page.fakeRedirect).toBe(false);
  });

  it('parses last page with more_items=0', () => {
    const json = readFileSync(join(FIXTURES, 'page-39.json'), 'utf8');
    const page = parseInventoryPage(json);

    expect(page.success).toBe(true);
    expect(page.moreItems).toBe(false);
    expect(page.assets.length).toBeGreaterThan(0);
  });

  it('handles empty inventory (total_inventory_count=0)', () => {
    const json = JSON.stringify({
      success: 1,
      total_inventory_count: 0,
      assets: [],
      descriptions: [],
    });
    const page = parseInventoryPage(json);

    expect(page.success).toBe(true);
    expect(page.totalInventoryCount).toBe(0);
    expect(page.assets).toEqual([]);
    expect(page.descriptions).toEqual([]);
    expect(page.moreItems).toBe(false);
  });

  it('handles success as boolean true', () => {
    const json = JSON.stringify({
      success: true,
      total_inventory_count: 5,
      assets: [{ appid: 753, contextid: '6', assetid: '1', classid: '1', instanceid: '0', amount: '1' }],
      descriptions: [],
    });
    const page = parseInventoryPage(json);
    expect(page.success).toBe(true);
  });

  it('handles success as number 1', () => {
    const json = JSON.stringify({ success: 1, total_inventory_count: 0 });
    const page = parseInventoryPage(json);
    expect(page.success).toBe(true);
  });

  it('handles success=false with error message', () => {
    const json = JSON.stringify({ success: false, error: 'Profile is private' });
    const page = parseInventoryPage(json);

    expect(page.success).toBe(false);
    expect(page.error).toBe('Profile is private');
    expect(page.assets).toEqual([]);
    expect(page.descriptions).toEqual([]);
  });

  it('prefers lowercase error over uppercase Error', () => {
    const json = JSON.stringify({
      success: false,
      error: 'lowercase wins',
      Error: 'uppercase loses',
    });
    const page = parseInventoryPage(json);
    expect(page.error).toBe('lowercase wins');
  });

  it('falls back to uppercase Error when lowercase missing', () => {
    const json = JSON.stringify({ success: false, Error: 'uppercase fallback' });
    const page = parseInventoryPage(json);
    expect(page.error).toBe('uppercase fallback');
  });

  it('extracts eresult from error string pattern "Failure (2)"', () => {
    const json = JSON.stringify({ success: false, error: 'Failure (2)' });
    const page = parseInventoryPage(json);

    expect(page.error).toBe('Failure');
    expect(page.eresult).toBe(2);
  });

  it('handles more_items as boolean true', () => {
    const json = JSON.stringify({
      success: 1,
      more_items: true,
      last_assetid: '123',
      total_inventory_count: 100,
      assets: [],
      descriptions: [],
    });
    const page = parseInventoryPage(json);
    expect(page.moreItems).toBe(true);
    expect(page.lastAssetId).toBe('123');
  });

  it('detects fake_redirect flag', () => {
    const json = JSON.stringify({ success: 1, fake_redirect: 1, total_inventory_count: 0 });
    const page = parseInventoryPage(json);
    expect(page.fakeRedirect).toBe(true);
  });

  it('handles anomalous empty: success but no assets', () => {
    const json = JSON.stringify({
      success: 1,
      total_inventory_count: 5000,
      // no assets or descriptions keys
    });
    const page = parseInventoryPage(json);

    expect(page.success).toBe(true);
    expect(page.assets).toEqual([]);
    expect(page.descriptions).toEqual([]);
    // totalInventoryCount reports what Steam said even if data is missing
    expect(page.totalInventoryCount).toBe(5000);
  });

  it('handles malformed JSON gracefully', () => {
    const page = parseInventoryPage('not valid json {{{');

    expect(page.success).toBe(false);
    expect(page.error).toBeTruthy();
    expect(page.assets).toEqual([]);
    expect(page.descriptions).toEqual([]);
  });
});

#!/usr/bin/env node

/**
 * Fields enum auto-discovery script (FR49).
 *
 * Fetches a real Steam inventory page, extracts all description + asset keys,
 * and updates the Fields enum in src/types.ts if new fields are found.
 *
 * Usage:
 *   node scripts/update-fields.mjs          # fetch from Steam API
 *   node scripts/update-fields.mjs --local  # use local fixtures only
 *
 * Runs automatically on `npm install` (via prepare hook) in dev mode.
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const TYPES_FILE = join(ROOT, 'src', 'types.ts');
const FIXTURES_DIR = join(ROOT, 'fixtures');

const STEAM_ID = '76561198356905764';
const APP_ID = 753;
const CTX_ID = 6;
const API_URL = `https://steamcommunity.com/inventory/${STEAM_ID}/${APP_ID}/${CTX_ID}?l=english&count=1`;

// Fields that are internal to the loader (not from Steam API)
const INTERNAL_FIELDS = new Set(['cache_expiration', 'id', 'is_currency']);

// Fields to always exclude (never useful as selectable output fields)
const EXCLUDE_FIELDS = new Set(['classid_instanceid']);

async function fetchSteamPage() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) {
      console.warn(`  Steam API returned ${res.status}, falling back to fixtures`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn(`  Steam API unreachable: ${err.message}, falling back to fixtures`);
    return null;
  }
}

function extractKeysFromFixtures() {
  const keys = new Set();
  const files = readdirSync(FIXTURES_DIR).filter(f => f.endsWith('.json'));

  // Sample first 3 pages for speed
  for (const file of files.slice(0, 3)) {
    const page = JSON.parse(readFileSync(join(FIXTURES_DIR, file), 'utf8'));
    if (page.assets) {
      for (const asset of page.assets) {
        for (const key of Object.keys(asset)) keys.add(key);
      }
    }
    if (page.descriptions) {
      for (const desc of page.descriptions) {
        for (const key of Object.keys(desc)) keys.add(key);
      }
    }
  }
  return keys;
}

function extractKeysFromResponse(data) {
  const keys = new Set();
  if (data.assets) {
    for (const asset of data.assets) {
      for (const key of Object.keys(asset)) keys.add(key);
    }
  }
  if (data.descriptions) {
    for (const desc of data.descriptions) {
      for (const key of Object.keys(desc)) keys.add(key);
    }
  }
  return keys;
}

function getCurrentEnumValues() {
  const content = readFileSync(TYPES_FILE, 'utf8');
  const enumMatch = content.match(/export enum Fields \{([\s\S]*?)\}/);
  if (!enumMatch) throw new Error('Fields enum not found in src/types.ts');

  const values = new Set();
  const lines = enumMatch[1].split('\n');
  for (const line of lines) {
    const match = line.match(/=\s*'([^']+)'/);
    if (match) values.add(match[1]);
  }
  return values;
}

function toEnumKey(fieldName) {
  return fieldName.toUpperCase();
}

function buildEnumBlock(fields) {
  const sorted = [...fields].sort();
  const lines = sorted.map(f => `  ${toEnumKey(f)} = '${f}',`);
  return `export enum Fields {\n${lines.join('\n')}\n}`;
}

function updateTypesFile(allFields) {
  const content = readFileSync(TYPES_FILE, 'utf8');
  const newEnum = buildEnumBlock(allFields);
  const updated = content.replace(/export enum Fields \{[\s\S]*?\}/, newEnum);
  writeFileSync(TYPES_FILE, updated, 'utf8');
}

async function main() {
  const useLocal = process.argv.includes('--local');

  console.log('[update-fields] Discovering Steam API fields...');

  // Collect keys from all sources
  const allKeys = new Set();

  // Always check fixtures
  const fixtureKeys = extractKeysFromFixtures();
  for (const k of fixtureKeys) allKeys.add(k);
  console.log(`  Fixtures: ${fixtureKeys.size} keys`);

  // Fetch from API unless --local
  if (!useLocal) {
    const data = await fetchSteamPage();
    if (data) {
      const apiKeys = extractKeysFromResponse(data);
      for (const k of apiKeys) allKeys.add(k);
      console.log(`  Steam API: ${apiKeys.size} keys`);
    }
  }

  // Filter out excluded and add internal fields
  for (const k of EXCLUDE_FIELDS) allKeys.delete(k);
  for (const k of INTERNAL_FIELDS) allKeys.add(k);

  // Compare with current enum
  const currentValues = getCurrentEnumValues();
  const newFields = [...allKeys].filter(k => !currentValues.has(k));
  const removedFields = [...currentValues].filter(k => !allKeys.has(k) && !INTERNAL_FIELDS.has(k));

  if (newFields.length === 0 && removedFields.length === 0) {
    console.log(`  Fields enum is up to date (${currentValues.size} fields)`);
    return;
  }

  if (newFields.length > 0) {
    console.log(`  New fields discovered: ${newFields.join(', ')}`);
  }
  if (removedFields.length > 0) {
    console.log(`  Fields no longer in API: ${removedFields.join(', ')}`);
    // Don't remove fields — they might be in other app contexts
    for (const k of removedFields) allKeys.add(k);
  }

  // Merge: keep all existing + add new
  const merged = new Set([...currentValues, ...allKeys]);
  updateTypesFile(merged);
  console.log(`  Updated Fields enum: ${currentValues.size} → ${merged.size} fields`);
}

main().catch(err => {
  console.error('[update-fields] Error:', err.message);
  // Non-fatal — don't break npm install
  process.exit(0);
});

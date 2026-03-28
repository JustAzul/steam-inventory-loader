# azul-steam-inventory-loader

Load Steam inventories with automatic pagination, provider chain fallback, LRU caching, field selection, and adaptive worker offloading.

Supports **Node.js 18+** with ESM and CJS.

## Install

```bash
npm install azul-steam-inventory-loader
```

## Quick Start

```typescript
import { Loader } from 'azul-steam-inventory-loader';

const loader = new Loader();

// Load entire inventory (all items in memory)
const result = await loader.load('76561198356905764', 730, 2);
console.log(`${result.count} items loaded`);

// Stream page-by-page (lower memory, faster time-to-first-item)
for await (const batch of loader.loadStream('76561198356905764', 730, 2)) {
  console.log(`Got ${batch.length} items`);
}
```

## API

### `loader.load(steamId, appId, contextId, config?)`

Returns `Promise<LoaderResponse>` with all items in memory.

```typescript
interface LoaderResponse {
  success: boolean;
  count: number;
  inventory: ItemDetails[];
  error?: SteamErrorInfo;
}
```

### `loader.loadStream(steamId, appId, contextId, config?)`

Returns `AsyncGenerator<ItemDetails[]>` yielding one batch per page. Throws `SteamError` on failure. Does not write to cache.

```typescript
const items: ItemDetails[] = [];
for await (const batch of loader.loadStream(steamId, 730, 2)) {
  items.push(...batch);
}
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `steamId` | `string \| number \| SteamID` | Steam ID (64-bit string, number, or SteamID object) |
| `appId` | `string \| number` | Steam app ID (e.g., `730` for CS2, `753` for Steam community) |
| `contextId` | `string \| number` | Inventory context (e.g., `2` for CS2, `6` for community items) |
| `config` | `LoadConfig \| FlatConfig` | Optional configuration (see below) |

### Configuration

```typescript
import { Loader, Fields } from 'azul-steam-inventory-loader';
import type { LoadConfig } from 'azul-steam-inventory-loader';

const config: LoadConfig = {
  // Core
  language: 'english',        // API language (default: 'english')
  tradableOnly: true,          // Filter non-tradable items (default: true)
  fields: [Fields.MARKET_HASH_NAME, Fields.TRADABLE, Fields.TAGS],  // Select fields (default: all)

  // Pagination
  itemsPerPage: 2000,          // Items per API page (default: 2000)
  maxRetries: 3,               // Retry attempts per page (default: 3)
  requestDelay: 4000,          // Delay between pages in ms (default: 4000, auto 0 for paid APIs)

  // Cache
  cache: {                     // true = defaults, false = disabled, object = custom
    ttl: 30_000,               // Cache TTL in ms (default: 30000)
    maxEntries: 20,            // Max cached inventories (default: 20)
    maxSize: 512 * 1024 * 1024, // Max cache size in bytes (default: 512MB)
  },

  // Providers
  providers: {
    priority: ['community'],   // Provider order (default: ['community'])
    steamApisKey: undefined,   // SteamApis.com API key
    steamSupplyKey: undefined, // Steam.Supply API key
    customEndpoint: undefined, // Custom provider URL
  },

  // Network & Workers
  proxy: undefined,            // HTTP proxy URL
  maxWorkers: undefined,       // Worker threads (default: cpus-1, clamped [1, 8])
};

const loader = new Loader();
const result = await loader.load('76561198356905764', 730, 2, config);
```

### Field Selection

Reduce memory usage by selecting only the fields you need:

```typescript
import { Loader, Fields } from 'azul-steam-inventory-loader';

const loader = new Loader();
const result = await loader.load('76561198356905764', 753, 6, {
  fields: [Fields.MARKET_HASH_NAME, Fields.TRADABLE, Fields.ICON_URL],
});

// result.inventory[0] → { assetid, market_hash_name, tradable, icon_url }
// assetid is always included
```

### Provider Chain

The loader supports multiple Steam inventory API providers with automatic fallback:

| Provider | Requires | Rate Limiting |
|----------|----------|---------------|
| `community` | Nothing (default) | Yes (4s delay between pages) |
| `steamApis` | `steamApisKey` | No (paid API) |
| `steamSupply` | `steamSupplyKey` | No (paid API) |
| `custom` | `customEndpoint` | Configurable |

```typescript
const loader = new Loader();

// Try SteamApis first, fall back to community on rate limit
const result = await loader.load(steamId, 730, 2, {
  providers: {
    priority: ['steamApis', 'community'],
    steamApisKey: 'your-key',
  },
});
```

### Caching

All `Loader` instances share a global LRU cache by default:

```typescript
// Disable cache for a specific load
const result = await loader.load(steamId, 730, 2, { cache: false });

// Custom cache settings
const result = await loader.load(steamId, 730, 2, {
  cache: { ttl: 60_000, maxEntries: 50 },
});

// Inject your own cache store
const loader = new Loader(undefined, myCustomCacheStore);
```

### Workers

For high-concurrency scenarios (e.g., loading many inventories at once), the loader automatically offloads page processing to worker threads when:

- Inventory has 5000+ items
- 3+ concurrent loads are active

```typescript
import { Loader, PiscinaWorkerPool } from 'azul-steam-inventory-loader';

// Auto-managed pool (created and destroyed per load)
const result = await loader.load(steamId, 730, 2, { maxWorkers: 4 });

// Or inject a long-lived pool for better performance
const pool = new PiscinaWorkerPool({ maxWorkers: 4 });
const loader = new Loader(undefined, undefined, pool);
// ... use loader ...
await pool.destroy();
```

### Constructor

```typescript
const loader = new Loader(
  httpClient?,    // Custom IHttpClient implementation
  cache?,         // Custom ICacheStore<string, LoaderResponse>
  workerPool?,    // Custom IWorkerPool (e.g., PiscinaWorkerPool)
  registry?,      // Custom StrategyRegistry
);
```

### Static Methods

```typescript
// v3 compat: static method (uses shared cache)
const result = await Loader.Loader(steamId, appId, contextId, config);

// Register custom provider
Loader.registerProvider('myApi', myProvider);

// Register app-specific strategy
Loader.registerStrategy(730, 2, myCS2Strategy);

// Replace shared cache
Loader.setSharedCache(myCache);
```

### Utility Functions

```typescript
import { getTag, getImageURL, getLargeImageURL, isCardType } from 'azul-steam-inventory-loader';

// Get a tag by category
const tag = getTag(item.tags, 'Type');

// Get image URLs
const url = getImageURL(item);
const largeUrl = getLargeImageURL(item);

// Check if item is a trading card
const isCard = isCardType(item);
```

## Migrating from v3

### Breaking Changes

- **Package name**: `steam-inventory-loader` &rarr; `azul-steam-inventory-loader`
- **Import style**: CommonJS `require()` still works, but ESM `import` is recommended
- **Error handling**: `load()` never throws &mdash; always returns `{ success: false, error }` on failure

### Deprecated (still works)

| v3 | v4 |
|----|-----|
| `Loader.Loader(steamId, appId, contextId, config)` | `new Loader().load(steamId, appId, contextId, config)` |
| `{ Language: 'english' }` | `{ language: 'english' }` |
| `{ SteamCommunity_Jar: jar }` | Pass cookies via constructor or config |
| Flat config (`{ cacheTTL, steamApisKey, ... }`) | Grouped config (`{ cache: { ttl }, providers: { steamApisKey } }`) |

### What's New in v4

- **`loadStream()`** &mdash; async generator for incremental processing
- **Field selection** &mdash; `fields` option to reduce memory usage (~40% reduction with 7 fields)
- **Grouped config** &mdash; `LoadConfig` interface organized by concern
- **Provider chain fallback** &mdash; automatic retry with next provider on rate limit
- **Adaptive workers** &mdash; automatic worker offloading for large concurrent loads
- **LRU cache** &mdash; size-aware shared cache (512MB default) with TTL
- **TypeScript** &mdash; full type definitions, dual ESM/CJS build

## Common App IDs

| Game | App ID | Context ID |
|------|--------|------------|
| CS2 | 730 | 2 |
| TF2 | 440 | 2 |
| Dota 2 | 570 | 2 |
| Rust | 252490 | 2 |
| Steam Community (trading cards, etc.) | 753 | 6 |

## License

[MIT](LICENSE)

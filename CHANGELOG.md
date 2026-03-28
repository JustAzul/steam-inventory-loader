# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.0.0-alpha.5] - 2026-03-28

### Added
- README with full API reference, migration guide, and common app IDs
- MIT license (matching steamcommunity ecosystem)

## [4.0.0-alpha.4] - 2026-03-28

### Changed
- Redesigned `OptionalConfig` into grouped `LoadConfig` interface
  - `cache: boolean | CacheConfig` (ttl, maxEntries, maxSize)
  - `providers: ProviderConfig` (priority, steamApisKey, steamSupplyKey, customEndpoint)
- Old flat `FlatConfig` still accepted via union type (no breaking change)
- v3 compat keys (`Language`, `SteamCommunity_Jar`) marked `@deprecated`

## [4.0.0-alpha.3] - 2026-03-28

### Added
- `loadStream()` async generator for incremental inventory loading
  - Yields `ItemDetails[]` per page
  - Throws `SteamError` on failure (consumers keep partial results)
  - Reads cache on hit, never writes (avoids memory accumulation)

### Changed
- Decomposed `_loadInner()` into focused methods (max 1 try/catch each):
  - `_attemptFetch()` — single HTTP attempt with result type
  - `_fetchPage()` — retry loop (zero try/catch)
  - `_processPageMainThread()` — pure pipeline call
  - `_processPageWithWorker()` — worker with graceful fallback
  - `_streamPages()` — clean pagination generator
- `_loadInner()` now internally consumes `_streamPages()` — single pagination loop

## [4.0.0-alpha.2] - 2026-03-28

### Added
- Network latency benchmark for worker break-even analysis
- `DelayedFixtureHttpClient` for simulated latency benchmarks

## [4.0.0-alpha.1] - 2026-03-28

### Added
- Complete v4 rewrite with modular architecture
- Provider chain with automatic fallback (community, steamApis, steamSupply, custom)
- Field selection (`Fields` enum) for memory optimization (~40% reduction)
- Adaptive worker offloading via Piscina (5000+ items, 3+ concurrent loads)
- Size-aware LRU cache (512MB default, TTL, max entries)
- Benchmark suite with PRD target validation
- Cross-Node-version benchmarks (18, 20, 22, 24)
- `BaseInventoryProvider` abstract class (DRY provider implementations)
- Injectable `StrategyRegistry` via constructor

### Changed
- Package name: `steam-inventory-loader` → `azul-steam-inventory-loader`
- `load()` never throws — always returns `{ success: false, error }` on failure
- TypeScript rewrite with strict mode, dual ESM/CJS build
- CI: build before test (worker tests need `dist/process-page-task.js`)

### Fixed
- Cache key collision across different steamId/appId combinations
- SteamError consolidation (single error class with typed variants)
- Proxy support via hpagent

## [3.8.1] - Previous

### Fixed
- Malformed logic in inventory loading

## [3.8.0] - Previous

### Added
- Custom endpoint support
- Steam.Supply provider
- SteamApis.com provider
- `itemsPerPage` configuration
- `requestDelay` configuration

## [3.0.0] - Previous

### Changed
- Major rewrite to class-based architecture
- Added v3 configuration API

// v4 public API

// Main loader
export { Loader } from './loader/loader.js';

// Types & enums
export { Fields, SteamErrorType } from './types.js';
export type {
  CacheConfig,
  FlatConfig,
  HttpRequest,
  HttpResponse,
  ICacheStore,
  IHttpClient,
  IInventoryProvider,
  IInventoryRepository,
  IStrategy,
  IWorkerPool,
  InferItem,
  InnerItemDescription,
  InventoryPage,
  ItemActions,
  ItemAsset,
  ItemDescription,
  ItemDetails,
  LoadConfig,
  LoaderConfig,
  LoaderResponse,
  OptionalConfig,
  PageRequest,
  ParseConfig,
  PartialItem,
  ProviderConfig,
  RateLimitConfig,
  SelectedItem,
  SteamErrorInfo,
  SteamTag,
  Tag,
} from './types.js';

// Workers (FR58-FR61)
export { PiscinaWorkerPool } from './worker/piscina-worker-pool.js';
export type { WorkerPoolOptions } from './worker/piscina-worker-pool.js';
export { shouldUseWorker, ITEM_THRESHOLD, ACTIVE_LOAD_THRESHOLD } from './worker/adaptive-decision.js';

// Error class
export { SteamError } from './errors/errors.js';

// Utilities (v3 compat)
export { getTag, getImageURL, getLargeImageURL, isCardType } from './compat/utils.js';

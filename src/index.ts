// v4 public API

// Main loader
export { Loader } from './loader/loader.js';

// Types & enums
export { Fields } from './types.js';
export type {
  HttpRequest,
  HttpResponse,
  ICacheStore,
  IHttpClient,
  IInventoryProvider,
  IInventoryRepository,
  IStrategy,
  IWorkerPool,
  InnerItemDescription,
  InventoryPage,
  ItemActions,
  ItemAsset,
  ItemDescription,
  ItemDetails,
  LoaderConfig,
  LoaderResponse,
  OptionalConfig,
  PageRequest,
  ParseConfig,
  SteamErrorInfo,
  SteamErrorType,
  SteamTag,
  Tag,
} from './types.js';

// Workers (FR58-FR61)
export { PiscinaWorkerPool } from './worker/piscina-worker-pool.js';
export type { WorkerPoolOptions } from './worker/piscina-worker-pool.js';
export { shouldUseWorker, ITEM_THRESHOLD, ACTIVE_LOAD_THRESHOLD } from './worker/adaptive-decision.js';

// Utilities (v3 compat)
export { getTag, getImageURL, getLargeImageURL, isCardType } from './compat/utils.js';

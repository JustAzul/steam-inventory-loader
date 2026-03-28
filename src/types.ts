// ─── Fields Enum (FR46, FR49) ─────────────────────────────────────────────

/** Selectable fields for ItemDetails output. Use with `fields` config option. */
export enum Fields {
  ACTIONS = 'actions',
  AMOUNT = 'amount',
  APPID = 'appid',
  ASSETID = 'assetid',
  BACKGROUND_COLOR = 'background_color',
  CACHE_EXPIRATION = 'cache_expiration',
  CLASSID = 'classid',
  COMMODITY = 'commodity',
  CONTEXTID = 'contextid',
  CURRENCY = 'currency',
  DESCRIPTIONS = 'descriptions',
  FRAUDWARNINGS = 'fraudwarnings',
  ICON_URL = 'icon_url',
  ICON_URL_LARGE = 'icon_url_large',
  ID = 'id',
  INSTANCEID = 'instanceid',
  IS_CURRENCY = 'is_currency',
  ITEM_EXPIRATION = 'item_expiration',
  MARKET_FEE_APP = 'market_fee_app',
  MARKET_HASH_NAME = 'market_hash_name',
  MARKET_MARKETABLE_RESTRICTION = 'market_marketable_restriction',
  MARKET_NAME = 'market_name',
  MARKET_TRADABLE_RESTRICTION = 'market_tradable_restriction',
  MARKETABLE = 'marketable',
  NAME = 'name',
  OWNER = 'owner',
  OWNER_ACTIONS = 'owner_actions',
  OWNER_DESCRIPTIONS = 'owner_descriptions',
  SEALED = 'sealed',
  SEALED_TYPE = 'sealed_type',
  TAGS = 'tags',
  TRADABLE = 'tradable',
  TYPE = 'type',
}

// ─── Tag Types ────────────────────────────────────────────────────────────

/** Raw tag from Steam API (new format uses localized_* fields). */
export interface SteamTag {
  category: string;
  internal_name: string;
  localized_category_name?: string;
  localized_tag_name?: string;
  /** Legacy field — may not be present in new API format. */
  name?: string;
  /** Legacy field — may not be present in new API format. */
  category_name?: string;
  /** Legacy field — may not be present in new API format. */
  color?: string;
}

/** Normalized tag output (v3 compat names). */
export interface Tag {
  category: string;
  internal_name: string;
  name: string;
  category_name: string;
  color: string;
}

// ─── Inner Types ──────────────────────────────────────────────────────────

export interface InnerItemDescription {
  value: string;
  type?: string;
  color?: string;
  label?: string;
}

export interface ItemActions {
  link: string;
  name: string;
}

// ─── Steam API Response Types ─────────────────────────────────────────────

/** Single asset reference from Steam API `assets[]` array. */
export interface ItemAsset {
  appid: number;
  contextid: string;
  assetid: string;
  classid: string;
  instanceid: string;
  amount: string;
  /** Present on currency items. */
  currencyid?: string;
  is_currency?: boolean | number;
  currency?: number;
}

/** Single description from Steam API `descriptions[]` array. */
export interface ItemDescription {
  appid: number;
  classid: string;
  instanceid: string;
  currency?: number;
  background_color?: string;
  icon_url?: string;
  icon_url_large?: string;
  descriptions?: InnerItemDescription[];
  tradable?: number;
  actions?: ItemActions[];
  owner_actions?: ItemActions[];
  owner_descriptions?: InnerItemDescription[];
  name?: string;
  type?: string;
  market_name?: string;
  market_hash_name?: string;
  market_fee_app?: number;
  commodity?: number;
  market_tradable_restriction?: number | string;
  market_marketable_restriction?: number | string;
  marketable?: number;
  tags?: SteamTag[];
  fraudwarnings?: unknown[];
  item_expiration?: string;
  owner?: unknown;
  sealed?: number;
  sealed_type?: number;
  /** Present on currency items. */
  is_currency?: boolean | number;
  currencyid?: string;
}

/** Parsed inventory page (output of parser). */
export interface InventoryPage {
  success: boolean;
  assets: ItemAsset[];
  descriptions: ItemDescription[];
  moreItems: boolean;
  lastAssetId: string | null;
  totalInventoryCount: number;
  /** Error message from Steam API (lowercase `error` or uppercase `Error`). */
  error: string | null;
  /** eresult code extracted from error string. */
  eresult: number | null;
  /** Steam.Supply fake redirect flag. */
  fakeRedirect: boolean;
}

// ─── Output Types ─────────────────────────────────────────────────────────

/** Final item output (flat object, v3 parity + sealed fields). */
export interface ItemDetails {
  actions: ItemActions[];
  amount: number;
  appid: number;
  assetid: string;
  background_color: string;
  cache_expiration?: string;
  classid: string;
  commodity: boolean;
  contextid: string;
  currency: number | null;
  descriptions: InnerItemDescription[];
  fraudwarnings: unknown[];
  icon_url: string;
  icon_url_large: string;
  id: string;
  instanceid: string;
  is_currency: boolean;
  item_expiration?: string;
  market_fee_app?: number;
  market_hash_name: string;
  market_marketable_restriction: number;
  market_name: string;
  market_tradable_restriction: number;
  marketable: boolean;
  name: string;
  owner?: unknown;
  owner_actions?: ItemActions[];
  owner_descriptions?: InnerItemDescription[];
  sealed?: number;
  sealed_type?: number;
  tags?: Tag[];
  tradable: boolean;
  type: string;
}

// ─── Error Types (FR24) ──────────────────────────────────────────────────

export type SteamErrorType =
  | 'rate_limited'
  | 'private_profile'
  | 'auth_failed'
  | 'insufficient_balance'
  | 'invalid_response'
  | 'malformed_data'
  | 'network_error'
  | 'bad_status';

export interface SteamErrorInfo {
  type: SteamErrorType;
  message: string;
  eresult?: number;
}

// ─── Loader Response ──────────────────────────────────────────────────────

export interface LoaderResponse {
  success: boolean;
  count: number;
  inventory: ItemDetails[];
  error?: SteamErrorInfo;
}

// ─── HTTP Types ───────────────────────────────────────────────────────────

export interface HttpRequest {
  method: 'GET' | 'POST';
  url: string;
  headers?: Record<string, string>;
  params?: Record<string, string | number>;
  cookies?: string[];
  timeout?: number;
  proxy?: string;
}

export interface HttpResponse {
  status: number;
  data: unknown;
  headers: Record<string, string | string[] | undefined>;
}

// ─── Interfaces (Contracts) ──────────────────────────────────────────────

/** Raw HTTP transport abstraction. */
export interface IHttpClient {
  execute(request: HttpRequest): Promise<HttpResponse>;
  destroy(): void;
}

/** Page request parameters for providers. */
export interface PageRequest {
  steamId: string;
  appId: number;
  contextId: number;
  language: string;
  count: number;
  cursor: string | null;
}

/** Full loading strategy per API endpoint (FR65). */
export interface IInventoryProvider {
  /** Unique provider name (e.g., 'community', 'steamApis'). */
  readonly name: string;
  /** Cursor-compat group (e.g., 'steam-api', 'steam-supply'). */
  readonly method: string;
  /** Whether this provider has the required keys/config. */
  isAvailable(config: LoaderConfig): boolean;
  /** Build HTTP request for a single page. */
  buildRequest(params: PageRequest, config: LoaderConfig): HttpRequest;
  /** Parse raw HTTP response into InventoryPage. */
  parseResponse(raw: unknown): InventoryPage;
  /** Extract next cursor from parsed page, or null if done. */
  getNextCursor(page: InventoryPage): string | null;
  /** Classify HTTP error into typed SteamError. */
  classifyError(status: number, body: unknown): SteamErrorInfo;
  /** Whether this error type should trigger fallback to next provider. */
  shouldFallback(error: SteamErrorInfo): boolean;
}

/** Item accumulation abstraction with rolling description window (FR50). */
export interface IInventoryRepository {
  addPage(page: InventoryPage, config: ParseConfig): void;
  getItems(): ItemDetails[];
  getItemCount(): number;
  clear(): void;
}

/** App-specific post-processing strategy (FR21-FR23, FR68). */
export interface IStrategy {
  apply(item: ItemDetails): ItemDetails;
}

/** Generic cache abstraction (FR53-FR57). */
export interface ICacheStore<K, V> {
  get(key: K): V | undefined;
  set(key: K, value: V): void;
  has(key: K): boolean;
  delete(key: K): boolean;
}

/** Worker pool abstraction (FR58-FR61). */
export interface IWorkerPool {
  run<T>(task: string, data: unknown): Promise<T>;
  destroy(): Promise<void>;
}

// ─── Config Types ─────────────────────────────────────────────────────────

/** Parse configuration passed to repository/pipeline. */
export interface ParseConfig {
  tradableOnly: boolean;
  fields?: Fields[];
  strategy: IStrategy;
  contextId: number;
}

/** Normalized internal loader config. */
export interface LoaderConfig {
  steamId: string;
  appId: number;
  contextId: number;
  language: string;
  tradableOnly: boolean;
  itemsPerPage: number;
  maxRetries: number;
  requestDelay: number;
  cache: boolean;
  cacheTTL: number;
  cacheMaxEntries: number;
  cacheMaxSize: number;
  fields?: Fields[];
  endpointPriority: string[];
  steamApisKey?: string;
  steamSupplyKey?: string;
  customEndpoint?: string;
  proxy?: string;
  cookies?: string[];
  /** Max worker threads for adaptive worker pool (FR61). Default: cpus - 1, clamped to [1, 8]. */
  maxWorkers?: number;
}

/** User-facing optional config (v3 compat keys accepted via v3ConfigMapper). */
export interface OptionalConfig {
  language?: string;
  tradableOnly?: boolean;
  itemsPerPage?: number;
  maxRetries?: number;
  requestDelay?: number;
  cache?: boolean;
  cacheTTL?: number;
  cacheMaxEntries?: number;
  /** Max total cache size in bytes. Default: 512MB. Prevents heap blowup from large inventories. */
  cacheMaxSize?: number;
  fields?: Fields[];
  endpointPriority?: string[];
  steamApisKey?: string;
  steamSupplyKey?: string;
  customEndpoint?: string;
  proxy?: string;
  /** v3 compat: SteamCommunity cookie jar or wrapper. */
  SteamCommunity_Jar?: unknown;
  /** v3 compat: language (capitalized key). */
  Language?: string;
  /** Max worker threads for adaptive worker pool (FR61). */
  maxWorkers?: number;
}

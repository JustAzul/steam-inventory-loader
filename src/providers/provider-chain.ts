import type { IInventoryProvider, LoaderConfig } from '../types.js';
import { SteamCommunityProvider } from './steam-community.js';
import { SteamApisProvider } from './steam-apis.js';
import { SteamSupplyProvider } from './steam-supply.js';
import { CustomProvider } from './custom.js';

/** All built-in providers in default priority order. */
const BUILT_IN_PROVIDERS: Record<string, IInventoryProvider> = {
  community: new SteamCommunityProvider(),
  steamApis: new SteamApisProvider(),
  steamSupply: new SteamSupplyProvider(),
  custom: new CustomProvider(),
};

/** Custom providers registered via Loader.registerProvider(). */
const customProviders = new Map<string, IInventoryProvider>();

/**
 * Register a custom provider (FR67).
 */
export function registerProvider(name: string, provider: IInventoryProvider): void {
  customProviders.set(name, provider);
}

/**
 * Resolve the ordered provider chain based on config (FR66).
 * Returns providers in priority order, filtered to only available ones.
 */
export function resolveProviderChain(config: LoaderConfig): IInventoryProvider[] {
  const allProviders: Record<string, IInventoryProvider> = {
    ...BUILT_IN_PROVIDERS,
    ...Object.fromEntries(customProviders),
  };

  const priority = config.endpointPriority.length > 0
    ? config.endpointPriority
    : ['community']; // Default to Steam Community

  const chain: IInventoryProvider[] = [];

  for (const name of priority) {
    const provider = allProviders[name];
    if (provider && provider.isAvailable(config)) {
      chain.push(provider);
    }
  }

  // If priority list yielded nothing, fall back to community
  if (chain.length === 0) {
    const community = allProviders['community'];
    if (community && community.isAvailable(config)) {
      chain.push(community);
    }
  }

  return chain;
}

/**
 * Check if two providers share the same method (cursor-compatible).
 * Same method → cursor carries over on fallback.
 * Different method → restart from page 1, clear repository.
 */
export function isCursorCompatible(a: IInventoryProvider, b: IInventoryProvider): boolean {
  return a.method === b.method;
}

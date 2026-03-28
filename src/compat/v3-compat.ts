import type { OptionalConfig } from '../types.js';

const STEAM_COMMUNITY_URL = 'https://steamcommunity.com';

interface SteamIDLike {
  getSteamID64(): string;
}

interface CookieJarLike {
  getCookieStringSync(url: string): string;
}

/**
 * Coerce steamID input to string (FR40).
 * Accepts: string, number, or SteamID object with getSteamID64().
 */
export function coerceSteamId(input: unknown): string {
  if (typeof input === 'string') return input;
  if (typeof input === 'number') return String(input);
  if (input && typeof (input as SteamIDLike).getSteamID64 === 'function') {
    return (input as SteamIDLike).getSteamID64();
  }
  return String(input);
}

/**
 * Coerce appID/contextID to number (FR41).
 */
export function coerceNumber(input: string | number): number {
  return typeof input === 'string' ? parseInt(input, 10) : input;
}

/**
 * Map v3 config keys to v4 format (FR34).
 * Handles: Language→language, SteamCommunity_Jar→cookies.
 */
export function mapV3Config(config: OptionalConfig): OptionalConfig & { cookies?: string[] } {
  const result: OptionalConfig & { cookies?: string[] } = { ...config };

  // Language key mapping
  if (config.Language && !config.language) {
    result.language = config.Language;
  }

  // CookieJar parsing (FR34)
  if (config.SteamCommunity_Jar) {
    const jar = extractJar(config.SteamCommunity_Jar);
    if (jar) {
      try {
        const cookieString = jar.getCookieStringSync(STEAM_COMMUNITY_URL);
        if (cookieString) {
          result.cookies = [cookieString];
        }
      } catch {
        // Jar extraction failed — proceed without cookies
      }
    }
  }

  // Clean up v3-specific keys
  delete result.Language;
  delete result.SteamCommunity_Jar;

  return result;
}

/**
 * Extract CookieJar from direct or wrapped format.
 * Supports: jar directly, or { _jar: jar } wrapper (FR34).
 */
function extractJar(input: unknown): CookieJarLike | null {
  if (!input || typeof input !== 'object') return null;

  // Direct jar with getCookieStringSync
  if (typeof (input as CookieJarLike).getCookieStringSync === 'function') {
    return input as CookieJarLike;
  }

  // Wrapped: { _jar: actualJar }
  const wrapped = input as { _jar?: unknown };
  if (wrapped._jar && typeof (wrapped._jar as CookieJarLike).getCookieStringSync === 'function') {
    return wrapped._jar as CookieJarLike;
  }

  return null;
}

import { injectable } from 'tsyringe';
import { CookieJar } from 'tough-cookie';
import { Cookie } from '../types/cookie.type';

@injectable()
export default class CookieParserService {
  /**
   * Parses cookies from a CookieJar for steamcommunity.com domain
   * @param jar - The CookieJar instance containing cookies
   * @returns Array of formatted cookie strings
   */
  public parseCookies(jar?: CookieJar): string[] {
    if (!jar) return [];
    
    // Handle nested jar structure (some CookieJar implementations wrap the actual jar)
    if ('_jar' in jar) {
      return this.parseCookies((jar as any)._jar);
    }
    
    const result = (jar.serializeSync().cookies as Cookie[])
      .filter(({ domain }) => domain === 'steamcommunity.com')
      .map(({ key, value }) => `${key}=${value}`);
    
    return result;
  }
  
  /**
   * Builds the complete cookie string for HTTP requests
   * @param jar - The CookieJar instance
   * @param appID - Steam application ID
   * @param contextID - Steam context ID
   * @returns Complete cookie string for HTTP headers
   */
  public buildCookieString(jar?: CookieJar, appID?: string, contextID?: string): string {
    const cookies: string[] = [];
    
    // Add inventory context cookie if provided
    if (appID && contextID) {
      cookies.push(`strInventoryLastContext=${appID}_${contextID}`);
    }
    
    // Add Steam community cookies
    if (jar) {
      cookies.push(...this.parseCookies(jar));
    }
    
    return cookies.join('; ');
  }
} 
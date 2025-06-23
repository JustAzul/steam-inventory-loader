export interface IHttpClient {
  setDefaultCookies(cookies: string): void;
  setDefaultHeaders(headers: Record<string, string>): void;
} 
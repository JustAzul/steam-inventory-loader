import { HttpClientGetProps } from '../../domain/types/http-response.type';
import { InventoryPageResult } from '../../domain/types/inventory-page-result.type';

export interface IHttpClient {
  destroy(): void;
  execute(props: HttpClientGetProps): Promise<InventoryPageResult | undefined>;
  setDefaultCookies(cookies: string): void;
  setDefaultHeaders(headers: Record<string, string>): void;
}

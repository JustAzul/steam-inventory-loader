import { HttpClientGetProps } from '@domain/types/http-response.type';
import { InventoryPageResult } from '@domain/types/inventory-page-result.type';

export interface IFetcher {
  execute(
    httpClientGetProps: Readonly<HttpClientGetProps>,
  ): Promise<InventoryPageResult | undefined>;
}

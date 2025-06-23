import { injectable, inject } from 'tsyringe';

import { InventoryPageResult } from '@application/types/inventory-page-result.type';

import { IFetcher } from '../ports/fetcher.port';
import { HttpClientResponse } from '../types/http-response.type';

@injectable()
export default class GetInventoryPageResultUseCase {
  constructor(
    @inject('IFetcher')
    private readonly fetcher: IFetcher,
  ) {}
  public execute(
    url: string,
  ): Promise<HttpClientResponse<InventoryPageResult>> {
    return this.fetcher.execute<InventoryPageResult>({ url });
  }
}

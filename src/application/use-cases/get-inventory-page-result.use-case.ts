import { injectable, inject } from 'tsyringe';

import { InventoryPageResult } from '@application/types/inventory-page-result.type';
import { ErrorPayload } from '@shared/errors';
import { DataOrError } from '@shared/utils';

import { IFetcher } from '../ports/fetcher.port';
import {
  HttpClientErrorCodes,
  HttpClientResponse,
} from '../types/http-response.type';

@injectable()
export default class GetInventoryPageResultUseCase {
  constructor(
    @inject('IFetcher')
    private readonly fetcher: IFetcher,
  ) {}
  public execute(
    url: string,
  ): Promise<
    DataOrError<
      ErrorPayload<HttpClientErrorCodes>,
      HttpClientResponse<InventoryPageResult>
    >
  > {
    return this.fetcher.execute<InventoryPageResult>({ url });
  }
}

import {
  DEFAULT_REQUEST_ITEM_COUNT,
  DEFAULT_REQUEST_LANGUAGE,
} from '../../shared/constants';
import {
  HttpClientGetProps,
  HttpClientResponse,
} from '../types/http-response.type';
import { InventoryPageResult } from '../types/inventory-page-result.type';
import { injectable, inject } from 'tsyringe';

import GetHttpResponseWithExceptionUseCase from './get-http-response-with-exception.use-case';
import GetPageUrlUseCase from './get-page-url.use-case';

export type GetInventoryPageResultProps = {
  appID: string;
  contextID: string;
  count: number;
  language: string;
  steamID64: string;
  lastAssetID?: string;
};

@injectable()
export default class GetInventoryPageResultUseCase {
  public constructor(
    private readonly getHttpResponseUseCase: GetHttpResponseWithExceptionUseCase,
    private readonly getPageUrlUseCase: GetPageUrlUseCase,
  ) {}

  public async execute(
    props: GetInventoryPageResultProps,
  ): Promise<InventoryPageResult> {
    const { url, params } = this.getPageUrlUseCase.execute(props);

    const httpClientProps: HttpClientGetProps = {
      url,
      params,
    };

    const { data }: HttpClientResponse<InventoryPageResult> =
      await this.getHttpResponseUseCase.execute(httpClientProps);

    return data as InventoryPageResult;
  }
}

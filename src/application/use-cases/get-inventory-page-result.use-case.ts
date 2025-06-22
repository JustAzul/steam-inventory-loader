import {
  DEFAULT_REQUEST_ITEM_COUNT,
  DEFAULT_REQUEST_LANGUAGE,
} from '../../shared/constants';
import {
  HttpClientGetProps,
  HttpClientResponse,
} from '../types/http-response.type';
import { InventoryPageResult } from '../types/inventory-page-result.type';

import GetHttpResponseWithExceptionUseCase from './get-http-response-with-exception.use-case';
import GetPageUrlUseCase from './get-page-url.use-case';

export type GetInventoryPageResultProps = {
  appID: string;
  contextID: string;
  count: number;
  language: string;
  steamID64: string;
};

export type GetInventoryPageResultConstructor = {
  props: GetInventoryPageResultProps;
  getHttpResponseUseCase: GetHttpResponseWithExceptionUseCase;
  getPageUrlUseCase: GetPageUrlUseCase;
};

export default class GetInventoryPageResultUseCase {
  public readonly props: GetInventoryPageResultProps;
  private readonly getHttpResponseUseCase: GetHttpResponseWithExceptionUseCase;
  private readonly getPageUrlUseCase: GetPageUrlUseCase;

  public constructor({
    props,
    getHttpResponseUseCase,
    getPageUrlUseCase,
  }: Readonly<GetInventoryPageResultConstructor>) {
    this.props = props;
    this.getHttpResponseUseCase = getHttpResponseUseCase;
    this.getPageUrlUseCase = getPageUrlUseCase;
  }

  public async execute(
    lastAssetID?: string,
  ): Promise<InventoryPageResult> {
    const { url, params } = this.getPageUrlUseCase.execute({
      ...this.props,
      lastAssetID,
    });

    const httpClientProps: HttpClientGetProps = {
      url,
      params,
    };

    const { data }: HttpClientResponse<InventoryPageResult> =
      await this.getHttpResponseUseCase.execute(httpClientProps);

    return data as InventoryPageResult;
  }
}

import {
  DEFAULT_REQUEST_ITEM_COUNT,
  DEFAULT_REQUEST_LANGUAGE,
} from '../../shared/constants';
import GetHttpResponseWithExceptionUseCase, {
  GetHttpResponseWithExceptionProps,
} from './get-http-response-with-exception.use-case';
import GetPageUrlUseCase, { GetPageUrlProps } from './get-page-url.use-case';
import {
  HttpClientGetProps,
  HttpClientResponse,
} from '../ports/http-client.interface';

import FetchUrlUseCase from './fetch-url.use-case';
import FetchWithDelayUseCase from './fetch-with-delay.use-case';
import { InventoryPageResult } from '../types/inventory-page-result.type';

export type GetInventoryPageResultInterfaces = {
  fetchUrlUseCase: FetchUrlUseCase | FetchWithDelayUseCase;
};

export type GetInventoryPageResultProps = {
  appID: string;
  contextID: string;
  count: number;
  language: string;
  lastAssetID?: string;
  steamID64: string;
};

export type GetInventoryPageResultConstructor = {
  interfaces: GetInventoryPageResultInterfaces;
  props: GetInventoryPageResultProps;
};

export default class GetInventoryPageResultUseCase {
  public readonly interfaces: GetInventoryPageResultInterfaces;

  public readonly props: GetInventoryPageResultProps;

  public constructor({ props, interfaces }: GetInventoryPageResultConstructor) {
    this.interfaces = interfaces;
    this.props = props;
  }

  public async execute(): Promise<InventoryPageResult> {
    const count = this.props?.count || DEFAULT_REQUEST_ITEM_COUNT;
    const language = this.props?.language || DEFAULT_REQUEST_LANGUAGE;

    const getPageUrlProps: GetPageUrlProps = {
      appID: this.props.appID,
      contextID: this.props.contextID,
      count,
      language,
      steamID64: this.props.steamID64,
    };

    const hasLastAssetID = Boolean(this.props.lastAssetID);

    if (hasLastAssetID) {
      getPageUrlProps.lastAssetID = this.props.lastAssetID;
    }

    const getHttpResponseProps: GetHttpResponseWithExceptionProps = {};

    const getHttpResponseUseCase = new GetHttpResponseWithExceptionUseCase({
      interfaces: this.interfaces,
      props: getHttpResponseProps,
    });

    const httpClientProps: HttpClientGetProps = {
      url: GetPageUrlUseCase.execute(getPageUrlProps),
    };

    const { data }: HttpClientResponse<InventoryPageResult> =
      await getHttpResponseUseCase.execute(httpClientProps);

    return data as InventoryPageResult;
  }
}

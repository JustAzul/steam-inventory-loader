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
  IHttpClient,
} from '../ports/http-client.interface';

import { IQueueWithDelay } from '../ports/queue-with-delay.interface';
import { InventoryPageResult } from '../types/inventory-page-result.type';

export type GetInventoryPageResultInterfaces = {
  queue: IQueueWithDelay<
    HttpClientGetProps,
    HttpClientResponse<InventoryPageResult>
  >;
  httpClient: IHttpClient;
};

export type GetInventoryPageResultProps = {
  appID: string;
  contextID: string;
  count: number;
  delayBetweenRequests?: number;
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

    const hasDelay = Boolean(this.props.delayBetweenRequests);
    const getHttpResponseProps: GetHttpResponseWithExceptionProps = {};

    if (hasDelay) {
      getHttpResponseProps.delayBetweenRequestsInMilliseconds =
        this.props.delayBetweenRequests;
    }

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

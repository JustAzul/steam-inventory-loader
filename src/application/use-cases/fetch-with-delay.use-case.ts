import {
  HttpClientGetProps,
  HttpClientResponse,
  IHttpClient,
} from '../ports/http-client.interface';

import { IQueueWithDelay } from '../ports/queue-with-delay.interface';
import { InventoryPageResult } from '../types/inventory-page-result.type';
import UseCaseException from '../exceptions/use-case.exception';

export type FetchWithDelayUseCaseProps = {
  delayInMilliseconds: number;
};

export type FetchWithDelayUseCaseInterfaces = {
  httpClient: IHttpClient;
  queue: IQueueWithDelay<
    HttpClientGetProps,
    HttpClientResponse<InventoryPageResult>
  >;
};

export type FetchWithDelayUseCaseConstructor = {
  interfaces: FetchWithDelayUseCaseInterfaces;
  props: FetchWithDelayUseCaseProps;
};

export default class FetchWithDelayUseCase {
  private readonly interfaces: FetchWithDelayUseCaseInterfaces;

  private readonly props: FetchWithDelayUseCaseProps;

  public constructor({ interfaces, props }: FetchWithDelayUseCaseConstructor) {
    this.interfaces = interfaces;
    this.props = props;

    if (this.props.delayInMilliseconds <= 0) {
      throw new UseCaseException(
        FetchWithDelayUseCase.name,
        'delayInMilliseconds must be a positive number',
      );
    }

    this.queue.setDelayInMilliseconds(this.props.delayInMilliseconds);
  }

  public async execute(
    httpClientGetProps: HttpClientGetProps,
  ): Promise<HttpClientResponse<InventoryPageResult>> {
    return this.queue.insertAndProcess(httpClientGetProps);
  }

  private get queue(): IQueueWithDelay<
    HttpClientGetProps,
    HttpClientResponse<InventoryPageResult>
  > {
    return this.interfaces.queue;
  }
}

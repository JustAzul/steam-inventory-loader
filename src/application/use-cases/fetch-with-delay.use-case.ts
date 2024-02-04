import AsyncQueueWithDelay from '../../domain/entities/async-queue-with-delay.entity';
import UseCaseException from '../exceptions/use-case.exception';
import {
  HttpClientGetProps,
  HttpClientResponse,
  IHttpClient,
} from '../ports/http-client.interface';

import FetchUrlUseCase from './fetch-url.use-case';

export type FetchWithDelayUseCaseProps = {
  delayInMilliseconds: number;
};

export type FetchWithDelayUseCaseInterfaces = {
  httpClient: IHttpClient;
};

export type FetchWithDelayUseCaseConstructor = {
  interfaces: FetchWithDelayUseCaseInterfaces;
  props: FetchWithDelayUseCaseProps;
};

export default class FetchWithDelayUseCase {
  private readonly asyncQueueWithDelay: AsyncQueueWithDelay;

  private readonly fetchUrlUseCase: FetchUrlUseCase;

  private readonly interfaces: FetchWithDelayUseCaseInterfaces;

  private readonly props: FetchWithDelayUseCaseProps;

  public constructor({
    interfaces,
    props,
  }: Readonly<FetchWithDelayUseCaseConstructor>) {
    this.props = props;
    this.interfaces = interfaces;

    if (this.props.delayInMilliseconds < 0) {
      throw new UseCaseException(
        FetchWithDelayUseCase.name,
        'delay must be greater than or equal to 0',
      );
    }

    this.fetchUrlUseCase = new FetchUrlUseCase(this.interfaces.httpClient);

    this.asyncQueueWithDelay = new AsyncQueueWithDelay({
      delayInMilliseconds: this.props.delayInMilliseconds,
      processItem: (itemProps: HttpClientGetProps) =>
        this.fetchUrlUseCase.execute(itemProps),
    });
  }

  public execute<FetchUrlResult>(
    httpClientGetProps: Readonly<HttpClientGetProps>,
  ): Promise<HttpClientResponse<FetchUrlResult>> {
    return this.asyncQueueWithDelay.insertAndProcess(httpClientGetProps);
  }
}

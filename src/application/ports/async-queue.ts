import { ErrorPayload } from '@shared/errors';
import { DataOrError } from '@shared/utils';

type AsyncQueueErrorCodes = 'ASYNC_QUEUE_UNKNOW_ERROR';

export interface AsyncQueueParams<T> {
  job: () => Promise<T>;
}

export abstract class IAsyncQueue {
  abstract enqueueAndProcess<T>(
    params: AsyncQueueParams<T>,
  ): Promise<DataOrError<ErrorPayload<AsyncQueueErrorCodes>, T>>;
}

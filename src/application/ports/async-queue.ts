export interface AsyncQueueParams<T> {
  job: () => Promise<T>;
}

export abstract class IAsyncQueue {
  abstract enqueueAndProcess<T>(params: AsyncQueueParams<T>): Promise<T>;
}

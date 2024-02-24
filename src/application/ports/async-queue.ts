export interface AsyncQueueParams<T> {
  job: () => Promise<T>;
}

export abstract class IAsyncQueue {
  abstract insertAndProcess<T>(params: AsyncQueueParams<T>): Promise<T>;
}

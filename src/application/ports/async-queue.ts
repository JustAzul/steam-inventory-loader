export interface AsyncQueueParams<T> {
  job: () => Promise<T>;
}

export interface IAsyncQueue {
  enqueueAndProcess<T>(params: AsyncQueueParams<T>): Promise<T>;
}

export interface AsyncQueueParams<R, T> {
  item?: T;
  processItem: (item?: T) => Promise<R>;
}

export abstract class IAsyncQueue {
  abstract insertAndProcess<R, T>(params: AsyncQueueParams<R, T>): Promise<R>;
}

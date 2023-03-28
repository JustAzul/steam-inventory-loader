export interface IQueueWithDelay<QueueItemType, QueueResponseType> {
  insertAndProcess(item: QueueItemType): Promise<QueueResponseType>;

  // insertItem(item: QueueItemType): number;
  // isQueueWithItems(): boolean;
  // processQueue(): void;
  // removeItem(index: number): QueueItemType | undefined;
  setDelayInMilliseconds(delayInMilliseconds: number): void;
  // waitForItemToBeProcessed(index: number): Promise<QueueResponseType>;
}

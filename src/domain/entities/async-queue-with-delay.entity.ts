import DomainException from '../exceptions/domain.exception';
import EventEmitter from 'events';
import { EventEmitterResponse } from '../types/event-emitter-response.type';
import { QueueItem } from '../types/queue-item.type';

export type AsyncQueueWithDelayProps = {
  delayInMilliseconds: number;
  processItem: (item: any) => Promise<any>;
};

export default class AsyncQueueWithDelayEntity {
  private indexCounter: number;

  private isQueueBeingProcessed: boolean;

  private readonly eventEmitter: EventEmitter;

  private readonly items: QueueItem<unknown>[];

  private readonly props: Required<AsyncQueueWithDelayProps>;

  public constructor(props: AsyncQueueWithDelayProps) {
    this.props = props;

    if (this.props.delayInMilliseconds < 0) {
      throw new DomainException(
        AsyncQueueWithDelayEntity.name,
        'delay in milliseconds must be greater than or equal to zero',
      );
    }

    this.eventEmitter = new EventEmitter();
    this.indexCounter = 0;
    this.isQueueBeingProcessed = false;
    this.items = [];

    if (this.isQueueWithItems()) {
      this.processQueue().finally(() => null);
    }
  }

  private insertItem<ItemType>(item: ItemType): QueueItem<ItemType> {
    const itemUID = this.indexCounter;
    this.indexCounter += 1;

    const queueItem: QueueItem<ItemType> = {
      item,
      eventID: AsyncQueueWithDelayEntity.FindEventUID(itemUID),
    };

    this.items.push(queueItem);
    return queueItem;
  }

  public insertAndProcess<ResponseType, ItemType>(
    item: ItemType,
  ): Promise<ResponseType> {
    const { eventID } = this.insertItem<ItemType>(item);

    return new Promise((resolve, reject) => {
      this.eventEmitter.once(
        eventID,
        ({ error, result }: EventEmitterResponse<ResponseType>) => {
          const hasError = Boolean(error);

          if (hasError) reject(error);
          else resolve(result as ResponseType);
        },
      );

      this.processQueue<ResponseType, ItemType>().finally(() => null);
    });
  }

  private async processQueue<
    ResponseType,
    ItemType = unknown,
  >(): Promise<void> {
    if (this.isQueueBeingProcessed) {
      return;
    }

    this.isQueueBeingProcessed = true;

    while (this.isQueueWithItems()) {
      const queueItem = this.items.shift() as QueueItem<ItemType>;

      try {
        // eslint-disable-next-line no-await-in-loop
        const result = (await this.processItem(queueItem?.item)) as ItemType;

        this.eventEmitter.emit(queueItem?.eventID, {
          error: null,
          result,
        } as EventEmitterResponse<ResponseType>);
      } catch (error) {
        this.eventEmitter.emit(queueItem?.eventID, {
          error,
          result: null,
        } as EventEmitterResponse<ResponseType>);
      }

      // eslint-disable-next-line no-await-in-loop
      await AsyncQueueWithDelayEntity.Wait(this.props.delayInMilliseconds);
    }

    this.isQueueBeingProcessed = false;
    if (this.isQueueWithItems()) await this.processQueue();
  }

  private get processItem() {
    return this.props.processItem;
  }

  private isQueueWithItems(): boolean {
    return this.items.length > 0;
  }

  private static Wait(timeToWait: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(), timeToWait);
    });
  }

  private static FindEventUID(uID: number): symbol {
    return Symbol(uID);
  }
}
import EventEmitter from 'events';

import sleep from '../../shared/helpers/sleep.helper';
import DomainException from '../exceptions/domain.exception';
import { EventEmitterResponse } from '../types/event-emitter-response.type';
import { QueueItem } from '../types/queue-item.type';

export type AsyncQueueWithDelayProps = {
  delayInMilliseconds: number;
  processItem: (item: any) => Promise<any>;
};

export default class AsyncQueueWithDelay {
  private indexCounter: number;

  private isQueueBeingProcessed: boolean;

  private readonly eventEmitter: EventEmitter;

  private readonly items: QueueItem<unknown>[];

  private readonly props: Required<AsyncQueueWithDelayProps>;

  public constructor(props: AsyncQueueWithDelayProps) {
    this.props = props;

    if (this.props.delayInMilliseconds < 0) {
      throw new DomainException(
        AsyncQueueWithDelay.name,
        'delay in milliseconds must be greater than or equal to zero',
      );
    }

    this.eventEmitter = new EventEmitter();
    this.indexCounter = 0;
    this.isQueueBeingProcessed = false;
    this.items = [];

    // eslint-disable-next-line no-underscore-dangle
    this._initProcessing();
  }

  // eslint-disable-next-line no-underscore-dangle
  private _initProcessing(): void {
    if (this.isQueueWithItems()) {
      this.processQueue().catch((error) => {
        console.error('Error while processing the queue:', error);
      });
    }
  }

  private insertItem<ItemType>(item: ItemType): QueueItem<ItemType> {
    const itemUID = this.indexCounter;
    this.indexCounter += 1;

    const queueItem: QueueItem<ItemType> = {
      eventID: AsyncQueueWithDelay.FindEventUID(itemUID),
      item,
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
      await sleep(this.props.delayInMilliseconds);
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

  private static FindEventUID(uID: number): symbol {
    return Symbol(uID);
  }
}

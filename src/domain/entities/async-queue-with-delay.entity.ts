import { UUID, randomUUID } from 'crypto';
import EventEmitter from 'events';

export type AsyncQueueWithDelayProps<ProcessItemParams, ProcessItemResult> = {
  delayInMilliseconds: number;
  processItem: (props: ProcessItemParams) => Promise<ProcessItemResult>;
};

export default class AsyncQueueWithDelay<
  ProcessItemParams = unknown,
  ProcessItemResult = unknown,
> {
  private isProcessing = false;
  private lastTaskTime = 0;
  private readonly queue = new Map<
    UUID,
    {
      props: ProcessItemParams;
      resolve: (result: ProcessItemResult) => void;
    }
  >();
  private readonly events = new EventEmitter();
  private readonly props: AsyncQueueWithDelayProps<
    ProcessItemParams,
    ProcessItemResult
  >;

  constructor(
    props: AsyncQueueWithDelayProps<ProcessItemParams, ProcessItemResult>,
  ) {
    this.props = props;
    this.events.on('item-processed', (id, result) => {
      const item = this.queue.get(id);
      if (item) {
        item.resolve(result);
        this.queue.delete(id);
      }
      this.lastTaskTime = Date.now();
      this.processNext();
    });
  }

  public insertAndProcess(
    props: ProcessItemParams,
  ): Promise<ProcessItemResult> {
    const id = randomUUID();
    return new Promise((resolve) => {
      this.queue.set(id, { props, resolve });
      if (!this.isProcessing) {
        this.processNext();
      }
    });
  }

  private processNext(): void {
    const nextItem = this.queue.entries().next();
    if (nextItem.done) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const [id, { props }] = nextItem.value;

    const delay = this.getDelay();
    setTimeout(async () => {
      const result = await this.props.processItem(props);
      this.events.emit('item-processed', id, result);
    }, delay);
  }

  private getDelay(): number {
    const { delayInMilliseconds } = this.props;
    if (!this.lastTaskTime) {
      return delayInMilliseconds;
    }
    const timeSinceLastTask = Date.now() - this.lastTaskTime;
    return Math.max(0, delayInMilliseconds - timeSinceLastTask);
  }
} 
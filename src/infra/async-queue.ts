import { UUID, randomUUID } from 'crypto';
import EventEmitter from 'events';

import { AsyncQueueParams, IAsyncQueue } from '@application/ports/async-queue';
import { IRepository } from '@application/ports/repository.interface';
import { RepositoryException } from '@infra/exceptions';

export interface AsyncQueueProps {
  eventHandler?: EventEmitter;
  repository: IRepository<
    [ReturnType<AsyncQueue['createTaskId']>, AsyncQueueParams<unknown>]
  >;
  taskDelay?: number;
  delayFn?: (fn: () => void, ms: number) => void;
  testMode?: boolean;
}

export class AsyncQueue implements IAsyncQueue {
  private lastTaskTime?: number;
  private queueStatus: 'IDLE' | 'PROCESSING';

  private readonly events: EventEmitter;
  private readonly delayFn: (fn: () => void, ms: number) => void;

  constructor(private readonly props: AsyncQueueProps) {
    this.queueStatus = 'IDLE';

    this.events = props.eventHandler ?? new EventEmitter();
    this.delayFn =
      props.delayFn ??
      ((fn: () => void, ms: number): void => {
        setTimeout(fn, ms);
      });

    if (props.taskDelay !== undefined && props.taskDelay !== null) {
      if (props.taskDelay < 0) {
        throw new Error('Task delay must be a positive number');
      }

      this.lastTaskTime = 0;
    }
  }

  async enqueueAndProcess<T>(task: AsyncQueueParams<T>): Promise<T> {
    const taskId = this.createTaskId();
    // No need for a top-level try-catch here, let the consumer handle it.
    const taskResult: T = await new Promise((resolve, reject) => {
      this.waitForTaskCompletion<T>(taskId).then(resolve).catch(reject);
      this.addTaskToQueue<T>(task, taskId).catch(reject);
      if (this.props.testMode !== true) {
        this.processTaskQueue();
      }
    });
    return taskResult;
  }

  private waitForTaskCompletion<T>(
    taskId: ReturnType<AsyncQueue['createTaskId']>,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.events.once(taskId, (error: unknown, result: T) => {
        if (
          this.props.taskDelay !== undefined &&
          this.props.taskDelay !== null
        ) {
          this.lastTaskTime = Date.now();
        }

        if (error !== null && error !== undefined) reject(error);
        else resolve(result);
      });
    });
  }

  private processTaskQueue(): void {
    if (this.queueStatus === 'PROCESSING') return;
    this.queueStatus = 'PROCESSING';
    this.startTaskProcessing();
  }

  private startTaskProcessing(): void {
    const delay = this.calculateDelayBeforeNextTask();

    if (delay !== null && delay !== undefined && delay > 0) {
      this.delayFn((): void => {
        this.executeNextTask().catch((error) => {
          // eslint-disable-next-line no-console
          console.error('Failed to execute next task:', error);
        });
      }, delay);
    } else {
      this.executeNextTask().catch((error) => {
        // eslint-disable-next-line no-console
        console.error('Failed to execute next task:', error);
      });
    }
  }

  private calculateDelayBeforeNextTask(): number {
    if (
      this.props.taskDelay === undefined ||
      this.props.taskDelay === null ||
      this.lastTaskTime === undefined ||
      this.lastTaskTime === null
    ) {
      return 0;
    }

    const elapsed = Date.now() - this.lastTaskTime;
    const shouldDelay = elapsed < this.props.taskDelay;

    if (!shouldDelay) return 0;
    return Math.max(0, this.props.taskDelay - elapsed);
  }

  private async executeNextTask(): Promise<void> {
    try {
      const nextTask = await this.props.repository.findAny();
      const [taskId, { job }] = nextTask;

      try {
        const result = await job();
        this.events.emit(taskId, null, result);
      } catch (error) {
        this.events.emit(taskId, error);
      }

      await this.deleteItem(taskId);

      this.delayFn(() => {
        this.executeNextTask().catch((err) => {
          // eslint-disable-next-line no-console
          console.error('Error in fire-and-forget executeNextTask:', err);
        });
      }, this.calculateDelayBeforeNextTask());
    } catch (error) {
      if (error instanceof RepositoryException) {
        // Assuming findAny throws RepositoryException when empty.
        // A better approach would be a specific "QueueEmptyException"
        this.queueStatus = 'IDLE';
        return;
      }
      // Re-throw unexpected errors
      throw error;
    }
  }

  private async deleteItem(
    taskId: ReturnType<AsyncQueue['createTaskId']>,
  ): Promise<void> {
    try {
      await this.props.repository.delete(taskId);
    } catch (error) {
      // Decide how to handle a failed delete. For now, we'll log and ignore.
      // A real implementation might need a retry mechanism or dead-letter queue.
      // eslint-disable-next-line no-console
      console.error(`Failed to delete task ${taskId} from repository.`, error);
    }
  }

  private createTaskId(): UUID {
    return randomUUID();
  }

  private async addTaskToQueue<T>(
    task: AsyncQueueParams<T>,
    taskId: ReturnType<AsyncQueue['createTaskId']>,
  ): Promise<void> {
    await this.props.repository.insert([taskId, task]);
  }

  /**
   * Test-only: Synchronously process all tasks in the queue until empty.
   * Emits events as normal. Bypasses timers and recursion.
   */
  public async drainQueueForTest(): Promise<void> {
    while (true) {
      try {
        const nextTask = await this.props.repository.findAny();
        const [taskId, { job }] = nextTask;
        try {
          const result = await job();
          this.events.emit(taskId, null, result);
          await Promise.resolve(); // Yield to event loop
        } catch (error) {
          this.events.emit(taskId, error);
          await Promise.resolve(); // Yield to event loop
        }
        await this.deleteItem(taskId);
      } catch (error) {
        if (error instanceof RepositoryException) {
          this.queueStatus = 'IDLE';
          break;
        }
        throw error;
      }
    }
  }
}

import { UUID, randomUUID } from 'crypto';
import EventEmitter from 'events';

import { AsyncQueueParams, IAsyncQueue } from '@application/ports/async-queue';
import { IRepository } from '@application/ports/repository.interface';
import { RepositoryException } from '@domain/exceptions/repository.exception';

export interface AsyncQueueProps {
  eventHandler?: EventEmitter;
  repository: IRepository<
    [ReturnType<AsyncQueue['createTaskId']>, AsyncQueueParams<unknown>]
  >;
  taskDelay?: number;
}

export class AsyncQueue implements IAsyncQueue {
  private lastTaskTime?: number;
  private queueStatus: 'IDLE' | 'PROCESSING';

  private readonly events: EventEmitter;

  constructor(private readonly props: AsyncQueueProps) {
    this.queueStatus = 'IDLE';

    this.events = props.eventHandler || new EventEmitter();

    if (props.taskDelay) {
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
      this.addTaskToQueue<T>(task, taskId);
      this.processTaskQueue();
    });
    return taskResult;
  }

  private waitForTaskCompletion<T>(
    taskId: ReturnType<AsyncQueue['createTaskId']>,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.events.once(taskId, (error: unknown, result: T) => {
        if (this.props.taskDelay) {
          this.lastTaskTime = Date.now();
        }

        if (error) reject(error);
        else resolve(result);
      });
    });
  }

  private processTaskQueue() {
    if (this.queueStatus === 'PROCESSING') return;
    this.queueStatus = 'PROCESSING';
    this.startTaskProcessing();
  }

  private startTaskProcessing() {
    const delay = this.calculateDelayBeforeNextTask();

    if (delay) setTimeout(() => this.executeNextTask(), delay);
    else this.executeNextTask();
  }

  private calculateDelayBeforeNextTask() {
    if (!this.props.taskDelay || !this.lastTaskTime) return 0;

    const elapsed = Date.now() - this.lastTaskTime;
    const shouldDelay = elapsed < this.props.taskDelay;

    if (!shouldDelay) return 0;
    return Math.max(0, this.props.taskDelay - elapsed);
  }

  private async executeNextTask() {
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

      setTimeout(
        () => this.executeNextTask(),
        this.calculateDelayBeforeNextTask(),
      );
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

  private async deleteItem(taskId: ReturnType<AsyncQueue['createTaskId']>) {
    try {
      await this.props.repository.delete(taskId);
    } catch (error) {
      // Decide how to handle a failed delete. For now, we'll log and ignore.
      // A real implementation might need a retry mechanism or dead-letter queue.
      console.error(`Failed to delete task ${taskId} from repository.`, error);
    }
  }

  private createTaskId(): UUID {
    return randomUUID();
  }

  private async addTaskToQueue<T>(
    task: AsyncQueueParams<T>,
    taskId: ReturnType<AsyncQueue['createTaskId']>,
  ) {
    await this.props.repository.insert([taskId, task]);
  }
}

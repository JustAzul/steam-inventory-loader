import { UUID, randomUUID } from 'crypto';
import EventEmitter from 'events';

import { AsyncQueueParams, IAsyncQueue } from '@application/ports/async-queue';
import { IRepository } from '@application/ports/repository.interface';
import { ErrorPayload } from '@shared/errors';
import { error, result } from '@shared/utils';

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

  async enqueueAndProcess<T>(task: AsyncQueueParams<T>) {
    const taskId = this.createTaskId();

    try {
      const taskResult: T = await new Promise((resolve, reject) => {
        this.waitForTaskCompletion<T>(taskId).then(resolve).catch(reject);
        this.addTaskToQueue<T>(task, taskId);
        this.processTaskQueue();
      });

      return result(taskResult);
    } catch (e) {
      return error(
        new ErrorPayload({
          code: 'ASYNC_QUEUE_UNKNOW_ERROR',
          payload: { error: e },
        }),
      );
    }
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
    const [error, nextTask] = this.props.repository.findAny();

    if (error) {
      if (error.code === 'REPOSITORY_FIND_ANY_ERROR_REPOSITORY_EMPTY') {
        this.queueStatus = 'IDLE';
        return;
      }

      throw new Error(error.code);
    }

    const [taskId, { job }] = nextTask;

    try {
      const result = await job();
      this.events.emit(taskId, null, result);
    } catch (error) {
      this.events.emit(taskId, error);
    }

    this.deleteItem(taskId);

    setTimeout(
      () => this.executeNextTask(),
      this.calculateDelayBeforeNextTask(),
    );
  }

  private deleteItem(taskId: ReturnType<AsyncQueue['createTaskId']>) {
    const [error] = this.props.repository.delete(taskId);

    if (error) {
      if (error.code !== 'REPOSITORY_DELETE_ERROR_ITEM_NOT_FOUND') {
        throw new Error(error.code);
      }
    }
  }

  private createTaskId(): UUID {
    return randomUUID();
  }

  private addTaskToQueue<T>(
    task: AsyncQueueParams<T>,
    taskId: ReturnType<AsyncQueue['createTaskId']>,
  ) {
    const [error] = this.props.repository.insert([taskId, task]);

    if (error) {
      throw new Error(error.code);
    }
  }
}

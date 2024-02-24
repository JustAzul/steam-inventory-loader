import { UUID, randomUUID } from 'crypto';
import EventEmitter from 'events';

import { AsyncQueueParams, IAsyncQueue } from '@application/ports/async-queue';

export default class AsyncQueue implements IAsyncQueue {
  private readonly eventEmitter: EventEmitter;
  private queueStatus: 'IDLE' | 'PROCESSING' = 'IDLE';
  private readonly taskQueue: Array<
    [ReturnType<AsyncQueue['createTaskId']>, AsyncQueueParams<unknown>]
  >;
  private lastTaskTime?: number;

  constructor(readonly taskDelay?: number) {
    this.eventEmitter = new EventEmitter();
    this.taskQueue = [];

    if (taskDelay) {
      this.lastTaskTime = 0;
    }
  }

  async enqueueAndProcess<T>(task: AsyncQueueParams<T>): Promise<T> {
    const taskId = this.createTaskId();

    return new Promise((resolve, reject) => {
      this.waitForTaskCompletion<T>(taskId).then(resolve).catch(reject);
      this.addTaskToQueue<T>(task, taskId);
      this.processTaskQueue();
    });
  }

  private waitForTaskCompletion<R>(
    taskId: ReturnType<AsyncQueue['createTaskId']>,
  ): Promise<R> {
    return new Promise((resolve, reject) => {
      this.eventEmitter.once(taskId, (error: unknown, result: R) => {
        if (this.taskDelay) {
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
    if (!this.taskDelay || !this.lastTaskTime) return 0;

    const elapsed = Date.now() - this.lastTaskTime;
    const shouldDelay = elapsed < this.taskDelay;

    if (!shouldDelay) return 0;
    return Math.max(0, this.taskDelay - elapsed);
  }

  private async executeNextTask() {
    const nextTask = this.taskQueue.shift();

    if (!nextTask) {
      this.queueStatus = 'IDLE';
      return;
    }

    const [taskId, { job }] = nextTask;

    try {
      const result = await job();
      this.eventEmitter.emit(taskId, null, result);
    } catch (error) {
      this.eventEmitter.emit(taskId, error);
    }

    setTimeout(
      () => this.executeNextTask(),
      this.calculateDelayBeforeNextTask(),
    );
  }

  private createTaskId(): UUID {
    return randomUUID();
  }

  private addTaskToQueue<T>(
    task: AsyncQueueParams<T>,
    taskId: ReturnType<AsyncQueue['createTaskId']>,
  ) {
    this.taskQueue.push([taskId, task]);
  }
}

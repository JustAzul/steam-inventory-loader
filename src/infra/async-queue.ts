import { UUID, randomUUID } from 'crypto';
import EventEmitter from 'events';

import {
    AsyncQueueParams,
    IAsyncQueue,
} from '@application/ports/async-queue';

export default class AsyncQueue implements IAsyncQueue {
    private readonly eventEmitter: EventEmitter;

    private queueStatus: 'IDLE' | 'PROCESSING' = 'IDLE';
    private readonly queue: Array<
        [ReturnType<AsyncQueue['generateQueueID']>, AsyncQueueParams<any, any>]
    >;

    private lastExecutionTime?: number;

    constructor(readonly delayInMilliseconds?: number) {
        this.eventEmitter = new EventEmitter();
        this.queue = [];

        if (delayInMilliseconds) {
            this.lastExecutionTime = 0;
        }
    }

    async insertAndProcess<R, T>(param: AsyncQueueParams<R, T>): Promise<R> {
        const queueID = this.generateQueueID();

        return new Promise((resolve, reject) => {
            // Listen for result
            this.setupEventResponse<R>(queueID).then(resolve).catch(reject);

            // Add item to queue
            this.insertIntoQueue<R, T>(param, queueID);

            // Handle/Process queue
            this.handleQueue();
        });
    }

    private setupEventResponse<R>(
        queueID: ReturnType<AsyncQueue['generateQueueID']>,
    ): Promise<R> {
        return new Promise((resolve, reject) => {
            this.eventEmitter.once(queueID, (error: unknown, result: R) => {
                if (this.delayInMilliseconds) {
                    this.lastExecutionTime = Date.now();
                }

                if (error) reject(error);
                else resolve(result);
            });
        });
    }

    private handleQueue() {
        if (this.queueStatus === 'PROCESSING') return;

        this.queueStatus = 'PROCESSING';
        this.triggerQueue();
    }

    private triggerQueue() {
        const timeToWait = this.findTimeToWait();

        if (timeToWait) setTimeout(() => this.processQueue(), timeToWait);
        else this.processQueue();
    }

    private findTimeToWait() {
        if (!this.delayInMilliseconds || !this.lastExecutionTime) return 0;

        // Calculate the time elapsed since the last execution
        const timeElapsedSinceLastExecution = Date.now() - this.lastExecutionTime;

        // Determine if the elapsed time is less than the delay, indicating we should wait more
        const shouldWait = timeElapsedSinceLastExecution < this.delayInMilliseconds;

        if (!shouldWait) {
            // If we shouldn't wait, no additional delay is necessary
            return 0;
        }

        // Calculate how much more time we need to wait, if any
        return Math.max(
            0,
            this.delayInMilliseconds - timeElapsedSinceLastExecution,
        );
    }

    private async processQueue() {
        const queueItem = this.queue.shift();

        if (!queueItem) {
            this.queueStatus = 'IDLE';
            return;
        }

        const [id, { item, processItem }] = queueItem;

        let result;

        try {
            if (item) result = await processItem(item);
            else result = await processItem();

            this.eventEmitter.emit(id, null, result);
        } catch (error) {
            this.eventEmitter.emit(id, error);
        }

        const timeToWait = this.findTimeToWait();
        setTimeout(() => this.processQueue(), timeToWait);
    }

    private generateQueueID(): UUID {
        return randomUUID();
    }

    private insertIntoQueue<R, T>(
        params: AsyncQueueParams<R, T>,
        id?: ReturnType<AsyncQueue['generateQueueID']>,
    ) {
        if (!id) id = this.generateQueueID();
        this.queue.push([id, params]);

        return id;
    }
}

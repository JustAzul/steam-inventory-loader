import { UUID } from 'crypto';
import EventEmitter from 'events';

import { AsyncQueueParams } from '@application/ports/async-queue';
import { IRepository } from '@application/ports/repository.interface';
import { RepositoryException } from '@infra/exceptions';

import { AsyncQueue, AsyncQueueProps } from '../async-queue';

jest.setTimeout(15000);

describe('AsyncQueue', () => {
  let mockRepository: jest.Mocked<
    IRepository<[UUID, AsyncQueueParams<unknown>]>
  >;
  let eventEmitter: EventEmitter;
  let asyncQueue: AsyncQueue;

  beforeEach(() => {
    mockRepository = {
      delete: jest.fn(),
      findAny: jest.fn(),
      insert: jest.fn(),
    };
    eventEmitter = new EventEmitter();
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create AsyncQueue with default event handler', () => {
      const props: AsyncQueueProps = {
        delayFn: (fn, ms) => setTimeout(fn, ms),
        repository: mockRepository,
      };
      const queue = new AsyncQueue(props);
      expect(queue).toBeInstanceOf(AsyncQueue);
    });

    it('should create AsyncQueue with custom event handler', () => {
      const props: AsyncQueueProps = {
        delayFn: (fn, ms) => setTimeout(fn, ms),
        eventHandler: eventEmitter,
        repository: mockRepository,
      };
      const queue = new AsyncQueue(props);
      expect(queue).toBeInstanceOf(AsyncQueue);
    });

    it('should throw error for negative task delay', () => {
      const props: AsyncQueueProps = {
        delayFn: (fn, ms) => setTimeout(fn, ms),
        repository: mockRepository,
        taskDelay: -100,
      };
      expect(() => new AsyncQueue(props)).toThrow(
        'Task delay must be a positive number',
      );
    });

    it('should accept positive task delay', () => {
      const props: AsyncQueueProps = {
        delayFn: (fn, ms) => setTimeout(fn, ms),
        repository: mockRepository,
        taskDelay: 100,
      };
      expect(() => new AsyncQueue(props)).not.toThrow();
    });
  });

  describe('enqueueAndProcess', () => {
    beforeEach(() => {
      const props: AsyncQueueProps = {
        eventHandler: eventEmitter,
        repository: mockRepository,
        testMode: true,
      };
      asyncQueue = new AsyncQueue(props);
    });

    it('should successfully enqueue and process a task', async () => {
      const expectedResult = 'test-result';
      const mockJob = jest.fn().mockResolvedValue(expectedResult);
      const task: AsyncQueueParams<string> = { job: mockJob };

      // By default, findAny throws RepositoryException
      mockRepository.findAny.mockImplementation(() => {
        throw new RepositoryException('AsyncQueue', 'Queue empty');
      });
      // Mock repository behavior for the expected task
      mockRepository.findAny.mockResolvedValueOnce(['test-id' as UUID, task]);
      mockRepository.delete.mockResolvedValueOnce(true);

      const resultPromise = asyncQueue.enqueueAndProcess(task);
      await asyncQueue.drainQueueForTest();
      const result = await resultPromise;
      expect(result).toBe(expectedResult);
      expect(mockRepository.insert).toHaveBeenCalledWith(
        expect.arrayContaining([expect.any(String), task]),
      );
      expect(mockJob).toHaveBeenCalled();
      expect(mockRepository.delete).toHaveBeenCalledWith('test-id');
    });

    it('should handle task execution error', async () => {
      const errorMessage = 'Task execution failed';
      const mockJob = jest.fn().mockRejectedValue(new Error(errorMessage));
      const task: AsyncQueueParams<string> = { job: mockJob };

      mockRepository.findAny.mockImplementation(() => {
        throw new RepositoryException('AsyncQueue', 'Queue empty');
      });
      mockRepository.findAny.mockResolvedValueOnce(['test-id' as UUID, task]);
      mockRepository.delete.mockResolvedValueOnce(true);

      const resultPromise = asyncQueue.enqueueAndProcess(task);
      await asyncQueue.drainQueueForTest();
      await expect(resultPromise).rejects.toThrow(errorMessage);
      expect(mockRepository.delete).toHaveBeenCalledWith('test-id');
    });

    it('should handle repository insert error', async () => {
      const insertError = new Error('Repository insert failed');
      const mockJob = jest.fn().mockResolvedValue('result');
      const task: AsyncQueueParams<string> = { job: mockJob };

      mockRepository.insert.mockRejectedValue(insertError);
      mockRepository.findAny.mockImplementation(() => {
        throw new RepositoryException('AsyncQueue', 'Queue empty');
      });

      const resultPromise = asyncQueue.enqueueAndProcess(task);
      await asyncQueue.drainQueueForTest();
      await expect(resultPromise).rejects.toThrow('Repository insert failed');
    });

    it('should process multiple tasks sequentially', async () => {
      const task1 = { job: jest.fn().mockResolvedValue('result1') };
      const task2 = { job: jest.fn().mockResolvedValue('result2') };

      mockRepository.findAny.mockImplementation(() => {
        throw new RepositoryException('AsyncQueue', 'Queue empty');
      });
      mockRepository.findAny.mockResolvedValueOnce(['id1' as UUID, task1]);
      mockRepository.findAny.mockResolvedValueOnce(['id2' as UUID, task2]);
      mockRepository.delete.mockResolvedValue(true);

      const promise1 = asyncQueue.enqueueAndProcess(task1);
      const promise2 = asyncQueue.enqueueAndProcess(task2);
      await asyncQueue.drainQueueForTest();
      const [result1, result2] = await Promise.all([promise1, promise2]);
      expect(result1).toBe('result1');
      expect(result2).toBe('result2');
      expect(mockRepository.insert).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error handling', () => {
    beforeEach(() => {
      const props: AsyncQueueProps = {
        eventHandler: eventEmitter,
        repository: mockRepository,
        testMode: true,
      };
      asyncQueue = new AsyncQueue(props);
    });

    it('should handle repository delete failure gracefully', async () => {
      const mockJob = jest.fn().mockResolvedValue('result');
      const task: AsyncQueueParams<string> = { job: mockJob };

      mockRepository.findAny.mockImplementation(() => {
        throw new RepositoryException('AsyncQueue', 'Queue empty');
      });
      mockRepository.findAny.mockResolvedValueOnce(['test-id' as UUID, task]);
      mockRepository.delete.mockRejectedValue(new Error('Delete failed'));

      const resultPromise = asyncQueue.enqueueAndProcess(task);
      await asyncQueue.drainQueueForTest();
      const result = await resultPromise;
      expect(result).toBe('result');
    });

    it('should handle unexpected errors during task execution', async () => {
      mockRepository.findAny.mockImplementation(() => {
        throw new RepositoryException('AsyncQueue', 'Queue empty');
      });
      mockRepository.findAny.mockRejectedValueOnce(
        new Error('Unexpected repository error'),
      );

      const mockJob = jest.fn().mockResolvedValue('result');
      const task: AsyncQueueParams<string> = { job: mockJob };

      const resultPromise = asyncQueue.enqueueAndProcess(task);
      await asyncQueue.drainQueueForTest();
      await expect(resultPromise).rejects.toThrow(
        'Unexpected repository error',
      );
    });

    it('should stop processing when queue is empty', async () => {
      const mockJob = jest.fn().mockResolvedValue('result');
      const task: AsyncQueueParams<string> = { job: mockJob };

      mockRepository.findAny.mockImplementation(() => {
        throw new RepositoryException('AsyncQueue', 'Queue empty');
      });

      const resultPromise = asyncQueue.enqueueAndProcess(task);
      await asyncQueue.drainQueueForTest();
      const result = await resultPromise;
      expect(result).toBe('result');
    });
  });

  describe('Queue status management', () => {
    it('should not process multiple queues simultaneously', () => {
      const props: AsyncQueueProps = {
        delayFn: (fn, ms): void => {
          setTimeout(fn, ms);
        },
        eventHandler: eventEmitter,
        repository: mockRepository,
      };
      asyncQueue = new AsyncQueue(props);

      // Check that processTaskQueue doesn't start multiple processing cycles

      const processTaskQueue = (asyncQueue as any).processTaskQueue.bind(
        asyncQueue,
      );

      // Set status to PROCESSING

      (asyncQueue as any).queueStatus = 'PROCESSING';

      // This should return early without starting processing
      processTaskQueue();

      // Verify no repository calls were made
      expect(mockRepository.findAny).not.toHaveBeenCalled();
    });
  });

  describe('Task ID generation', () => {
    it('should generate unique task IDs', () => {
      const props: AsyncQueueProps = {
        delayFn: (fn, ms) => setTimeout(fn, ms),
        repository: mockRepository,
      };
      const queue = new AsyncQueue(props);

      const createTaskId = (queue as any).createTaskId.bind(queue);
      const id1 = createTaskId();
      const id2 = createTaskId();

      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });
  });
});

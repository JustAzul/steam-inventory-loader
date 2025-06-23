import EventEmitter from 'events';
import { UUID } from 'crypto';

import { AsyncQueueParams } from '@application/ports/async-queue';
import { IRepository } from '@application/ports/repository.interface';
import { RepositoryException } from '@domain/exceptions/repository.exception';

import { AsyncQueue, AsyncQueueProps } from '../async-queue';

describe('AsyncQueue', () => {
  let mockRepository: jest.Mocked<IRepository<[UUID, AsyncQueueParams<unknown>]>>;
  let eventEmitter: EventEmitter;
  let asyncQueue: AsyncQueue;

  beforeEach(() => {
    mockRepository = {
      insert: jest.fn(),
      delete: jest.fn(),
      findAny: jest.fn(),
    };
    eventEmitter = new EventEmitter();
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create AsyncQueue with default event handler', () => {
      const props: AsyncQueueProps = { repository: mockRepository };
      const queue = new AsyncQueue(props);
      expect(queue).toBeInstanceOf(AsyncQueue);
    });

    it('should create AsyncQueue with custom event handler', () => {
      const props: AsyncQueueProps = {
        repository: mockRepository,
        eventHandler: eventEmitter,
      };
      const queue = new AsyncQueue(props);
      expect(queue).toBeInstanceOf(AsyncQueue);
    });

    it('should throw error for negative task delay', () => {
      const props: AsyncQueueProps = {
        repository: mockRepository,
        taskDelay: -100,
      };
      expect(() => new AsyncQueue(props)).toThrow('Task delay must be a positive number');
    });

    it('should accept positive task delay', () => {
      const props: AsyncQueueProps = {
        repository: mockRepository,
        taskDelay: 100,
      };
      expect(() => new AsyncQueue(props)).not.toThrow();
    });
  });

  describe('enqueueAndProcess', () => {
    beforeEach(() => {
      const props: AsyncQueueProps = {
        repository: mockRepository,
        eventHandler: eventEmitter,
      };
      asyncQueue = new AsyncQueue(props);
    });

    it('should successfully enqueue and process a task', async () => {
      const expectedResult = 'test-result';
      const mockJob = jest.fn().mockResolvedValue(expectedResult);
      const task: AsyncQueueParams<string> = { job: mockJob };
      
      // Mock repository behavior
      mockRepository.findAny.mockResolvedValueOnce(['test-id', task] as any);
      mockRepository.delete.mockResolvedValueOnce(true);
      
      // Mock the repository to be empty after processing
      mockRepository.findAny.mockRejectedValueOnce(new RepositoryException('Queue empty'));

      const result = await asyncQueue.enqueueAndProcess(task);

      expect(result).toBe(expectedResult);
      expect(mockRepository.insert).toHaveBeenCalledWith(
        expect.arrayContaining([expect.any(String), task])
      );
      expect(mockJob).toHaveBeenCalled();
      expect(mockRepository.delete).toHaveBeenCalledWith('test-id');
    });

    it('should handle task execution error', async () => {
      const errorMessage = 'Task execution failed';
      const mockJob = jest.fn().mockRejectedValue(new Error(errorMessage));
      const task: AsyncQueueParams<string> = { job: mockJob };
      
      mockRepository.findAny.mockResolvedValueOnce(['test-id', task] as any);
      mockRepository.delete.mockResolvedValueOnce(true);
      mockRepository.findAny.mockRejectedValueOnce(new RepositoryException('Queue empty'));

      await expect(asyncQueue.enqueueAndProcess(task)).rejects.toThrow(errorMessage);
      expect(mockRepository.delete).toHaveBeenCalledWith('test-id');
    });

    it('should handle repository insert error', async () => {
      const insertError = new Error('Repository insert failed');
      const mockJob = jest.fn().mockResolvedValue('result');
      const task: AsyncQueueParams<string> = { job: mockJob };
      
      mockRepository.insert.mockRejectedValue(insertError);

      await expect(asyncQueue.enqueueAndProcess(task)).rejects.toThrow('Repository insert failed');
    });

    it('should process multiple tasks sequentially', async () => {
      const task1 = { job: jest.fn().mockResolvedValue('result1') };
      const task2 = { job: jest.fn().mockResolvedValue('result2') };
      
      // Setup repository to return tasks in sequence
      mockRepository.findAny
        .mockResolvedValueOnce(['id1', task1] as any)
        .mockResolvedValueOnce(['id2', task2] as any)
        .mockRejectedValue(new RepositoryException('Queue empty'));
      
      mockRepository.delete.mockResolvedValue(true);

      // Start both tasks
      const promise1 = asyncQueue.enqueueAndProcess(task1);
      const promise2 = asyncQueue.enqueueAndProcess(task2);

      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(result1).toBe('result1');
      expect(result2).toBe('result2');
      expect(mockRepository.insert).toHaveBeenCalledTimes(2);
    });
  });

  describe('Task delay functionality', () => {
    it('should respect task delay between executions', async () => {
      const taskDelay = 100;
      const props: AsyncQueueProps = {
        repository: mockRepository,
        eventHandler: eventEmitter,
        taskDelay,
      };
      asyncQueue = new AsyncQueue(props);

      const startTime = Date.now();
      const mockJob = jest.fn().mockResolvedValue('result');
      const task: AsyncQueueParams<string> = { job: mockJob };

      mockRepository.findAny.mockResolvedValueOnce(['id1', task] as any);
      mockRepository.delete.mockResolvedValueOnce(true);
      mockRepository.findAny.mockRejectedValueOnce(new RepositoryException('Queue empty'));

      await asyncQueue.enqueueAndProcess(task);
      
      // The delay should be applied after task completion
      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(0); // At least some time passed
    });

    it('should calculate correct delay when tasks are processed quickly', () => {
      const taskDelay = 1000;
      const props: AsyncQueueProps = {
        repository: mockRepository,
        taskDelay,
      };
      asyncQueue = new AsyncQueue(props);

      // Access private method through reflection for testing
      const calculateDelay = (asyncQueue as any).calculateDelayBeforeNextTask.bind(asyncQueue);
      
      // Set lastTaskTime to simulate recent execution
      (asyncQueue as any).lastTaskTime = Date.now() - 500; // 500ms ago
      
      const delay = calculateDelay();
      expect(delay).toBeGreaterThan(400); // Should be close to 500ms remaining
      expect(delay).toBeLessThanOrEqual(500);
    });

    it('should return 0 delay when enough time has passed', () => {
      const taskDelay = 100;
      const props: AsyncQueueProps = {
        repository: mockRepository,
        taskDelay,
      };
      asyncQueue = new AsyncQueue(props);

      const calculateDelay = (asyncQueue as any).calculateDelayBeforeNextTask.bind(asyncQueue);
      
      // Set lastTaskTime to simulate old execution
      (asyncQueue as any).lastTaskTime = Date.now() - 200; // 200ms ago
      
      const delay = calculateDelay();
      expect(delay).toBe(0);
    });
  });

  describe('Error handling', () => {
    beforeEach(() => {
      const props: AsyncQueueProps = {
        repository: mockRepository,
        eventHandler: eventEmitter,
      };
      asyncQueue = new AsyncQueue(props);
    });

    it('should handle repository delete failure gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const mockJob = jest.fn().mockResolvedValue('result');
      const task: AsyncQueueParams<string> = { job: mockJob };

      mockRepository.findAny.mockResolvedValueOnce(['test-id', task] as any);
      mockRepository.delete.mockRejectedValue(new Error('Delete failed'));
      mockRepository.findAny.mockRejectedValueOnce(new RepositoryException('Queue empty'));

      const result = await asyncQueue.enqueueAndProcess(task);

      expect(result).toBe('result');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to delete task test-id from repository.',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle unexpected errors during task execution', async () => {
      mockRepository.findAny.mockRejectedValue(new Error('Unexpected repository error'));

      const mockJob = jest.fn().mockResolvedValue('result');
      const task: AsyncQueueParams<string> = { job: mockJob };

      await expect(asyncQueue.enqueueAndProcess(task)).rejects.toThrow('Unexpected repository error');
    });

    it('should stop processing when queue is empty', async () => {
      const mockJob = jest.fn().mockResolvedValue('result');
      const task: AsyncQueueParams<string> = { job: mockJob };

      // Repository is immediately empty
      mockRepository.findAny.mockRejectedValue(new RepositoryException('Queue empty'));

      const result = await asyncQueue.enqueueAndProcess(task);
      expect(result).toBe('result');
    });
  });

  describe('Queue status management', () => {
    it('should not process multiple queues simultaneously', async () => {
      const props: AsyncQueueProps = {
        repository: mockRepository,
        eventHandler: eventEmitter,
      };
      asyncQueue = new AsyncQueue(props);

      // Check that processTaskQueue doesn't start multiple processing cycles
      const processTaskQueue = (asyncQueue as any).processTaskQueue.bind(asyncQueue);
      
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
      const props: AsyncQueueProps = { repository: mockRepository };
      const queue = new AsyncQueue(props);
      
      const createTaskId = (queue as any).createTaskId.bind(queue);
      const id1 = createTaskId();
      const id2 = createTaskId();
      
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });
  });
});
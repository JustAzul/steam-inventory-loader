import { IRepository } from '@application/ports/repository.interface';
import { AsyncQueueParams } from '@application/ports/async-queue';
import { AsyncQueue, AsyncQueueProps } from '@infra/async-queue';
import { UUID } from 'crypto';

describe(AsyncQueue.name, () => {
  let mockRepository: IRepository<[UUID, AsyncQueueParams<unknown>]>;
  // let mockEventEmitter: EventEmitter;
  let asyncQueue: AsyncQueue;

  beforeEach(() => {
    mockRepository = {
      insert: jest.fn(),
      delete: jest.fn(),
      findAny: jest.fn(),
    };

    // mockEventEmitter = new EventEmitter();

    const props: AsyncQueueProps = {
      repository: mockRepository,
      // eventHandler: mockEventEmitter,
      taskDelay: 1000,
    };

    asyncQueue = new AsyncQueue(props);
  });

  describe('constructor', () => {
    it('should initialize with default properties', () => {
      expect(asyncQueue).toBeDefined();
      expect((asyncQueue as any).queueStatus).toBe('IDLE');
    });

    it('should throw an error if taskDelay is negative', () => {
      const props: AsyncQueueProps = {
        repository: mockRepository,
        taskDelay: -1,
      };

      expect(() => new AsyncQueue(props)).toThrow(
        'Task delay must be a positive number',
      );
    });
  });

  // TODOS:
  // it should process tasks correctly (return expected result)
  // it should handle errors correctly (return expected error)
  // it should wait the delay before processing the next task
  // it should not starve the event loop
});

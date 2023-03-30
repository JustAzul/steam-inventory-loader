import AsyncQueueWithDelayEntity, {
  AsyncQueueWithDelayProps,
} from '../domain/entities/async-queue-with-delay.entity';

import DomainException from '../domain/exceptions/domain.exception';

jest.useFakeTimers();
jest.spyOn(global, 'setTimeout');

describe(AsyncQueueWithDelayEntity.name, () => {
  const delay = Number.MAX_SAFE_INTEGER;

  const defaultProps: AsyncQueueWithDelayProps = {
    delayInMilliseconds: delay,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
    processItem: jest.fn().mockImplementation((item: any) => item),
  };

  const asyncQueueWithDelayEntity = (
    props: AsyncQueueWithDelayProps = defaultProps,
  ) => new AsyncQueueWithDelayEntity(props);

  const items: string[] = Array.from(new Array(3), (_, i) => String(i));

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it(`should return error instance`, async () => {
    const props: AsyncQueueWithDelayProps = {
      delayInMilliseconds: 1,
      processItem: jest.fn().mockImplementation(() => {
        throw new DomainException(AsyncQueueWithDelayEntity.name, 'test error');
      }),
    };

    const asyncQueueWithDelayInstance = asyncQueueWithDelayEntity(props);

    try {
      await asyncQueueWithDelayInstance.insertAndProcess<string, string>(
        'test item',
      );
    } catch (error) {
      expect(error).toBeInstanceOf(DomainException);
    }
  });

  it(`should execute delays`, async () => {
    const asyncQueueWithDelayInstance = asyncQueueWithDelayEntity();
    expect(setTimeout).not.toBeCalled();

    await Promise.all([
      jest.runAllTimersAsync(),
      Promise.all(
        items.map((item) =>
          asyncQueueWithDelayInstance.insertAndProcess<string, string>(item),
        ),
      ),
    ]);

    expect(setTimeout).toHaveBeenCalledTimes(items.length);
  });

  it(`should wait for a delay between calls`, async () => {
    expect(defaultProps.processItem).not.toBeCalled();

    const asyncQueueWithDelayInstance = asyncQueueWithDelayEntity();
    await asyncQueueWithDelayInstance.insertAndProcess('first call');

    jest.runAllTimers();

    expect(setTimeout).toBeCalled();
    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), delay);

    expect(defaultProps.processItem).toBeCalled();
    expect(defaultProps.processItem).toHaveBeenCalledTimes(1);

    await Promise.all([
      asyncQueueWithDelayInstance.insertAndProcess('second call'),
      jest.runAllTimersAsync(),
    ]);

    expect(defaultProps.processItem).toBeCalled();
    expect(defaultProps.processItem).toHaveBeenCalledTimes(2);
    expect(setTimeout).toBeCalled();

    expect(setTimeout).toHaveBeenCalledTimes(2);
    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), delay);
  });

  it(`should match results`, async () => {
    const asyncQueueWithDelayInstance = asyncQueueWithDelayEntity();

    const [, results] = await Promise.all([
      jest.runAllTimersAsync(),
      Promise.all(
        items.map((item) =>
          asyncQueueWithDelayInstance.insertAndProcess<string, string>(item),
        ),
      ),
    ]);

    for (let i = 0; i < items.length; i += 1) {
      expect(results[i]).toBe(items[i]);
    }
  });
});

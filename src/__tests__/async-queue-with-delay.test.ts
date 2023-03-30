import AsyncQueueWithDelayEntity, {
  AsyncQueueWithDelayProps,
} from '../domain/entities/async-queue-with-delay.entity';

jest.useFakeTimers();
jest.spyOn(global, 'setTimeout');

describe(AsyncQueueWithDelayEntity.name, () => {
  const delay = Number.MAX_SAFE_INTEGER;

  const props: AsyncQueueWithDelayProps = {
    delayInMilliseconds: delay,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
    processItem: jest.fn().mockImplementation((item: any) => item),
  };

  const asyncQueueWithDelayEntity = new AsyncQueueWithDelayEntity(props);
  const items: string[] = Array.from(new Array(10), (_, i) => String(i));

  beforeEach(() => jest.clearAllMocks());

  it(`should execute delays`, async () => {
    expect(setTimeout).not.toBeCalled();

    await Promise.all([
      jest.runAllTimersAsync(),
      Promise.all(
        items.map((item) =>
          asyncQueueWithDelayEntity.insertAndProcess<string, string>(item),
        ),
      ),
    ]);

    expect(setTimeout).toHaveBeenCalledTimes(items.length);
  });

  it(`should wait for a delay between calls`, async () => {
    expect(props.processItem).not.toBeCalled();

    await asyncQueueWithDelayEntity.insertAndProcess('first call');
    jest.runAllTimers();

    expect(setTimeout).toBeCalled();
    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), delay);

    expect(props.processItem).toBeCalled();
    expect(props.processItem).toHaveBeenCalledTimes(1);

    await Promise.all([
      asyncQueueWithDelayEntity.insertAndProcess('second call'),
      jest.runAllTimersAsync(),
    ]);

    expect(props.processItem).toBeCalled();
    expect(props.processItem).toHaveBeenCalledTimes(2);
    expect(setTimeout).toBeCalled();

    expect(setTimeout).toHaveBeenCalledTimes(2);
    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), delay);
  });

  it(`should match results`, async () => {
    const [, results] = await Promise.all([
      jest.runAllTimersAsync(),
      Promise.all(
        items.map((item) =>
          asyncQueueWithDelayEntity.insertAndProcess<string, string>(item),
        ),
      ),
    ]);

    for (let i = 0; i < items.length; i += 1) {
      expect(results[i]).toBe(items[i]);
    }
  });
});

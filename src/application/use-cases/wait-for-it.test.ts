import WaitForItUseCase from './wait-for-it.use-case';

jest.useFakeTimers();

describe(WaitForItUseCase.name, () => {
  it(`should wait for a delay between calls`, async () => {
    // random delay
    const delayInMilliseconds = Math.floor(Math.random() * 1000);

    const start = Date.now();

    await Promise.all([
      WaitForItUseCase.execute(delayInMilliseconds),
      jest.runAllTimersAsync(),
    ]);

    const end = Date.now();
    const diff = end - start;

    expect(diff).toEqual(delayInMilliseconds);
  });
});

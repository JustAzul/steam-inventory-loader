import sleep from '../sleep.helper';

jest.useFakeTimers();

describe(sleep.name, () => {
  it(`should wait for a delay between calls`, async () => {
    // random delay
    const delayInMilliseconds = Math.floor(Math.random() * 1000);

    const start = Date.now();

    await Promise.all([sleep(delayInMilliseconds), jest.runAllTimersAsync()]);

    const end = Date.now();
    const diff = end - start;

    expect(diff).toEqual(delayInMilliseconds);
  });
});

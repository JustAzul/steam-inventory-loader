/**
 * Pauses execution for a specified amount of time.
 *
 * @param timeInMilliseconds - The amount of time to pause in milliseconds.
 */
export default function sleep(timeInMilliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, timeInMilliseconds));
}

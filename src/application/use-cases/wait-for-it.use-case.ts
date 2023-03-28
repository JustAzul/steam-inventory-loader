export default class WaitForItUseCase {
  public static async execute(timeInMilliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, timeInMilliseconds));
  }
}

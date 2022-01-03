export type SpawnWorkerInstance = () => Worker;

export class WebWorker {
  public id: string;

  public isBusy = false;

  public timeoutInMs: number;

  public isTerminated = false;

  private worker: Worker;

  private timeout: NodeJS.Timeout;

  private spawnWorkerInstance: SpawnWorkerInstance;

  private static count = 0;

  constructor(spawnWorkerInstance: SpawnWorkerInstance, timeoutInMs: number) {
    this.timeoutInMs = timeoutInMs;
    this.spawnWorkerInstance = spawnWorkerInstance;
    this.id = `Worker: ${WebWorker.count++}`;
    this.attachWorkerInstance();
  }

  public static withTimeout(
    spawnWorkerInstance: SpawnWorkerInstance,
    timeoutInMs: number
  ) {
    return new WebWorker(spawnWorkerInstance, timeoutInMs);
  }

  /**
   * Terminates the `Worker` instance.
   */
  public terminate() {
    this.isBusy = false;
    this.isTerminated = true;
    this.worker.terminate();
    clearTimeout(this.timeout);
  }

  /**
   * Attaches a new `Worker` instance with the given `SpawnWorkerInstance` function.
   */
  private attachWorkerInstance() {
    this.worker = this.spawnWorkerInstance();
  }

  /**
   * Sets a timeout, after which the `Worker` instance will terminate.
   * If the instance is busy, the timer will restart instead.
   */
  private startWorkerTimeout() {
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      if (this.isBusy) {
        // If the `Worker` instance is busy working,
        // restart the timer.
        this.startWorkerTimeout();
      } else {
        this.terminate();
      }
    }, this.timeoutInMs);
  }

  public startWork<TResponse>(payload: any): Promise<TResponse> {
    if (this.isTerminated) {
      this.attachWorkerInstance();
    }

    return new Promise((resolve, reject) => {
      // Guard against errors
      this.worker.onerror = (error) => {
        reject(error);
        this.isBusy = false;
        this.startWorkerTimeout();
      };

      // Guard against a message that cannot be deserialized
      this.worker.onmessageerror = (error) => {
        reject(error);
        this.isBusy = false;
        this.startWorkerTimeout();
      };

      // Callback for the successful case
      this.worker.onmessage = ({ data }) => {
        resolve(data);
        this.isBusy = false;
        this.startWorkerTimeout();
      };

      // Pass the work to the `Worker` instance
      this.isBusy = true;
      this.worker.postMessage(payload);
    });
  }
}

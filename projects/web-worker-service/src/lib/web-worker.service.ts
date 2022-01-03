import { Injectable } from "@angular/core";
import { WebWorker, SpawnWorkerInstance } from "./WebWorker";

@Injectable({
  providedIn: "root",
})
/**
 * Provides an abstraction layer for using `WebWorker` instances.
 *
 * Use a web worker, and this service will either use an idle instance,
 * or spawn a new worker with a 1 minute timeout.
 */
export class WebWorkerService {
  /**
   * List of workers for a given Worker instance spawner.
   */
  private webWorkers = new Map<SpawnWorkerInstance, WebWorker[]>();

  /**
   * Delegates work to an idle web worker if available, and otherwise spawns a new one.
   *
   * @param spawnWorkerInstance SpawnWorkerInstance function
   * @param payload Payload passed to the worker for processing
   * @returns Result
   */
  public async useWebWorker<TResponse>(
    spawnWorkerInstance: SpawnWorkerInstance,
    payload: unknown
  ): Promise<TResponse> {
    const worker =
      this.findIdleWorker(spawnWorkerInstance) ||
      this.spawnWorker(spawnWorkerInstance);

    return worker.startWork(payload);
  }

  /**
   * Looks for an idle `WebWorker` instance of the given `SpawnWorkerInstance` function.
   *
   * @param spawnWorkerInstance SpawnWorkerInstance function
   * @returns An idle WebWorker instance or `undefined`
   */
  private findIdleWorker(
    spawnWorkerInstance: SpawnWorkerInstance
  ): WebWorker | undefined {
    const currentWorkers = this.webWorkers.get(spawnWorkerInstance) || [];
    return currentWorkers.find((worker) => !worker.isBusy);
  }

  /**
   * Spawns a new `WebWorker` instance.
   *
   * @param spawnWorkerInstance SpawnWorkerInstance function
   * @returns A new `WebWorker` instance
   */
  private spawnWorker(spawnWorkerInstance: SpawnWorkerInstance) {
    const worker = WebWorker.withTimeout(spawnWorkerInstance, 1000 * 60 * 1); // 1 minute timeout

    if (this.webWorkers.has(spawnWorkerInstance)) {
      this.webWorkers.get(spawnWorkerInstance)?.push(worker);
    } else {
      this.webWorkers.set(spawnWorkerInstance, [worker]);
    }

    return worker;
  }
}

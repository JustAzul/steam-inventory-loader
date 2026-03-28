/**
 * Adaptive worker decision logic (FR58-FR61).
 * Workers are beneficial only when concurrent load volume justifies spawn overhead (~80ms).
 */

/** Minimum inventory size to consider worker offloading (FR60). */
export const ITEM_THRESHOLD = 5000;

/** Minimum concurrent active loads to justify worker spawn overhead (FR59). */
export const ACTIVE_LOAD_THRESHOLD = 3;

/**
 * Decides whether to offload page processing to a worker thread.
 * Returns true only when both thresholds are met — below either,
 * main-thread processing is faster than paying the spawn overhead.
 */
export function shouldUseWorker(totalItems: number, activeLoads: number): boolean {
  return totalItems >= ITEM_THRESHOLD && activeLoads >= ACTIVE_LOAD_THRESHOLD;
}

/**
 * Measurement utilities for benchmarks.
 * Requires: node --expose-gc
 */

if (typeof globalThis.gc !== 'function') {
  console.error('ERROR: Run with --expose-gc flag: node --expose-gc benchmarks/run.js');
  process.exit(1);
}

/**
 * Force garbage collection and return heap used in bytes.
 */
export function heapUsed() {
  globalThis.gc();
  globalThis.gc(); // double GC for finalization
  return process.memoryUsage().heapUsed;
}

/**
 * Measure wall-clock time of an async function over multiple iterations.
 * Returns { median, min, max } in milliseconds.
 */
export async function measureTime(fn, iterations = 3) {
  const times = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    times.push(performance.now() - start);
  }
  times.sort((a, b) => a - b);
  return {
    median: times[Math.floor(times.length / 2)],
    min: times[0],
    max: times[times.length - 1],
  };
}

/**
 * Measure heap delta of an async function.
 * Returns delta in bytes. Keeps result reference alive during measurement.
 */
export async function measureHeap(fn) {
  const before = heapUsed();
  const result = await fn();
  const after = heapUsed();
  // Keep result alive to prevent premature GC
  void result;
  return { heapDelta: after - before, result };
}

/**
 * Measure both time (median of N) and heap delta.
 */
export async function measureBoth(fn, iterations = 3) {
  const time = await measureTime(fn, iterations);
  const { heapDelta, result } = await measureHeap(fn);
  return { time, heapDelta, result };
}

export function formatBytes(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function formatMs(ms) {
  return `${ms.toFixed(2)}ms`;
}

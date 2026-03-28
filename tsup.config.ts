import { defineConfig } from 'tsup';

export default defineConfig([
  // Main library bundle
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    target: 'node18',
    clean: true,
    splitting: false,
    sourcemap: true,
    minify: true,
  },
  // Worker entry point — separate file for Piscina to load in worker threads
  {
    entry: ['src/worker/process-page-task.ts'],
    format: ['esm'],
    target: 'node18',
    clean: false,
    splitting: false,
    sourcemap: true,
    minify: true,
    outDir: 'dist',
  },
]);

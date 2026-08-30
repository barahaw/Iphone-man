import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Each integration test's beforeEach re-imports the whole app graph via
    // vi.resetModules() + dynamic import, which is heavy under concurrency.
    // The default 10s hooks were too tight; give setup real wall-clock headroom
    // instead of hiding the work.
    hookTimeout: 30000,
    testTimeout: 30000,
    teardownTimeout: 30000,
    fileParallelism: true,
    // Cap concurrent workers well below the 20 detected cores. Running the 10
    // integration + 10 unit files all at once made every file re-transform the
    // app simultaneously, thrashing the CPU and blowing the hook timers. A
    // bounded fork pool keeps throughput high while removing that contention.
    pool: "forks",
    poolOptions: {
      forks: {
        minForks: 1,
        maxForks: 4,
        singleFork: false,
        isolate: true,
      },
    },
  },
});

import { defineConfig } from 'vitest/config'

/**
 * The benchmark asserts heap growth stays flat, which needs a manually
 * triggerable GC. `--expose-gc` is passed through to the worker pool.
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/bench/**/*.bench.test.ts'],
    testTimeout: 120_000,
    pool: 'forks',
    poolOptions: {
      forks: { execArgv: ['--expose-gc'] },
    },
  },
})

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['server/src/**/*.test.ts', 'types/**/*.test.ts'],
    setupFiles: ['./test/setup.ts'],
    // Each `vi.fn(impl)` gets its `impl` back before every test, so module-level mocks keep working
    // while per-test stubs and recorded calls are dropped.
    mockReset: true,
    restoreMocks: true,
  },
});

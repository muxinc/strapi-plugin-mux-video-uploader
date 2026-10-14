import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['server/src/**/*.test.ts', 'types/**/*.test.ts'],
    // Installs the fake global `strapi` before any plugin module is imported: some of them read it at load time.
    setupFiles: ['./test/setup.ts'],
    restoreMocks: true,
  },
});

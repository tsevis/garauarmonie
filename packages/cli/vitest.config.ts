import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      // bin.ts is the stream wiring and index.ts is re-exports: both are
      // exercised by running the binary, not by unit tests.
      exclude: ['src/bin.ts', 'src/index.ts'],
      thresholds: { statements: 80, branches: 80, functions: 80, lines: 80 },
    },
  },
});

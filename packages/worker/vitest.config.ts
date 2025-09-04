import { defineConfig } from 'vitest/config';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const thresholds = require('../../scripts/coverage-threshold.js');

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      thresholds: { global: thresholds },
      reportsDirectory: './coverage',
      reporter: ['text', 'json', 'html'],
    },
    retry: process.env.CI ? 2 : 0,
    testTimeout: 30000,
  },
});

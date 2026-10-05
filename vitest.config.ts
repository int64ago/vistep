import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    include: ['src/**/*.{test,spec}.?(c|m)[jt]s?(x)', 'scripts/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    // Geometry checks compete for CPU; keep local reviews and CI within the same bounded suite.
    maxWorkers: 4,
    setupFiles: ['src/i18n/english.ts'],
  },
});

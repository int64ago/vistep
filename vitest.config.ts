import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: { setupFiles: ['src/i18n/english.ts'] },
});

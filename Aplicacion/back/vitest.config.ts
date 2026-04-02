import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./test/setup.ts'],
    reporters: ['default', 'html'],
    outputFile: './test-report/index.html'
  }
});
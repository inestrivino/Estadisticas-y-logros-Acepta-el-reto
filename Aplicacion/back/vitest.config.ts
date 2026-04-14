import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'istanbul',
      reporter: 'html',
      reportsDirectory: './coverage',
      include: ['src/**']
    },
    reporters: [ 
      ['html', { outputFile: './test-report/index.html' }]
    ],
  }
});
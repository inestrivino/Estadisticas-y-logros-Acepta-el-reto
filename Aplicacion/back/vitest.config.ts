import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        reporters: ['default', 'html'],
        outputFile: './test-report/index.html'
    }
});
import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "jsdom",
        setupFiles: ['./test/setup.ts'],
        coverage: {
            provider: 'istanbul',
            reporter: 'html',
            reportsDirectory: './test-report/coverage',
            include: ['src/**']
        },
        reporters: [
            ['html', { outputFile: './test-report/index.html' }]
        ]
    }
});
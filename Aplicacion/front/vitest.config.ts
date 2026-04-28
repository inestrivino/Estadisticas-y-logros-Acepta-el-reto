import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "jsdom",
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
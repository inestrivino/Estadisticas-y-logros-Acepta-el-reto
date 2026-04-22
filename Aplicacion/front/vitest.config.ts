import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "jsdom",
        reporters: ['default', 'html'],
        outputFile: './test-report/index.html'
    },
});
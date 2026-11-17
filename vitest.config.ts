import { defineConfig } from 'vitest/config';

// Unit tests for pure logic (engine, formatting, data helpers). UI scenarios live in e2e/ (Playwright).
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});

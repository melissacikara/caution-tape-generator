import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/api/**/*.spec.ts'],
    setupFiles: ['tests/api/setup.ts'],
    testTimeout: 45_000,
  },
})

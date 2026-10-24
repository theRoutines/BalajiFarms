import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    fileParallelism: false,
    globalSetup: './tests/setup/globalSetup.js',
    globalTeardown: './tests/setup/globalTeardown.js',
    setupFiles: ['./tests/setup/testEnv.js'],
  },
})

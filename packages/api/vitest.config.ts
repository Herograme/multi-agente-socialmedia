import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@social-content/agents': path.resolve(__dirname, '../agents/src'),
      '@social-content/shared': path.resolve(__dirname, '../shared/src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', '**/*.test.ts'],
    },
  },
});

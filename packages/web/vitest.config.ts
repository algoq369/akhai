import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

// Env-split (E4.1): one global jsdom environment over server-module suites was the
// root cause of three collection bugs (F2 fs, query-cache node:crypto, route-schemas
// transitive imports). Server suites run in node; the jsdom lane stays scaffolded
// (setup.ts wired) for future client tests.
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/', '**/*.config.{js,ts}', '**/types.ts', '**/*.d.ts'],
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'server',
          environment: 'node',
          include: ['lib/__tests__/**/*.{test,spec}.{ts,tsx,js,mjs}'],
          // no jsdom setup — server suites need none (verified: zero DOM/testing-library usage)
        },
      },
      {
        extends: true,
        test: {
          name: 'client',
          environment: 'jsdom',
          setupFiles: './tests/setup.ts',
          include: [
            'components/**/__tests__/**/*.{test,spec}.{ts,tsx}',
            'hooks/**/__tests__/**/*.{test,spec}.{ts,tsx}',
            'app/**/__tests__/**/*.{test,spec}.{ts,tsx}',
          ],
        },
      },
    ],
  },
  resolve: {
    alias: {
      'server-only': path.resolve(__dirname, './tests/stubs/server-only.ts'),
      '@': path.resolve(__dirname, './'),
    },
  },
});

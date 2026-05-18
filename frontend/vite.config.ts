/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5004',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setupTests.ts'],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/main.tsx',
        'src/App.tsx',
        'src/theme/**',
        'src/types/**',
        'src/test/**',
        'src/**/*.test.{ts,tsx}',
        'src/routes/**',
      ],
      thresholds: {
        'src/utils/**': { lines: 100, branches: 100, functions: 100, statements: 100 },
        'src/hooks/**': { lines: 100, branches: 100, functions: 100, statements: 100 },
        'src/context/**': { lines: 100, branches: 100, functions: 100, statements: 100 },
        'src/api/**': { lines: 100, branches: 100, functions: 100, statements: 100 },
        'src/components/**': { lines: 85, branches: 85, functions: 85, statements: 85 },
        'src/pages/**': { lines: 85, branches: 85, functions: 85, statements: 85 },
      },
    },
  },
});

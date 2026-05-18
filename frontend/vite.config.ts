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
      // Per-file thresholds: every file that has a co-located *.test.{ts,tsx}
      // is expected to keep 100% — these are the files we've consciously
      // TDD'd. Files without tests stay at 0% and are tracked as a backlog
      // in the coverage report. As more tests get written, add the file
      // glob here so a future drop fails CI.
      thresholds: {
        'src/utils/**': { lines: 100, branches: 100, functions: 100, statements: 100 },
        'src/hooks/**': { lines: 100, branches: 100, functions: 100, statements: 100 },
        'src/context/**': { lines: 100, branches: 100, functions: 100, statements: 100 },
        'src/components/common/StatusChip.tsx': { lines: 100, branches: 100, functions: 100, statements: 100 },
        'src/components/tailor/TailorCard.tsx': { lines: 100, branches: 100, functions: 100, statements: 100 },
        'src/components/booking/MeasurementForm.tsx': { lines: 100, branches: 100, functions: 100, statements: 100 },
        'src/pages/auth/Login.tsx': { lines: 100, branches: 100, functions: 100, statements: 100 },
      },
    },
  },
});

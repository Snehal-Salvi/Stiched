export default {
  testEnvironment: 'node',
  testMatch: ['**/*.test.js'],
  transform: {},
  setupFiles: ['<rootDir>/src/test/setEnv.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/app.js',
    '!src/config/db.js',
    '!src/config/passport.js',
    '!src/test/**',
    '!src/**/*.test.js',
  ],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 60000,
  clearMocks: true,
};

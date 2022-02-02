// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/configuration

module.exports = {
  automock: false,
  clearMocks: true,
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  testPathIgnorePatterns: [
    'node_modules',
    'dist'
  ],
  collectCoverageFrom: [
    '<rootDir>/src/**/*.{js,ts}',
    '!<rootDir>/src/**/__tests__/**/*.{js,ts}',
  ],
  coverageThreshold: {
    global: {
      branches: 99,
      functions: 99,
      lines: 99,
      statements: 99,
    },
  },
}

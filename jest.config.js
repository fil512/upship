module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.[jt]s'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { useESM: false }]
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    '^@upship/api$': '<rootDir>/api/src'
  },
  collectCoverageFrom: [
    'server/**/*.{js,ts}',
    '!server/db/migrations/**',
    '!server/db/migrate.js',       // CLI migration runner
    '!server/routes/gameState.js'  // Complex action logic - tested via integration
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testTimeout: 10000,
  verbose: true,
  // Mock the database by default
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js']
};

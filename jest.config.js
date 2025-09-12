module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/android/',
    '<rootDir>/ios/',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|@react-navigation|react-native-.*|expo-notifications|expo-location)/)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/tests/**',
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Stricter thresholds for critical modules
    './src/services/*.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './src/utils/assessment/*.ts': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(ts|tsx|js)',
    '<rootDir>/src/**/*.(test|spec).(ts|tsx|js)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    'expo-notifications': '<rootDir>/src/tests/mocks/expo-notifications.js',
    'expo-location': '<rootDir>/src/tests/mocks/expo-location.js',
    'expo-crypto': '<rootDir>/src/tests/mocks/expo-crypto.js',
    'nanoid': '<rootDir>/src/tests/mocks/nanoid.js',
    'react-native-purchases': '<rootDir>/src/tests/mocks/react-native-purchases.js',
  },
};
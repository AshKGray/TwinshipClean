import '@testing-library/jest-native/extend-expect';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
}));

// Mock AccessibilityInfo - must be done before react-native import
jest.mock('react-native/Libraries/Components/AccessibilityInfo/AccessibilityInfo', () => ({
  isReduceMotionEnabled: jest.fn(() => Promise.resolve(false)),
  addEventListener: jest.fn((eventName: string, handler: Function) => ({
    remove: jest.fn(),
  })),
  removeEventListener: jest.fn(),
  announceForAccessibility: jest.fn(),
  isScreenReaderEnabled: jest.fn(() => Promise.resolve(false)),
}));

// Mock Appearance
jest.mock('react-native/Libraries/Utilities/Appearance', () => ({
  getColorScheme: jest.fn(() => 'light'),
  addChangeListener: jest.fn(() => ({ remove: jest.fn() })),
}));

// Mock zustand persist
jest.mock('zustand/middleware', () => ({
  persist: (config: any) => config,
  createJSONStorage: () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  }),
}));

// Global test utilities
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
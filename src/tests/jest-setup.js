/**
 * Jest Global Setup
 *
 * This file runs BEFORE the test environment is set up.
 * Used to mock APIs that need to be available during module loading.
 */

// Create mock functions that will be available globally
const mockGetColorScheme = () => 'light';
const mockAddChangeListener = () => ({ remove: () => {} });
const mockIsReduceMotionEnabled = () => Promise.resolve(false);
const mockAddEventListener = () => ({ remove: () => {} });
const mockRemoveEventListener = () => {};
const mockAnnounceForAccessibility = () => {};
const mockIsScreenReaderEnabled = () => Promise.resolve(false);

// Mock Appearance API
if (typeof global.Appearance === 'undefined') {
  global.Appearance = {
    getColorScheme: mockGetColorScheme,
    addChangeListener: mockAddChangeListener,
  };
}

// Mock AccessibilityInfo
if (typeof global.AccessibilityInfo === 'undefined') {
  global.AccessibilityInfo = {
    isReduceMotionEnabled: mockIsReduceMotionEnabled,
    addEventListener: mockAddEventListener,
    removeEventListener: mockRemoveEventListener,
    announceForAccessibility: mockAnnounceForAccessibility,
    isScreenReaderEnabled: mockIsScreenReaderEnabled,
  };
}

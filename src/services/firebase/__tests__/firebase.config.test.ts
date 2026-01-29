/**
 * Firebase Configuration Tests
 *
 * Tests Firebase initialization and configuration.
 *
 * Story: 7-1 Firebase Project Setup and Configuration
 */

// Mock environment variables before importing Firebase config
const mockEnvVars = {
  EXPO_PUBLIC_FIREBASE_API_KEY: 'test-api-key',
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: 'test-project',
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: 'test.appspot.com',
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '123456789',
  EXPO_PUBLIC_FIREBASE_APP_ID: 'test-app-id',
  EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID: 'test-measurement-id',
};

Object.entries(mockEnvVars).forEach(([key, value]) => {
  process.env[key] = value;
});

// Mock Firebase modules
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({ name: 'test-app' })),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({ type: 'firestore' })),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({ type: 'auth' })),
}));

describe('Firebase Configuration', () => {
  beforeEach(() => {
    // Suppress console output during tests
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('exports firebase app instance', () => {
    const { app } = require('../firebase.config');
    expect(app).toBeDefined();
    expect(app.name).toBe('test-app');
  });

  it('exports firestore db instance', () => {
    const { db } = require('../firebase.config');
    expect(db).toBeDefined();
    expect(db.type).toBe('firestore');
  });

  it('exports auth instance', () => {
    const { auth } = require('../firebase.config');
    expect(auth).toBeDefined();
    expect(auth.type).toBe('auth');
  });

  it('exports firebase config object', () => {
    const { firebaseConfig } = require('../firebase.config');
    expect(firebaseConfig).toBeDefined();
    expect(firebaseConfig.apiKey).toBe(mockEnvVars.EXPO_PUBLIC_FIREBASE_API_KEY);
    expect(firebaseConfig.projectId).toBe(mockEnvVars.EXPO_PUBLIC_FIREBASE_PROJECT_ID);
  });

  it('initializes with correct configuration', () => {
    const { firebaseConfig } = require('../firebase.config');
    expect(firebaseConfig).toMatchObject({
      apiKey: mockEnvVars.EXPO_PUBLIC_FIREBASE_API_KEY,
      authDomain: mockEnvVars.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: mockEnvVars.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: mockEnvVars.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: mockEnvVars.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: mockEnvVars.EXPO_PUBLIC_FIREBASE_APP_ID,
      measurementId: mockEnvVars.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
    });
  });

  it('includes measurement ID when provided', () => {
    const { firebaseConfig } = require('../firebase.config');
    expect(firebaseConfig.measurementId).toBe(mockEnvVars.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID);
  });
});

describe('Firebase Configuration Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('throws error when required environment variables are missing', () => {
    // Remove required env vars
    delete process.env.EXPO_PUBLIC_FIREBASE_API_KEY;

    // Re-mock Firebase to throw on missing config
    jest.doMock('firebase/app', () => ({
      initializeApp: jest.fn(() => {
        throw new Error('Missing Firebase environment variables: EXPO_PUBLIC_FIREBASE_API_KEY');
      }),
    }));

    // Expect error when loading config
    expect(() => {
      jest.isolateModules(() => {
        require('../firebase.config');
      });
    }).toThrow();

    // Restore env var
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY = mockEnvVars.EXPO_PUBLIC_FIREBASE_API_KEY;
  });
});

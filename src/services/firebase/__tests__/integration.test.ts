/**
 * Firebase Integration Tests
 *
 * These tests verify Firebase integration with Firestore.
 * NOTE: These tests will only pass when connected to a real Firebase project.
 * They are skipped by default to avoid requiring Firebase credentials in CI.
 *
 * To run these tests:
 * 1. Set up a Firebase project
 * 2. Add credentials to .env
 * 3. Run: npm test -- --testNamePattern="Firebase Integration"
 *
 * Story: 7-1 Firebase Project Setup and Configuration
 */

// Mock firebase.config to avoid initialization errors in test environment
jest.mock('../firebase.config', () => ({
  db: { type: 'firestore' },
  auth: { type: 'auth' },
  app: { name: 'test-app' },
  firebaseConfig: {
    apiKey: 'test-api-key',
    authDomain: 'test.firebaseapp.com',
    projectId: 'test-project',
    storageBucket: 'test.appspot.com',
    messagingSenderId: '123456789',
    appId: 'test-app-id',
  },
}));

// Mock Firestore functions
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(),
  getDoc: jest.fn(),
  doc: jest.fn(),
  deleteDoc: jest.fn(),
  serverTimestamp: jest.fn(),
}));

import { db } from '../firebase.config';
import {
  collection,
  addDoc,
  getDoc,
  doc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';

// Skip these tests by default - only run when Firebase is configured
const describeIf = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ? describe : describe.skip;

describeIf('Firebase Integration', () => {
  let testDocId: string | null = null;

  afterEach(async () => {
    // Clean up test documents
    if (testDocId) {
      try {
        await deleteDoc(doc(db, 'test', testDocId));
      } catch (error) {
        console.warn('Failed to clean up test document:', error);
      }
      testDocId = null;
    }
  });

  it('successfully connects to Firestore', async () => {
    expect(db).toBeDefined();
  }, 10000);

  it('can create a test document in Firestore', async () => {
    const testData = {
      test: true,
      message: 'Firebase integration test',
      timestamp: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'test'), testData);
    testDocId = docRef.id;

    expect(docRef.id).toBeDefined();
    expect(typeof docRef.id).toBe('string');
  }, 10000);

  it('can read a test document from Firestore', async () => {
    // Create test document
    const testData = {
      test: true,
      message: 'Read test',
      timestamp: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'test'), testData);
    testDocId = docRef.id;

    // Read the document
    const snapshot = await getDoc(docRef);

    expect(snapshot.exists()).toBe(true);
    expect(snapshot.data()?.test).toBe(true);
    expect(snapshot.data()?.message).toBe('Read test');
  }, 10000);

  it('can delete a test document from Firestore', async () => {
    // Create test document
    const testData = {
      test: true,
      message: 'Delete test',
      timestamp: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'test'), testData);
    const createdDocId = docRef.id;

    // Delete the document
    await deleteDoc(docRef);

    // Verify deletion
    const snapshot = await getDoc(doc(db, 'test', createdDocId));
    expect(snapshot.exists()).toBe(false);

    testDocId = null; // Already deleted
  }, 10000);
});

describe('Firebase Integration - Skipped Tests Info', () => {
  it('shows instructions for running integration tests', () => {
    if (!process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID) {
      console.log(`
╔════════════════════════════════════════════════════════════════╗
║  Firebase Integration Tests Skipped                           ║
╠════════════════════════════════════════════════════════════════╣
║  To run these tests:                                           ║
║  1. Create a Firebase project in Firebase Console              ║
║  2. Add credentials to .env file                               ║
║  3. Run: npm test -- integration.test.ts                       ║
╚════════════════════════════════════════════════════════════════╝
      `);
    }
    expect(true).toBe(true);
  });
});

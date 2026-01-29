/**
 * Firebase Configuration
 *
 * Initializes Firebase app with Firestore services.
 * Firebase Auth is temporarily disabled due to Expo Go compatibility issues.
 * Will be re-enabled when moving to development build.
 *
 * Story: 7-1 Firebase Project Setup and Configuration
 */

import { initializeApp, FirebaseApp, getApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

// Validate configuration
function validateFirebaseConfig(): void {
  const requiredKeys = [
    'EXPO_PUBLIC_FIREBASE_API_KEY',
    'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
    'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'EXPO_PUBLIC_FIREBASE_APP_ID',
  ];

  const missingKeys = requiredKeys.filter(
    key => !process.env[key]
  );

  if (missingKeys.length > 0) {
    throw new Error(
      `Missing Firebase environment variables: ${missingKeys.join(', ')}\n` +
      'Please ensure all required EXPO_PUBLIC_FIREBASE_* variables are set in .env'
    );
  }
}

// Initialize Firebase
let firebaseApp: FirebaseApp;
let firestoreDb: Firestore;

try {
  validateFirebaseConfig();

  // Initialize Firebase app
  try {
    firebaseApp = getApp();
    console.log('📦 Using existing Firebase app');
  } catch {
    firebaseApp = initializeApp(firebaseConfig);
    console.log('📦 Initialized new Firebase app');
  }

  // Initialize Firestore
  firestoreDb = getFirestore(firebaseApp);
  console.log('✅ Firestore initialized');

  console.log('✅ Firebase initialized successfully');
  console.log('📦 Project ID:', firebaseConfig.projectId);
  console.log('⚠️  Firebase Auth is disabled (Expo Go limitation) - will be re-enabled in development build');
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  throw error;
}

// Direct exports
export const db = firestoreDb;
export const app = firebaseApp;

// Temporary: Export a mock auth object to prevent import errors
// This will be replaced with real auth when moving to development build
export const auth = null as any;

// Export for testing
export { firebaseConfig };

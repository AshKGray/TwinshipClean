/**
 * Firebase Services Export
 *
 * Central export point for all Firebase services.
 * Firebase Auth temporarily disabled due to Expo Go limitations.
 *
 * Story: 7-1 Firebase Project Setup and Configuration
 */

export { db, auth, app, firebaseConfig } from './firebase.config';

// Re-export commonly used Firebase functions for convenience
export {
  // Firestore
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  type DocumentData,
  type QuerySnapshot,
  type DocumentSnapshot,
} from 'firebase/firestore';

// Firebase Auth exports temporarily disabled
// Uncomment when moving to development build
/*
export {
  // Authentication
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
  type UserCredential,
} from 'firebase/auth';
*/

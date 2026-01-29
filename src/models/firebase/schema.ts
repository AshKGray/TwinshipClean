/**
 * Firebase Firestore Schema Definitions
 *
 * TypeScript interfaces for all Firestore document types.
 * These schemas define the structure of data stored in Firebase.
 *
 * Story: 7-3 Firestore Data Models and Schema
 */

import type { Timestamp } from 'firebase/firestore';

/**
 * Theme Color Options
 */
export type ThemeColor =
  | 'nebula-rose'
  | 'stellar-blue'
  | 'orbit-sage'
  | 'solar-amber'
  | 'celestial-indigo'
  | 'comet-coral'
  | 'aurora-teal'
  | 'meteor-copper';

/**
 * Twin Type Options
 */
export type TwinType = 'identical' | 'fraternal' | 'other';

/**
 * User Profile Document
 * Collection: users/{userId}
 */
export interface UserProfileDoc {
  id: string;                         // Firebase Auth UID
  email: string;                      // User email (from Firebase Auth)
  name: string;                       // Encrypted with user key
  birthdate: string;                  // Encrypted
  twinType: TwinType;
  accentColor: ThemeColor;
  twinId?: string;                    // Reference to twin's user ID
  twinPairId?: string;                // Reference to twinPairs document
  createdAt: Timestamp;               // Firestore Timestamp
  updatedAt: Timestamp;
  encryptionKeyHash?: string;         // Hash for key verification
}

/**
 * Twin Pair Document
 * Collection: twinPairs/{pairId}
 */
export interface TwinPairDoc {
  id: string;                         // UUID v4
  twin1Id: string;                    // User ID of first twin
  twin2Id: string;                    // User ID of second twin
  pairedAt: Timestamp;
  invitationId: string;               // Reference to invitation
  sharedEncryptionKey?: string;       // Encrypted with both user keys (Phase 2)
  status: 'active' | 'inactive';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Story Document
 * Collection: twinPairs/{pairId}/stories/{storyId}
 */
export interface StoryDoc {
  id: string;
  title: string;                      // Encrypted
  content: string;                    // Encrypted
  createdBy: string;                  // User ID
  createdAt: Timestamp;
  updatedAt: Timestamp;
  updatedBy: string;                  // User ID of last editor
  mediaUrls?: string[];               // Encrypted URLs (Phase 2: Firebase Storage)
  tags?: string[];
  version: number;                    // For conflict resolution
  editHistory?: EditEntry[];          // Track edits
  isDeleted?: boolean;                // Soft delete flag
  deletedAt?: Timestamp;
}

/**
 * Edit History Entry
 */
export interface EditEntry {
  userId: string;
  timestamp: Timestamp;
  changes: string;                    // Summary of changes
}

/**
 * Twintuition Alert Document
 * Collection: twinPairs/{pairId}/alerts/{alertId}
 */
export interface TwintuitionAlertDoc {
  id: string;
  type: 'feeling' | 'thought' | 'action';
  emotion?: EmotionWord;
  intensity?: number;                 // 1-10
  message?: string;                   // Encrypted (max 100 chars)
  senderId: string;                   // User ID who sent
  recipientId: string;                // User ID who receives
  sentAt: Timestamp;
  seenAt?: Timestamp;
  respondedAt?: Timestamp;
  expiresAt: Timestamp;               // Auto-delete after 24 hours
  isDeleted?: boolean;
}

/**
 * Emotion Words for Twintuition
 */
export type EmotionWord =
  | 'joy'
  | 'sadness'
  | 'anger'
  | 'fear'
  | 'surprise'
  | 'disgust'
  | 'trust'
  | 'anticipation';

/**
 * Game Session Document
 * Collection: twinPairs/{pairId}/games/{gameId}
 */
export interface GameSessionDoc {
  id: string;
  gameType: 'maze' | 'emotion' | 'decision' | 'duo';
  userId: string;                     // User who played
  twinId: string;                     // Twin's user ID
  rawData: Record<string, any>;       // Game-specific data (encrypted if sensitive)
  completedAt: Timestamp;
  result?: Record<string, any>;       // Calculated result (when both complete)
  resultCalculatedAt?: Timestamp;
  version: number;                    // For updates
}

/**
 * Invitation Document
 * Collection: invitations/{invitationId}
 */
export interface InvitationDoc {
  id: string;
  code: string;                       // 8-character code
  createdBy: string;                  // User ID
  createdAt: Timestamp;
  expiresAt: Timestamp;               // 7 days from creation
  status: 'pending' | 'accepted' | 'expired';
  acceptedBy?: string;                // User ID who accepted
  acceptedAt?: Timestamp;
}

/**
 * Twincidence Document
 * Collection: twinPairs/{pairId}/twincidences/{twincidenceId}
 */
export interface TwincidenceDoc {
  id: string;
  title: string;                      // Encrypted
  description: string;                // Encrypted
  type: 'manual' | 'twintuition_sync' | 'location' | 'biometric' | 'activity';
  detectedAt: Timestamp;
  twin1Data?: Record<string, any>;    // Twin 1 data snapshot
  twin2Data?: Record<string, any>;    // Twin 2 data snapshot
  syncScore?: number;                 // Synchronicity score (0-100)
  metadata?: Record<string, any>;     // Additional metadata
  createdBy?: string;                 // User ID (for manual entries)
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isDeleted?: boolean;
}

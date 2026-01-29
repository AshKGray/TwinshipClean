/**
 * Firebase Firestore Collection Paths
 *
 * Constants and helper functions for Firestore collection paths.
 * Provides type-safe path construction for all collections.
 *
 * Story: 7-3 Firestore Data Models and Schema
 */

/**
 * Root collection names
 */
export const COLLECTIONS = {
  USERS: 'users',
  TWIN_PAIRS: 'twinPairs',
  INVITATIONS: 'invitations',
} as const;

/**
 * Subcollection names within twinPairs
 */
export const SUBCOLLECTIONS = {
  STORIES: 'stories',
  ALERTS: 'alerts',
  GAMES: 'games',
  TWINCIDENCES: 'twincidences',
} as const;

/**
 * Get user document path
 */
export function getUserPath(userId: string): string {
  return `${COLLECTIONS.USERS}/${userId}`;
}

/**
 * Get twin pair document path
 */
export function getTwinPairPath(pairId: string): string {
  return `${COLLECTIONS.TWIN_PAIRS}/${pairId}`;
}

/**
 * Get stories collection path for a twin pair
 */
export function getStoriesPath(pairId: string): string {
  return `${COLLECTIONS.TWIN_PAIRS}/${pairId}/${SUBCOLLECTIONS.STORIES}`;
}

/**
 * Get specific story document path
 */
export function getStoryPath(pairId: string, storyId: string): string {
  return `${getStoriesPath(pairId)}/${storyId}`;
}

/**
 * Get alerts collection path for a twin pair
 */
export function getAlertsPath(pairId: string): string {
  return `${COLLECTIONS.TWIN_PAIRS}/${pairId}/${SUBCOLLECTIONS.ALERTS}`;
}

/**
 * Get specific alert document path
 */
export function getAlertPath(pairId: string, alertId: string): string {
  return `${getAlertsPath(pairId)}/${alertId}`;
}

/**
 * Get games collection path for a twin pair
 */
export function getGamesPath(pairId: string): string {
  return `${COLLECTIONS.TWIN_PAIRS}/${pairId}/${SUBCOLLECTIONS.GAMES}`;
}

/**
 * Get specific game session document path
 */
export function getGamePath(pairId: string, gameId: string): string {
  return `${getGamesPath(pairId)}/${gameId}`;
}

/**
 * Get twincidences collection path for a twin pair
 */
export function getTwincidencesPath(pairId: string): string {
  return `${COLLECTIONS.TWIN_PAIRS}/${pairId}/${SUBCOLLECTIONS.TWINCIDENCES}`;
}

/**
 * Get specific twincidence document path
 */
export function getTwincidencePath(pairId: string, twincidenceId: string): string {
  return `${getTwincidencesPath(pairId)}/${twincidenceId}`;
}

/**
 * Get invitation document path
 */
export function getInvitationPath(invitationId: string): string {
  return `${COLLECTIONS.INVITATIONS}/${invitationId}`;
}

/**
 * Parse collection path to extract IDs
 */
export function parseCollectionPath(path: string): {
  collection: string;
  documentId?: string;
  subcollection?: string;
  subdocumentId?: string;
} {
  const parts = path.split('/');

  if (parts.length === 1) {
    return { collection: parts[0] };
  } else if (parts.length === 2) {
    return { collection: parts[0], documentId: parts[1] };
  } else if (parts.length === 3) {
    return { collection: parts[0], documentId: parts[1], subcollection: parts[2] };
  } else if (parts.length === 4) {
    return {
      collection: parts[0],
      documentId: parts[1],
      subcollection: parts[2],
      subdocumentId: parts[3]
    };
  }

  return { collection: path };
}

/**
 * Validate collection path format
 */
export function isValidCollectionPath(path: string): boolean {
  const parts = path.split('/');
  // Collection paths should have odd number of parts (collection, doc, subcollection, etc.)
  // Document paths should have even number of parts
  return parts.length > 0 && parts.every(part => part.length > 0);
}

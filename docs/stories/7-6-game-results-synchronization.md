# Story 7.6: Game Results Synchronization

**Epic**: 7 - Data Synchronization & Backend
**Status**: drafted
**Story ID**: 7-6
**Estimated Effort**: Medium (5-6 hours)

---

## User Story

**As a** user
**I want** my game results to sync with my twin
**So that** we can compare our synchronicity scores and see insights when both have completed

## Business Value

Game results synchronization is essential for the twin comparison feature - the core scientific differentiator of Twinship. When both twins complete a game, the app can automatically analyze and display synchronicity insights, driving engagement and providing measurable value.

## Acceptance Criteria

1. ✅ Completed game session uploads to Firestore after game ends
2. ✅ Twin's game session retrieved for comparison when both complete
3. ✅ Analysis runs automatically when both twins finish the same game
4. ✅ Result stored in both session documents (for offline access)
5. ✅ Both twins notified when result is available
6. ✅ Results load from Firestore on app startup (historical data)
7. ✅ Large game data compressed before upload (JSON.stringify)
8. ✅ Offline game sessions queue for sync when network returns
9. ✅ Real-time listener detects when twin completes game
10. ✅ Results display shows twin comparison data
11. ✅ Synchronicity scores normalized to 0-100 scale
12. ✅ Game type and completion timestamp indexed for queries

## Technical Implementation Notes

### Game Sync Service

Create `src/services/firebase/gamesSync.ts`:

```typescript
import {
  collection,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
  getDocs
} from 'firebase/firestore';
import { db } from './firebase.config';
import { firestoreService } from './firestore';
import { getGamesPath } from '@/models/firebase/collections';
import type { GameSessionDoc } from '@/models/firebase/schema';
import type { GameSession, GameResult } from '@/types';
import { useAssessmentStore } from '@/state/assessmentStore';
import { useTwinStore } from '@/state/twinStore';
import { v4 as uuidv4 } from 'uuid';

// Import analysis services
import { mazeAnalysisService } from './games/mazeAnalysis';
import { emotionAnalysisService } from './games/emotionAnalysis';
import { decisionAnalysisService } from './games/decisionAnalysis';
import { duoMatchingService } from './games/duoMatching';

class GameSyncService {
  private listener: Unsubscribe | null = null;

  /**
   * Upload game session after completion
   */
  async uploadGameSession(twinPairId: string, session: GameSession): Promise<void> {
    try {
      const userId = useTwinStore.getState().userProfile?.id;
      if (!userId) throw new Error('User not authenticated');

      // Compress raw game data
      const compressedData = this.compressGameData(session.rawData);

      // Create game document
      const gameDoc: Omit<GameSessionDoc, 'id' | 'createdAt' | 'completedAt'> = {
        gameType: session.gameType,
        userId: session.userId,
        twinId: session.twinId || '',
        rawData: compressedData,
        version: 1,
      };

      const gamesPath = getGamesPath(twinPairId);
      await firestoreService.createDocument(gamesPath, session.id, {
        ...gameDoc,
        completedAt: serverTimestamp(),
      });

      console.log('Game session uploaded:', session.id);

      // Check if twin has completed this game type
      await this.checkTwinCompletion(twinPairId, session);
    } catch (error) {
      console.error('Error uploading game session:', error);
      throw error;
    }
  }

  /**
   * Check if twin has completed the same game and run analysis
   */
  private async checkTwinCompletion(twinPairId: string, session: GameSession): Promise<void> {
    try {
      const twinId = session.twinId;
      if (!twinId) return;

      // Query for twin's session of the same game type
      const gamesPath = getGamesPath(twinPairId);
      const twinSessions = await firestoreService.queryCollection<GameSessionDoc>(
        gamesPath,
        [
          where('userId', '==', twinId),
          where('gameType', '==', session.gameType),
          orderBy('completedAt', 'desc')
        ]
      );

      if (twinSessions.length > 0) {
        // Twin has completed this game, run analysis
        const twinSession = twinSessions[0];
        await this.calculateAndStoreResult(twinPairId, session, twinSession as any);
      }
    } catch (error) {
      console.error('Error checking twin completion:', error);
    }
  }

  /**
   * Get twin's game session for specific game type
   */
  async getTwinGameSession(
    twinPairId: string,
    gameType: string,
    twinId: string
  ): Promise<GameSession | null> {
    try {
      const gamesPath = getGamesPath(twinPairId);
      const sessions = await firestoreService.queryCollection<GameSessionDoc>(
        gamesPath,
        [
          where('userId', '==', twinId),
          where('gameType', '==', gameType),
          orderBy('completedAt', 'desc')
        ]
      );

      if (sessions.length === 0) return null;

      const sessionDoc = sessions[0];
      return this.convertToGameSession(sessionDoc);
    } catch (error) {
      console.error('Error getting twin game session:', error);
      return null;
    }
  }

  /**
   * Calculate result and store in both session documents
   */
  async calculateAndStoreResult(
    twinPairId: string,
    session1: GameSession,
    session2: GameSession
  ): Promise<void> {
    try {
      // Run appropriate analysis based on game type
      let result: GameResult;

      switch (session1.gameType) {
        case 'maze':
          result = await mazeAnalysisService.compareTwinSessions(
            session1.rawData,
            session2.rawData
          );
          break;
        case 'emotion':
          result = await emotionAnalysisService.compareEmotionalProfiles(
            session1.rawData,
            session2.rawData
          );
          break;
        case 'decision':
          result = await decisionAnalysisService.compareDecisionProfiles(
            session1.rawData,
            session2.rawData
          );
          break;
        case 'duo':
          result = await duoMatchingService.generateDuoResult(session1.rawData);
          break;
        default:
          throw new Error(`Unknown game type: ${session1.gameType}`);
      }

      // Store result in both sessions
      const gamesPath = getGamesPath(twinPairId);

      await firestoreService.updateDocument(gamesPath, session1.id, {
        result,
        resultCalculatedAt: serverTimestamp(),
      });

      await firestoreService.updateDocument(gamesPath, session2.id, {
        result,
        resultCalculatedAt: serverTimestamp(),
      });

      console.log('Game result calculated and stored:', result);

      // Notify both twins (via real-time listener)
      useAssessmentStore.getState().notifyResultAvailable(session1.gameType);
    } catch (error) {
      console.error('Error calculating and storing result:', error);
      throw error;
    }
  }

  /**
   * Subscribe to game results (detect when twin completes)
   */
  subscribeToGameResults(
    twinPairId: string,
    callback: (sessions: GameSession[]) => void
  ): Unsubscribe {
    const gamesPath = getGamesPath(twinPairId);
    const collectionRef = collection(db, gamesPath);

    // Query: All completed games, ordered by completion time
    const q = query(
      collectionRef,
      orderBy('completedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const sessions: GameSession[] = snapshot.docs.map(doc => {
          const data = doc.data() as GameSessionDoc;
          return this.convertToGameSession(data);
        });

        callback(sessions);
      },
      (error) => {
        console.error('Error in games snapshot:', error);
      }
    );

    this.listener = unsubscribe;
    return unsubscribe;
  }

  /**
   * Load all game sessions for a user (historical data)
   */
  async loadGameSessions(twinPairId: string, userId: string): Promise<GameSession[]> {
    try {
      const gamesPath = getGamesPath(twinPairId);
      const sessions = await firestoreService.queryCollection<GameSessionDoc>(
        gamesPath,
        [
          where('userId', '==', userId),
          orderBy('completedAt', 'desc')
        ]
      );

      return sessions.map(session => this.convertToGameSession(session));
    } catch (error) {
      console.error('Error loading game sessions:', error);
      return [];
    }
  }

  /**
   * Compress game data before upload (JSON.stringify)
   */
  private compressGameData(data: any): string {
    try {
      return JSON.stringify(data);
    } catch (error) {
      console.error('Error compressing game data:', error);
      return '';
    }
  }

  /**
   * Decompress game data after download (JSON.parse)
   */
  private decompressGameData(compressed: string): any {
    try {
      return JSON.parse(compressed);
    } catch (error) {
      console.error('Error decompressing game data:', error);
      return {};
    }
  }

  /**
   * Convert GameSessionDoc to GameSession
   */
  private convertToGameSession(doc: GameSessionDoc): GameSession {
    return {
      id: doc.id,
      gameType: doc.gameType as any,
      userId: doc.userId,
      twinId: doc.twinId,
      startedAt: '', // Not stored in doc
      completedAt: firestoreService.timestampToISO(doc.completedAt as Timestamp),
      rawData: typeof doc.rawData === 'string'
        ? this.decompressGameData(doc.rawData)
        : doc.rawData,
      result: doc.result,
      status: doc.result ? 'analyzed' : 'completed',
    } as GameSession;
  }

  /**
   * Unsubscribe from listener
   */
  unsubscribe(): void {
    if (this.listener) {
      this.listener();
      this.listener = null;
    }
  }
}

// Export singleton instance
export const gameSyncService = new GameSyncService();
```

## Dependencies

### Upstream Dependencies
- Story 7.1: Firebase Project Setup and Configuration
- Story 7.2: User Authentication with Firebase
- Story 7.3: Firestore Data Models and Schema
- Epic 2: Twin Connection Games Laboratory (game logic)

### Downstream Dependencies
- Story 2.10: Game Results History and Comparison Dashboard

## Files to Create/Modify

### New Files:
- `src/services/firebase/gamesSync.ts` - Game results synchronization service

### Modified Files:
- `src/state/assessmentStore.ts` - Add Firebase sync actions
- `src/screens/games/MazeResults.tsx` - Use synced results
- `src/screens/games/EmotionResults.tsx` - Use synced results
- `src/screens/games/DecisionResults.tsx` - Use synced results
- `src/screens/games/DuoResults.tsx` - Use synced results

## Testing Strategy

### Unit Tests
- ✅ uploadGameSession compresses data
- ✅ getTwinGameSession retrieves correct session
- ✅ calculateAndStoreResult runs appropriate analysis
- ✅ Result stored in both session documents
- ✅ Data compression/decompression works correctly

### Integration Tests
- ✅ Upload game session to Firestore
- ✅ Twin completes game → Analysis runs automatically
- ✅ Result stored in both sessions
- ✅ Listener detects twin completion
- ✅ Load historical game sessions

### E2E Tests
- ✅ Twin 1 completes game → Session uploaded
- ✅ Twin 2 completes same game → Analysis runs → Both see results
- ✅ Results display with comparison data

### Manual Testing Checklist
- [ ] Complete game, verify session in Firestore
- [ ] Twin completes same game, verify result calculated
- [ ] Verify result in both session documents
- [ ] Check data compression (view in Firestore Console)
- [ ] Load historical results, verify display correctly

## Definition of Done

- [ ] All acceptance criteria met and verified
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] E2E tests written and passing
- [ ] Manual testing checklist completed
- [ ] Analysis runs automatically when both complete
- [ ] Results display with twin comparison
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Sprint status updated to "done"

---

**Related Documentation**:
- [Epic 7 Tech Spec](/docs/tech-spec-epic-7.md)
- [Epic 2: Games Laboratory](/docs/tech-spec-epic-2.md)

**Story Owner**: Backend Team
**Last Updated**: 2025-11-18

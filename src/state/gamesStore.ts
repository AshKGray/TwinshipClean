/**
 * Games Store - Epic 2
 * Manages game sessions, results, and synchronicity tracking for all 4 psychic games
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// Type Definitions
// ============================================================================

export type GameType = 'maze' | 'emotion' | 'decision' | 'duo';
export type GameStatus = 'in_progress' | 'completed' | 'analyzed';

// Base GameSession Interface
export interface GameSession {
  id: string;
  gameType: GameType;
  userId: string;
  twinId?: string;
  startedAt: string;
  completedAt?: string;
  rawData: MazeData | EmotionData | DecisionData | DuoData;
  result?: GameResult;
  status: GameStatus;
}

// Maze Game Types
export interface MazeMove {
  direction: 'up' | 'down' | 'left' | 'right';
  timestamp: number;
  wasError: boolean;
  corrected: boolean;
}

export interface MazeData {
  moves: MazeMove[];
  completionTime: number;
  errorCount: number;
  correctionsCount: number;
  mazeId: string;
}

export interface MazeResult extends GameResult {
  directionPreferences: {
    up: number;
    down: number;
    left: number;
    right: number;
  };
  errorRate: number;
  synchronicity: {
    directionAlignment: number;
    errorStyleMatch: number;
    overallScore: number;
  };
}

// Emotion Game Types
export type EmotionWord = 'joy' | 'sadness' | 'anger' | 'fear' |
                          'surprise' | 'disgust' | 'trust' | 'anticipation';

export interface EmotionAssociation {
  emotion: EmotionWord;
  selectedImages: number[];
  selectionOrder: number[];
  responseTime: number;
}

export interface EmotionData {
  associations: EmotionAssociation[];
}

export interface EmotionResult extends GameResult {
  vocabularyOverlap: number;
  sharedAssociations: {
    emotion: EmotionWord;
    images: number[];
    confidence: number;
  }[];
  synchronicity: {
    overallScore: number;
  };
}

// Decision Game Types
export type DecisionCategory = 'risk' | 'ethics' | 'practical' | 'emotional';

export interface DecisionScenario {
  id: string;
  category: DecisionCategory;
  question: string;
  options: string[];
  selectedOption: number;
  responseTime: number;
  changed: boolean;
  timerPressure: number;
}

export interface DecisionData {
  scenarios: DecisionScenario[];
  averageResponseTime: number;
  changeCount: number;
}

export interface DecisionResult extends GameResult {
  valueAlignment: number;
  categoryBreakdown: {
    risk: number;
    ethics: number;
    practical: number;
    emotional: number;
  };
  stressResponsePattern: {
    becomesMorePragmatic: boolean;
    speedChange: number;
    changeFrequency: number;
  };
  synchronicity: {
    overallScore: number;
  };
}

// Duo Quiz Types
export type DuoCategory = 'relationship' | 'communication' | 'humor' | 'conflict';

export interface DuoQuestion {
  id: string;
  category: DuoCategory;
  question: string;
  options: string[];
  selfAnswer: number;
  twinAnswer: number;
}

export interface IconicDuo {
  id: string;
  name: string;
  description: string;
  archetype: string;
  traits: string[];
}

export interface DuoData {
  questions: DuoQuestion[];
}

export interface DuoResult extends GameResult {
  matchedDuo: IconicDuo;
  perceptionGap: number;
  keyTraits: string[];
  selfAwareness: number;
  synchronicity: {
    overallScore: number;
  };
}

// Base GameResult
export interface GameResult {
  gameType: GameType;
  completedAt: string;
  synchronicity: {
    overallScore: number;
  };
  insights: string[];
  shareable: boolean;
}

// ============================================================================
// Store Interface
// ============================================================================

interface GamesState {
  // Sessions
  sessions: GameSession[];
  currentSessionId: string | null;

  // Results
  results: GameResult[];

  // UI State
  isLoading: boolean;
  error: string | null;

  // Actions - Session Management
  startGameSession: (gameType: GameType, userId: string, twinId?: string) => string;
  updateGameSession: (sessionId: string, updates: Partial<GameSession>) => void;
  completeGameSession: (sessionId: string, rawData: any) => void;
  deleteGameSession: (sessionId: string) => void;

  // Actions - Results
  calculateResult: (userSessionId: string, twinSessionId: string) => GameResult | null;
  saveResult: (result: GameResult) => void;

  // Queries
  getSessionById: (sessionId: string) => GameSession | undefined;
  getSessionsByType: (gameType: GameType) => GameSession[];
  getCompletedSessions: (userId: string) => GameSession[];
  getTwinComparison: (gameType: GameType, userId: string, twinId: string) => {
    userSession?: GameSession;
    twinSession?: GameSession;
    result?: GameResult;
  };
  getLatestResults: (limit: number) => GameResult[];

  // Computed Values
  getOverallSynchronicity: () => number;
  getCompletionStatus: () => { [key in GameType]: boolean };
  getSynchronicityTrend: (gameType?: GameType) => number[];

  // Utility
  clearError: () => void;
  reset: () => void;
}

// ============================================================================
// Store Implementation
// ============================================================================

const initialState = {
  sessions: [],
  currentSessionId: null,
  results: [],
  isLoading: false,
  error: null,
};

export const useGamesStore = create<GamesState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Start a new game session
      startGameSession: (gameType: GameType, userId: string, twinId?: string) => {
        const sessionId = `${gameType}_${Date.now()}_${userId}`;
        const newSession: GameSession = {
          id: sessionId,
          gameType,
          userId,
          twinId,
          startedAt: new Date().toISOString(),
          rawData: {} as any, // Will be filled during gameplay
          status: 'in_progress',
        };

        set((state) => ({
          sessions: [...state.sessions, newSession],
          currentSessionId: sessionId,
          error: null,
        }));

        return sessionId;
      },

      // Update existing session
      updateGameSession: (sessionId: string, updates: Partial<GameSession>) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, ...updates } : s
          ),
        }));
      },

      // Complete game session
      completeGameSession: (sessionId: string, rawData: any) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  rawData,
                  completedAt: new Date().toISOString(),
                  status: 'completed' as GameStatus,
                }
              : s
          ),
          currentSessionId: null,
        }));
      },

      // Delete session
      deleteGameSession: (sessionId: string) => {
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== sessionId),
        }));
      },

      // Calculate result (will be implemented by analysis services)
      calculateResult: (userSessionId: string, twinSessionId: string) => {
        const userSession = get().sessions.find((s) => s.id === userSessionId);
        const twinSession = get().sessions.find((s) => s.id === twinSessionId);

        if (!userSession || !twinSession) {
          set({ error: 'Sessions not found for comparison' });
          return null;
        }

        if (userSession.gameType !== twinSession.gameType) {
          set({ error: 'Cannot compare different game types' });
          return null;
        }

        // Result calculation will be handled by specific analysis services
        // This is a placeholder that returns null - actual implementation in analysis services
        return null;
      },

      // Save calculated result
      saveResult: (result: GameResult) => {
        set((state) => ({
          results: [...state.results, result],
        }));
      },

      // Query: Get session by ID
      getSessionById: (sessionId: string) => {
        return get().sessions.find((s) => s.id === sessionId);
      },

      // Query: Get sessions by game type
      getSessionsByType: (gameType: GameType) => {
        return get().sessions.filter((s) => s.gameType === gameType);
      },

      // Query: Get completed sessions for user
      getCompletedSessions: (userId: string) => {
        return get().sessions.filter(
          (s) => s.userId === userId && s.status === 'completed'
        );
      },

      // Query: Get twin comparison data
      getTwinComparison: (gameType: GameType, userId: string, twinId: string) => {
        const sessions = get().sessions.filter((s) => s.gameType === gameType);
        const userSession = sessions.find(
          (s) => s.userId === userId && s.status === 'completed'
        );
        const twinSession = sessions.find(
          (s) => s.userId === twinId && s.status === 'completed'
        );

        const result = get().results.find(
          (r) => r.gameType === gameType &&
          userSession && twinSession &&
          (userSession.status === 'analyzed' || twinSession.status === 'analyzed')
        );

        return {
          userSession,
          twinSession,
          result,
        };
      },

      // Query: Get latest results
      getLatestResults: (limit: number) => {
        return get()
          .results.sort(
            (a, b) =>
              new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
          )
          .slice(0, limit);
      },

      // Computed: Overall synchronicity score
      getOverallSynchronicity: () => {
        const results = get().results;
        if (results.length === 0) return 0;

        const sum = results.reduce(
          (acc, r) => acc + r.synchronicity.overallScore,
          0
        );
        return Math.round(sum / results.length);
      },

      // Computed: Completion status for each game
      getCompletionStatus: () => {
        const sessions = get().sessions;
        return {
          maze: sessions.some((s) => s.gameType === 'maze' && s.status === 'completed'),
          emotion: sessions.some(
            (s) => s.gameType === 'emotion' && s.status === 'completed'
          ),
          decision: sessions.some(
            (s) => s.gameType === 'decision' && s.status === 'completed'
          ),
          duo: sessions.some((s) => s.gameType === 'duo' && s.status === 'completed'),
        };
      },

      // Computed: Synchronicity trend over time
      getSynchronicityTrend: (gameType?: GameType) => {
        let results = get().results;
        if (gameType) {
          results = results.filter((r) => r.gameType === gameType);
        }

        return results
          .sort(
            (a, b) =>
              new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
          )
          .map((r) => r.synchronicity.overallScore);
      },

      // Clear error
      clearError: () => set({ error: null }),

      // Reset store
      reset: () => set(initialState),
    }),
    {
      name: 'games-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        sessions: state.sessions,
        results: state.results,
      }),
    }
  )
);

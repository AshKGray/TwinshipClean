import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameState, GameSession, PsychicGameType, GameInvitation, Achievement, SyncScoreMetrics } from '../../../types/games';
import * as Haptics from 'expo-haptics';

interface GameActions {
  // Session Management
  createGameSession: (gameType: PsychicGameType, twinId: string) => GameSession;
  updateGameSession: (sessionId: string, updates: Partial<GameSession>) => void;
  completeGameSession: (sessionId: string, results: any) => void;
  cancelGameSession: (sessionId: string) => void;
  
  // Invitations
  sendGameInvitation: (toUserId: string, gameType: PsychicGameType) => void;
  acceptInvitation: (invitationId: string) => void;
  declineInvitation: (invitationId: string) => void;
  
  // Game Play
  makeChoice: (sessionId: string, choice: any, responseTime: number) => void;
  calculateSyncScore: (session: GameSession) => number;
  
  // Achievements
  checkAchievements: () => void;
  unlockAchievement: (achievementId: string) => void;
  
  // Analytics
  updateSyncMetrics: (session: GameSession) => void;
  getGameStats: (gameType?: PsychicGameType) => any;
  
  // Connection
  setConnectionStatus: (status: 'online' | 'offline' | 'connecting') => void;
  
  // Reset
  resetGameState: () => void;
}

type GameStore = GameState & GameActions;

const initialSyncMetrics: SyncScoreMetrics = {
  totalGames: 0,
  perfectMatches: 0,
  streakCount: 0,
  maxStreak: 0,
  averageResponseTimeDiff: 0,
  syncPercentage: 0,
  gameTypeStats: {
    color_sync: { played: 0, matches: 0, averageScore: 0 },
    number_intuition: { played: 0, matches: 0, averageScore: 0 },
    emotion_mirror: { played: 0, matches: 0, averageScore: 0 },
    symbol_connection: { played: 0, matches: 0, averageScore: 0 },
    time_sync: { played: 0, matches: 0, averageScore: 0 }
  }
};

const defaultAchievements: Achievement[] = [
  {
    id: 'first_match',
    name: 'First Sync',
    description: 'Achieve your first perfect match',
    icon: 'flash',
    unlocked: false,
    category: 'sync',
    requirement: { type: 'perfect_matches', value: 1 }
  },
  {
    id: 'streak_5',
    name: 'Sync Master',
    description: 'Get 5 perfect matches in a row',
    icon: 'flame',
    unlocked: false,
    category: 'streak',
    requirement: { type: 'streak', value: 5 }
  },
  {
    id: 'color_master',
    name: 'Color Harmony',
    description: 'Master the Color Sync game with 10 perfect matches',
    icon: 'color-palette',
    unlocked: false,
    category: 'mastery',
    requirement: { type: 'perfect_matches', value: 10, gameType: 'color_sync' }
  },
  {
    id: 'mind_reader',
    name: 'Mind Reader',
    description: 'Achieve 80% sync rate across all games',
    icon: 'eye',
    unlocked: false,
    category: 'special',
    requirement: { type: 'sync_percentage', value: 80 }
  }
];

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // Initial State
      currentSession: null,
      gameHistory: [],
      syncMetrics: initialSyncMetrics,
      achievements: defaultAchievements,
      activeInvitations: [],
      isConnected: false,
      connectionStatus: 'offline',

      // Session Management
      createGameSession: (gameType, twinId) => {
        const session: GameSession = {
          id: Date.now().toString(),
          gameType,
          hostId: 'current_user', // In real app, get from auth
          twinId,
          status: 'waiting',
          createdAt: new Date().toISOString(),
          difficulty: 'medium',
          maxRounds: 3,
          currentRound: 0,
          results: [],
          syncScore: 0
        };
        
        set({ currentSession: session });
        return session;
      },

      updateGameSession: (sessionId, updates) => {
        set(state => ({
          currentSession: state.currentSession?.id === sessionId 
            ? { ...state.currentSession, ...updates } 
            : state.currentSession,
          gameHistory: state.gameHistory.map(session => 
            session.id === sessionId ? { ...session, ...updates } : session
          )
        }));
      },

      completeGameSession: (sessionId, results) => {
        const state = get();
        const session = state.currentSession;
        
        if (session && session.id === sessionId) {
          const completedSession: GameSession = {
            ...session,
            status: 'completed',
            completedAt: new Date().toISOString(),
            results,
            syncScore: get().calculateSyncScore(session)
          };
          
          set(state => ({
            currentSession: null,
            gameHistory: [completedSession, ...state.gameHistory]
          }));
          
          // Update metrics and check achievements
          get().updateSyncMetrics(completedSession);
          get().checkAchievements();
        }
      },

      cancelGameSession: (sessionId) => {
        set(state => ({
          currentSession: state.currentSession?.id === sessionId ? null : state.currentSession
        }));
      },

      // Game Play
      makeChoice: (sessionId, choice, responseTime) => {
        const state = get();
        const session = state.currentSession;
        
        if (session && session.id === sessionId) {
          const updatedSession = {
            ...session,
            hostChoice: choice,
            status: 'in_progress' as const
          };
          
          set({ currentSession: updatedSession });
          
          // Simulate twin response (in real app, wait for WebSocket)
          setTimeout(() => {
            get().simulateTwinResponse(sessionId, responseTime);
          }, 1000 + Math.random() * 2000);
        }
      },

      simulateTwinResponse: (sessionId: string, hostResponseTime: number) => {
        console.log('Simulating twin response for session:', sessionId);
        const state = get();
        const session = state.currentSession;
        
        if (session && session.id === sessionId) {
          const twinResponseTime = hostResponseTime + (Math.random() - 0.5) * 1000;
          const isMatch = Math.random() > 0.6; // 40% match rate for demo
          
          let twinChoice;
          if (session.gameType === 'color_sync') {
            const colors = ['#ff1493', '#00bfff', '#00ff7f', '#ffff00', '#8a2be2', '#ff4500'];
            twinChoice = isMatch ? session.hostChoice : colors[Math.floor(Math.random() * colors.length)];
          } else if (session.gameType === 'number_intuition') {
            twinChoice = isMatch ? session.hostChoice : Math.floor(Math.random() * 10) + 1;
          } else {
            twinChoice = session.hostChoice; // Default to match for other games
          }
          
          const roundResult = {
            round: session.currentRound + 1,
            hostChoice: session.hostChoice,
            twinChoice,
            isMatch: session.hostChoice === twinChoice,
            responseTimeDiff: Math.abs(hostResponseTime - twinResponseTime),
            timestamp: new Date().toISOString()
          };
          
          const updatedSession = {
            ...session,
            twinChoice,
            currentRound: session.currentRound + 1,
            results: [...session.results, roundResult]
          };
          
          set({ currentSession: updatedSession });
          
          // Haptic feedback
          if (roundResult.isMatch) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          
          // Complete game if max rounds reached
          if (updatedSession.currentRound >= updatedSession.maxRounds) {
            setTimeout(() => {
              get().completeGameSession(sessionId, updatedSession.results);
            }, 2000);
          }
        }
      },

      calculateSyncScore: (session) => {
        if (session.results.length === 0) return 0;
        
        const matches = session.results.filter(r => r.isMatch).length;
        const baseScore = (matches / session.results.length) * 100;
        
        // Bonus for response time synchronicity
        const avgTimeDiff = session.results.reduce((sum, r) => sum + r.responseTimeDiff, 0) / session.results.length;
        const timeBonus = Math.max(0, (2000 - avgTimeDiff) / 2000) * 20;
        
        return Math.round(Math.min(100, baseScore + timeBonus));
      },

      // Achievements
      checkAchievements: () => {
        const state = get();
        const { syncMetrics, achievements } = state;
        
        achievements.forEach(achievement => {
          if (!achievement.unlocked) {
            let shouldUnlock = false;
            
            switch (achievement.requirement.type) {
              case 'perfect_matches':
                if (achievement.requirement.gameType) {
                  const gameStats = syncMetrics.gameTypeStats[achievement.requirement.gameType];
                  shouldUnlock = gameStats.matches >= achievement.requirement.value;
                } else {
                  shouldUnlock = syncMetrics.perfectMatches >= achievement.requirement.value;
                }
                break;
              case 'streak':
                shouldUnlock = syncMetrics.maxStreak >= achievement.requirement.value;
                break;
              case 'sync_percentage':
                shouldUnlock = syncMetrics.syncPercentage >= achievement.requirement.value;
                break;
            }
            
            if (shouldUnlock) {
              get().unlockAchievement(achievement.id);
            }
          }
        });
      },

      unlockAchievement: (achievementId) => {
        set(state => ({
          achievements: state.achievements.map(achievement =>
            achievement.id === achievementId
              ? { ...achievement, unlocked: true, unlockedAt: new Date().toISOString() }
              : achievement
          )
        }));
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      },

      // Metrics
      updateSyncMetrics: (session) => {
        set(state => {
          const currentStats = state.syncMetrics.gameTypeStats[session.gameType];
          const matches = session.results.filter(r => r.isMatch).length;
          const newMatches = matches > 0;
          
          const updatedGameTypeStats = {
            ...state.syncMetrics.gameTypeStats,
            [session.gameType]: {
              played: currentStats.played + 1,
              matches: currentStats.matches + matches,
              averageScore: ((currentStats.averageScore * currentStats.played) + session.syncScore) / (currentStats.played + 1)
            }
          };
          
          const totalMatches = Object.values(updatedGameTypeStats).reduce((sum, stats) => sum + stats.matches, 0);
          const totalGames = Object.values(updatedGameTypeStats).reduce((sum, stats) => sum + stats.played, 0);
          
          const newStreak = newMatches ? state.syncMetrics.streakCount + 1 : 0;
          
          return {
            syncMetrics: {
              ...state.syncMetrics,
              totalGames,
              perfectMatches: totalMatches,
              streakCount: newStreak,
              maxStreak: Math.max(state.syncMetrics.maxStreak, newStreak),
              syncPercentage: totalGames > 0 ? Math.round((totalMatches / totalGames) * 100) : 0,
              gameTypeStats: updatedGameTypeStats
            }
          };
        });
      },

      getGameStats: (gameType) => {
        const { syncMetrics } = get();
        
        if (gameType) {
          return syncMetrics.gameTypeStats[gameType];
        }
        
        return {
          totalGames: syncMetrics.totalGames,
          perfectMatches: syncMetrics.perfectMatches,
          syncPercentage: syncMetrics.syncPercentage,
          streak: syncMetrics.streakCount,
          maxStreak: syncMetrics.maxStreak
        };
      },

      // Invitations (placeholder for real-time features)
      sendGameInvitation: (toUserId, gameType) => {
        const invitation: GameInvitation = {
          id: Date.now().toString(),
          fromUserId: 'current_user',
          toUserId,
          gameType,
          status: 'pending',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
        };
        
        set(state => ({
          activeInvitations: [...state.activeInvitations, invitation]
        }));
      },

      acceptInvitation: (invitationId) => {
        set(state => ({
          activeInvitations: state.activeInvitations.map(inv =>
            inv.id === invitationId ? { ...inv, status: 'accepted' } : inv
          )
        }));
      },

      declineInvitation: (invitationId) => {
        set(state => ({
          activeInvitations: state.activeInvitations.map(inv =>
            inv.id === invitationId ? { ...inv, status: 'declined' } : inv
          )
        }));
      },

      // Connection
      setConnectionStatus: (status) => {
        set({ connectionStatus: status, isConnected: status === 'online' });
      },

      // Reset
      resetGameState: () => {
        set({
          currentSession: null,
          gameHistory: [],
          syncMetrics: initialSyncMetrics,
          achievements: defaultAchievements.map(a => ({ ...a, unlocked: false, unlockedAt: undefined })),
          activeInvitations: []
        });
      }
    }),
    {
      name: 'psychic-games-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        gameHistory: state.gameHistory.slice(0, 50), // Keep last 50 games
        syncMetrics: state.syncMetrics,
        achievements: state.achievements
      })
    }
  )
);
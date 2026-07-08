import { getZodiacSign } from "../utils/zodiac";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { shallow } from "zustand/shallow";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSupportStore } from "./supportStore";

export type TwinType = "identical" | "fraternal" | "other";
export type ThemeColor = "neon-pink" | "neon-blue" | "neon-green" | "neon-yellow" | "neon-purple" | "neon-orange" | "neon-cyan" | "neon-red";

export interface TwinProfile {
  id: string;
  name: string;
  age: number;
  gender: string;
  sexualOrientation?: string;
  showSexualOrientation?: boolean;
  twinType: TwinType;
  otherTwinTypeDescription?: string;
  twinDeceased?: boolean;
  birthDate: string;
  zodiacSign?: string;
  placeOfBirth?: string;
  timeOfBirth?: string;
  profilePicture?: string;
  accentColor: ThemeColor;
  isConnected: boolean;
  lastSeen?: string;
}

export interface TwintuitionAlert {
  id: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type: "feeling" | "thought" | "action";
}

// Updated game types for new system
export type GameType = "cognitive_sync_maze" | "emotional_resonance" | "temporal_decision" | "iconic_duo";

export interface GameInsight {
  type: string;
  message: string;
  data: any;
}

export interface GameResult {
  id: string;
  gameType: GameType;
  score: number;
  timestamp: string;
  twinScore: number;
  insights?: GameInsight[];
  cognitiveData?: any;
  emotionalData?: any;
  decisionData?: any;
  duoData?: any;
}

export interface Story {
  id: string;
  title: string;
  content: string;
  photos: string[];
  timestamp: string;
  isShared: boolean;
  milestone?: boolean;
}

interface TwinState {
  // Profile & Setup
  isOnboarded: boolean;
  userProfile: TwinProfile | null;
  twinProfile: TwinProfile | null;
  themeColor: ThemeColor;
  
  // Features
  twintuitionAlerts: TwintuitionAlert[];
  gameResults: GameResult[];
  stories: Story[];
  syncScore: number;
  
  // Pairing
  shareCode: string | null;
  paired: boolean;
  pendingInvitation: {
    email?: string;
    phone?: string;
    status: 'pending' | 'accepted' | 'declined';
  } | null;
  
  // New invitation system integration
  invitationToken: string | null;
  invitationStatus: 'none' | 'sent' | 'received' | 'processing' | 'accepted' | 'declined';
  lastInvitationSent: string | null;
  invitationHistory: Array<{
    id: string;
    type: 'sent' | 'received';
    timestamp: string;
    status: 'pending' | 'accepted' | 'declined' | 'expired';
    recipientName?: string;
    senderName?: string;
  }>;

  // Settings
  researchParticipation: boolean;
  notificationsEnabled: boolean;
  
  // Research integration
  hasActiveResearchStudies: boolean;
  researchContributions: number;
  
  // Actions
  setOnboarded: (onboarded: boolean) => void;
  setUserProfile: (profile: TwinProfile) => void;
  setTwinProfile: (profile: TwinProfile) => void;
  setShareCode: (code: string | null) => void;
  setPaired: (value: boolean) => void;
  setPendingInvitation: (invitation: { email?: string; phone?: string; status: 'pending' | 'accepted' | 'declined'; } | null) => void;
  
  // New invitation actions
  setInvitationToken: (token: string | null) => void;
  setInvitationStatus: (status: TwinState['invitationStatus']) => void;
  setLastInvitationSent: (timestamp: string | null) => void;
  addInvitationToHistory: (invitation: TwinState['invitationHistory'][0]) => void;
  
  signOut: () => void;
  addTwintuitionAlert: (alert: Omit<TwintuitionAlert, "id" | "timestamp">) => void;
  markAlertAsRead: (alertId: string) => void;
  
  // Updated game methods
  addGameResult: (result: Omit<GameResult, "id" | "timestamp">) => void;
  calculateSyncScore: () => void;
  getGameTypeStats: (gameType: GameType) => { played: number; averageScore: number; bestScore: number; };
  getInsightsByType: (insightType: string) => GameInsight[];
  
  addStory: (story: Omit<Story, "id" | "timestamp">) => void;
  updateStory: (storyId: string, updates: Partial<Story>) => void;
  setResearchParticipation: (participate: boolean) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setHasActiveResearchStudies: (hasStudies: boolean) => void;
  incrementResearchContributions: () => void;
}

export const useTwinStore = create<TwinState>()(
  persist(
    (set, get) => ({
      // Initial state
      isOnboarded: false,
      userProfile: null,
      twinProfile: null,
      themeColor: "neon-purple",
      twintuitionAlerts: [],
      gameResults: [],
      stories: [],
      syncScore: 0,
      researchParticipation: false,
      notificationsEnabled: true,
      hasActiveResearchStudies: false,
      researchContributions: 0,
      shareCode: null,
      paired: false,
      pendingInvitation: null,
      
      // New invitation system
      invitationToken: null,
      invitationStatus: 'none',
      lastInvitationSent: null,
      invitationHistory: [],

      // Actions
      setOnboarded: (onboarded) => set({ isOnboarded: onboarded }),
      
      setUserProfile: (profile) => {
        if (profile.birthDate) {
          const date = new Date(profile.birthDate);
          const month = date.getMonth() + 1;
          const day = date.getDate();
          profile.zodiacSign = getZodiacSign(month, day);
        } else {
          profile.zodiacSign = "Unknown";
        }
        set({ 
          userProfile: profile,
          themeColor: profile.accentColor || "neon-purple"
        });
      },
      
      setTwinProfile: (profile) => {
        if (profile.birthDate) {
          const date = new Date(profile.birthDate);
          const month = date.getMonth() + 1;
          const day = date.getDate();
          profile.zodiacSign = getZodiacSign(month, day);
        } else {
          profile.zodiacSign = "Unknown";
        }
        set({ twinProfile: profile });
      },
      
      setPendingInvitation: (invitation) => set({ pendingInvitation: invitation }),
      
      // New invitation actions
      setInvitationToken: (token) => set({ invitationToken: token }),
      
      setInvitationStatus: (status) => set({ invitationStatus: status }),
      
      setLastInvitationSent: (timestamp) => set({ lastInvitationSent: timestamp }),
      
      addInvitationToHistory: (invitation) => {
        const history = get().invitationHistory;
        set({ invitationHistory: [invitation, ...history.slice(0, 9)] }); // Keep last 10
      },

      setShareCode: (code) => set({ shareCode: code }),

      setPaired: (value) => set({ 
        paired: value,
        userProfile: get().userProfile ? { ...get().userProfile!, isConnected: value } : null,
        twinProfile: get().twinProfile ? { ...get().twinProfile!, isConnected: value } : null,
      }),
      
      signOut: () => {
        const { reset: resetSupportStore } = useSupportStore.getState();
        if (typeof resetSupportStore === "function") {
          resetSupportStore();
        }

        AsyncStorage.removeItem("twin-support-store").catch((error) => {
          console.error("Failed to clear support storage", error);
        });

        set({
          isOnboarded: false,
          userProfile: null,
          twinProfile: null,
          themeColor: "neon-purple",
          shareCode: null,
          paired: false,
          pendingInvitation: null,
          invitationToken: null,
          invitationStatus: 'none',
          lastInvitationSent: null,
          invitationHistory: [],
          twintuitionAlerts: [],
          gameResults: [],
          stories: [],
          syncScore: 0,
          researchParticipation: false,
          notificationsEnabled: true,
          hasActiveResearchStudies: false,
          researchContributions: 0,
        });
      },
      
      addTwintuitionAlert: (alert) => {
        const newAlert: TwintuitionAlert = {
          ...alert,
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          isRead: false,
        };
        set((state) => ({
          twintuitionAlerts: [newAlert, ...state.twintuitionAlerts],
        }));
      },
      
      markAlertAsRead: (alertId) =>
        set((state) => ({
          twintuitionAlerts: state.twintuitionAlerts.map((alert) =>
            alert.id === alertId ? { ...alert, isRead: true } : alert
          ),
        })),
      
      // Updated game result method
      addGameResult: (result) => {
        const newResult: GameResult = {
          ...result,
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
        };
        set((state) => ({
          gameResults: [newResult, ...state.gameResults],
        }));
        
        // Recalculate sync score after adding result
        get().calculateSyncScore();
      },
      
      calculateSyncScore: () => {
        const results = get().gameResults;
        if (results.length === 0) {
          set({ syncScore: 0 });
          return;
        }
        
        const totalScore = results.reduce((acc, result) => acc + result.score, 0);
        const avgScore = totalScore / results.length;
        
        set({ syncScore: avgScore });
      },
      
      getGameTypeStats: (gameType) => {
        const state = get();
        const gameTypeResults = state.gameResults.filter(result => result.gameType === gameType);
        const totalScore = gameTypeResults.reduce((sum, result) => sum + result.score, 0);
        const bestScore = gameTypeResults.length > 0 ? Math.max(...gameTypeResults.map(r => r.score)) : 0;
        
        return {
          played: gameTypeResults.length,
          averageScore: gameTypeResults.length > 0 ? Math.round(totalScore / gameTypeResults.length) : 0,
          bestScore
        };
      },
      
      getInsightsByType: (insightType) => {
        const state = get();
        const allInsights: GameInsight[] = [];
        
        state.gameResults.forEach(result => {
          if (result.insights) {
            const typeInsights = result.insights.filter(i => i.type === insightType);
            allInsights.push(...typeInsights);
          }
        });
        
        return allInsights;
      },
      
      addStory: (story) => {
        const newStory: Story = {
          ...story,
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
        };
        set((state) => ({
          stories: [newStory, ...state.stories],
        }));
      },
      
      updateStory: (storyId, updates) =>
        set((state) => ({
          stories: state.stories.map((story) =>
            story.id === storyId ? { ...story, ...updates } : story
          ),
        })),
      
      setResearchParticipation: (participate) =>
        set({ researchParticipation: participate }),
        
      setHasActiveResearchStudies: (hasStudies: boolean) =>
        set({ hasActiveResearchStudies: hasStudies }),
        
      incrementResearchContributions: () =>
        set((state) => ({ researchContributions: state.researchContributions + 1 })),
      
      setNotificationsEnabled: (enabled) =>
        set({ notificationsEnabled: enabled }),
    }),
    {
      name: "twin-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isOnboarded: state.isOnboarded,
        userProfile: state.userProfile,
        twinProfile: state.twinProfile,
        themeColor: state.themeColor,
        researchParticipation: state.researchParticipation,
        notificationsEnabled: state.notificationsEnabled,
        hasActiveResearchStudies: state.hasActiveResearchStudies,
        researchContributions: state.researchContributions,
        shareCode: state.shareCode,
        paired: state.paired,
        invitationToken: state.invitationToken,
        invitationStatus: state.invitationStatus,
        lastInvitationSent: state.lastInvitationSent,
        invitationHistory: state.invitationHistory,
        pendingInvitation: state.pendingInvitation,
        gameResults: state.gameResults,
        syncScore: state.syncScore,
      }),
    }
  )
);

// Non-persisted store for temporary data
interface TempTwinState {
  currentChatMessages: any[];
  isTyping: boolean;
  connectionStatus: "connected" | "disconnected" | "connecting";
  
  setChatMessages: (messages: any[]) => void;
  addChatMessage: (message: any) => void;
  setIsTyping: (typing: boolean) => void;
  setConnectionStatus: (status: "connected" | "disconnected" | "connecting") => void;
}

export const useTempTwinStore = create<TempTwinState>((set) => ({
  currentChatMessages: [],
  isTyping: false,
  connectionStatus: "disconnected",
  
  setChatMessages: (messages) => set({ currentChatMessages: messages }),
  
  addChatMessage: (message) =>
    set((state) => ({
      currentChatMessages: [...state.currentChatMessages, message],
    })),
  
  setIsTyping: (typing) => set({ isTyping: typing }),
  
  setConnectionStatus: (status) => set({ connectionStatus: status }),
}));

// Performance-optimized selectors for common use cases
export const useTwinStoreShallow = {
  // Profile-only selectors to prevent unnecessary re-renders
  userProfile: () => useTwinStore((state) => state.userProfile, shallow),
  twinProfile: () => useTwinStore((state) => state.twinProfile, shallow),
  profiles: () => useTwinStore((state) => ({ userProfile: state.userProfile, twinProfile: state.twinProfile }), shallow),

  // Theme and UI selectors
  themeInfo: () => useTwinStore((state) => ({ themeColor: state.themeColor, accentColor: state.userProfile?.accentColor }), shallow),

  // Connection state selectors
  connectionState: () => useTwinStore((state) => ({ paired: state.paired, isOnboarded: state.isOnboarded }), shallow),

  // Game and activity selectors
  gameData: () => useTwinStore((state) => ({ gameResults: state.gameResults, syncScore: state.syncScore }), shallow),

  // Settings selectors
  settingsState: () => useTwinStore((state) => ({
    researchParticipation: state.researchParticipation,
    notificationsEnabled: state.notificationsEnabled,
    hasActiveResearchStudies: state.hasActiveResearchStudies
  }), shallow),

  // Invitation selectors
  invitationState: () => useTwinStore((state) => ({
    invitationStatus: state.invitationStatus,
    invitationToken: state.invitationToken,
    lastInvitationSent: state.lastInvitationSent
  }), shallow),
};
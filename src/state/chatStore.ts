import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage, TypingIndicator, ChatConnection, TwintuitionMoment } from '../types/chat';
import { ThemeColor } from './twinStore';

interface ChatState {
  // Messages
  messages: ChatMessage[];
  unsentMessages: ChatMessage[];
  
  // Connection
  connection: ChatConnection;
  typingIndicator: TypingIndicator | null;
  
  // Twintuition
  twintuitionMoments: TwintuitionMoment[];
  
  // UI State
  isVoiceRecording: boolean;
  showQuickResponses: boolean;
  selectedMessageId: string | null;
  
  // Actions
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp' | 'isDelivered' | 'isRead'>) => void;
  updateMessage: (messageId: string, updates: Partial<ChatMessage>) => void;
  deleteMessage: (messageId: string) => void;
  markAsRead: (messageId: string) => void;
  markAsDelivered: (messageId: string) => void;
  addReaction: (messageId: string, emoji: string, userId: string, userName: string) => void;
  removeReaction: (messageId: string, emoji: string, userId: string) => void;
  
  // Connection
  setConnection: (connection: Partial<ChatConnection>) => void;
  setTypingIndicator: (indicator: TypingIndicator | null) => void;
  incrementUnreadCount: () => void;
  resetUnreadCount: () => void;
  
  // Twintuition
  addTwintuitionMoment: (moment: Omit<TwintuitionMoment, 'id' | 'timestamp'>) => void;
  
  // UI
  setVoiceRecording: (recording: boolean) => void;
  setShowQuickResponses: (show: boolean) => void;
  setSelectedMessage: (messageId: string | null) => void;
  
  // Utilities
  getUnreadMessages: () => ChatMessage[];
  getMessagesByDate: (date: string) => ChatMessage[];
  searchMessages: (query: string) => ChatMessage[];
  clearChat: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // Initial state
      messages: [],
      unsentMessages: [],
      connection: {
        status: 'disconnected',
        unreadCount: 0,
      },
      typingIndicator: null,
      twintuitionMoments: [],
      isVoiceRecording: false,
      showQuickResponses: false,
      selectedMessageId: null,

      // Message actions
      addMessage: (messageData) => {
        const message: ChatMessage = {
          ...messageData,
          id: Date.now().toString() + Math.random().toString(36),
          timestamp: new Date().toISOString(),
          isDelivered: false,
          isRead: false,
          reactions: [],
        };

        set((state) => ({
          messages: [...state.messages, message],
        }));
      },

      updateMessage: (messageId, updates) => {
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === messageId ? { ...msg, ...updates } : msg
          ),
        }));
      },

      deleteMessage: (messageId) => {
        set((state) => ({
          messages: state.messages.filter((msg) => msg.id !== messageId),
        }));
      },

      markAsRead: (messageId) => {
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === messageId ? { ...msg, isRead: true } : msg
          ),
        }));
      },

      markAsDelivered: (messageId) => {
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === messageId ? { ...msg, isDelivered: true } : msg
          ),
        }));
      },

      addReaction: (messageId, emoji, userId, userName) => {
        set((state) => ({
          messages: state.messages.map((msg) => {
            if (msg.id === messageId) {
              const existingReaction = msg.reactions?.find(
                (r) => r.emoji === emoji && r.userId === userId
              );
              if (!existingReaction) {
                return {
                  ...msg,
                  reactions: [
                    ...(msg.reactions || []),
                    {
                      emoji,
                      userId,
                      userName,
                      timestamp: new Date().toISOString(),
                    },
                  ],
                };
              }
            }
            return msg;
          }),
        }));
      },

      removeReaction: (messageId, emoji, userId) => {
        set((state) => ({
          messages: state.messages.map((msg) => {
            if (msg.id === messageId) {
              return {
                ...msg,
                reactions: msg.reactions?.filter(
                  (r) => !(r.emoji === emoji && r.userId === userId)
                ) || [],
              };
            }
            return msg;
          }),
        }));
      },

      // Connection actions
      setConnection: (connectionUpdates) => {
        set((state) => ({
          connection: { ...state.connection, ...connectionUpdates },
        }));
      },

      setTypingIndicator: (indicator) => {
        set({ typingIndicator: indicator });
      },

      incrementUnreadCount: () => {
        set((state) => ({
          connection: {
            ...state.connection,
            unreadCount: state.connection.unreadCount + 1,
          },
        }));
      },

      resetUnreadCount: () => {
        set((state) => ({
          connection: { ...state.connection, unreadCount: 0 },
        }));
      },

      // Twintuition actions
      addTwintuitionMoment: (momentData) => {
        const moment: TwintuitionMoment = {
          ...momentData,
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
        };

        set((state) => ({
          twintuitionMoments: [moment, ...state.twintuitionMoments],
        }));
      },

      // UI actions
      setVoiceRecording: (recording) => {
        set({ isVoiceRecording: recording });
      },

      setShowQuickResponses: (show) => {
        set({ showQuickResponses: show });
      },

      setSelectedMessage: (messageId) => {
        set({ selectedMessageId: messageId });
      },

      // Utility functions
      getUnreadMessages: () => {
        return get().messages.filter((msg) => !msg.isRead);
      },

      getMessagesByDate: (date) => {
        return get().messages.filter((msg) =>
          msg.timestamp.startsWith(date)
        );
      },

      searchMessages: (query) => {
        const lowerQuery = query.toLowerCase();
        return get().messages.filter((msg) =>
          msg.text.toLowerCase().includes(lowerQuery) ||
          msg.senderName.toLowerCase().includes(lowerQuery)
        );
      },

      clearChat: () => {
        set({
          messages: [],
          unsentMessages: [],
          twintuitionMoments: [],
          selectedMessageId: null,
        });
      },
    }),
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        messages: state.messages,
        twintuitionMoments: state.twintuitionMoments,
        connection: {
          unreadCount: state.connection.unreadCount,
          lastSeen: state.connection.lastSeen,
        },
      }),
    }
  )
);

// Performance-optimized selectors for chat store
export const useChatStoreShallow = {
  // Message-related selectors
  messages: () => useChatStore((state) => state.messages, shallow),
  messageStats: () => useChatStore((state) => ({
    messageCount: state.messages.length,
    unreadCount: state.connection.unreadCount
  }), shallow),

  // Connection state
  connectionInfo: () => useChatStore((state) => ({
    connection: state.connection,
    typingIndicator: state.typingIndicator
  }), shallow),

  // UI state
  uiState: () => useChatStore((state) => ({
    isVoiceRecording: state.isVoiceRecording,
    showQuickResponses: state.showQuickResponses,
    selectedMessageId: state.selectedMessageId
  }), shallow),

  // Twintuition data
  twintuitionData: () => useChatStore((state) => state.twintuitionMoments, shallow),
};

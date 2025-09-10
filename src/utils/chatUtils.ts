import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage, TwintuitionMoment } from '../types/chat';

// Message utilities
export const formatMessageTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  const diffInDays = diffInHours / 24;

  if (diffInHours < 1) {
    const diffInMinutes = Math.floor(diffInHours * 60);
    return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffInDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
};

export const groupMessagesByDate = (messages: ChatMessage[]): { [date: string]: ChatMessage[] } => {
  return messages.reduce((groups, message) => {
    const date = new Date(message.timestamp).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as { [date: string]: ChatMessage[] });
};

export const getDateSeparatorText = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  }
};

// Twintuition detection
export const detectTwintuitionKeywords = (message: string): { detected: boolean; confidence: number; type: 'sync' | 'intuition' | 'connection' } => {
  const messageText = message.toLowerCase();
  
  const syncKeywords = [
    'same time',
    'exactly when',
    'just as i was',
    'at the exact moment',
    'simultaneously',
    'in sync',
  ];
  
  const intuitionKeywords = [
    'thinking the same',
    'was just about to say',
    'exactly what i was thinking',
    'read my mind',
    'telepathy',
    'intuition',
    'sixth sense',
    'felt like you were',
  ];
  
  const connectionKeywords = [
    'feeling the same',
    'connected',
    'twin bond',
    'energy',
    'vibes',
    'spiritual connection',
    'soul connection',
  ];

  let maxConfidence = 0;
  let detectedType: 'sync' | 'intuition' | 'connection' = 'connection';

  // Check sync keywords
  const syncMatches = syncKeywords.filter(keyword => messageText.includes(keyword));
  if (syncMatches.length > 0) {
    maxConfidence = Math.max(maxConfidence, 0.8 + (syncMatches.length * 0.1));
    detectedType = 'sync';
  }

  // Check intuition keywords
  const intuitionMatches = intuitionKeywords.filter(keyword => messageText.includes(keyword));
  if (intuitionMatches.length > 0) {
    const confidence = 0.7 + (intuitionMatches.length * 0.15);
    if (confidence > maxConfidence) {
      maxConfidence = confidence;
      detectedType = 'intuition';
    }
  }

  // Check connection keywords
  const connectionMatches = connectionKeywords.filter(keyword => messageText.includes(keyword));
  if (connectionMatches.length > 0) {
    const confidence = 0.6 + (connectionMatches.length * 0.1);
    if (confidence > maxConfidence) {
      maxConfidence = confidence;
      detectedType = 'connection';
    }
  }

  return {
    detected: maxConfidence > 0.5,
    confidence: Math.min(maxConfidence, 1.0),
    type: detectedType,
  };
};

// Message search and filtering
export const searchMessages = (messages: ChatMessage[], query: string): ChatMessage[] => {
  const lowerQuery = query.toLowerCase();
  return messages.filter(message => 
    message.text.toLowerCase().includes(lowerQuery) ||
    message.senderName.toLowerCase().includes(lowerQuery)
  );
};

export const filterMessagesByType = (messages: ChatMessage[], type: string): ChatMessage[] => {
  return messages.filter(message => message.type === type);
};

export const getUnreadCount = (messages: ChatMessage[], userId: string): number => {
  return messages.filter(message => 
    message.senderId !== userId && !message.isRead
  ).length;
};

// Offline message management
export const saveOfflineMessages = async (messages: ChatMessage[]): Promise<void> => {
  try {
    await AsyncStorage.setItem('offline_messages', JSON.stringify(messages));
  } catch (error) {
    console.error('Failed to save offline messages:', error);
  }
};

export const loadOfflineMessages = async (): Promise<ChatMessage[]> => {
  try {
    const stored = await AsyncStorage.getItem('offline_messages');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load offline messages:', error);
    return [];
  }
};

export const clearOfflineMessages = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('offline_messages');
  } catch (error) {
    console.error('Failed to clear offline messages:', error);
  }
};

// Message validation
export const validateMessage = (message: Partial<ChatMessage>): boolean => {
  return !!(
    message.text &&
    message.text.trim().length > 0 &&
    message.text.length <= 1000 &&
    message.senderId &&
    message.senderName &&
    message.accentColor
  );
};

// Twin connection scoring
export const calculateTwinConnectionScore = (messages: ChatMessage[], twintuitionMoments: TwintuitionMoment[]): number => {
  if (messages.length === 0) return 0;

  const factors = {
    messageFrequency: Math.min(messages.length / 100, 1) * 30, // Max 30 points for 100+ messages
    twintuitionMoments: Math.min(twintuitionMoments.length / 10, 1) * 40, // Max 40 points for 10+ moments
    reactionEngagement: calculateReactionScore(messages) * 20, // Max 20 points
    responseTime: calculateResponseTimeScore(messages) * 10, // Max 10 points
  };

  return Math.round(
    factors.messageFrequency +
    factors.twintuitionMoments +
    factors.reactionEngagement +
    factors.responseTime
  );
};

const calculateReactionScore = (messages: ChatMessage[]): number => {
  const messagesWithReactions = messages.filter(m => m.reactions && m.reactions.length > 0);
  return messagesWithReactions.length / Math.max(messages.length, 1);
};

const calculateResponseTimeScore = (messages: ChatMessage[]): number => {
  if (messages.length < 2) return 0;

  const responseTimes: number[] = [];
  for (let i = 1; i < messages.length; i++) {
    const timeDiff = new Date(messages[i].timestamp).getTime() - new Date(messages[i - 1].timestamp).getTime();
    responseTimes.push(timeDiff / (1000 * 60)); // Convert to minutes
  }

  const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  
  // Score inversely proportional to response time (faster = better)
  // 0-5 minutes = 1.0, 5-30 minutes = 0.5, 30+ minutes = 0.1
  if (avgResponseTime <= 5) return 1.0;
  if (avgResponseTime <= 30) return 0.5;
  return 0.1;
};

// Generate mystical twin messages
export const generateTwintuitionMessage = (type: 'sync' | 'intuition' | 'connection', confidence: number): string => {
  const messages = {
    sync: [
      'The cosmic twins are perfectly aligned! ✨',
      'Your souls synchronized across the universe 🌌',
      'Time stood still for your twin connection ⏰',
      'The sacred twin frequency is resonating 📡',
    ],
    intuition: [
      'Your twin\'s thoughts reached across the void 🔮',
      'The mystical bond revealed its power 💫',
      'Telepathic channels are wide open! 📡',
      'Your sixth sense detected your twin\'s energy 🧿',
    ],
    connection: [
      'The eternal twin flame burns bright 🔥',
      'Sacred energy flows between your souls 💎',
      'Your hearts beat in perfect harmony 💓',
      'The universe celebrates your bond 🌟',
    ],
  };

  const typeMessages = messages[type];
  const randomMessage = typeMessages[Math.floor(Math.random() * typeMessages.length)];
  
  const confidenceText = confidence >= 0.9 ? 'EXTREMELY STRONG' : 
                         confidence >= 0.7 ? 'STRONG' : 'MODERATE';
  
  return `${randomMessage}\n\nConnection Strength: ${confidenceText}`;
};
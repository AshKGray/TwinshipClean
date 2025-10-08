export type MessageType = 'text' | 'image' | 'voice' | 'reaction';
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed';

export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: string;
  type: MessageType;
  accentColor: string;
  isDelivered: boolean;
  isRead: boolean;
  reactions: MessageReaction[];
  originalMessageId?: string; // For reactions/replies
  createdAt: string;
  updatedAt: string;
}

export interface MessageReaction {
  id: string;
  emoji: string;
  userId: string;
  userName: string;
  timestamp: string;
}

export interface TypingIndicator {
  userId: string;
  userName: string;
  timestamp: string;
  twinPairId: string;
}

export interface TwintuitionMoment {
  id: string;
  message: string;
  type: 'intuition' | 'synchronicity' | 'connection';
  confidence: number;
  timestamp: string;
  triggeredBy: string;
  twinPairId: string;
}

export interface MessageDeliveryStatus {
  messageId: string;
  status: MessageStatus;
  timestamp: string;
  userId?: string;
}

export interface OfflineMessage {
  id: string;
  messageData: string; // JSON serialized ChatMessage
  twinPairId: string;
  recipientId: string;
  attempts: number;
  maxAttempts: number;
  nextAttemptAt?: string;
  createdAt: string;
  expiresAt: string;
}
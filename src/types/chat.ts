import { ThemeColor } from '../state/twinStore';

export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: string;
  type: 'text' | 'image' | 'emoji' | 'reaction' | 'twintuition';
  imageUrl?: string;
  replyTo?: string;
  reactions?: MessageReaction[];
  isDelivered: boolean;
  isRead: boolean;
  accentColor: ThemeColor;
}

export interface MessageReaction {
  emoji: string;
  userId: string;
  userName: string;
  timestamp: string;
}

export interface TypingIndicator {
  userId: string;
  userName: string;
  timestamp: string;
}

export interface ChatConnection {
  status: 'connected' | 'connecting' | 'disconnected' | 'reconnecting';
  lastSeen?: string;
  unreadCount: number;
  roomId?: string;
  lastConnected?: string;
}

export interface TwintuitionMoment {
  id: string;
  message: string;
  timestamp: string;
  type: 'sync' | 'intuition' | 'connection';
  confidence: number;
}

export interface VoiceMessage {
  id: string;
  uri: string;
  duration: number;
  waveform?: number[];
}

export interface QuickResponse {
  id: string;
  text: string;
  emoji: string;
}

export const QUICK_RESPONSES: QuickResponse[] = [
  { id: '1', text: 'I was just thinking that!', emoji: '🤔' },
  { id: '2', text: 'Twintuition moment!', emoji: '✨' },
  { id: '3', text: 'Same here!', emoji: '🤝' },
  { id: '4', text: 'Love you twin!', emoji: '❤️' },
  { id: '5', text: 'Miss you!', emoji: '🥺' },
  { id: '6', text: 'On my way!', emoji: '🏃' },
];

export const TWIN_EMOJIS = ['👯', '👭', '👬', '💫', '✨', '🔮', '💎', '🌟', '💝', '🎭', '🪞', '💫'];

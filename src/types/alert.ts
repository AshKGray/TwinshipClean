/**
 * Twintuition Alert Types
 *
 * Type definitions for the Twintuition alert system.
 * Story: 3-1 Twintuition Alert Types and UI
 */

import type { GalaxyAccentColor } from '../theme/colors';
import type { HapticPattern } from '../theme/haptics';

/**
 * Alert types available for sending
 */
export type TwintuitionAlertType =
  | 'thinking_of_you'
  | 'need_support'
  | 'sharing_joy'
  | 'feeling_sync'
  | 'random_check_in';

/**
 * Alert metadata configuration
 */
export interface AlertTypeMetadata {
  type: TwintuitionAlertType;
  label: string;
  description: string;
  icon: string; // Emoji icon
  color: GalaxyAccentColor;
  hapticPattern: HapticPattern;
}

/**
 * Twintuition alert document structure
 */
export interface TwintuitionAlert {
  id: string;
  type: TwintuitionAlertType;
  senderId: string;
  senderName: string;
  receiverId: string;
  message?: string; // Optional encrypted personal message
  emotion?: string; // Optional emotion/mood
  timestamp: string;
  isRead: boolean;
  readAt?: string;
  deliveredAt?: string;
}

/**
 * Alert with encryption
 */
export interface EncryptedAlert extends Omit<TwintuitionAlert, 'message'> {
  encryptedMessage?: string;
}

/**
 * Cosmic Sync Moment (simultaneous alert)
 */
export interface CosmicSyncMoment {
  id: string;
  alert1Id: string;
  alert2Id: string;
  user1Id: string;
  user2Id: string;
  timeDifferenceSeconds: number;
  detectedAt: string;
  celebrated: boolean;
}

/**
 * Alert statistics for analytics
 */
export interface AlertStats {
  totalSent: number;
  totalReceived: number;
  totalSyncMoments: number;
  mostCommonType: TwintuitionAlertType | null;
  averageResponseTimeMinutes: number;
  alertsByType: Record<TwintuitionAlertType, number>;
  alertsByHour: Record<number, number>; // 0-23
  alertsByDayOfWeek: Record<number, number>; // 0-6
  recentAlerts: TwintuitionAlert[];
  recentSyncMoments: CosmicSyncMoment[];
}

/**
 * Alert pattern insights
 */
export interface AlertPatternInsight {
  type: 'frequency' | 'timing' | 'reciprocity' | 'sync_rate' | 'emotional';
  title: string;
  description: string;
  data: any;
  confidence: number;
}

/**
 * Alert metadata configurations
 */
export const ALERT_TYPE_METADATA: Record<TwintuitionAlertType, AlertTypeMetadata> = {
  thinking_of_you: {
    type: 'thinking_of_you',
    label: 'Thinking of You',
    description: 'Let your twin know you\'re thinking about them',
    icon: '💭',
    color: 'stellar-blue',
    hapticPattern: 'light',
  },
  need_support: {
    type: 'need_support',
    label: 'Need Support',
    description: 'Reach out when you need your twin',
    icon: '🤗',
    color: 'nebula-rose',
    hapticPattern: 'medium',
  },
  sharing_joy: {
    type: 'sharing_joy',
    label: 'Sharing Joy',
    description: 'Share a moment of happiness',
    icon: '✨',
    color: 'solar-amber',
    hapticPattern: 'success',
  },
  feeling_sync: {
    type: 'feeling_sync',
    label: 'Feeling Sync',
    description: 'You sense your twin is feeling the same way',
    icon: '🔮',
    color: 'celestial-indigo',
    hapticPattern: 'heavy',
  },
  random_check_in: {
    type: 'random_check_in',
    label: 'Random Check-in',
    description: 'Just saying hi!',
    icon: '👋',
    color: 'aurora-teal',
    hapticPattern: 'light',
  },
};

/**
 * Get alert type metadata
 */
export function getAlertTypeMetadata(type: TwintuitionAlertType): AlertTypeMetadata {
  return ALERT_TYPE_METADATA[type];
}

/**
 * Get alert display text
 */
export function getAlertDisplayText(alert: TwintuitionAlert, currentUserId: string): string {
  const isSent = alert.senderId === currentUserId;
  const metadata = getAlertTypeMetadata(alert.type);

  if (isSent) {
    return `You sent a ${metadata.label} alert`;
  }

  return `${alert.senderName} sent you a ${metadata.label} alert`;
}

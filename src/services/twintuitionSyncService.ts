/**
 * Twintuition Sync Service
 *
 * Automatically detects when twins send twintuition alerts simultaneously
 * and creates twincidences.
 *
 * Story: 4-5 Automatic Twintuition Sync Detection
 */

import { twincidenceService } from './twincidenceService';
import { useTwintuitionStore } from '../state/twintuitionStore';
import { TwincidenceCategory } from '../types/twincidences';
import type { TwintuitionSyncData } from '../types/twincidences';

export interface TwintuitionAlert {
  id: string;
  type: 'feeling' | 'thought' | 'action';
  emotion?: string;
  intensity?: number;
  message?: string;
  senderId: string;
  recipientId: string;
  sentAt: string;
}

export class TwintuitionSyncService {
  private static syncThreshold = 30000; // 30 seconds
  private static recentAlerts: TwintuitionAlert[] = [];
  private static maxRecentAlerts = 50;

  /**
   * Check for simultaneous twintuition alerts
   */
  static async checkForSync(
    newAlert: TwintuitionAlert,
    allAlerts: TwintuitionAlert[]
  ): Promise<TwintuitionSyncData | null> {
    try {
      const newAlertTime = new Date(newAlert.sentAt).getTime();

      // Look for alerts from the other twin sent within threshold
      for (const existingAlert of allAlerts) {
        if (existingAlert.id === newAlert.id) continue;
        if (existingAlert.senderId === newAlert.senderId) continue;

        const existingAlertTime = new Date(existingAlert.sentAt).getTime();
        const deltaMs = Math.abs(newAlertTime - existingAlertTime);

        // Check if within sync threshold
        if (deltaMs <= this.syncThreshold) {
          const deltaSeconds = Math.round(deltaMs / 1000);

          // Check for emotion match
          const emotionMatch = newAlert.emotion && existingAlert.emotion
            ? newAlert.emotion === existingAlert.emotion
            : false;

          // Check for type match
          const typeMatch = newAlert.type === existingAlert.type;

          const syncData: TwintuitionSyncData = {
            alert1Id: newAlert.id,
            alert2Id: existingAlert.id,
            deltaSeconds,
            emotionMatch,
            typeMatch,
          };

          console.log('[TwintuitionSync] Sync detected:', syncData);
          return syncData;
        }
      }

      return null;
    } catch (error) {
      console.error('[TwintuitionSync] Error checking for sync:', error);
      return null;
    }
  }

  /**
   * Auto-create twincidence from twintuition sync
   */
  static async createSyncTwincidence(
    twinPairId: string,
    syncData: TwintuitionSyncData,
    alert1: TwintuitionAlert,
    alert2: TwintuitionAlert
  ): Promise<string> {
    try {
      const title = this.generateTitle(alert1, alert2, syncData);
      const confidenceScore = this.calculateConfidenceScore(syncData);

      const twincidenceId = await twincidenceService.createAutoTwincidence(
        twinPairId,
        TwincidenceCategory.TWINTUITION_SYNC,
        title,
        { twintuitionData: syncData },
        confidenceScore
      );

      console.log('[TwintuitionSync] Created sync twincidence:', twincidenceId);
      return twincidenceId;
    } catch (error) {
      console.error('[TwintuitionSync] Error creating sync twincidence:', error);
      throw error;
    }
  }

  /**
   * Generate descriptive title for the sync
   */
  private static generateTitle(
    alert1: TwintuitionAlert,
    alert2: TwintuitionAlert,
    syncData: TwintuitionSyncData
  ): string {
    const { deltaSeconds, emotionMatch, typeMatch } = syncData;

    if (emotionMatch && alert1.emotion) {
      return `Simultaneous ${alert1.emotion} feeling (${deltaSeconds}s apart)`;
    }

    if (typeMatch) {
      const typeLabel = {
        feeling: 'Feeling',
        thought: 'Thought',
        action: 'Action',
      }[alert1.type];

      return `Synchronized ${typeLabel} alerts (${deltaSeconds}s apart)`;
    }

    return `Twin alert synchronicity (${deltaSeconds}s apart)`;
  }

  /**
   * Calculate confidence score for the sync
   */
  private static calculateConfidenceScore(syncData: TwintuitionSyncData): number {
    let score = 0;

    // Base score from time delta (closer = higher)
    const timeFactor = Math.max(0, 1 - syncData.deltaSeconds / this.syncThreshold);
    score += timeFactor * 0.5;

    // Bonus for emotion match
    if (syncData.emotionMatch) {
      score += 0.3;
    }

    // Bonus for type match
    if (syncData.typeMatch) {
      score += 0.2;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Monitor twintuition store for new alerts
   */
  static startMonitoring(twinPairId: string): void {
    // This would be called when the app starts
    // and would subscribe to the twintuition store
    console.log('[TwintuitionSync] Started monitoring for:', twinPairId);

    // Note: Actual implementation would use Zustand subscription
    // or Supabase real-time listeners
  }

  /**
   * Stop monitoring
   */
  static stopMonitoring(): void {
    console.log('[TwintuitionSync] Stopped monitoring');
  }

  /**
   * Set sync threshold (in milliseconds)
   */
  static setSyncThreshold(milliseconds: number): void {
    this.syncThreshold = milliseconds;
    console.log('[TwintuitionSync] Sync threshold set to:', milliseconds);
  }

  /**
   * Get current sync threshold
   */
  static getSyncThreshold(): number {
    return this.syncThreshold;
  }

  /**
   * Add alert to recent tracking
   */
  static addRecentAlert(alert: TwintuitionAlert): void {
    this.recentAlerts.unshift(alert);
    if (this.recentAlerts.length > this.maxRecentAlerts) {
      this.recentAlerts = this.recentAlerts.slice(0, this.maxRecentAlerts);
    }
  }

  /**
   * Get recent alerts for analysis
   */
  static getRecentAlerts(): TwintuitionAlert[] {
    return this.recentAlerts;
  }

  /**
   * Clear recent alerts
   */
  static clearRecentAlerts(): void {
    this.recentAlerts = [];
  }

  /**
   * Analyze patterns in recent syncs
   */
  static analyzeSyncPatterns(syncs: TwintuitionSyncData[]): {
    averageDelta: number;
    emotionMatchRate: number;
    typeMatchRate: number;
    totalSyncs: number;
  } {
    if (syncs.length === 0) {
      return {
        averageDelta: 0,
        emotionMatchRate: 0,
        typeMatchRate: 0,
        totalSyncs: 0,
      };
    }

    const averageDelta =
      syncs.reduce((sum, sync) => sum + sync.deltaSeconds, 0) / syncs.length;

    const emotionMatches = syncs.filter((s) => s.emotionMatch).length;
    const emotionMatchRate = emotionMatches / syncs.length;

    const typeMatches = syncs.filter((s) => s.typeMatch).length;
    const typeMatchRate = typeMatches / syncs.length;

    return {
      averageDelta,
      emotionMatchRate,
      typeMatchRate,
      totalSyncs: syncs.length,
    };
  }

  /**
   * Suggest converting existing pattern to twincidence
   */
  static async suggestPatternConversion(
    twinPairId: string,
    pattern: string
  ): Promise<boolean> {
    // This could analyze chat patterns, alert patterns, etc.
    // and suggest creating a twincidence
    console.log('[TwintuitionSync] Suggesting pattern conversion:', pattern);
    return true;
  }
}

export const twintuitionSyncService = TwintuitionSyncService;

/**
 * Alert Service - Business logic for Twintuition alerts
 *
 * Handles sending, receiving, and analyzing alerts with Supabase integration.
 */

import * as Notifications from 'expo-notifications';
import { supabase } from '../lib/supabase';
import { useAlertStore } from '../state/alertStore';
import { useTwinStore } from '../state/twinStore';
import type {
  TwintuitionAlert,
  TwintuitionAlertType,
  AlertStats,
  AlertPatternInsight,
} from '../types/alert';
import type { RealtimeChannel } from '@supabase/supabase-js';

const SYNC_WINDOW_SECONDS = 60;

class AlertServiceClass {
  private alertChannel: RealtimeChannel | null = null;

  async sendAlert(
    type: TwintuitionAlertType,
    receiverId: string,
    options?: { message?: string; emotion?: string }
  ): Promise<TwintuitionAlert> {
    const twinStore = useTwinStore.getState();
    const userProfile = twinStore.userProfile;
    if (!userProfile) throw new Error('User profile not found');

    const { data: pairs } = await supabase
      .from('twin_pairs')
      .select('id')
      .or(`user1_id.eq.${userProfile.id},user2_id.eq.${userProfile.id}`)
      .eq('status', 'active')
      .limit(1);

    const pairId = pairs?.[0]?.id;
    if (!pairId) throw new Error('No active twin pair found');

    const { data, error } = await supabase
      .from('twintuition_moments')
      .insert({
        twin_pair_id: pairId,
        sender_id: userProfile.id,
        message: options?.message || `${type} alert`,
        type: type as string,
        is_read: false,
        metadata: {
          emotion: options?.emotion,
          sender_name: userProfile.name,
          receiver_id: receiverId,
        },
      })
      .select()
      .single();

    if (error) throw error;

    const alert: TwintuitionAlert = {
      id: data.id,
      type,
      senderId: userProfile.id,
      senderName: userProfile.name,
      receiverId,
      timestamp: data.created_at,
      isRead: false,
      message: options?.message,
      emotion: options?.emotion,
    };

    useAlertStore.getState().addAlert(alert);
    useAlertStore.getState().setLastAlertSentAt(data.created_at);
    return alert;
  }

  async markAlertAsRead(alertId: string): Promise<void> {
    await supabase
      .from('twintuition_moments')
      .update({ is_read: true })
      .eq('id', alertId);
    useAlertStore.getState().markAlertAsRead(alertId);
  }

  startAlertListener(userId: string): void {
    if (this.alertChannel) return;

    this.alertChannel = supabase
      .channel('twintuition-alerts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'twintuition_moments' },
        async (payload) => {
          const data = payload.new as any;
          if (data.metadata?.receiver_id === userId) {
            const alert: TwintuitionAlert = {
              id: data.id,
              type: data.type as TwintuitionAlertType,
              senderId: data.sender_id,
              senderName: data.metadata?.sender_name || 'Twin',
              receiverId: userId,
              timestamp: data.created_at,
              isRead: false,
              message: data.message,
              emotion: data.metadata?.emotion,
            };
            useAlertStore.getState().addAlert(alert);
            await this.showAlertNotification(alert);
          }
        }
      )
      .subscribe();
  }

  stopAlertListener(): void {
    if (this.alertChannel) {
      supabase.removeChannel(this.alertChannel);
      this.alertChannel = null;
    }
  }

  private async showAlertNotification(alert: TwintuitionAlert): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${alert.senderName} sent you an alert`,
          body: alert.message || 'Tap to view',
          data: { type: 'twintuition_alert', alertId: alert.id },
          sound: 'default',
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Error showing alert notification:', error);
    }
  }

  async getAlertStats(userId: string, days: number = 30): Promise<AlertStats> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { data: alerts } = await supabase
      .from('twintuition_moments')
      .select('*')
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: false });

    const userAlerts = (alerts || []).filter(
      (a: any) => a.sender_id === userId || a.metadata?.receiver_id === userId
    );
    const sent = userAlerts.filter((a: any) => a.sender_id === userId);
    const received = userAlerts.filter((a: any) => a.metadata?.receiver_id === userId);

    const alertsByType: Record<string, number> = {};
    const alertsByHour: Record<number, number> = {};
    const alertsByDayOfWeek: Record<number, number> = {};

    userAlerts.forEach((a: any) => {
      alertsByType[a.type] = (alertsByType[a.type] || 0) + 1;
      const d = new Date(a.created_at);
      alertsByHour[d.getHours()] = (alertsByHour[d.getHours()] || 0) + 1;
      alertsByDayOfWeek[d.getDay()] = (alertsByDayOfWeek[d.getDay()] || 0) + 1;
    });

    let mostCommonType: TwintuitionAlertType | null = null;
    let maxCount = 0;
    Object.entries(alertsByType).forEach(([type, count]) => {
      if (count > maxCount) { maxCount = count; mostCommonType = type as TwintuitionAlertType; }
    });

    const stats: AlertStats = {
      totalSent: sent.length,
      totalReceived: received.length,
      totalSyncMoments: 0,
      mostCommonType,
      averageResponseTimeMinutes: 0,
      alertsByType: alertsByType as any,
      alertsByHour: alertsByHour as any,
      alertsByDayOfWeek: alertsByDayOfWeek as any,
      recentAlerts: userAlerts.slice(0, 20).map((a: any) => ({
        id: a.id, type: a.type, senderId: a.sender_id,
        senderName: a.metadata?.sender_name || 'Twin',
        receiverId: a.metadata?.receiver_id || '',
        timestamp: a.created_at, isRead: a.is_read, message: a.message,
      })),
      recentSyncMoments: [],
    };

    useAlertStore.getState().updateStatsCache(stats);
    return stats;
  }

  async generatePatternInsights(stats: AlertStats): Promise<AlertPatternInsight[]> {
    const insights: AlertPatternInsight[] = [];
    const totalAlerts = stats.totalSent + stats.totalReceived;
    const avgPerDay = totalAlerts / 30;

    if (avgPerDay > 2) {
      insights.push({
        type: 'frequency', title: 'Highly Connected',
        description: `You exchange ${avgPerDay.toFixed(1)} alerts per day on average`,
        data: { avgPerDay }, confidence: 0.9,
      });
    }

    const hourCounts = Object.entries(stats.alertsByHour).sort(([, a], [, b]) => b - a);
    if (hourCounts.length > 0) {
      const peakHour = parseInt(hourCounts[0][0]);
      const timeOfDay = peakHour < 12 ? 'morning' : peakHour < 17 ? 'afternoon' : 'evening';
      insights.push({
        type: 'timing', title: `Peak Connection: ${timeOfDay}`,
        description: `Most alerts sent around ${peakHour}:00`,
        data: { peakHour, timeOfDay }, confidence: 0.85,
      });
    }

    return insights;
  }

  async deleteAlert(alertId: string): Promise<void> {
    await supabase.from('twintuition_moments').delete().eq('id', alertId);
    useAlertStore.getState().deleteAlert(alertId);
  }

  async initialize(userId: string): Promise<void> {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') console.warn('Notification permissions not granted');
    this.startAlertListener(userId);
  }

  cleanup(): void {
    this.stopAlertListener();
  }
}

export const alertService = new AlertServiceClass();

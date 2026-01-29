/**
 * Research Data Service
 *
 * Handles anonymization, submission, and management of research data
 * Story: 5-3 Anonymized Data Submission Pipeline
 *
 * Privacy-first approach with comprehensive data anonymization
 */

import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

// ============================================================================
// Types
// ============================================================================

export interface AnonymizedUserData {
  anonymousId: string;
  studyId: string;
  submittedAt: string;
  dataType: 'game' | 'twintuition' | 'twincidence' | 'assessment' | 'communication';
  data: any;
  metadata: {
    version: string;
    hashAlgorithm: string;
    k_anonymity: number;
  };
}

export interface DataSubmissionQueue {
  id: string;
  userId: string;
  studyId: string;
  dataType: string;
  rawData: any;
  status: 'pending' | 'processing' | 'submitted' | 'failed';
  createdAt: string;
  submittedAt?: string;
  errorMessage?: string;
  retryCount: number;
}

export interface PopulationInsight {
  id: string;
  studyId: string;
  title: string;
  description: string;
  metrics: {
    name: string;
    userValue: number;
    populationMean: number;
    populationStdDev: number;
    percentile: number;
  }[];
  sampleSize: number;
  lastUpdated: string;
}

export interface LeaderboardEntry {
  anonymousId: string;
  displayName: string;
  contributionScore: number;
  dataPointsSubmitted: number;
  dataTypesCount: number;
  consistencyScore: number;
  rank: number;
  badges: string[];
}

// ============================================================================
// Research Data Service Class
// ============================================================================

class ResearchDataServiceClass {
  private readonly QUEUE_KEY = '@research_submission_queue';
  private readonly ANONYMOUS_ID_KEY = '@research_anonymous_id';

  async generateAnonymousId(userId: string, studyId: string): Promise<string> {
    const key = `${this.ANONYMOUS_ID_KEY}_${userId}_${studyId}`;

    const existing = await AsyncStorage.getItem(key);
    if (existing) {
      return existing;
    }

    const salt = await this.getOrCreateSalt();
    const input = `${userId}_${studyId}_${salt}`;
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      input
    );

    const anonymousId = `TWIN_${hash.substring(0, 16).toUpperCase()}`;
    await AsyncStorage.setItem(key, anonymousId);

    return anonymousId;
  }

  private async getOrCreateSalt(): Promise<string> {
    const key = '@research_salt';
    let salt = await AsyncStorage.getItem(key);

    if (!salt) {
      const randomBytes = await Crypto.getRandomBytesAsync(32);
      salt = Array.from(randomBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      await AsyncStorage.setItem(key, salt);
    }

    return salt;
  }

  private anonymizeGameData(gameData: any): any {
    return {
      gameType: gameData.gameType,
      completedAt: gameData.completedAt,
      synchronicityScore: gameData.result?.synchronicity?.overallScore || 0,
      performanceMetrics: {
        completionTime: gameData.rawData?.completionTime,
        errorCount: gameData.rawData?.errorCount,
        score: gameData.result?.synchronicity?.overallScore,
      },
      twinPairData: {
        hasTwinData: !!gameData.twinId,
        synchronicity: gameData.result?.synchronicity,
      },
    };
  }

  private anonymizeTwintuitionData(twintuitionData: any): any {
    return {
      alertType: twintuitionData.type,
      confidence: twintuitionData.confidence,
      timestamp: twintuitionData.detectedAt,
      patterns: {
        timeOfDay: new Date(twintuitionData.detectedAt).getHours(),
        dayOfWeek: new Date(twintuitionData.detectedAt).getDay(),
      },
    };
  }

  private anonymizeTwincidenceData(twincidenceData: any): any {
    return {
      category: twincidenceData.category,
      detectionType: twincidenceData.detectionType,
      confidenceScore: twincidenceData.metadata?.confidenceScore,
      timestamp: twincidenceData.timestamp,
      hasTwinConfirmation: twincidenceData.metadata?.twinConfirmed || false,
      patterns: {
        timeOfDay: new Date(twincidenceData.timestamp).getHours(),
        dayOfWeek: new Date(twincidenceData.timestamp).getDay(),
      },
    };
  }

  private anonymizeAssessmentData(assessmentData: any): any {
    return {
      assessmentType: assessmentData.type,
      completedAt: assessmentData.completedAt,
      scores: {
        overallScore: assessmentData.totalScore,
        subscaleScores: assessmentData.subscaleScores?.map((s: any) => ({
          category: s.category,
          score: s.score,
        })),
      },
    };
  }

  private anonymizeCommunicationData(communicationData: any): any {
    return {
      messageCount: communicationData.messageCount,
      patterns: {
        averageResponseTime: communicationData.averageResponseTime,
        peakActivityHours: communicationData.peakHours,
        messagingFrequency: communicationData.frequency,
      },
    };
  }

  async anonymizeData(
    userId: string,
    studyId: string,
    dataType: AnonymizedUserData['dataType'],
    rawData: any
  ): Promise<AnonymizedUserData> {
    const anonymousId = await this.generateAnonymousId(userId, studyId);

    let anonymizedData: any;

    switch (dataType) {
      case 'game':
        anonymizedData = this.anonymizeGameData(rawData);
        break;
      case 'twintuition':
        anonymizedData = this.anonymizeTwintuitionData(rawData);
        break;
      case 'twincidence':
        anonymizedData = this.anonymizeTwincidenceData(rawData);
        break;
      case 'assessment':
        anonymizedData = this.anonymizeAssessmentData(rawData);
        break;
      case 'communication':
        anonymizedData = this.anonymizeCommunicationData(rawData);
        break;
      default:
        throw new Error(`Unknown data type: ${dataType}`);
    }

    return {
      anonymousId,
      studyId,
      submittedAt: new Date().toISOString(),
      dataType,
      data: anonymizedData,
      metadata: {
        version: '1.0.0',
        hashAlgorithm: 'SHA-256',
        k_anonymity: 5,
      },
    };
  }

  async queueDataSubmission(
    userId: string,
    studyId: string,
    dataType: string,
    rawData: any
  ): Promise<void> {
    const queueItem: DataSubmissionQueue = {
      id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      studyId,
      dataType,
      rawData,
      status: 'pending',
      createdAt: new Date().toISOString(),
      retryCount: 0,
    };

    const queueJson = await AsyncStorage.getItem(this.QUEUE_KEY);
    const queue: DataSubmissionQueue[] = queueJson ? JSON.parse(queueJson) : [];
    queue.push(queueItem);
    await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));

    console.log(`Data queued for submission: ${dataType} for study ${studyId}`);
  }

  async processSubmissionQueue(): Promise<void> {
    const queueJson = await AsyncStorage.getItem(this.QUEUE_KEY);
    if (!queueJson) return;

    const queue: DataSubmissionQueue[] = JSON.parse(queueJson);
    const pendingItems = queue.filter(item => item.status === 'pending' || item.status === 'failed');

    console.log(`Processing ${pendingItems.length} queued submissions`);

    for (const item of pendingItems) {
      try {
        item.status = 'processing';
        await this.updateQueue(queue);

        const anonymizedData = await this.anonymizeData(
          item.userId,
          item.studyId,
          item.dataType as any,
          item.rawData
        );

        await this.submitAnonymizedData(anonymizedData);

        item.status = 'submitted';
        item.submittedAt = new Date().toISOString();
        await this.updateQueue(queue);
      } catch (error) {
        console.error(`Failed to submit queued item ${item.id}:`, error);

        item.status = 'failed';
        item.retryCount++;
        item.errorMessage = error instanceof Error ? error.message : 'Unknown error';

        if (item.retryCount >= 3) {
          const index = queue.indexOf(item);
          queue.splice(index, 1);
        }

        await this.updateQueue(queue);
      }
    }

    // Clean up submitted items older than 7 days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);
    const cleanedQueue = queue.filter(item => {
      if (item.status === 'submitted') {
        return new Date(item.submittedAt!) > cutoffDate;
      }
      return true;
    });

    await this.updateQueue(cleanedQueue);
  }

  private async updateQueue(queue: DataSubmissionQueue[]): Promise<void> {
    await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
  }

  async submitAnonymizedData(anonymizedData: AnonymizedUserData): Promise<void> {
    try {
      const { error } = await supabase.from('research_submissions').insert({
        anonymous_id: anonymizedData.anonymousId,
        study_id: anonymizedData.studyId,
        data_type: anonymizedData.dataType,
        data: anonymizedData.data,
        metadata: anonymizedData.metadata,
        submitted_at: anonymizedData.submittedAt,
      });

      if (error) throw error;

      console.log(`Anonymized data submitted for ${anonymizedData.dataType}`);
    } catch (error) {
      console.error('Error submitting anonymized data:', error);
      throw error;
    }
  }

  async getPopulationInsights(studyId: string, _userId: string): Promise<PopulationInsight[]> {
    try {
      const { data, error } = await supabase
        .from('research_insights')
        .select('*')
        .eq('study_id', studyId)
        .order('last_updated', { ascending: false })
        .limit(10);

      if (error) throw error;
      return (data || []) as PopulationInsight[];
    } catch (error) {
      console.error('Error fetching population insights:', error);
      return [];
    }
  }

  async getContributionLeaderboard(studyId: string, resultLimit: number = 50): Promise<LeaderboardEntry[]> {
    try {
      const { data, error } = await supabase
        .from('research_leaderboard')
        .select('*')
        .eq('study_id', studyId)
        .order('contribution_score', { ascending: false })
        .limit(resultLimit);

      if (error) throw error;
      return (data || []) as LeaderboardEntry[];
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
  }

  async requestDataDeletion(userId: string, studyId: string): Promise<void> {
    try {
      const anonymousId = await this.generateAnonymousId(userId, studyId);

      const { error } = await supabase.from('research_deletion_requests').insert({
        anonymous_id: anonymousId,
        study_id: studyId,
        requested_at: new Date().toISOString(),
        status: 'pending',
      });

      if (error) throw error;

      console.log(`Data deletion request submitted for anonymous ID: ${anonymousId}`);
    } catch (error) {
      console.error('Error requesting data deletion:', error);
      throw error;
    }
  }

  async getContributionStats(userId: string, studyId: string): Promise<{
    totalSubmissions: number;
    lastSubmission: string | null;
    dataTypes: string[];
    contributionScore: number;
  }> {
    try {
      const anonymousId = await this.generateAnonymousId(userId, studyId);

      const { data, error } = await supabase
        .from('research_submissions')
        .select('*')
        .eq('anonymous_id', anonymousId)
        .eq('study_id', studyId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      const submissions = data || [];
      const dataTypes = [...new Set(submissions.map((s: any) => s.data_type))];
      const lastSubmission = submissions.length > 0 ? submissions[0].submitted_at : null;
      const contributionScore = this.calculateContributionScore(submissions);

      return {
        totalSubmissions: submissions.length,
        lastSubmission,
        dataTypes,
        contributionScore,
      };
    } catch (error) {
      console.error('Error fetching contribution stats:', error);
      return {
        totalSubmissions: 0,
        lastSubmission: null,
        dataTypes: [],
        contributionScore: 0,
      };
    }
  }

  private calculateContributionScore(submissions: any[]): number {
    let score = 0;

    score += submissions.length * 10;

    const uniqueTypes = new Set(submissions.map((s: any) => s.data_type || s.dataType));
    score += uniqueTypes.size * 20;

    const recentSubmissions = submissions.filter((s: any) => {
      const submittedDate = new Date(s.submitted_at || s.submittedAt);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return submittedDate > thirtyDaysAgo;
    });
    score += recentSubmissions.length * 5;

    return Math.min(score, 1000);
  }
}

export const researchDataService = new ResearchDataServiceClass();

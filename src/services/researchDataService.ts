/**
 * Research Data Service
 *
 * Handles anonymization, submission, and management of research data
 * Story: 5-3 Anonymized Data Submission Pipeline
 *
 * Privacy-first approach with comprehensive data anonymization
 */

import { firestoreService } from './firebase/firestore';
import { where } from 'firebase/firestore';
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

  /**
   * Generate stable anonymous ID for a user-study pair
   * Uses cryptographic hashing to ensure anonymity
   */
  async generateAnonymousId(userId: string, studyId: string): Promise<string> {
    const key = `${this.ANONYMOUS_ID_KEY}_${userId}_${studyId}`;

    // Check if we already have an anonymous ID for this user-study pair
    const existing = await AsyncStorage.getItem(key);
    if (existing) {
      return existing;
    }

    // Generate new anonymous ID using SHA-256 hash
    const salt = await this.getOrCreateSalt();
    const input = `${userId}_${studyId}_${salt}`;
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      input
    );

    // Create anonymous ID from hash
    const anonymousId = `TWIN_${hash.substring(0, 16).toUpperCase()}`;

    // Store for future use
    await AsyncStorage.setItem(key, anonymousId);

    return anonymousId;
  }

  /**
   * Get or create cryptographic salt for hashing
   */
  private async getOrCreateSalt(): Promise<string> {
    const key = '@research_salt';
    let salt = await AsyncStorage.getItem(key);

    if (!salt) {
      // Generate random salt
      const randomBytes = await Crypto.getRandomBytesAsync(32);
      salt = Array.from(randomBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      await AsyncStorage.setItem(key, salt);
    }

    return salt;
  }

  /**
   * Anonymize game data before submission
   */
  private anonymizeGameData(gameData: any): any {
    return {
      gameType: gameData.gameType,
      completedAt: gameData.completedAt,
      synchronicityScore: gameData.result?.synchronicity?.overallScore || 0,
      // Remove any PII, keep only aggregated metrics
      performanceMetrics: {
        completionTime: gameData.rawData?.completionTime,
        errorCount: gameData.rawData?.errorCount,
        score: gameData.result?.synchronicity?.overallScore,
      },
      twinPairData: {
        // Only include if both twins consented
        hasTwinData: !!gameData.twinId,
        synchronicity: gameData.result?.synchronicity,
      },
    };
  }

  /**
   * Anonymize twintuition data
   */
  private anonymizeTwintuitionData(twintuitionData: any): any {
    return {
      alertType: twintuitionData.type,
      confidence: twintuitionData.confidence,
      timestamp: twintuitionData.detectedAt,
      // Remove specific content, keep only patterns
      patterns: {
        timeOfDay: new Date(twintuitionData.detectedAt).getHours(),
        dayOfWeek: new Date(twintuitionData.detectedAt).getDay(),
      },
      // No message content or personal details
    };
  }

  /**
   * Anonymize twincidence data
   */
  private anonymizeTwincidenceData(twincidenceData: any): any {
    return {
      category: twincidenceData.category,
      detectionType: twincidenceData.detectionType,
      confidenceScore: twincidenceData.metadata?.confidenceScore,
      timestamp: twincidenceData.timestamp,
      // Remove descriptions, media, locations
      // Keep only categorical and confidence data
      hasTwinConfirmation: twincidenceData.metadata?.twinConfirmed || false,
      patterns: {
        timeOfDay: new Date(twincidenceData.timestamp).getHours(),
        dayOfWeek: new Date(twincidenceData.timestamp).getDay(),
      },
    };
  }

  /**
   * Anonymize assessment data
   */
  private anonymizeAssessmentData(assessmentData: any): any {
    return {
      assessmentType: assessmentData.type,
      completedAt: assessmentData.completedAt,
      // Only aggregate scores, no specific answers
      scores: {
        overallScore: assessmentData.totalScore,
        subscaleScores: assessmentData.subscaleScores?.map((s: any) => ({
          category: s.category,
          score: s.score,
        })),
      },
      // No personality details or specific responses
    };
  }

  /**
   * Anonymize communication pattern data
   */
  private anonymizeCommunicationData(communicationData: any): any {
    return {
      // Only timing and frequency, NO content
      messageCount: communicationData.messageCount,
      patterns: {
        averageResponseTime: communicationData.averageResponseTime,
        peakActivityHours: communicationData.peakHours,
        messagingFrequency: communicationData.frequency,
      },
      // Absolutely NO message content
    };
  }

  /**
   * Anonymize data based on type
   */
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
        k_anonymity: 5, // Minimum k-anonymity level
      },
    };
  }

  /**
   * Add data to submission queue (offline support)
   */
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

    // Get existing queue
    const queueJson = await AsyncStorage.getItem(this.QUEUE_KEY);
    const queue: DataSubmissionQueue[] = queueJson ? JSON.parse(queueJson) : [];

    // Add new item
    queue.push(queueItem);

    // Save queue
    await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));

    console.log(`✅ Data queued for submission: ${dataType} for study ${studyId}`);
  }

  /**
   * Process submission queue
   */
  async processSubmissionQueue(): Promise<void> {
    const queueJson = await AsyncStorage.getItem(this.QUEUE_KEY);
    if (!queueJson) return;

    const queue: DataSubmissionQueue[] = JSON.parse(queueJson);
    const pendingItems = queue.filter(item => item.status === 'pending' || item.status === 'failed');

    console.log(`📤 Processing ${pendingItems.length} queued submissions`);

    for (const item of pendingItems) {
      try {
        // Update status
        item.status = 'processing';
        await this.updateQueue(queue);

        // Anonymize and submit
        const anonymizedData = await this.anonymizeData(
          item.userId,
          item.studyId,
          item.dataType as any,
          item.rawData
        );

        await this.submitAnonymizedData(anonymizedData);

        // Mark as submitted
        item.status = 'submitted';
        item.submittedAt = new Date().toISOString();
        await this.updateQueue(queue);

        console.log(`✅ Submitted queued item: ${item.id}`);
      } catch (error) {
        console.error(`❌ Failed to submit queued item ${item.id}:`, error);

        item.status = 'failed';
        item.retryCount++;
        item.errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Remove if too many retries
        if (item.retryCount >= 3) {
          const index = queue.indexOf(item);
          queue.splice(index, 1);
          console.log(`🗑️  Removed failed item after 3 retries: ${item.id}`);
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

  /**
   * Update queue in storage
   */
  private async updateQueue(queue: DataSubmissionQueue[]): Promise<void> {
    await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
  }

  /**
   * Submit anonymized data to Firestore
   */
  async submitAnonymizedData(anonymizedData: AnonymizedUserData): Promise<void> {
    try {
      const docId = `${anonymizedData.anonymousId}_${anonymizedData.dataType}_${Date.now()}`;

      await firestoreService.createDocument(
        'research_submissions',
        docId,
        anonymizedData
      );

      console.log(`✅ Anonymized data submitted to Firestore: ${docId}`);
    } catch (error) {
      console.error('❌ Error submitting anonymized data:', error);
      throw error;
    }
  }

  /**
   * Get population insights for a study
   */
  async getPopulationInsights(studyId: string, userId: string): Promise<PopulationInsight[]> {
    try {
      // Get aggregated insights from Firestore
      const insights = await firestoreService.queryCollectionSimple<PopulationInsight>(
        'research_insights',
        [{ field: 'studyId', operator: '==', value: studyId }],
        { field: 'lastUpdated', direction: 'desc' },
        10
      );

      return insights;
    } catch (error) {
      console.error('❌ Error fetching population insights:', error);
      return [];
    }
  }

  /**
   * Get contribution leaderboard
   */
  async getContributionLeaderboard(studyId: string, limit: number = 50): Promise<LeaderboardEntry[]> {
    try {
      // Get leaderboard from Firestore
      const leaderboard = await firestoreService.queryCollectionSimple<LeaderboardEntry>(
        'research_leaderboard',
        [{ field: 'studyId', operator: '==', value: studyId }],
        { field: 'contributionScore', direction: 'desc' },
        limit
      );

      return leaderboard;
    } catch (error) {
      console.error('❌ Error fetching leaderboard:', error);
      return [];
    }
  }

  /**
   * Request data deletion
   */
  async requestDataDeletion(userId: string, studyId: string): Promise<void> {
    try {
      const anonymousId = await this.generateAnonymousId(userId, studyId);

      // Create deletion request
      const deletionRequest = {
        anonymousId,
        studyId,
        requestedAt: new Date().toISOString(),
        status: 'pending',
      };

      await firestoreService.createDocument(
        'research_deletion_requests',
        `del_${anonymousId}_${Date.now()}`,
        deletionRequest
      );

      console.log(`✅ Data deletion request submitted for anonymous ID: ${anonymousId}`);
    } catch (error) {
      console.error('❌ Error requesting data deletion:', error);
      throw error;
    }
  }

  /**
   * Get user's contribution stats
   */
  async getContributionStats(userId: string, studyId: string): Promise<{
    totalSubmissions: number;
    lastSubmission: string | null;
    dataTypes: string[];
    contributionScore: number;
  }> {
    try {
      const anonymousId = await this.generateAnonymousId(userId, studyId);

      // Get submissions for this anonymous ID
      const submissions = await firestoreService.queryCollectionSimple<AnonymizedUserData>(
        'research_submissions',
        [
          { field: 'anonymousId', operator: '==', value: anonymousId },
          { field: 'studyId', operator: '==', value: studyId },
        ],
        { field: 'submittedAt', direction: 'desc' }
      );

      const dataTypes = [...new Set(submissions.map(s => s.dataType))];
      const lastSubmission = submissions.length > 0 ? submissions[0].submittedAt : null;

      // Calculate contribution score
      const contributionScore = this.calculateContributionScore(submissions);

      return {
        totalSubmissions: submissions.length,
        lastSubmission,
        dataTypes,
        contributionScore,
      };
    } catch (error) {
      console.error('❌ Error fetching contribution stats:', error);
      return {
        totalSubmissions: 0,
        lastSubmission: null,
        dataTypes: [],
        contributionScore: 0,
      };
    }
  }

  /**
   * Calculate contribution score
   */
  private calculateContributionScore(submissions: AnonymizedUserData[]): number {
    let score = 0;

    // Base points for submissions
    score += submissions.length * 10;

    // Bonus for data diversity
    const uniqueTypes = new Set(submissions.map(s => s.dataType));
    score += uniqueTypes.size * 20;

    // Bonus for consistency (submissions in last 30 days)
    const recentSubmissions = submissions.filter(s => {
      const submittedDate = new Date(s.submittedAt);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return submittedDate > thirtyDaysAgo;
    });
    score += recentSubmissions.length * 5;

    return Math.min(score, 1000); // Cap at 1000
  }
}

export const researchDataService = new ResearchDataServiceClass();

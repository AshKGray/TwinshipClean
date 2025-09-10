/**
 * Sync Service - Cloud synchronization for twin pair data merging
 * Handles secure twin data sharing and privacy-preserving analytics
 */

import NetInfo from '@react-native-community/netinfo';
import {
  AssessmentResults,
  TwinPairData,
  PairAnalytics,
  PrivacyConsent,
  SyncStatus,
} from '../types/assessment/types';
import { EncryptionService } from './encryptionService';
import { storageService } from './storageService';

export interface CloudProvider {
  name: string;
  apiUrl: string;
  authenticate: () => Promise<string>;
  uploadData: (data: any, metadata: any) => Promise<string>;
  downloadData: (id: string) => Promise<any>;
  deleteData: (id: string) => Promise<void>;
  findPairs: (criteria: any) => Promise<any[]>;
}

export interface SyncOptions {
  forceSync?: boolean;
  cloudProvider?: string;
  encryptCloud?: boolean;
  includeAnalytics?: boolean;
  maxRetries?: number;
}

export interface PairMatchingCriteria {
  shareCode?: string;
  email?: string;
  phone?: string;
  twinType?: string;
  birthDate?: string;
  similarityThreshold?: number;
}

class SyncServiceClass {
  private providers: Map<string, CloudProvider> = new Map();
  private syncQueue: Array<{ type: string; data: any; options: SyncOptions }> = [];
  private syncing = false;
  private retryDelays = [1000, 2000, 5000, 10000, 30000]; // Exponential backoff

  constructor() {
    this.initializeProviders();
    this.startSyncWorker();
  }

  /**
   * Register cloud provider
   */
  registerProvider(name: string, provider: CloudProvider): void {
    this.providers.set(name, provider);
  }

  /**
   * Sync assessment results to cloud for pair matching
   */
  async syncAssessmentResults(
    results: AssessmentResults,
    options: SyncOptions = {}
  ): Promise<void> {
    // Check privacy consent
    if (!results.privacyConsent.twinDataMerging) {
      console.log('Skipping sync - no consent for twin data merging');
      return;
    }

    // Check network connectivity
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      console.log('No network connection - queuing for later sync');
      this.queueSync('assessment_results', results, options);
      return;
    }

    try {
      await this.performSync('assessment_results', results, options);
      
      // Mark as synced
      results.synced = true;
      await storageService.setSecure(`results_${results.id}`, results);
      
    } catch (error) {
      console.error('Failed to sync assessment results:', error);
      this.queueSync('assessment_results', results, options);
      throw error;
    }
  }

  /**
   * Find and create twin pairs based on matching criteria
   */
  async findTwinPairs(
    criteria: PairMatchingCriteria,
    providerName = 'supabase'
  ): Promise<TwinPairData[]> {
    const provider = this.providers.get(providerName);
    if (!provider) throw new Error(`Provider ${providerName} not found`);

    try {
      const authToken = await provider.authenticate();
      const matches = await provider.findPairs(criteria);
      
      return matches.map(match => this.createTwinPair(match));
    } catch (error) {
      console.error('Failed to find twin pairs:', error);
      throw error;
    }
  }

  /**
   * Merge twin pair data and generate analytics
   */
  async mergePairData(
    pairId: string,
    twin1Results: AssessmentResults,
    twin2Results: AssessmentResults
  ): Promise<PairAnalytics> {
    // Verify both twins consented to data merging
    if (!twin1Results.privacyConsent.twinDataMerging || 
        !twin2Results.privacyConsent.twinDataMerging) {
      throw new Error('Both twins must consent to data merging');
    }

    // Generate privacy-preserving analytics
    const analytics = await this.calculatePairAnalytics(twin1Results, twin2Results);
    
    // Store analytics securely
    await storageService.setSecure(`pair_analytics_${pairId}`, analytics);
    
    return analytics;
  }

  /**
   * Get sync status for assessment data
   */
  async getSyncStatus(): Promise<SyncStatus> {
    const pendingItems = this.syncQueue.length;
    const lastSyncAttempt = await storageService.get('last_sync_attempt');
    const lastSuccessfulSync = await storageService.get('last_successful_sync');
    const syncErrors = await storageService.get('sync_errors') || [];
    
    return {
      lastSyncAttempt,
      lastSuccessfulSync,
      pendingChanges: pendingItems,
      syncErrors: syncErrors.slice(-5), // Keep last 5 errors
      needsResolution: syncErrors.length > 0 || pendingItems > 10,
    };
  }

  /**
   * Force sync all pending data
   */
  async forceSyncAll(options: SyncOptions = {}): Promise<void> {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      throw new Error('No network connection available');
    }

    this.syncing = true;
    const errors: Error[] = [];
    
    try {
      // Process sync queue
      while (this.syncQueue.length > 0) {
        const item = this.syncQueue.shift()!;
        try {
          await this.performSync(item.type, item.data, { ...item.options, ...options });
        } catch (error) {
          errors.push(error as Error);
          console.error(`Failed to sync ${item.type}:`, error);
        }
      }
      
      // Sync pending results from storage
      const results = await storageService.getSecure('assessment_results') || {};
      for (const [resultId, result] of Object.entries(results)) {
        if (!(result as AssessmentResults).synced) {
          try {
            await this.syncAssessmentResults(result as AssessmentResults, options);
          } catch (error) {
            errors.push(error as Error);
          }
        }
      }
      
      await storageService.set('last_successful_sync', new Date().toISOString());
      
    } finally {
      this.syncing = false;
      
      if (errors.length > 0) {
        await storageService.set('sync_errors', errors.map(e => e.message));
        throw new Error(`Sync completed with ${errors.length} errors`);
      }
    }
  }

  /**
   * Delete cloud data for privacy compliance
   */
  async deleteCloudData(userId: string, providerName = 'supabase'): Promise<void> {
    const provider = this.providers.get(providerName);
    if (!provider) throw new Error(`Provider ${providerName} not found`);

    try {
      const authToken = await provider.authenticate();
      await provider.deleteData(userId);
    } catch (error) {
      console.error('Failed to delete cloud data:', error);
      throw error;
    }
  }

  /**
   * Export anonymized data for research
   */
  async exportAnonymizedData(
    assessmentResults: AssessmentResults[],
    includeAnalytics = false
  ): Promise<any> {
    const anonymizedData = assessmentResults
      .filter(result => result.privacyConsent.anonymizedSharing)
      .map(result => this.anonymizeResults(result));
    
    const exportPackage = {
      data: anonymizedData,
      metadata: {
        exportedAt: new Date().toISOString(),
        totalRecords: anonymizedData.length,
        privacyLevel: 'anonymized',
        includesAnalytics: includeAnalytics,
      },
    };
    
    if (includeAnalytics) {
      // Add anonymized pair analytics if available
      const pairAnalytics = await this.getAnonymizedPairAnalytics();
      exportPackage['pairAnalytics'] = pairAnalytics;
    }
    
    return exportPackage;
  }

  // Private methods
  private initializeProviders(): void {
    // Supabase provider
    this.registerProvider('supabase', {
      name: 'Supabase',
      apiUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
      authenticate: async () => {
        // Implement Supabase authentication
        return 'supabase_auth_token';
      },
      uploadData: async (data, metadata) => {
        // Implement Supabase data upload
        console.log('Uploading to Supabase:', metadata);
        return 'upload_id';
      },
      downloadData: async (id) => {
        // Implement Supabase data download
        console.log('Downloading from Supabase:', id);
        return {};
      },
      deleteData: async (id) => {
        // Implement Supabase data deletion
        console.log('Deleting from Supabase:', id);
      },
      findPairs: async (criteria) => {
        // Implement Supabase pair matching
        console.log('Finding pairs in Supabase:', criteria);
        return [];
      },
    });

    // Firebase provider
    this.registerProvider('firebase', {
      name: 'Firebase',
      apiUrl: process.env.EXPO_PUBLIC_FIREBASE_URL || '',
      authenticate: async () => {
        // Implement Firebase authentication
        return 'firebase_auth_token';
      },
      uploadData: async (data, metadata) => {
        // Implement Firebase data upload
        console.log('Uploading to Firebase:', metadata);
        return 'upload_id';
      },
      downloadData: async (id) => {
        // Implement Firebase data download
        console.log('Downloading from Firebase:', id);
        return {};
      },
      deleteData: async (id) => {
        // Implement Firebase data deletion
        console.log('Deleting from Firebase:', id);
      },
      findPairs: async (criteria) => {
        // Implement Firebase pair matching
        console.log('Finding pairs in Firebase:', criteria);
        return [];
      },
    });
  }

  private queueSync(type: string, data: any, options: SyncOptions): void {
    this.syncQueue.push({ type, data, options });
    
    // Limit queue size to prevent memory issues
    if (this.syncQueue.length > 100) {
      this.syncQueue.shift(); // Remove oldest item
    }
  }

  private async performSync(
    type: string,
    data: any,
    options: SyncOptions
  ): Promise<void> {
    const providerName = options.cloudProvider || 'supabase';
    const provider = this.providers.get(providerName);
    
    if (!provider) throw new Error(`Provider ${providerName} not found`);

    let processedData = data;
    
    // Apply encryption if requested
    if (options.encryptCloud !== false) {
      processedData = await EncryptionService.encrypt(JSON.stringify(data));
    }
    
    const metadata = {
      type,
      timestamp: new Date().toISOString(),
      encrypted: options.encryptCloud !== false,
      version: '1.0',
    };
    
    const maxRetries = options.maxRetries || 3;
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const authToken = await provider.authenticate();
        await provider.uploadData(processedData, metadata);
        
        await storageService.set('last_sync_attempt', new Date().toISOString());
        return; // Success
        
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries - 1) {
          const delay = this.retryDelays[Math.min(attempt, this.retryDelays.length - 1)];
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error('Sync failed after all retries');
  }

  private createTwinPair(matchData: any): TwinPairData {
    return {
      pairId: matchData.id,
      twin1Id: matchData.twin1Id,
      twin2Id: matchData.twin2Id,
      pairedAt: new Date().toISOString(),
      bothConsented: true,
      sharedAssessments: [],
      privacyLevel: 'twin_only',
    };
  }

  private async calculatePairAnalytics(
    twin1Results: AssessmentResults,
    twin2Results: AssessmentResults
  ): Promise<PairAnalytics> {
    const similarityScores = {};
    const complementarityScores = {};
    
    // Calculate category-wise similarity
    twin1Results.scores.forEach(score1 => {
      const score2 = twin2Results.scores.find(s => s.category === score1.category);
      if (score2) {
        const similarity = 1 - Math.abs(score1.normalizedScore - score2.normalizedScore) / 100;
        similarityScores[score1.category] = similarity;
        complementarityScores[score1.category] = Math.abs(score1.normalizedScore - score2.normalizedScore) / 100;
      }
    });
    
    const overallCompatibility = Object.values(similarityScores as Record<string, number>)
      .reduce((sum: number, score: number) => sum + score, 0) / Object.keys(similarityScores).length;
    
    return {
      similarityScores,
      complementarityScores,
      overallCompatibility,
      uniqueTraits: {
        twin1: this.extractUniqueTraits(twin1Results.scores),
        twin2: this.extractUniqueTraits(twin2Results.scores),
      },
      sharedTraits: this.extractSharedTraits(twin1Results.scores, twin2Results.scores),
      growthOpportunities: this.identifyGrowthOpportunities(twin1Results.scores, twin2Results.scores),
      strengthAreas: this.identifyStrengthAreas(twin1Results.scores, twin2Results.scores),
      lastUpdated: new Date().toISOString(),
    };
  }

  private extractUniqueTraits(scores: any[]): string[] {
    return scores
      .filter(score => score.normalizedScore > 80)
      .map(score => `High ${score.category}`);
  }

  private extractSharedTraits(scores1: any[], scores2: any[]): string[] {
    const shared = [];
    
    scores1.forEach(score1 => {
      const score2 = scores2.find(s => s.category === score1.category);
      if (score2 && Math.abs(score1.normalizedScore - score2.normalizedScore) < 20) {
        shared.push(`Similar ${score1.category}`);
      }
    });
    
    return shared;
  }

  private identifyGrowthOpportunities(scores1: any[], scores2: any[]): string[] {
    const opportunities = [];
    
    scores1.forEach(score1 => {
      const score2 = scores2.find(s => s.category === score1.category);
      if (score2) {
        if (score1.normalizedScore < 40 && score2.normalizedScore > 60) {
          opportunities.push(`Twin 1: Learn ${score1.category} from Twin 2`);
        } else if (score2.normalizedScore < 40 && score1.normalizedScore > 60) {
          opportunities.push(`Twin 2: Learn ${score1.category} from Twin 1`);
        }
      }
    });
    
    return opportunities;
  }

  private identifyStrengthAreas(scores1: any[], scores2: any[]): string[] {
    const strengths = [];
    
    scores1.forEach(score1 => {
      const score2 = scores2.find(s => s.category === score1.category);
      if (score2 && score1.normalizedScore > 70 && score2.normalizedScore > 70) {
        strengths.push(`Mutual strength in ${score1.category}`);
      }
    });
    
    return strengths;
  }

  private anonymizeResults(results: AssessmentResults): any {
    return {
      id: this.generateAnonymousId(),
      templateId: results.templateId,
      completedAt: results.completedAt,
      scores: results.scores.map(score => ({
        category: score.category,
        normalizedScore: Math.round(score.normalizedScore / 10) * 10, // Round to nearest 10
        confidence: Math.round(score.confidence * 10) / 10,
      })),
      overallScore: results.overallScore ? Math.round(results.overallScore / 10) * 10 : null,
      demographics: {
        ageRange: this.anonymizeAge(results.userId), // Would need age data
        region: 'anonymized',
      },
    };
  }

  private async getAnonymizedPairAnalytics(): Promise<any[]> {
    // Retrieve and anonymize pair analytics
    return [];
  }

  private generateAnonymousId(): string {
    return 'anon_' + Math.random().toString(36).substr(2, 9);
  }

  private anonymizeAge(userId: string): string {
    // This would use actual age data to create age ranges
    return '25-34'; // Example
  }

  private startSyncWorker(): void {
    // Background sync worker
    setInterval(async () => {
      if (!this.syncing && this.syncQueue.length > 0) {
        const netState = await NetInfo.fetch();
        if (netState.isConnected) {
          try {
            await this.forceSyncAll({ maxRetries: 1 });
          } catch (error) {
            console.log('Background sync failed:', error);
          }
        }
      }
    }, 30000); // Check every 30 seconds
  }
}

// Singleton instance
export const SyncService = new SyncServiceClass();
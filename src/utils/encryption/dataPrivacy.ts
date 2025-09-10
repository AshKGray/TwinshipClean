/**
 * Data Privacy Utilities - GDPR/Privacy compliance and data management
 * Handles consent management, data anonymization, and privacy controls
 */

import {
  PrivacyConsent,
  AssessmentResults,
  TwinPairData,
} from '../types/assessment/types';
import { EncryptionService } from '../services/encryptionService';
import { storageService } from '../services/storageService';

export interface PrivacySettings {
  dataCollection: boolean;
  researchParticipation: boolean;
  anonymizedSharing: boolean;
  twinDataMerging: boolean;
  marketingCommunications: boolean;
  thirdPartySharing: boolean;
  dataRetentionPeriod: '1year' | '5years' | 'indefinite' | 'until_deleted';
  rightToErasure: boolean;
  dataPortability: boolean;
  processingPurposes: string[];
}

export interface DataAuditLog {
  id: string;
  timestamp: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'share' | 'export' | 'anonymize';
  dataType: string;
  userId: string;
  purpose: string;
  legalBasis: 'consent' | 'legitimate_interest' | 'contract' | 'legal_obligation';
  automated: boolean;
}

export interface ConsentRecord {
  id: string;
  userId: string;
  consentType: string;
  granted: boolean;
  timestamp: string;
  version: string;
  mechanism: 'explicit' | 'implied' | 'opt_in' | 'opt_out';
  withdrawable: boolean;
  evidence: string; // How consent was captured
}

export interface DataInventory {
  personalData: {
    category: string;
    fields: string[];
    purpose: string;
    legalBasis: string;
    retentionPeriod: string;
    sharing: string[];
  }[];
  sensitiveData: {
    category: string;
    fields: string[];
    purpose: string;
    safeguards: string[];
  }[];
  processedData: {
    type: string;
    source: string;
    processing: string;
    output: string;
  }[];
}

class DataPrivacyManager {
  private auditLog: DataAuditLog[] = [];
  private consentRecords: Map<string, ConsentRecord[]> = new Map();
  
  /**
   * Initialize privacy settings with defaults
   */
  getDefaultPrivacySettings(): PrivacySettings {
    return {
      dataCollection: false,
      researchParticipation: false,
      anonymizedSharing: false,
      twinDataMerging: false,
      marketingCommunications: false,
      thirdPartySharing: false,
      dataRetentionPeriod: 'until_deleted',
      rightToErasure: true,
      dataPortability: true,
      processingPurposes: ['assessment_functionality'],
    };
  }

  /**
   * Validate privacy consent for specific processing
   */
  async validateConsent(
    userId: string,
    processingType: string,
    dataType: string
  ): Promise<boolean> {
    const userConsents = this.consentRecords.get(userId) || [];
    const relevantConsent = userConsents.find(c => 
      c.consentType === processingType && c.granted
    );
    
    if (!relevantConsent) {
      await this.logDataAction({
        action: 'read',
        dataType,
        userId,
        purpose: processingType,
        legalBasis: 'consent',
        automated: true,
      });
      return false;
    }
    
    // Check if consent is still valid (not withdrawn)
    const isValid = relevantConsent.granted && 
                   (!relevantConsent.withdrawable || 
                    new Date(relevantConsent.timestamp) > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)); // 1 year validity
    
    if (isValid) {
      await this.logDataAction({
        action: 'read',
        dataType,
        userId,
        purpose: processingType,
        legalBasis: 'consent',
        automated: true,
      });
    }
    
    return isValid;
  }

  /**
   * Record user consent
   */
  async recordConsent(
    userId: string,
    consentType: string,
    granted: boolean,
    mechanism: ConsentRecord['mechanism'] = 'explicit',
    evidence?: string
  ): Promise<void> {
    const consent: ConsentRecord = {
      id: `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      consentType,
      granted,
      timestamp: new Date().toISOString(),
      version: '1.0', // Would be dynamic based on privacy policy version
      mechanism,
      withdrawable: true,
      evidence: evidence || `${mechanism} consent via app interface`,
    };
    
    const userConsents = this.consentRecords.get(userId) || [];
    userConsents.push(consent);
    this.consentRecords.set(userId, userConsents);
    
    // Store securely
    await storageService.setSecure(`consent_${userId}`, userConsents);
    
    await this.logDataAction({
      action: granted ? 'create' : 'delete',
      dataType: 'consent_record',
      userId,
      purpose: 'consent_management',
      legalBasis: 'consent',
      automated: false,
    });
  }

  /**
   * Withdraw consent for specific processing
   */
  async withdrawConsent(
    userId: string,
    consentType: string
  ): Promise<void> {
    await this.recordConsent(userId, consentType, false, 'explicit', 'User initiated withdrawal');
    
    // If data merging consent is withdrawn, handle pair data
    if (consentType === 'twinDataMerging') {
      await this.handleDataMergingWithdrawal(userId);
    }
  }

  /**
   * Anonymize assessment data
   */
  async anonymizeAssessmentData(
    results: AssessmentResults,
    anonymizationLevel: 'basic' | 'enhanced' | 'full' = 'enhanced'
  ): Promise<any> {
    const anonymized = {
      // Remove direct identifiers
      id: this.generateAnonymousId(),
      templateId: results.templateId,
      completedAt: this.anonymizeTimestamp(results.completedAt, anonymizationLevel),
      
      // Generalize scores
      scores: results.scores.map(score => ({
        category: score.category,
        normalizedScore: this.generalizeScore(score.normalizedScore, anonymizationLevel),
        confidence: Math.round(score.confidence * 10) / 10, // Round to 1 decimal
      })),
      
      // Remove or generalize sensitive fields
      overallScore: results.overallScore ? 
        this.generalizeScore(results.overallScore, anonymizationLevel) : null,
      
      // Add noise to prevent re-identification
      reliability: this.addNoise(results.reliability, 0.05),
      validity: this.addNoise(results.validity, 0.05),
      
      // Generalize insights
      insights: this.anonymizeInsights(results.insights),
      recommendations: this.anonymizeRecommendations(results.recommendations),
      
      // Add anonymization metadata
      _anonymized: {
        level: anonymizationLevel,
        timestamp: new Date().toISOString(),
        method: 'k_anonymity_differential_privacy',
      },
    };
    
    await this.logDataAction({
      action: 'anonymize',
      dataType: 'assessment_results',
      userId: results.userId,
      purpose: 'data_protection',
      legalBasis: 'consent',
      automated: true,
    });
    
    return anonymized;
  }

  /**
   * Create data export package for user (GDPR Article 20)
   */
  async createDataExport(
    userId: string,
    includeAnalytics = false
  ): Promise<{
    personalData: any;
    assessmentData: any;
    pairData: any;
    consentHistory: ConsentRecord[];
    auditLog: DataAuditLog[];
    metadata: {
      exportedAt: string;
      format: string;
      completeness: string;
    };
  }> {
    // Validate user consent for data export
    const canExport = await this.validateConsent(userId, 'dataPortability', 'all_user_data');
    if (!canExport) {
      throw new Error('No valid consent for data export');
    }
    
    const exportData = {
      personalData: await this.getUserPersonalData(userId),
      assessmentData: await this.getUserAssessmentData(userId),
      pairData: includeAnalytics ? await this.getUserPairData(userId) : null,
      consentHistory: this.consentRecords.get(userId) || [],
      auditLog: this.auditLog.filter(log => log.userId === userId),
      metadata: {
        exportedAt: new Date().toISOString(),
        format: 'JSON',
        completeness: 'complete',
      },
    };
    
    await this.logDataAction({
      action: 'export',
      dataType: 'complete_user_data',
      userId,
      purpose: 'data_portability',
      legalBasis: 'consent',
      automated: false,
    });
    
    return exportData;
  }

  /**
   * Delete all user data (GDPR Article 17 - Right to Erasure)
   */
  async deleteAllUserData(
    userId: string,
    reason: 'user_request' | 'consent_withdrawal' | 'retention_expired'
  ): Promise<void> {
    try {
      // Delete assessment data
      await storageService.removeSecure(`assessment_results_${userId}`);
      await storageService.removeSecure(`assessment_progress_${userId}`);
      
      // Delete pair data
      await storageService.removeSecure(`pair_data_${userId}`);
      await storageService.removeSecure(`pair_analytics_${userId}`);
      
      // Delete consent records
      await storageService.removeSecure(`consent_${userId}`);
      this.consentRecords.delete(userId);
      
      // Handle shared pair data
      await this.handleSharedDataDeletion(userId);
      
      await this.logDataAction({
        action: 'delete',
        dataType: 'complete_user_data',
        userId,
        purpose: `data_erasure_${reason}`,
        legalBasis: 'consent',
        automated: reason === 'retention_expired',
      });
      
    } catch (error) {
      console.error('Failed to delete user data:', error);
      throw new Error('Data deletion failed');
    }
  }

  /**
   * Check data retention compliance
   */
  async checkRetentionCompliance(): Promise<{
    expiredData: Array<{
      userId: string;
      dataType: string;
      retentionExpiry: string;
    }>;
    actionRequired: boolean;
  }> {
    const expiredData: any[] = [];
    const currentDate = new Date();
    
    // Check assessment data retention
    const assessmentKeys = await this.getAllStorageKeys('assessment_');
    
    for (const key of assessmentKeys) {
      const data = await storageService.getSecure(key);
      if (data && data.createdAt) {
        const retentionPeriod = this.getRetentionPeriod(data.userId, 'assessment_data');
        const expiryDate = this.calculateExpiryDate(data.createdAt, retentionPeriod);
        
        if (currentDate > expiryDate) {
          expiredData.push({
            userId: data.userId,
            dataType: 'assessment_data',
            retentionExpiry: expiryDate.toISOString(),
          });
        }
      }
    }
    
    return {
      expiredData,
      actionRequired: expiredData.length > 0,
    };
  }

  /**
   * Generate data processing impact assessment
   */
  async generateDPIA(): Promise<{
    riskLevel: 'low' | 'medium' | 'high';
    risks: Array<{
      category: string;
      description: string;
      likelihood: number;
      impact: number;
      mitigations: string[];
    }>;
    recommendations: string[];
    lastUpdated: string;
  }> {
    const risks = [
      {
        category: 'Data Breach',
        description: 'Unauthorized access to assessment data',
        likelihood: 0.2,
        impact: 0.8,
        mitigations: [
          'End-to-end encryption',
          'Secure storage tiers',
          'Access logging',
          'Regular security audits',
        ],
      },
      {
        category: 'Re-identification',
        description: 'Identifying users from anonymized data',
        likelihood: 0.3,
        impact: 0.6,
        mitigations: [
          'K-anonymity algorithms',
          'Differential privacy',
          'Data generalization',
          'Regular anonymization review',
        ],
      },
      {
        category: 'Consent Violations',
        description: 'Processing data without valid consent',
        likelihood: 0.1,
        impact: 0.9,
        mitigations: [
          'Consent validation checks',
          'Automated consent monitoring',
          'Regular consent audits',
          'Clear consent mechanisms',
        ],
      },
    ];
    
    const riskScores = risks.map(risk => risk.likelihood * risk.impact);
    const maxRisk = Math.max(...riskScores);
    
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (maxRisk > 0.6) riskLevel = 'high';
    else if (maxRisk > 0.3) riskLevel = 'medium';
    
    const recommendations = [
      'Implement regular privacy training',
      'Conduct quarterly privacy audits',
      'Update privacy notices annually',
      'Monitor data processing activities',
      'Implement privacy by design principles',
    ];
    
    return {
      riskLevel,
      risks,
      recommendations,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Get data inventory for compliance reporting
   */
  async getDataInventory(): Promise<DataInventory> {
    return {
      personalData: [
        {
          category: 'User Profile',
          fields: ['name', 'email', 'phone', 'dateOfBirth', 'location'],
          purpose: 'User identification and twin pairing',
          legalBasis: 'consent',
          retentionPeriod: '5 years or until deletion request',
          sharing: ['Twin pair only'],
        },
        {
          category: 'Assessment Responses',
          fields: ['questionResponses', 'scores', 'timestamps'],
          purpose: 'Personality assessment and twin analytics',
          legalBasis: 'consent',
          retentionPeriod: 'User-defined or until deletion request',
          sharing: ['Research (anonymized)', 'Twin pair (with consent)'],
        },
      ],
      sensitiveData: [
        {
          category: 'Psychological Data',
          fields: ['personalityScores', 'behavioralPatterns', 'emotionalProfiles'],
          purpose: 'Twin compatibility analysis',
          safeguards: ['End-to-end encryption', 'Access controls', 'Audit logging'],
        },
      ],
      processedData: [
        {
          type: 'Pair Analytics',
          source: 'Twin assessment data',
          processing: 'Similarity and complementarity algorithms',
          output: 'Compatibility scores and insights',
        },
        {
          type: 'Anonymized Research Data',
          source: 'User assessment data',
          processing: 'Anonymization and aggregation',
          output: 'Research insights and trends',
        },
      ],
    };
  }

  // Private helper methods
  private async logDataAction(
    action: Omit<DataAuditLog, 'id' | 'timestamp'>
  ): Promise<void> {
    const logEntry: DataAuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...action,
    };
    
    this.auditLog.push(logEntry);
    
    // Keep only recent entries to prevent memory issues
    if (this.auditLog.length > 10000) {
      this.auditLog = this.auditLog.slice(-5000);
    }
    
    // Persist audit log
    await storageService.set('privacy_audit_log', this.auditLog);
  }

  private generateAnonymousId(): string {
    return `anon_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 8)}`;
  }

  private anonymizeTimestamp(
    timestamp: string,
    level: 'basic' | 'enhanced' | 'full'
  ): string {
    const date = new Date(timestamp);
    
    switch (level) {
      case 'basic':
        // Round to nearest day
        return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
      case 'enhanced':
        // Round to nearest month
        return new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
      case 'full':
        // Round to nearest year
        return new Date(date.getFullYear(), 0, 1).toISOString();
    }
  }

  private generalizeScore(
    score: number,
    level: 'basic' | 'enhanced' | 'full'
  ): number {
    switch (level) {
      case 'basic':
        return Math.round(score / 5) * 5; // Round to nearest 5
      case 'enhanced':
        return Math.round(score / 10) * 10; // Round to nearest 10
      case 'full':
        return Math.round(score / 25) * 25; // Round to nearest 25
    }
  }

  private addNoise(value: number, noiseLevel: number): number {
    const noise = (Math.random() - 0.5) * 2 * noiseLevel;
    return Math.max(0, Math.min(1, value + noise));
  }

  private anonymizeInsights(insights: string[]): string[] {
    return insights.map(insight => 
      insight.replace(/\b(high|low|strong|weak)\s+/gi, 'notable ')
            .replace(/\b(very|extremely|significantly)\s+/gi, '')
            .replace(/\b\d+\.?\d*%/g, 'X%')
    );
  }

  private anonymizeRecommendations(recommendations: string[]): string[] {
    return recommendations.map(rec => 
      rec.replace(/\b(you|your)\b/gi, 'users')
         .replace(/\b(twin|sibling)\b/gi, 'pair member')
    );
  }

  private async handleDataMergingWithdrawal(userId: string): Promise<void> {
    // Remove user from any existing pairs
    const pairKeys = await this.getAllStorageKeys('pair_');
    
    for (const key of pairKeys) {
      const pairData = await storageService.getSecure(key);
      if (pairData && (pairData.twin1Id === userId || pairData.twin2Id === userId)) {
        // Mark pair as consent-withdrawn
        pairData.bothConsented = false;
        pairData.withdrawnAt = new Date().toISOString();
        await storageService.setSecure(key, pairData);
        
        // Delete merged analytics
        await storageService.removeSecure(`pair_analytics_${pairData.pairId}`);
      }
    }
  }

  private async handleSharedDataDeletion(userId: string): Promise<void> {
    // Handle deletion when user data is part of pair analytics
    const pairKeys = await this.getAllStorageKeys('pair_analytics_');
    
    for (const key of pairKeys) {
      const analytics = await storageService.getSecure(key);
      if (analytics && analytics.involvedUsers && analytics.involvedUsers.includes(userId)) {
        // Anonymize the remaining data or delete if both users are gone
        const remainingUsers = analytics.involvedUsers.filter((id: string) => id !== userId);
        
        if (remainingUsers.length === 0) {
          await storageService.removeSecure(key);
        } else {
          // Anonymize the data for remaining user
          const anonymizedAnalytics = await this.anonymizeAssessmentData(analytics, 'full');
          await storageService.setSecure(key, anonymizedAnalytics);
        }
      }
    }
  }

  private async getUserPersonalData(userId: string): Promise<any> {
    // Retrieve all personal data for the user
    const keys = await this.getAllStorageKeys(`user_${userId}`);
    const personalData: any = {};
    
    for (const key of keys) {
      const data = await storageService.getSecure(key);
      if (data) {
        personalData[key] = data;
      }
    }
    
    return personalData;
  }

  private async getUserAssessmentData(userId: string): Promise<any> {
    // Retrieve assessment data for the user
    return await storageService.getSecure(`assessment_results_${userId}`);
  }

  private async getUserPairData(userId: string): Promise<any> {
    // Retrieve pair data for the user
    return await storageService.getSecure(`pair_data_${userId}`);
  }

  private async getAllStorageKeys(prefix: string): Promise<string[]> {
    // Mock implementation - would use actual storage key enumeration
    return [];
  }

  private getRetentionPeriod(userId: string, dataType: string): string {
    // Get user-specific retention period or default
    return '5years'; // Default
  }

  private calculateExpiryDate(createdAt: string, retention: string): Date {
    const created = new Date(createdAt);
    
    switch (retention) {
      case '1year':
        return new Date(created.getTime() + 365 * 24 * 60 * 60 * 1000);
      case '5years':
        return new Date(created.getTime() + 5 * 365 * 24 * 60 * 60 * 1000);
      case 'indefinite':
        return new Date('9999-12-31');
      default:
        return new Date('9999-12-31');
    }
  }
}

// Export singleton instance
export const dataPrivacyManager = new DataPrivacyManager();

// Export utility functions
export {
  DataPrivacyManager,
};

/**
 * Initialize privacy compliance checks
 */
export async function initializePrivacyCompliance(): Promise<void> {
  // Run retention compliance check
  const compliance = await dataPrivacyManager.checkRetentionCompliance();
  
  if (compliance.actionRequired) {
    console.log('Privacy compliance action required:', compliance.expiredData.length, 'expired items');
    // Handle expired data according to policy
  }
  
  // Schedule regular compliance checks
  setInterval(async () => {
    await dataPrivacyManager.checkRetentionCompliance();
  }, 24 * 60 * 60 * 1000); // Daily check
}

/**
 * Validate data processing legality
 */
export async function validateProcessingLegality(
  userId: string,
  processingType: string,
  dataTypes: string[]
): Promise<{
  legal: boolean;
  basis: string;
  restrictions: string[];
}> {
  const legal = await dataPrivacyManager.validateConsent(userId, processingType, dataTypes.join(','));
  
  return {
    legal,
    basis: legal ? 'consent' : 'no_legal_basis',
    restrictions: legal ? [] : ['Obtain valid consent before processing'],
  };
}
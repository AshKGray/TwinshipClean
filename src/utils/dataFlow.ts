/**
 * Data Flow Architecture - Complete data flow orchestration
 * Coordinates all data operations across the assessment system
 */

import {
  AssessmentTemplate,
  AssessmentProgress,
  AssessmentResults,
  AssessmentResponse,
  TwinPairData,
  PairAnalytics,
  PrivacyConsent,
  SyncStatus,
} from '../types/assessment/types';
import { useAssessmentStore } from '../state/stores/assessmentStore';
import { usePairStore } from '../state/stores/pairStore';
import { SyncService } from '../services/syncService';
import { storageService } from '../services/storageService';
import { EncryptionService } from '../services/encryptionService';
import { analyzeTwinCompatibility } from './analytics/pairAnalytics';
import { dataPrivacyManager } from './encryption/dataPrivacy';

export interface DataFlowConfig {
  enableEncryption: boolean;
  enableCloudSync: boolean;
  enableAnalytics: boolean;
  privacyLevel: 'minimal' | 'standard' | 'enhanced';
  retentionPolicy: 'user_controlled' | 'app_managed' | 'compliance_driven';
}

export interface DataFlowOperation {
  id: string;
  type: 'create' | 'read' | 'update' | 'sync' | 'analyze' | 'export' | 'delete';
  entity: 'assessment' | 'response' | 'results' | 'pair' | 'analytics' | 'consent';
  userId: string;
  timestamp: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  metadata: Record<string, any>;
  privacy: {
    consentRequired: boolean;
    encryptionLevel: 'none' | 'standard' | 'high';
    auditRequired: boolean;
  };
}

export interface DataFlowMetrics {
  totalOperations: number;
  successRate: number;
  averageProcessingTime: number;
  encryptionRate: number;
  syncRate: number;
  privacyCompliance: number;
  storageUtilization: {
    local: number;
    secure: number;
    cloud: number;
  };
}

class DataFlowOrchestrator {
  private config: DataFlowConfig;
  private operationQueue: DataFlowOperation[] = [];
  private activeOperations: Map<string, DataFlowOperation> = new Map();
  private metrics: DataFlowMetrics;
  private initialized = false;

  constructor(config: Partial<DataFlowConfig> = {}) {
    this.config = {
      enableEncryption: true,
      enableCloudSync: true,
      enableAnalytics: true,
      privacyLevel: 'standard',
      retentionPolicy: 'user_controlled',
      ...config,
    };

    this.metrics = {
      totalOperations: 0,
      successRate: 0,
      averageProcessingTime: 0,
      encryptionRate: 0,
      syncRate: 0,
      privacyCompliance: 0,
      storageUtilization: {
        local: 0,
        secure: 0,
        cloud: 0,
      },
    };
  }

  /**
   * Initialize the data flow system
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Initialize encryption service
      await EncryptionService.initialize();

      // Load existing metrics
      const savedMetrics = await storageService.get('dataflow_metrics');
      if (savedMetrics) {
        this.metrics = { ...this.metrics, ...savedMetrics };
      }

      // Start operation processor
      this.startOperationProcessor();

      // Initialize privacy compliance
      await dataPrivacyManager.checkRetentionCompliance();

      this.initialized = true;
      console.log('Data flow orchestrator initialized');
    } catch (error) {
      console.error('Failed to initialize data flow orchestrator:', error);
      throw error;
    }
  }

  /**
   * Start assessment flow
   */
  async startAssessmentFlow(
    template: AssessmentTemplate,
    userId: string,
    privacyConsent: PrivacyConsent
  ): Promise<{
    progress: AssessmentProgress;
    operationId: string;
  }> {
    // Validate privacy consent
    const consentValid = await dataPrivacyManager.validateConsent(
      userId,
      'assessment_processing',
      'assessment_data'
    );

    if (!consentValid) {
      throw new Error('Invalid privacy consent for assessment processing');
    }

    // Create operation
    const operation = this.createOperation({
      type: 'create',
      entity: 'assessment',
      userId,
      metadata: { templateId: template.id },
      privacy: {
        consentRequired: true,
        encryptionLevel: this.config.privacyLevel === 'enhanced' ? 'high' : 'standard',
        auditRequired: true,
      },
    });

    // Queue operation
    this.queueOperation(operation);

    // Start assessment using store
    const assessmentStore = useAssessmentStore.getState();
    await assessmentStore.loadTemplate(template);
    assessmentStore.startAssessment(template.id, userId);
    assessmentStore.updatePrivacyConsent(privacyConsent);

    const progress = assessmentStore.currentProgress!;

    return {
      progress,
      operationId: operation.id,
    };
  }

  /**
   * Process assessment response
   */
  async processResponse(
    questionId: string,
    response: AssessmentResponse,
    userId: string
  ): Promise<void> {
    const operation = this.createOperation({
      type: 'update',
      entity: 'response',
      userId,
      metadata: { questionId, responseType: response.value?.constructor?.name || 'unknown' },
      privacy: {
        consentRequired: false,
        encryptionLevel: 'standard',
        auditRequired: false,
      },
    });

    this.queueOperation(operation);

    // Save response using store
    const assessmentStore = useAssessmentStore.getState();
    await assessmentStore.saveResponse(questionId, response);

    // Auto-save progress periodically
    if (assessmentStore.currentProgress?.completedQuestions % 5 === 0) {
      await this.saveProgress(userId);
    }
  }

  /**
   * Complete assessment and generate results
   */
  async completeAssessment(
    userId: string
  ): Promise<{
    results: AssessmentResults;
    syncStatus: SyncStatus;
  }> {
    const operation = this.createOperation({
      type: 'create',
      entity: 'results',
      userId,
      metadata: { completion: true },
      privacy: {
        consentRequired: true,
        encryptionLevel: 'high',
        auditRequired: true,
      },
    });

    this.queueOperation(operation);

    // Complete assessment using store
    const assessmentStore = useAssessmentStore.getState();
    const results = await assessmentStore.completeAssessment();

    // Handle cloud sync if enabled and consented
    let syncStatus: SyncStatus = {
      pendingChanges: 0,
      needsResolution: false,
    };

    if (this.config.enableCloudSync && results.privacyConsent.twinDataMerging) {
      try {
        await SyncService.syncAssessmentResults(results, {
          encryptCloud: this.config.enableEncryption,
          includeAnalytics: this.config.enableAnalytics,
        });
        syncStatus = await SyncService.getSyncStatus();
      } catch (error) {
        console.warn('Cloud sync failed, will retry later:', error);
      }
    }

    return {
      results,
      syncStatus,
    };
  }

  /**
   * Create twin pair and generate analytics
   */
  async createTwinPair(
    invitationId: string,
    userId: string
  ): Promise<{
    pairData: TwinPairData;
    analytics?: PairAnalytics;
  }> {
    const operation = this.createOperation({
      type: 'create',
      entity: 'pair',
      userId,
      metadata: { invitationId },
      privacy: {
        consentRequired: true,
        encryptionLevel: 'high',
        auditRequired: true,
      },
    });

    this.queueOperation(operation);

    // Create pair using store
    const pairStore = usePairStore.getState();
    const pairData = await pairStore.acceptInvitation(invitationId);

    // Generate analytics if both twins have completed assessments
    let analytics: PairAnalytics | undefined;

    if (this.config.enableAnalytics) {
      const twin1Results = await this.getUserResults(pairData.twin1Id);
      const twin2Results = await this.getUserResults(pairData.twin2Id);

      if (twin1Results && twin2Results) {
        analytics = await this.generatePairAnalytics(
          twin1Results,
          twin2Results,
          pairData.pairId
        );
      }
    }

    return {
      pairData,
      analytics,
    };
  }

  /**
   * Generate pair analytics with privacy protection
   */
  async generatePairAnalytics(
    twin1Results: AssessmentResults,
    twin2Results: AssessmentResults,
    pairId: string
  ): Promise<PairAnalytics> {
    const operation = this.createOperation({
      type: 'analyze',
      entity: 'analytics',
      userId: twin1Results.userId, // Primary user for operation tracking
      metadata: { pairId, twin2UserId: twin2Results.userId },
      privacy: {
        consentRequired: true,
        encryptionLevel: 'high',
        auditRequired: true,
      },
    });

    this.queueOperation(operation);

    // Verify both users consented to data merging
    if (!twin1Results.privacyConsent.twinDataMerging ||
        !twin2Results.privacyConsent.twinDataMerging) {
      throw new Error('Both twins must consent to data merging for analytics');
    }

    // Generate analytics using pair analytics function
    const analytics = analyzeTwinCompatibility(
      twin1Results,
      twin2Results
    );

    // Store analytics securely
    await storageService.setSecure(
      `pair_analytics_${pairId}`,
      analytics,
      {
        backup: true,
      }
    );

    // Update pair store
    const pairStore = usePairStore.getState();
    pairStore.generateAnalytics(twin1Results, twin2Results);

    return analytics;
  }

  /**
   * Export user data for portability
   */
  async exportUserData(
    userId: string,
    includeAnalytics = false
  ): Promise<string> {
    const operation = this.createOperation({
      type: 'export',
      entity: 'assessment',
      userId,
      metadata: { includeAnalytics },
      privacy: {
        consentRequired: true,
        encryptionLevel: 'none', // Export is unencrypted for portability
        auditRequired: true,
      },
    });

    this.queueOperation(operation);

    // Export using privacy manager
    const exportData = await dataPrivacyManager.createDataExport(
      userId,
      includeAnalytics
    );

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Delete all user data
   */
  async deleteUserData(
    userId: string,
    reason: 'user_request' | 'consent_withdrawal' | 'retention_expired' = 'user_request'
  ): Promise<void> {
    const operation = this.createOperation({
      type: 'delete',
      entity: 'assessment',
      userId,
      metadata: { reason, deletionType: 'complete' },
      privacy: {
        consentRequired: false, // Deletion doesn't require consent
        encryptionLevel: 'none',
        auditRequired: true,
      },
    });

    this.queueOperation(operation);

    // Delete using privacy manager
    await dataPrivacyManager.deleteAllUserData(userId, reason);

    // Clear from stores
    const assessmentStore = useAssessmentStore.getState();
    const pairStore = usePairStore.getState();

    await assessmentStore.deleteAllData();
    await pairStore.deletePairData();
  }

  /**
   * Get data flow metrics
   */
  async getMetrics(): Promise<DataFlowMetrics> {
    // Update storage utilization
    const storageStats = await storageService.getStats();
    
    this.metrics.storageUtilization = {
      local: storageStats.tierStats.standard.size + storageStats.tierStats.temp.size,
      secure: storageStats.tierStats.secure.size,
      cloud: 0, // Would be updated from sync service
    };

    // Calculate rates
    const totalOps = this.metrics.totalOperations;
    if (totalOps > 0) {
      const encryptedOps = this.countEncryptedOperations();
      const syncedOps = this.countSyncedOperations();
      
      this.metrics.encryptionRate = encryptedOps / totalOps;
      this.metrics.syncRate = syncedOps / totalOps;
    }

    return { ...this.metrics };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<DataFlowConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): DataFlowConfig {
    return { ...this.config };
  }

  // Private methods
  private createOperation(
    params: Omit<DataFlowOperation, 'id' | 'timestamp' | 'status'>
  ): DataFlowOperation {
    return {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      status: 'pending',
      ...params,
    };
  }

  private queueOperation(operation: DataFlowOperation): void {
    this.operationQueue.push(operation);
    this.metrics.totalOperations++;
  }

  private startOperationProcessor(): void {
    setInterval(async () => {
      await this.processOperationQueue();
    }, 1000); // Process every second
  }

  private async processOperationQueue(): Promise<void> {
    if (this.operationQueue.length === 0) return;

    const operation = this.operationQueue.shift()!;
    this.activeOperations.set(operation.id, operation);

    try {
      operation.status = 'processing';
      const startTime = Date.now();

      // Process operation based on type
      await this.executeOperation(operation);

      operation.status = 'completed';
      const processingTime = Date.now() - startTime;
      this.updateMetrics(operation, processingTime, true);

    } catch (error) {
      operation.status = 'failed';
      console.error('Operation failed:', operation.id, error);
      this.updateMetrics(operation, 0, false);
    } finally {
      this.activeOperations.delete(operation.id);
    }
  }

  private async executeOperation(operation: DataFlowOperation): Promise<void> {
    // Audit logging
    if (operation.privacy.auditRequired) {
      console.log('Auditing operation:', operation.id, operation.type, operation.entity);
    }

    // Consent validation
    if (operation.privacy.consentRequired) {
      const consentValid = await dataPrivacyManager.validateConsent(
        operation.userId,
        `${operation.type}_${operation.entity}`,
        operation.entity
      );

      if (!consentValid) {
        throw new Error('Invalid consent for operation');
      }
    }

    // Operation-specific processing would go here
    // This is a simplified version - actual implementation would have
    // detailed handlers for each operation type/entity combination
    
    console.log('Executing operation:', operation.id);
  }

  private updateMetrics(
    operation: DataFlowOperation,
    processingTime: number,
    success: boolean
  ): void {
    const currentAvg = this.metrics.averageProcessingTime;
    const totalOps = this.metrics.totalOperations;
    
    this.metrics.averageProcessingTime = 
      (currentAvg * (totalOps - 1) + processingTime) / totalOps;
    
    if (success) {
      this.metrics.successRate = 
        (this.metrics.successRate * (totalOps - 1) + 1) / totalOps;
    } else {
      this.metrics.successRate = 
        (this.metrics.successRate * (totalOps - 1)) / totalOps;
    }

    // Save metrics periodically
    if (totalOps % 10 === 0) {
      storageService.set('dataflow_metrics', this.metrics);
    }
  }

  private countEncryptedOperations(): number {
    // Would track operations that used encryption
    return Math.floor(this.metrics.totalOperations * 0.8); // Placeholder
  }

  private countSyncedOperations(): number {
    // Would track operations that were synced to cloud
    return Math.floor(this.metrics.totalOperations * 0.6); // Placeholder
  }

  private async saveProgress(userId: string): Promise<void> {
    const assessmentStore = useAssessmentStore.getState();
    await assessmentStore.saveProgress();
  }

  private async getUserResults(userId: string): Promise<AssessmentResults | null> {
    try {
      return await storageService.getSecure(`results_${userId}`);
    } catch {
      return null;
    }
  }
}

// Export singleton instance
export const dataFlowOrchestrator = new DataFlowOrchestrator();

// Export utility functions
export {
  DataFlowOrchestrator,
};

/**
 * Initialize data flow system
 */
export async function initializeDataFlow(
  config?: Partial<DataFlowConfig>
): Promise<DataFlowOrchestrator> {
  if (config) {
    dataFlowOrchestrator.updateConfig(config);
  }
  
  await dataFlowOrchestrator.initialize();
  return dataFlowOrchestrator;
}

/**
 * Create a complete assessment workflow
 */
export async function createAssessmentWorkflow(
  template: AssessmentTemplate,
  userId: string,
  privacyConsent: PrivacyConsent
): Promise<{
  startAssessment: () => Promise<AssessmentProgress>;
  saveResponse: (questionId: string, response: AssessmentResponse) => Promise<void>;
  completeAssessment: () => Promise<AssessmentResults>;
  pauseAssessment: () => Promise<void>;
  resumeAssessment: () => Promise<AssessmentProgress>;
}> {
  const { progress, operationId } = await dataFlowOrchestrator.startAssessmentFlow(
    template,
    userId,
    privacyConsent
  );

  return {
    startAssessment: async () => progress,
    
    saveResponse: async (questionId, response) => {
      await dataFlowOrchestrator.processResponse(questionId, response, userId);
    },
    
    completeAssessment: async () => {
      const { results } = await dataFlowOrchestrator.completeAssessment(userId);
      return results;
    },
    
    pauseAssessment: async () => {
      await dataFlowOrchestrator['saveProgress'](userId);
    },
    
    resumeAssessment: async () => {
      const assessmentStore = useAssessmentStore.getState();
      return assessmentStore.currentProgress!;
    },
  };
}
/**
 * Privacy-First Telemetry Service for Assessment Norming
 * Collects anonymous usage data to improve psychological assessment quality
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { nanoid } from 'nanoid';
import * as Crypto from 'expo-crypto';
import { 
  BaseTelemetryEvent,
  TelemetryEventType,
  TelemetryConfig,
  TelemetryBatch,
  AnonymousSession,
  QuestionTelemetryEvent,
  SectionTelemetryEvent,
  AssessmentTelemetryEvent,
  AnomalyTelemetryEvent,
  PerformanceTelemetryEvent,
  TelemetryPrivacyLevel,
  AnomalyType
} from '../types/telemetry';
import { AssessmentCategory, LikertScale } from '../types/assessment';

class TelemetryService {
  private config: TelemetryConfig;
  private currentSession: AnonymousSession | null = null;
  private eventQueue: BaseTelemetryEvent[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;

  constructor() {
    this.config = {
      enabled: false,
      privacyLevel: 'anonymous',
      collectPerformanceMetrics: true,
      collectAnomalyData: true,
      collectNormingData: true,
      batchSize: 50,
      maxRetries: 3,
      retentionDays: 90,
      encryptionEnabled: true,
      consentRequired: true,
      anonymizationDelay: 300000, // 5 minutes
    };
  }

  /**
   * Initialize telemetry service with user consent
   */
  async initialize(userConsent: boolean = false, config?: Partial<TelemetryConfig>): Promise<void> {
    try {
      // Load stored config and consent
      const storedConsent = await AsyncStorage.getItem('telemetry_consent');
      const storedConfig = await AsyncStorage.getItem('telemetry_config');

      if (storedConfig) {
        this.config = { ...this.config, ...JSON.parse(storedConfig) };
      }

      if (config) {
        this.config = { ...this.config, ...config };
        await AsyncStorage.setItem('telemetry_config', JSON.stringify(this.config));
      }

      // Enable only if user has consented
      this.config.enabled = userConsent || storedConsent === 'true';

      if (this.config.enabled) {
        await this.startSession();
        this.scheduleBatchProcessing();
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize telemetry service:', error);
    }
  }

  /**
   * Update user consent for telemetry
   */
  async updateConsent(consent: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem('telemetry_consent', consent.toString());
      this.config.enabled = consent;

      if (consent && !this.currentSession) {
        await this.startSession();
        this.scheduleBatchProcessing();
      } else if (!consent) {
        await this.endSession();
        this.clearEventQueue();
      }
    } catch (error) {
      console.error('Failed to update telemetry consent:', error);
    }
  }

  /**
   * Start a new anonymous session
   */
  private async startSession(): Promise<void> {
    if (!this.config.enabled) return;

    try {
      const sessionId = await this.generateSecureId();
      const deviceFingerprint = await this.generateDeviceFingerprint();

      this.currentSession = {
        sessionId,
        startTime: new Date().toISOString(),
        deviceFingerprint,
        consentedForNorming: true,
        consentedForResearch: true,
        dataQualityScore: 1.0,
        flagged: false,
        exclusionReasons: [],
      };

      // Store session temporarily for crash recovery
      await AsyncStorage.setItem('current_telemetry_session', JSON.stringify(this.currentSession));
    } catch (error) {
      console.error('Failed to start telemetry session:', error);
    }
  }

  /**
   * End current session
   */
  private async endSession(): Promise<void> {
    if (!this.currentSession) return;

    try {
      this.currentSession.endTime = new Date().toISOString();
      
      // Send final session event
      await this.trackEvent('assessment_completed', {
        totalTimeSpent: Date.now() - new Date(this.currentSession.startTime).getTime(),
        dataQualityScore: this.currentSession.dataQualityScore,
      });

      // Process remaining events
      await this.processBatch(true);

      // Schedule session data anonymization
      setTimeout(async () => {
        await AsyncStorage.removeItem('current_telemetry_session');
      }, this.config.anonymizationDelay);

      this.currentSession = null;
    } catch (error) {
      console.error('Failed to end telemetry session:', error);
    }
  }

  /**
   * Track question-level telemetry
   */
  async trackQuestionEvent(
    type: 'question_viewed' | 'question_answered' | 'question_revised',
    data: {
      questionId: string;
      questionCategory: AssessmentCategory;
      questionIndex: number;
      sectionId: string;
      timeOnQuestion: number;
      responseValue?: LikertScale | string | number;
      revisionCount?: number;
      confidenceLevel?: number;
    }
  ): Promise<void> {
    if (!this.isEnabled()) return;

    const event: QuestionTelemetryEvent = {
      ...this.createBaseEvent(type),
      questionId: data.questionId,
      questionCategory: data.questionCategory,
      questionIndex: data.questionIndex,
      sectionId: data.sectionId,
      timeOnQuestion: data.timeOnQuestion,
      responseValue: data.responseValue && typeof data.responseValue === 'string' && data.responseValue.includes('sensitive') 
        ? undefined 
        : data.responseValue,
      revisionCount: data.revisionCount || 0,
      confidenceLevel: data.confidenceLevel,
      responsePatternHash: data.responseValue ? 'hashed_' + (await this.hashValue(data.responseValue.toString())).substring(0, 8) : undefined,
    };

    await this.queueEvent(event);

    // Check for anomalies in real-time
    await this.checkQuestionAnomalies(event);
  }

  /**
   * Track section completion
   */
  async trackSectionCompletion(data: {
    sectionId: string;
    sectionCategory: AssessmentCategory;
    questionsInSection: number;
    timeInSection: number;
    completionRate: number;
    averageConfidence?: number;
    revisionsInSection: number;
  }): Promise<void> {
    if (!this.isEnabled()) return;

    const event: SectionTelemetryEvent = {
      ...this.createBaseEvent('section_completed'),
      sectionId: data.sectionId,
      sectionCategory: data.sectionCategory,
      questionsInSection: data.questionsInSection,
      timeInSection: data.timeInSection,
      completionRate: data.completionRate,
      averageConfidence: data.averageConfidence,
      revisionsInSection: data.revisionsInSection,
    };

    await this.queueEvent(event);
  }

  /**
   * Track assessment-level events
   */
  async trackAssessmentEvent(
    type: 'assessment_started' | 'assessment_completed' | 'assessment_abandoned',
    data: {
      assessmentVersion: string;
      totalQuestions: number;
      completedQuestions: number;
      totalTimeSpent: number;
      totalRevisions: number;
      abandonmentPoint?: {
        sectionId: string;
        questionIndex: number;
        timeSpent: number;
      };
    }
  ): Promise<void> {
    if (!this.isEnabled()) return;

    const event: AssessmentTelemetryEvent = {
      ...this.createBaseEvent(type),
      assessmentVersion: data.assessmentVersion,
      totalQuestions: data.totalQuestions,
      completedQuestions: data.completedQuestions,
      totalTimeSpent: data.totalTimeSpent,
      completionRate: data.completedQuestions / data.totalQuestions,
      averageResponseTime: data.totalTimeSpent / Math.max(data.completedQuestions, 1),
      totalRevisions: data.totalRevisions,
      abandonmentPoint: data.abandonmentPoint,
    };

    await this.queueEvent(event);

    // Check for assessment-level anomalies
    await this.checkAssessmentAnomalies(event);
  }

  /**
   * Track anomaly detection
   */
  async trackAnomaly(
    anomalyType: AnomalyType,
    data: {
      severity: 'low' | 'medium' | 'high' | 'critical';
      detectionAlgorithm: string;
      contextData: any;
      actionTaken: 'flagged' | 'excluded' | 'requires_review' | 'auto_corrected';
    }
  ): Promise<void> {
    if (!this.isEnabled()) return;

    const event: AnomalyTelemetryEvent = {
      ...this.createBaseEvent('anomaly_detected'),
      anomalyType,
      severity: data.severity,
      detectionAlgorithm: data.detectionAlgorithm,
      contextData: data.contextData,
      actionTaken: data.actionTaken,
    };

    await this.queueEvent(event);

    // Update session quality score
    if (this.currentSession) {
      const severityImpact = { low: 0.05, medium: 0.1, high: 0.2, critical: 0.5 };
      this.currentSession.dataQualityScore = Math.max(
        0,
        this.currentSession.dataQualityScore - severityImpact[data.severity]
      );

      if (data.severity === 'critical') {
        this.currentSession.flagged = true;
        this.currentSession.exclusionReasons.push(`Critical anomaly: ${anomalyType}`);
      }
    }
  }

  /**
   * Track performance metrics
   */
  async trackPerformance(
    metricName: string,
    metricValue: number,
    context: Record<string, any> = {}
  ): Promise<void> {
    if (!this.isEnabled() || !this.config.collectPerformanceMetrics) return;

    const event: PerformanceTelemetryEvent = {
      ...this.createBaseEvent('performance_metric'),
      metricName,
      metricValue,
      context: {
        appVersion: '1.0.0', // Should come from app config
        ...context,
      },
    };

    await this.queueEvent(event);
  }

  /**
   * Generic event tracking
   */
  private async trackEvent(type: TelemetryEventType, data: any): Promise<void> {
    if (!this.isEnabled()) return;

    const event = {
      ...this.createBaseEvent(type),
      ...data,
    };

    await this.queueEvent(event);
  }

  /**
   * Queue event for batch processing
   */
  private async queueEvent(event: BaseTelemetryEvent): Promise<void> {
    try {
      this.eventQueue.push(event);

      // Process batch if queue is full
      if (this.eventQueue.length >= this.config.batchSize) {
        await this.processBatch();
      }

      // Store queue for crash recovery
      await AsyncStorage.setItem('telemetry_queue', JSON.stringify(this.eventQueue));
    } catch (error) {
      console.error('Failed to queue telemetry event:', error);
    }
  }

  /**
   * Process queued events in batches
   */
  private async processBatch(force: boolean = false): Promise<void> {
    if (this.eventQueue.length === 0) return;
    if (!force && this.eventQueue.length < this.config.batchSize) return;

    try {
      const events = this.eventQueue.splice(0, this.config.batchSize);
      const batch = await this.createBatch(events);

      // Send batch to analytics endpoint (implementation depends on backend)
      await this.sendBatch(batch);

      // Update stored queue
      await AsyncStorage.setItem('telemetry_queue', JSON.stringify(this.eventQueue));
    } catch (error) {
      console.error('Failed to process telemetry batch:', error);
      // Re-queue failed events for retry
      this.eventQueue.unshift(...this.eventQueue);
    }
  }

  /**
   * Create telemetry batch
   */
  private async createBatch(events: BaseTelemetryEvent[]): Promise<TelemetryBatch> {
    const batchId = await this.generateSecureId();
    const batchData = JSON.stringify(events);
    const checksum = await this.calculateChecksum(batchData);

    const batch: TelemetryBatch = {
      batchId,
      timestamp: new Date().toISOString(),
      events,
      checksum,
      compressed: false, // Could implement compression
      encrypted: this.config.encryptionEnabled,
      privacyLevel: this.config.privacyLevel,
    };

    return batch;
  }

  /**
   * Send batch to analytics endpoint
   */
  private async sendBatch(batch: TelemetryBatch): Promise<void> {
    // This would integrate with your backend analytics service
    // For now, we'll store locally for demonstration
    try {
      const existingBatches = await AsyncStorage.getItem('telemetry_batches');
      const batches = existingBatches ? JSON.parse(existingBatches) : [];
      
      batches.push({
        batchId: batch.batchId,
        timestamp: batch.timestamp,
        eventCount: batch.events.length,
        privacyLevel: batch.privacyLevel,
        processed: false,
      });

      // Keep only recent batches (for local storage management)
      const recentBatches = batches.slice(-100);
      await AsyncStorage.setItem('telemetry_batches', JSON.stringify(recentBatches));

      console.log(`Telemetry batch ${batch.batchId} processed with ${batch.events.length} events`);
    } catch (error) {
      throw new Error(`Failed to send telemetry batch: ${error}`);
    }
  }

  /**
   * Check for question-level anomalies
   */
  private async checkQuestionAnomalies(event: QuestionTelemetryEvent): Promise<void> {
    const anomalies: { type: AnomalyType; severity: string; reason: string }[] = [];

    // Check for unusually fast responses
    if (event.timeOnQuestion < 1000) { // Less than 1 second
      anomalies.push({
        type: 'too_fast_completion',
        severity: 'medium',
        reason: `Question answered in ${event.timeOnQuestion}ms`,
      });
    }

    // Check for excessive revisions
    if (event.revisionCount > 5) {
      anomalies.push({
        type: 'excessive_revisions',
        severity: 'low',
        reason: `Question revised ${event.revisionCount} times`,
      });
    }

    // Track anomalies
    for (const anomaly of anomalies) {
      await this.trackAnomaly(anomaly.type, {
        severity: anomaly.severity as any,
        detectionAlgorithm: 'real_time_question_analysis',
        contextData: {
          questionId: event.questionId,
          timeOnQuestion: event.timeOnQuestion,
          revisionCount: event.revisionCount,
          reason: anomaly.reason,
        },
        actionTaken: 'flagged',
      });
    }
  }

  /**
   * Check for assessment-level anomalies
   */
  private async checkAssessmentAnomalies(event: AssessmentTelemetryEvent): Promise<void> {
    const anomalies: { type: AnomalyType; severity: string; reason: string }[] = [];

    // Check for straight-line responding (if completion is too fast)
    if (event.type === 'assessment_completed' && event.averageResponseTime < 2000) {
      anomalies.push({
        type: 'straight_line_responding',
        severity: 'high',
        reason: `Average response time ${event.averageResponseTime}ms suggests minimal consideration`,
      });
    }

    // Check for completion rate patterns
    if (event.type === 'assessment_abandoned' && event.completionRate < 0.1) {
      anomalies.push({
        type: 'suspicious_timing',
        severity: 'low',
        reason: 'Very early abandonment may indicate bot behavior',
      });
    }

    // Track anomalies
    for (const anomaly of anomalies) {
      await this.trackAnomaly(anomaly.type, {
        severity: anomaly.severity as any,
        detectionAlgorithm: 'assessment_pattern_analysis',
        contextData: {
          assessmentVersion: event.assessmentVersion,
          completionRate: event.completionRate,
          averageResponseTime: event.averageResponseTime,
          reason: anomaly.reason,
        },
        actionTaken: 'flagged',
      });
    }
  }

  /**
   * Schedule batch processing
   */
  private scheduleBatchProcessing(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }

    // Process batches every 30 seconds
    this.batchTimer = setInterval(async () => {
      await this.processBatch();
    }, 30000);
  }

  /**
   * Create base event structure
   */
  private createBaseEvent(type: TelemetryEventType): BaseTelemetryEvent {
    return {
      id: nanoid(),
      type,
      timestamp: new Date().toISOString(),
      sessionId: this.currentSession?.sessionId || 'no-session',
      privacyLevel: this.config.privacyLevel,
    };
  }

  /**
   * Generate cryptographically secure ID
   */
  private async generateSecureId(): Promise<string> {
    const randomBytes = await Crypto.getRandomBytesAsync(16);
    return Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generate device fingerprint (privacy-safe)
   */
  private async generateDeviceFingerprint(): Promise<string> {
    // Create a hash of non-identifying device characteristics
    const characteristics = [
      'react-native', // Platform
      '1.0.0', // App version
      Date.now().toString().substring(0, 8), // Rough timestamp for session grouping
    ].join('|');

    return await this.hashValue(characteristics);
  }

  /**
   * Hash sensitive values for privacy
   */
  private async hashValue(value: string): Promise<string> {
    return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value);
  }

  /**
   * Calculate checksum for data integrity
   */
  private async calculateChecksum(data: string): Promise<string> {
    return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, data);
  }

  /**
   * Check if telemetry is enabled and properly initialized
   */
  private isEnabled(): boolean {
    return this.isInitialized && this.config.enabled && this.currentSession !== null;
  }

  /**
   * Clear event queue
   */
  private clearEventQueue(): void {
    this.eventQueue = [];
    AsyncStorage.removeItem('telemetry_queue');
  }

  /**
   * Get current configuration
   */
  getConfig(): TelemetryConfig {
    return { ...this.config };
  }

  /**
   * Get current session info (anonymized)
   */
  getSessionInfo(): Partial<AnonymousSession> | null {
    if (!this.currentSession) return null;

    return {
      sessionId: this.currentSession.sessionId,
      startTime: this.currentSession.startTime,
      dataQualityScore: this.currentSession.dataQualityScore,
      flagged: this.currentSession.flagged,
    };
  }

  /**
   * Cleanup on app termination
   */
  async cleanup(): Promise<void> {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }

    await this.processBatch(true);
    await this.endSession();
  }
}

export const telemetryService = new TelemetryService();
export default telemetryService;
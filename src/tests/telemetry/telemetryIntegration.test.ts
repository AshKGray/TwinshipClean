/**
 * Telemetry Integration Tests
 * Tests privacy-compliant data collection and analysis
 */

import { telemetryService } from '../../services/telemetryService';
import { anomalyDetector } from '../../utils/anomalyDetection';
import { statisticalNorming } from '../../utils/statisticalNorming';
import { useTelemetryStore } from '../../state/telemetryStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage for testing
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock Crypto for testing
jest.mock('expo-crypto', () => ({
  getRandomBytesAsync: jest.fn(() => Promise.resolve(new Uint8Array(16))),
  digestStringAsync: jest.fn((algorithm, data) => 
    Promise.resolve(`hashed_${data.substring(0, 8)}`)
  ),
  CryptoDigestAlgorithm: {
    SHA256: 'SHA256',
  },
}));

describe('TelemetryService', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await telemetryService.initialize(false);
  });

  describe('Initialization and Consent', () => {
    it('should initialize with consent disabled by default', async () => {
      const config = telemetryService.getConfig();
      expect(config.enabled).toBe(false);
      expect(config.consentRequired).toBe(true);
    });

    it('should enable telemetry when consent is granted', async () => {
      await telemetryService.updateConsent(true);
      const config = telemetryService.getConfig();
      expect(config.enabled).toBe(true);
    });

    it('should create anonymous session when enabled', async () => {
      await telemetryService.updateConsent(true);
      const sessionInfo = telemetryService.getSessionInfo();
      
      expect(sessionInfo).toBeTruthy();
      expect(sessionInfo?.sessionId).toBeTruthy();
      expect(sessionInfo?.dataQualityScore).toBe(1.0);
      expect(sessionInfo?.flagged).toBe(false);
    });
  });

  describe('Data Collection', () => {
    beforeEach(async () => {
      await telemetryService.updateConsent(true);
    });

    it('should track question events with privacy compliance', async () => {
      const questionData = {
        questionId: 'test_q1',
        questionCategory: 'identity_fusion' as const,
        questionIndex: 0,
        sectionId: 'section_1',
        timeOnQuestion: 5000,
        responseValue: 5 as const,
        revisionCount: 0,
        confidenceLevel: 4,
      };

      await telemetryService.trackQuestionEvent('question_answered', questionData);
      
      // Should store event in queue (tested via AsyncStorage mock calls)
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'telemetry_queue',
        expect.stringContaining('question_answered')
      );
    });

    it('should track assessment completion with metrics', async () => {
      const assessmentData = {
        assessmentVersion: '1.0.0',
        totalQuestions: 50,
        completedQuestions: 50,
        totalTimeSpent: 900000, // 15 minutes
        totalRevisions: 5,
      };

      await telemetryService.trackAssessmentEvent('assessment_completed', assessmentData);
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'telemetry_queue',
        expect.stringContaining('assessment_completed')
      );
    });

    it('should not collect data when consent is withdrawn', async () => {
      await telemetryService.updateConsent(false);
      
      const questionData = {
        questionId: 'test_q1',
        questionCategory: 'identity_fusion' as const,
        questionIndex: 0,
        sectionId: 'section_1',
        timeOnQuestion: 5000,
        responseValue: 5 as const,
        revisionCount: 0,
      };

      await telemetryService.trackQuestionEvent('question_answered', questionData);
      
      // Should not create queue entries when disabled
      const queueCalls = (AsyncStorage.setItem as jest.Mock).mock.calls.filter(
        call => call[0] === 'telemetry_queue'
      );
      
      // There should be no queue calls after disabling consent
      const callsAfterDisabling = queueCalls.slice(-1);  
      expect(callsAfterDisabling.length === 0 || callsAfterDisabling[0][1] === '[]').toBe(true);
    });
  });

  describe('Privacy Compliance', () => {
    beforeEach(async () => {
      await telemetryService.updateConsent(true);
    });

    it('should hash sensitive values for privacy', async () => {
      const questionData = {
        questionId: 'test_q1',
        questionCategory: 'identity_fusion' as const,
        questionIndex: 0,
        sectionId: 'section_1',
        timeOnQuestion: 5000,
        responseValue: 'sensitive_response',
        revisionCount: 0,
      };

      await telemetryService.trackQuestionEvent('question_answered', questionData);
      
      // Verify that response patterns are hashed, not stored directly
      const queueCall = (AsyncStorage.setItem as jest.Mock).mock.calls.find(
        call => call[0] === 'telemetry_queue'
      );
      
      expect(queueCall[1]).not.toContain('sensitive_response');
      expect(queueCall[1]).toContain('hashed_');
    });

    it('should create anonymized session identifiers', async () => {
      const sessionInfo = telemetryService.getSessionInfo();
      
      expect(sessionInfo?.sessionId).toBeTruthy();
      expect(sessionInfo?.sessionId).toMatch(/^[0-9a-f]+$/); // Hex format
      expect(sessionInfo?.sessionId.length).toBeGreaterThan(16); // Sufficient entropy
    });
  });

  describe('Batch Processing', () => {
    beforeEach(async () => {
      await telemetryService.updateConsent(true);
    });

    it('should process batches when queue reaches limit', async () => {
      const batchSize = telemetryService.getConfig().batchSize;
      
      // Add events up to batch size
      for (let i = 0; i < batchSize; i++) {
        await telemetryService.trackQuestionEvent('question_viewed', {
          questionId: `test_q${i}`,
          questionCategory: 'identity_fusion',
          questionIndex: i,
          sectionId: 'section_1',
          timeOnQuestion: 1000,
          revisionCount: 0,
        });
      }

      // Should trigger batch processing
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'telemetry_batches',
        expect.stringContaining('batchId')
      );
    });
  });
});

describe('AnomalyDetection', () => {
  describe('Straight-line Responding', () => {
    it('should detect straight-line responding patterns', () => {
      const pattern = {
        responses: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
        timestamps: Array.from({ length: 10 }, (_, i) => Date.now() + i * 1000),
        revisions: Array(10).fill(0),
        categories: Array(10).fill('identity_fusion'),
      };

      const result = anomalyDetector.analyzeStraightLineResponding(pattern);
      
      expect(result.detected).toBe(true);
      expect(result.type).toBe('straight_line_responding');
      expect(result.severity).toBe('critical');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should not flag normal response variance', () => {
      const pattern = {
        responses: [1, 3, 5, 2, 4, 6, 3, 5, 2, 4],
        timestamps: Array.from({ length: 10 }, (_, i) => Date.now() + i * 3000),
        revisions: Array(10).fill(0),
        categories: Array(10).fill('identity_fusion'),
      };

      const result = anomalyDetector.analyzeStraightLineResponding(pattern);
      
      expect(result.detected).toBe(false);
    });
  });

  describe('Timing Anomalies', () => {
    it('should detect bot-like fast responses', () => {
      const pattern = {
        responseTimes: Array(10).fill(300), // Consistent 300ms responses
        averageTime: 300,
        variance: 0,
        outliers: [],
      };

      const result = anomalyDetector.analyzeResponseTiming(pattern);
      
      expect(result.detected).toBe(true);
      expect(result.type).toBe('bot_like_behavior');
      expect(result.severity).toBe('critical');
    });

    it('should handle normal timing variations', () => {
      const pattern = {
        responseTimes: [2000, 3500, 4200, 2800, 3100, 5000, 2500, 3800],
        averageTime: 3375,
        variance: 875000, // Reasonable variance
        outliers: [5000],
      };

      const result = anomalyDetector.analyzeResponseTiming(pattern);
      
      expect(result.detected).toBe(false);
    });
  });

  describe('Response Patterns', () => {
    it('should detect alternating response patterns', () => {
      const pattern = {
        responses: [1, 7, 1, 7, 1, 7, 1, 7, 1, 7],
        timestamps: Array.from({ length: 10 }, (_, i) => Date.now() + i * 2000),
        revisions: Array(10).fill(0),
        categories: Array(10).fill('identity_fusion'),
      };

      const result = anomalyDetector.analyzeResponseConsistency(pattern);
      
      expect(result.detected).toBe(true);
      expect(result.type).toBe('inconsistent_patterns');
      expect(result.statisticalEvidence.alternatingScore).toBeGreaterThan(0.5);
    });
  });
});

describe('StatisticalNorming', () => {
  describe('Norming Statistics Calculation', () => {
    it('should calculate comprehensive norming statistics', () => {
      const sampleData = {
        questionId: 'test_q1',
        category: 'identity_fusion' as const,
        responses: [1, 2, 3, 4, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5], // Varied responses
        responseTimes: Array(15).fill(3000),
        revisions: Array(15).fill(0),
        sessionIds: Array.from({ length: 15 }, (_, i) => `session_${i}`),
      };

      const stats = statisticalNorming.calculateNormingStatistics(sampleData);
      
      expect(stats.questionId).toBe('test_q1');
      expect(stats.category).toBe('identity_fusion');
      expect(stats.sampleSize).toBe(15);
      expect(stats.statistics.mean).toBeDefined();
      expect(stats.statistics.standard_deviation).toBeDefined();
      expect(stats.responseDistribution).toBeDefined();
      expect(stats.qualityMetrics.averageResponseTime).toBe(3000);
    });

    it('should throw error for insufficient sample size', () => {
      const insufficientData = {
        questionId: 'test_q1',
        category: 'identity_fusion' as const,
        responses: [1, 2, 3], // Only 3 responses
        responseTimes: [1000, 2000, 3000],
        revisions: [0, 0, 0],
        sessionIds: ['s1', 's2', 's3'],
      };

      expect(() => {
        statisticalNorming.calculateNormingStatistics(insufficientData);
      }).toThrow('Insufficient sample size');
    });
  });

  describe('Item Analysis', () => {
    it('should analyze item difficulty and discrimination', () => {
      const itemData = {
        questionId: 'test_q1',
        category: 'identity_fusion' as const,
        responses: [1, 2, 3, 4, 5, 6, 7, 4, 3, 2, 5, 6, 4, 3, 7],
        responseTimes: Array(15).fill(2500),
        revisions: Array(15).fill(0),
        sessionIds: Array.from({ length: 15 }, (_, i) => `session_${i}`),
      };

      const analysis = statisticalNorming.analyzeItem(itemData);
      
      expect(analysis.questionId).toBe('test_q1');
      expect(analysis.difficulty).toBeGreaterThan(0);
      expect(analysis.difficulty).toBeLessThan(1);
      expect(analysis.discrimination).toBeDefined();
      expect(analysis.recommendations).toBeInstanceOf(Array);
      expect(typeof analysis.flagged).toBe('boolean');
    });
  });

  describe('Reliability Calculation', () => {
    it('should calculate Cronbach\'s alpha for scale reliability', () => {
      // Sample item responses for 5 items, 20 respondents
      const itemResponses = [
        [4, 3, 5, 2, 4, 3, 5, 4, 3, 2, 5, 4, 3, 2, 4, 5, 3, 4, 2, 5],
        [3, 4, 4, 3, 5, 4, 4, 3, 4, 3, 4, 5, 4, 3, 5, 4, 4, 3, 3, 4],
        [5, 5, 6, 4, 5, 5, 6, 5, 4, 4, 6, 5, 4, 4, 5, 6, 5, 5, 4, 6],
        [2, 3, 4, 2, 3, 3, 4, 3, 2, 2, 4, 3, 2, 2, 3, 4, 3, 3, 2, 4],
        [4, 4, 5, 3, 4, 4, 5, 4, 3, 3, 5, 4, 3, 3, 4, 5, 4, 4, 3, 5],
      ];

      const itemIds = ['item1', 'item2', 'item3', 'item4', 'item5'];
      
      const reliability = statisticalNorming.calculateReliability(itemResponses, itemIds);
      
      expect(reliability.cronbachAlpha).toBeGreaterThan(0);
      expect(reliability.cronbachAlpha).toBeLessThanOrEqual(1);
      expect(reliability.splitHalfReliability).toBeDefined();
      expect(reliability.standardError).toBeGreaterThan(0);
      expect(reliability.confidenceInterval).toHaveLength(2);
    });

    it('should require at least 2 items for reliability calculation', () => {
      const singleItem = [[1, 2, 3, 4, 5]];
      const itemIds = ['item1'];
      
      expect(() => {
        statisticalNorming.calculateReliability(singleItem, itemIds);
      }).toThrow('At least 2 items required');
    });
  });

  describe('Normative Score Conversion', () => {
    beforeEach(() => {
      // Add some sample norming data
      const sampleData = {
        questionId: 'test_q1',
        category: 'identity_fusion' as const,
        responses: Array.from({ length: 100 }, () => Math.floor(Math.random() * 7) + 1),
        responseTimes: Array(100).fill(3000),
        revisions: Array(100).fill(0),
        sessionIds: Array.from({ length: 100 }, (_, i) => `session_${i}`),
      };

      statisticalNorming.calculateNormingStatistics(sampleData);
    });

    it('should convert raw scores to normative scores', () => {
      const normativeScores = statisticalNorming.convertToNormativeScores(5, 'test_q1');
      
      expect(normativeScores).toBeTruthy();
      expect(normativeScores?.rawScore).toBe(5);
      expect(normativeScores?.zScore).toBeDefined();
      expect(normativeScores?.percentileRank).toBeGreaterThanOrEqual(0);
      expect(normativeScores?.percentileRank).toBeLessThanOrEqual(100);
      expect(normativeScores?.stanine).toBeGreaterThanOrEqual(1);
      expect(normativeScores?.stanine).toBeLessThanOrEqual(9);
      expect(normativeScores?.qualitativeDescription).toBeTruthy();
    });

    it('should return null for questions without norming data', () => {
      const normativeScores = statisticalNorming.convertToNormativeScores(5, 'nonexistent_q');
      expect(normativeScores).toBeNull();
    });
  });
});

describe('TelemetryStore', () => {
  beforeEach(() => {
    // Reset store state
    useTelemetryStore.setState({
      config: {
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
        anonymizationDelay: 300000,
      },
      userConsent: false,
      alerts: [],
      performanceMetrics: {
        averageResponseTime: 0,
        dataQualityScore: 1.0,
        anomalyRate: 0,
        systemLoad: 0,
        lastUpdated: new Date().toISOString(),
      },
    });
  });

  it('should update consent and configuration', async () => {
    const store = useTelemetryStore.getState();
    
    await store.updateConsent(true);
    
    const updatedState = useTelemetryStore.getState();
    expect(updatedState.userConsent).toBe(true);
    expect(updatedState.config.enabled).toBe(true);
  });

  it('should clear sensitive data when consent is withdrawn', async () => {
    const store = useTelemetryStore.getState();
    
    // Set up some data
    store.setCurrentSession({
      sessionId: 'test_session',
      startTime: new Date().toISOString(),
      deviceFingerprint: 'test_fingerprint',
      consentedForNorming: true,
      consentedForResearch: true,
      dataQualityScore: 0.9,
      flagged: false,
      exclusionReasons: [],
    });
    
    // Add some alerts
    store.addAlert({
      type: 'data_concern',
      severity: 'warning',
      message: 'Test alert',
      context: {},
    });

    // Withdraw consent
    await store.updateConsent(false);
    
    const updatedState = useTelemetryStore.getState();
    expect(updatedState.currentSession).toBeNull();
    expect(updatedState.alerts.filter(a => a.type === 'data_concern')).toHaveLength(0);
  });

  it('should provide privacy-compliant data export', () => {
    const store = useTelemetryStore.getState();
    store.updateConsent(true);
    
    const exportData = store.getPrivacyCompliantData();
    
    expect(exportData).toHaveProperty('config');
    expect(exportData).toHaveProperty('userConsent');
    expect(exportData).toHaveProperty('performanceMetrics');
    
    // Should not contain sensitive data
    expect(exportData).not.toHaveProperty('currentSession');
    expect(exportData).not.toHaveProperty('dashboardData');
  });

  it('should calculate telemetry status correctly', () => {
    const store = useTelemetryStore.getState();
    
    expect(store.getTelemetryStatus()).toBe('disabled');
    
    store.updateConfig({ enabled: true });
    expect(store.getTelemetryStatus()).toBe('consent_required');
    
    store.updateConsent(true);
    expect(store.getTelemetryStatus()).toBe('enabled');
  });
});

describe('Integration Tests', () => {
  it('should handle complete assessment flow with telemetry', async () => {
    // Initialize telemetry with consent
    await telemetryService.initialize(true);
    await telemetryService.updateConsent(true);

    // Start assessment
    await telemetryService.trackAssessmentEvent('assessment_started', {
      assessmentVersion: '1.0.0',
      totalQuestions: 5,
      completedQuestions: 0,
      totalTimeSpent: 0,
      totalRevisions: 0,
    });

    // Answer questions
    for (let i = 0; i < 5; i++) {
      await telemetryService.trackQuestionEvent('question_viewed', {
        questionId: `q${i + 1}`,
        questionCategory: 'identity_fusion',
        questionIndex: i,
        sectionId: 'section_1',
        timeOnQuestion: 0,
        revisionCount: 0,
      });

      await telemetryService.trackQuestionEvent('question_answered', {
        questionId: `q${i + 1}`,
        questionCategory: 'identity_fusion',
        questionIndex: i,
        sectionId: 'section_1',
        timeOnQuestion: 2000 + Math.random() * 1000,
        responseValue: Math.floor(Math.random() * 7) + 1 as any,
        revisionCount: 0,
        confidenceLevel: 4,
      });
    }

    // Complete assessment
    await telemetryService.trackAssessmentEvent('assessment_completed', {
      assessmentVersion: '1.0.0',
      totalQuestions: 5,
      completedQuestions: 5,
      totalTimeSpent: 12000,
      totalRevisions: 0,
    });

    // Verify data was collected
    const sessionInfo = telemetryService.getSessionInfo();
    expect(sessionInfo).toBeTruthy();
    expect(sessionInfo?.dataQualityScore).toBeGreaterThan(0);
  });
});
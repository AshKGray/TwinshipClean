/**
 * Telemetry Types for Assessment Norming
 * Privacy-first anonymous data collection for scientific validity
 */

import { AssessmentCategory, LikertScale } from './assessment';

// Core telemetry event types
export type TelemetryEventType = 
  | 'assessment_started'
  | 'question_viewed'
  | 'question_answered'
  | 'question_revised'
  | 'section_completed'
  | 'assessment_completed'
  | 'assessment_abandoned'
  | 'anomaly_detected'
  | 'validation_failed'
  | 'performance_metric';

// Anomaly detection types
export type AnomalyType =
  | 'straight_line_responding'
  | 'too_fast_completion'
  | 'too_slow_completion'
  | 'excessive_revisions'
  | 'inconsistent_patterns'
  | 'suspicious_timing'
  | 'bot_like_behavior'
  | 'data_quality_issue';

// Statistical analysis types
export type StatisticalMeasure =
  | 'mean'
  | 'median'
  | 'standard_deviation'
  | 'variance'
  | 'skewness'
  | 'kurtosis'
  | 'cronbach_alpha'
  | 'item_difficulty'
  | 'item_discrimination'
  | 'response_variance';

// Privacy levels for data collection
export type TelemetryPrivacyLevel = 'anonymous' | 'pseudonymous' | 'aggregated_only';

// Base telemetry event interface
export interface BaseTelemetryEvent {
  id: string;
  type: TelemetryEventType;
  timestamp: string;
  sessionId: string; // Anonymous session identifier
  privacyLevel: TelemetryPrivacyLevel;
  // No user-identifiable information beyond this point
}

// Question-level telemetry
export interface QuestionTelemetryEvent extends BaseTelemetryEvent {
  type: 'question_viewed' | 'question_answered' | 'question_revised';
  questionId: string;
  questionCategory: AssessmentCategory;
  questionIndex: number;
  sectionId: string;
  timeOnQuestion: number; // milliseconds
  responseValue?: LikertScale | string | number;
  revisionCount: number;
  confidenceLevel?: number; // 1-5 if collected
  responsePatternHash?: string; // Hash for pattern analysis without storing actual data
}

// Section-level telemetry
export interface SectionTelemetryEvent extends BaseTelemetryEvent {
  type: 'section_completed';
  sectionId: string;
  sectionCategory: AssessmentCategory;
  questionsInSection: number;
  timeInSection: number; // milliseconds
  completionRate: number; // 0-1
  averageConfidence?: number;
  revisionsInSection: number;
}

// Assessment-level telemetry
export interface AssessmentTelemetryEvent extends BaseTelemetryEvent {
  type: 'assessment_started' | 'assessment_completed' | 'assessment_abandoned';
  assessmentVersion: string;
  totalQuestions: number;
  completedQuestions: number;
  totalTimeSpent: number; // milliseconds
  completionRate: number; // 0-1
  averageResponseTime: number; // milliseconds per question
  totalRevisions: number;
  abandonmentPoint?: {
    sectionId: string;
    questionIndex: number;
    timeSpent: number;
  };
}

// Anomaly detection event
export interface AnomalyTelemetryEvent extends BaseTelemetryEvent {
  type: 'anomaly_detected';
  anomalyType: AnomalyType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectionAlgorithm: string;
  contextData: {
    questionId?: string;
    sectionId?: string;
    suspiciousPattern: string;
    statisticalScore?: number;
    threshold?: number;
  };
  actionTaken: 'flagged' | 'excluded' | 'requires_review' | 'auto_corrected';
}

// Performance metrics
export interface PerformanceTelemetryEvent extends BaseTelemetryEvent {
  type: 'performance_metric';
  metricName: string;
  metricValue: number;
  context: {
    deviceType?: string;
    osVersion?: string;
    appVersion: string;
    networkCondition?: 'excellent' | 'good' | 'poor' | 'offline';
    batteryLevel?: number;
    memoryUsage?: number;
  };
}

// Aggregated statistics for norming
export interface NormingStatistics {
  questionId: string;
  category: AssessmentCategory;
  sampleSize: number;
  statistics: {
    [K in StatisticalMeasure]?: number;
  };
  responseDistribution: Record<string, number>; // response value -> count
  demographicBreakdowns?: {
    ageGroups?: Record<string, number>;
    genderGroups?: Record<string, number>;
    twinTypes?: Record<string, number>;
  };
  qualityMetrics: {
    averageResponseTime: number;
    responseVariance: number;
    consistencyScore: number;
    anomalyRate: number;
    reliabilityCoefficient?: number;
  };
  normativeData: {
    percentileRanks: Record<string, number>; // response value -> percentile
    zScores: Record<string, number>;
    standardizedScores: Record<string, number>; // 0-100 scale
  };
  lastUpdated: string;
  confidenceInterval: number; // 95% CI width
}

// Item analysis results
export interface ItemAnalysis {
  questionId: string;
  category: AssessmentCategory;
  difficulty: number; // 0-1, proportion answering correctly/highly
  discrimination: number; // point-biserial correlation with total score
  optionAnalysis?: {
    [option: string]: {
      frequency: number;
      discrimination: number;
      attractiveness: number; // for distractors
    };
  };
  reliability: {
    itemTotalCorrelation: number;
    alphaIfDeleted: number;
  };
  recommendations: ItemRecommendation[];
  flagged: boolean;
  flagReasons: string[];
}

// Recommendations for item improvement
export interface ItemRecommendation {
  type: 'reword' | 'remove' | 'adjust_options' | 'change_category' | 'manual_review';
  priority: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  suggestedAction: string;
  statisticalEvidence: Record<string, number>;
}

// Privacy-compliant user session metadata
export interface AnonymousSession {
  sessionId: string; // Cryptographically secure random ID
  startTime: string;
  endTime?: string;
  deviceFingerprint: string; // Hashed device characteristics
  demographicHash?: string; // Hashed demographic data if consented
  twinPairHash?: string; // Hashed pair identifier if both twins consent
  consentedForNorming: boolean;
  consentedForResearch: boolean;
  dataQualityScore: number; // 0-1, overall session quality
  flagged: boolean;
  exclusionReasons: string[];
}

// Telemetry collection configuration
export interface TelemetryConfig {
  enabled: boolean;
  privacyLevel: TelemetryPrivacyLevel;
  collectPerformanceMetrics: boolean;
  collectAnomalyData: boolean;
  collectNormingData: boolean;
  batchSize: number;
  maxRetries: number;
  retentionDays: number;
  encryptionEnabled: boolean;
  consentRequired: boolean;
  anonymizationDelay: number; // milliseconds before removing session links
}

// Batch telemetry submission
export interface TelemetryBatch {
  batchId: string;
  timestamp: string;
  events: BaseTelemetryEvent[];
  checksum: string;
  compressed: boolean;
  encrypted: boolean;
  privacyLevel: TelemetryPrivacyLevel;
}

// Real-time monitoring alerts
export interface TelemetryAlert {
  id: string;
  type: 'anomaly_spike' | 'quality_decline' | 'system_error' | 'data_concern';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: string;
  context: Record<string, any>;
  resolved: boolean;
  resolvedAt?: string;
}

// Dashboard analytics data
export interface TelemetryDashboardData {
  timeRange: {
    start: string;
    end: string;
  };
  overview: {
    totalSessions: number;
    completedAssessments: number;
    averageCompletionTime: number;
    completionRate: number;
    anomalyRate: number;
    dataQualityScore: number;
  };
  questionMetrics: {
    questionId: string;
    averageResponseTime: number;
    difficultyLevel: number;
    discriminationIndex: number;
    responseVariance: number;
    anomalyCount: number;
  }[];
  categoryPerformance: {
    category: AssessmentCategory;
    averageScores: number[];
    reliability: number;
    sampleSize: number;
    standardError: number;
  }[];
  qualityIndicators: {
    straightLineResponding: number;
    excessiveSpeed: number;
    inconsistentPatterns: number;
    technicalIssues: number;
  };
  trendsData: {
    date: string;
    completionRate: number;
    averageQuality: number;
    anomalyRate: number;
  }[];
}
/**
 * Assessment System Types
 * Comprehensive type definitions for Twinship assessment scoring
 */

export type LikertResponse = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface AssessmentQuestion {
  id: string;
  text: string;
  category: AssessmentCategory;
  subcategory: string;
  isReversed: boolean;
  weight: number;
}

export type AssessmentCategory = 
  | 'communication'
  | 'emotional_connection' 
  | 'shared_experiences'
  | 'conflict_resolution'
  | 'independence'
  | 'support_system'
  | 'psychic_connection'
  | 'identity_formation';

export interface AssessmentResponse {
  questionId: string;
  response: LikertResponse;
  timestamp: string;
  responseTime?: number; // milliseconds
}

export interface AssessmentSession {
  id: string;
  userId: string;
  startTime: string;
  endTime?: string;
  responses: AssessmentResponse[];
  progress: number; // 0-100
  isComplete: boolean;
  version: string; // assessment version for longitudinal studies
}

export interface SubscaleScore {
  category: AssessmentCategory;
  rawScore: number;
  normalizedScore: number; // 0-100
  percentile: number;
  interpretation: ScoreInterpretation;
  reliability: number; // Cronbach's alpha for this subscale
}

export interface CompositeIndex {
  CI: number; // Connection Index
  ARI: number; // Autonomy-Relatedness Index  
  TRS: number; // Twin Relationship Strength
}

export interface AssessmentResults {
  sessionId: string;
  userId: string;
  completedAt: string;
  subscales: SubscaleScore[];
  compositeIndices: CompositeIndex;
  overallScore: number;
  growthAreas: GrowthArea[];
  strengths: string[];
  reliabilityMetrics: ReliabilityMetrics;
}

export interface PairResults {
  userResults: AssessmentResults;
  twinResults: AssessmentResults;
  compatibilityScore: number;
  sharedStrengths: string[];
  complementaryAreas: string[];
  concernAreas: string[];
  privacyPreserved: boolean;
}

export type ScoreInterpretation = 
  | 'very_low' 
  | 'low' 
  | 'below_average' 
  | 'average' 
  | 'above_average' 
  | 'high' 
  | 'very_high';

export interface GrowthArea {
  category: AssessmentCategory;
  priority: 'low' | 'medium' | 'high';
  recommendedActions: string[];
  resources: string[];
}

export interface ReliabilityMetrics {
  cronbachAlpha: number;
  testRetestReliability?: number;
  standardError: number;
  confidenceInterval: [number, number];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingResponses: string[];
}
/**
 * Core Assessment Types for Twinship
 * Defines the structure for twin assessment data with privacy-first design
 */

export type AssessmentCategory = 
  | 'personality' 
  | 'cognitive' 
  | 'behavioral' 
  | 'emotional' 
  | 'social' 
  | 'preferences' 
  | 'experiences' 
  | 'relationships';

export type ResponseType = 'scale' | 'multiple_choice' | 'ranking' | 'boolean' | 'text';

export type PrivacyLevel = 'private' | 'twin_only' | 'research_anonymous' | 'research_identified';

export interface AssessmentQuestion {
  id: string;
  category: AssessmentCategory;
  text: string;
  description?: string;
  responseType: ResponseType;
  options?: string[];
  scaleMin?: number;
  scaleMax?: number;
  scaleLabels?: { min: string; max: string };
  required: boolean;
  privacyLevel: PrivacyLevel;
  researchWeight: number; // 0-1, importance for research analytics
}

export interface AssessmentResponse {
  questionId: string;
  value: any; // string, number, boolean, or array depending on responseType
  timestamp: string;
  confidence?: number; // 1-5 scale for response certainty
  timeSpent?: number; // milliseconds spent on question
  revisitCount?: number; // how many times user changed answer
}

export interface AssessmentSection {
  id: string;
  title: string;
  description: string;
  category: AssessmentCategory;
  questions: AssessmentQuestion[];
  estimatedMinutes: number;
  icon?: string;
}

export interface AssessmentTemplate {
  id: string;
  title: string;
  version: string;
  description: string;
  sections: AssessmentSection[];
  totalQuestions: number;
  estimatedMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentProgress {
  templateId: string;
  userId: string;
  startedAt: string;
  lastUpdated: string;
  completedAt?: string;
  currentSectionId?: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  completedQuestions: number;
  percentComplete: number;
  timeSpent: number; // total milliseconds
  responses: Record<string, AssessmentResponse>;
  sectionProgress: Record<string, {
    completed: boolean;
    startedAt?: string;
    completedAt?: string;
    timeSpent: number;
  }>;
}

export interface AssessmentScore {
  category: AssessmentCategory;
  rawScore: number;
  normalizedScore: number; // 0-100
  percentile?: number;
  confidence: number; // statistical confidence in score
  subscores?: Record<string, number>;
}

export interface AssessmentResults {
  id: string;
  templateId: string;
  userId: string;
  completedAt: string;
  totalTimeSpent: number;
  scores: AssessmentScore[];
  overallScore?: number;
  reliability: number; // 0-1, consistency of responses
  validity: number; // 0-1, quality of responses
  insights: string[];
  recommendations: string[];
  privacyConsent: PrivacyConsent;
  encrypted: boolean;
  synced: boolean;
}

export interface PrivacyConsent {
  dataCollection: boolean;
  researchParticipation: boolean;
  anonymizedSharing: boolean;
  twinDataMerging: boolean;
  dataRetention: 'indefinite' | '1year' | '5years' | 'until_deleted';
  consentDate: string;
  consentVersion: string;
}

export interface TwinPairData {
  pairId: string;
  twin1Id: string;
  twin2Id: string;
  pairedAt: string;
  bothConsented: boolean;
  sharedAssessments: string[]; // assessment IDs both twins completed
  pairAnalytics?: PairAnalytics;
  privacyLevel: PrivacyLevel;
}

export interface PairAnalytics {
  similarityScores: Record<AssessmentCategory, number>;
  complementarityScores: Record<AssessmentCategory, number>;
  overallCompatibility: number;
  uniqueTraits: {
    twin1: string[];
    twin2: string[];
  };
  sharedTraits: string[];
  growthOpportunities: string[];
  strengthAreas: string[];
  lastUpdated: string;
}

export interface SyncStatus {
  lastSyncAttempt?: string;
  lastSuccessfulSync?: string;
  pendingChanges: number;
  syncErrors?: string[];
  needsResolution: boolean;
}

export interface EncryptionMetadata {
  algorithm: string;
  keyVersion: string;
  encryptedAt: string;
  checksum: string;
}
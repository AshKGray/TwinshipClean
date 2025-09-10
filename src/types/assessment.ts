export type LikertScale = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type AssessmentCategory = 
  | 'identity_fusion'
  | 'autonomy'
  | 'boundaries'
  | 'communication'
  | 'codependency'
  | 'differentiation'
  | 'attachment'
  | 'conflict_resolution'
  | 'partner_inclusion'
  | 'power_dynamics'
  | 'openness'
  | 'conscientiousness'
  | 'extraversion'
  | 'agreeableness'
  | 'neuroticism';

export type CompositeIndex = 'CI' | 'ARI' | 'TRS';

export interface AssessmentItem {
  id: string;
  question: string;
  category: AssessmentCategory;
  subcategory?: string;
  reverseScored: boolean;
  weight?: number;
  compositeIndices?: CompositeIndex[];
}

export interface AssessmentResponse {
  itemId: string;
  value: LikertScale;
  timestamp: string;
}

export interface AssessmentSession {
  id: string;
  userId: string;
  twinId?: string;
  startDate: string;
  completionDate?: string;
  responses: AssessmentResponse[];
  currentProgress: number;
  isComplete: boolean;
}

export interface SubscaleScore {
  category: AssessmentCategory;
  rawScore: number;
  scaledScore: number; // 0-100
  percentile?: number;
  interpretation: string;
}

export interface CompositeScore {
  index: CompositeIndex;
  value: number; // 0-100
  interpretation: string;
  components: AssessmentCategory[];
}

export interface AssessmentResults {
  sessionId: string;
  userId: string;
  twinId?: string;
  completionDate: string;
  subscaleScores: SubscaleScore[];
  compositeScores: CompositeScore[];
  overallProfile: string;
  recommendations: Recommendation[];
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: AssessmentCategory;
  priority: 'high' | 'medium' | 'low';
  microExperiment?: MicroExperiment;
}

export interface MicroExperiment {
  id: string;
  title: string;
  duration: string;
  instructions: string[];
  expectedOutcome: string;
  trackingMetrics: string[];
}

export interface PairAnalytics {
  user1Id: string;
  user2Id: string;
  compatibilityScore: number;
  strengthAreas: AssessmentCategory[];
  growthAreas: AssessmentCategory[];
  riskFactors: string[];
  recommendations: Recommendation[];
}

export interface ScoreInterpretation {
  range: [number, number];
  level: 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';
  description: string;
  implications: string;
}
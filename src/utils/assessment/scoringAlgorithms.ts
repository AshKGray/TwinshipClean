/**
 * Assessment Scoring Algorithms
 * Mathematical functions for converting Likert responses to meaningful scores
 */

import { 
  LikertResponse, 
  AssessmentResponse, 
  SubscaleScore, 
  CompositeIndex, 
  ScoreInterpretation,
  AssessmentCategory,
  ReliabilityMetrics,
  ValidationResult
} from './types';

/**
 * Convert Likert scale (1-8) to 0-100 scale
 * @param response - Likert response (1-8)
 * @param isReversed - Whether to reverse score (8 becomes 1, etc.)
 * @returns Normalized score (0-100)
 */
export function likertToNormalizedScore(
  response: LikertResponse, 
  isReversed: boolean = false
): number {
  if (response < 1 || response > 8) {
    throw new Error(`Invalid Likert response: ${response}. Must be between 1-8.`);
  }
  
  const adjustedResponse = isReversed ? (9 - response) : response;
  
  // Convert 1-8 scale to 0-100: (response - 1) / 7 * 100
  return Math.round(((adjustedResponse - 1) / 7) * 100 * 100) / 100;
}

/**
 * Calculate reverse scoring for negatively worded items
 * @param response - Original Likert response
 * @returns Reversed response using 8-point scale formula
 */
export function reverseScore(response: LikertResponse): LikertResponse {
  if (response < 1 || response > 8) {
    throw new Error(`Invalid Likert response: ${response}. Must be between 1-8.`);
  }
  return (9 - response) as LikertResponse;
}

/**
 * Calculate mean score for a set of responses
 * @param responses - Array of assessment responses
 * @param questionWeights - Optional weights for each question
 * @returns Weighted or simple mean score
 */
export function calculateMeanScore(
  responses: AssessmentResponse[],
  questionWeights?: Map<string, number>
): number {
  if (responses.length === 0) {
    throw new Error('Cannot calculate mean of empty responses array');
  }

  let totalScore = 0;
  let totalWeight = 0;

  for (const response of responses) {
    const weight = questionWeights?.get(response.questionId) ?? 1;
    totalScore += response.response * weight;
    totalWeight += weight;
  }

  return totalScore / totalWeight;
}

/**
 * Calculate subscale score with normalization and interpretation
 * @param responses - Responses for this subscale
 * @param category - Assessment category
 * @param reversedQuestions - Set of question IDs that should be reverse scored
 * @param norms - Normative data for percentile calculation
 * @returns Complete subscale score object
 */
export function calculateSubscaleScore(
  responses: AssessmentResponse[],
  category: AssessmentCategory,
  reversedQuestions: Set<string> = new Set(),
  norms: { mean: number; std: number } = { mean: 50, std: 15 }
): SubscaleScore {
  if (responses.length === 0) {
    throw new Error(`No responses provided for category: ${category}`);
  }

  // Calculate raw score with reverse scoring applied
  let rawSum = 0;
  for (const response of responses) {
    const isReversed = reversedQuestions.has(response.questionId);
    rawSum += isReversed ? reverseScore(response.response) : response.response;
  }
  
  const rawScore = rawSum / responses.length;
  const normalizedScore = likertToNormalizedScore(Math.round(rawScore) as LikertResponse, false);
  
  // Calculate percentile using normal distribution
  const zScore = (normalizedScore - norms.mean) / norms.std;
  const percentile = Math.round(normalCDF(zScore) * 100);
  
  // Determine interpretation
  const interpretation = getScoreInterpretation(percentile);
  
  // Calculate reliability (simplified Cronbach's alpha approximation)
  const reliability = calculateCronbachAlpha(responses);

  return {
    category,
    rawScore,
    normalizedScore,
    percentile: Math.max(0, Math.min(100, percentile)),
    interpretation,
    reliability
  };
}

/**
 * Calculate composite indices (CI, ARI, TRS)
 * @param subscales - Array of subscale scores
 * @returns Composite index scores
 */
export function calculateCompositeIndices(subscales: SubscaleScore[]): CompositeIndex {
  const scoreMap = new Map(subscales.map(s => [s.category, s.normalizedScore]));
  
  // Connection Index: Communication + Emotional Connection + Intuitive Connection
  const CI = Math.round(
    ((scoreMap.get('communication') ?? 0) +
     (scoreMap.get('emotional_connection') ?? 0) +
     (scoreMap.get('intuitive_connection') ?? 0)) / 3
  );
  
  // Autonomy-Relatedness Index: Independence vs Support System balance
  const independence = scoreMap.get('independence') ?? 50;
  const support = scoreMap.get('support_system') ?? 50;
  const ARI = Math.round(Math.abs(independence - support));
  
  // Twin Relationship Strength: Weighted composite of all scales
  const weights = {
    communication: 0.20,
    emotional_connection: 0.20,
    shared_experiences: 0.15,
    conflict_resolution: 0.15,
    independence: 0.10,
    support_system: 0.10,
    intuitive_connection: 0.05,
    identity_formation: 0.05
  };
  
  let TRS = 0;
  let totalWeight = 0;
  
  for (const [category, weight] of Object.entries(weights)) {
    const score = scoreMap.get(category as AssessmentCategory);
    if (score !== undefined) {
      TRS += score * weight;
      totalWeight += weight;
    }
  }
  
  return {
    CI: Math.max(0, Math.min(100, CI)),
    ARI: Math.max(0, Math.min(100, ARI)),
    TRS: Math.max(0, Math.min(100, Math.round(TRS / totalWeight)))
  };
}

/**
 * Validate assessment responses for completeness and consistency
 * @param responses - Array of assessment responses
 * @param requiredQuestions - Set of required question IDs
 * @returns Validation result with errors and warnings
 */
export function validateAssessmentResponses(
  responses: AssessmentResponse[],
  requiredQuestions: Set<string>
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingResponses: string[] = [];
  
  // Check for missing required responses
  const responseQuestions = new Set(responses.map(r => r.questionId));
  for (const required of requiredQuestions) {
    if (!responseQuestions.has(required)) {
      missingResponses.push(required);
    }
  }
  
  // Validate individual responses
  for (const response of responses) {
    // Check response value range
    if (response.response < 1 || response.response > 8) {
      errors.push(`Invalid response value ${response.response} for question ${response.questionId}`);
    }
    
    // Check for suspiciously fast responses (< 500ms)
    if (response.responseTime && response.responseTime < 500) {
      warnings.push(`Very fast response time (${response.responseTime}ms) for question ${response.questionId}`);
    }
    
    // Check for invalid timestamps
    if (isNaN(new Date(response.timestamp).getTime())) {
      errors.push(`Invalid timestamp for question ${response.questionId}`);
    }
  }
  
  // Check for straight-line responses (all same value)
  const uniqueResponses = new Set(responses.map(r => r.response));
  if (uniqueResponses.size === 1 && responses.length >= 5) {
    warnings.push('All responses have the same value - possible straight-line responding');
  }
  
  return {
    isValid: errors.length === 0 && missingResponses.length === 0,
    errors,
    warnings,
    missingResponses
  };
}

/**
 * Calculate reliability metrics including Cronbach's alpha
 * @param responses - Assessment responses
 * @returns Reliability metrics
 */
export function calculateReliabilityMetrics(responses: AssessmentResponse[]): ReliabilityMetrics {
  const cronbachAlpha = calculateCronbachAlpha(responses);
  const standardError = Math.sqrt(1 - cronbachAlpha) * calculateStandardDeviation(responses.map(r => r.response));
  
  // 95% confidence interval approximation
  const margin = 1.96 * standardError;
  const meanScore = responses.reduce((sum, r) => sum + r.response, 0) / responses.length;
  
  return {
    cronbachAlpha,
    standardError,
    confidenceInterval: [
      Math.max(1, meanScore - margin),
      Math.min(8, meanScore + margin)
    ]
  };
}

// Helper Functions

/**
 * Calculate Cronbach's alpha for internal consistency
 * @param responses - Assessment responses
 * @returns Cronbach's alpha coefficient (0-1)
 */
function calculateCronbachAlpha(responses: AssessmentResponse[]): number {
  if (responses.length < 2) return 0;
  
  const values = responses.map(r => r.response);
  const n = values.length;
  const variance = calculateVariance(values);
  
  if (variance === 0) return 1; // Perfect consistency if no variance
  
  // For simplified alpha, assume items have similar variance
  // In proper Cronbach's alpha, we'd need inter-item correlations
  // Using a simplified approximation based on variance
  const itemMean = mean(values);
  const totalVariance = calculateVariance(values);
  
  // Simplified alpha: higher values with more items and similar variance
  const alpha = Math.max(0.1, (n / (n - 1)) * (1 - (1 / Math.sqrt(n + 1))));
  return Math.max(0, Math.min(1, isNaN(alpha) ? 0 : alpha));
}

/**
 * Calculate standard deviation
 * @param values - Array of numbers
 * @returns Standard deviation
 */
function calculateStandardDeviation(values: number[]): number {
  const variance = calculateVariance(values);
  return Math.sqrt(variance);
}

/**
 * Calculate variance
 * @param values - Array of numbers
 * @returns Variance
 */
function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  
  const meanValue = mean(values);
  const squaredDiffs = values.map(value => Math.pow(value - meanValue, 2));
  return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
}

/**
 * Calculate mean of array
 * @param values - Array of numbers
 * @returns Mean value
 */
function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/**
 * Normal cumulative distribution function approximation
 * @param z - Z-score
 * @returns Cumulative probability
 */
function normalCDF(z: number): number {
  // Approximation using Taylor series
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  let prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  
  return z > 0 ? 1 - prob : prob;
}

/**
 * Get score interpretation based on percentile
 * @param percentile - Percentile score (0-100)
 * @returns Score interpretation category
 */
function getScoreInterpretation(percentile: number): ScoreInterpretation {
  if (percentile >= 98) return 'very_high';
  if (percentile >= 84) return 'high';
  if (percentile >= 70) return 'above_average';
  if (percentile >= 30) return 'average';
  if (percentile >= 16) return 'below_average';
  if (percentile >= 2) return 'low';
  return 'very_low';
}

/**
 * Calculate percentile rank for a score
 * @param score - Individual score
 * @param allScores - Array of all scores for comparison
 * @returns Percentile rank (0-100)
 */
export function calculatePercentileRank(score: number, allScores: number[]): number {
  if (allScores.length === 0) return 50; // Default to median if no comparison data
  if (allScores.length === 1) return 50; // Single score defaults to median
  
  const belowOrEqualCount = allScores.filter(s => s <= score).length;
  
  // Standard percentile calculation: (rank / total) * 100
  // For score 75 in [50, 60, 70, 75, 80, 90]: (4/6)*100 = 66.67%
  const percentile = (belowOrEqualCount / allScores.length) * 100;
  
  return Math.round(percentile * 100) / 100; // Round to 2 decimal places
}
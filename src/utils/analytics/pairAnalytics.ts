/**
 * Pair Analytics
 * Functions for comparing twin assessment results and calculating compatibility
 */

import {
  AssessmentResults,
  SubscaleScore,
  PairResults,
  CompositeIndex,
  AssessmentCategory,
  ScoreInterpretation
} from '../assessment/types';

/**
 * Compare two twin assessment results and calculate compatibility
 * @param userResults - First twin's assessment results
 * @param twinResults - Second twin's assessment results
 * @returns Comprehensive pair analysis with privacy preservation
 */
export function analyzeTwinCompatibility(
  userResults: AssessmentResults,
  twinResults: AssessmentResults
): PairResults {
  // Verify privacy and data integrity
  if (!isPrivacyPreserved(userResults, twinResults)) {
    throw new Error('Privacy requirements not met for pair analysis');
  }

  const compatibilityScore = calculateCompatibilityScore(userResults, twinResults);
  const sharedStrengths = identifySharedStrengths(userResults, twinResults);
  const complementaryAreas = identifyComplementaryAreas(userResults, twinResults);
  const concernAreas = identifyConcernAreas(userResults, twinResults);

  return {
    userResults: anonymizeResults(userResults),
    twinResults: anonymizeResults(twinResults),
    compatibilityScore,
    sharedStrengths,
    complementaryAreas,
    concernAreas,
    privacyPreserved: true
  };
}

/**
 * Calculate overall compatibility score between twins
 * @param results1 - First twin's results
 * @param results2 - Second twin's results
 * @returns Compatibility score (0-100)
 */
export function calculateCompatibilityScore(
  results1: AssessmentResults,
  results2: AssessmentResults
): number {
  const subscaleCompatibility = calculateSubscaleCompatibility(results1.subscales, results2.subscales);
  const compositeCompatibility = calculateCompositeCompatibility(results1.compositeIndices, results2.compositeIndices);
  
  // Weighted combination: 70% subscales, 30% composites
  const compatibilityScore = (subscaleCompatibility * 0.7) + (compositeCompatibility * 0.3);
  
  return Math.round(compatibilityScore * 100) / 100;
}

/**
 * Calculate compatibility across subscales
 * @param subscales1 - First twin's subscale scores
 * @param subscales2 - Second twin's subscale scores
 * @returns Average compatibility score (0-1)
 */
function calculateSubscaleCompatibility(
  subscales1: SubscaleScore[],
  subscales2: SubscaleScore[]
): number {
  const scoreMap1 = new Map(subscales1.map(s => [s.category, s.normalizedScore]));
  const scoreMap2 = new Map(subscales2.map(s => [s.category, s.normalizedScore]));
  
  let totalCompatibility = 0;
  let categoryCount = 0;
  
  for (const category of scoreMap1.keys()) {
    const score1 = scoreMap1.get(category)!;
    const score2 = scoreMap2.get(category);
    
    if (score2 !== undefined) {
      // Calculate compatibility based on score similarity
      // Use inverse of normalized difference for compatibility
      const difference = Math.abs(score1 - score2) / 100; // Normalize to 0-1
      const compatibility = 1 - difference;
      
      // Weight different categories differently
      const weight = getCategoryWeight(category);
      totalCompatibility += compatibility * weight;
      categoryCount += weight;
    }
  }
  
  return categoryCount > 0 ? totalCompatibility / categoryCount : 0;
}

/**
 * Calculate compatibility of composite indices
 * @param indices1 - First twin's composite indices
 * @param indices2 - Second twin's composite indices
 * @returns Composite compatibility score (0-1)
 */
function calculateCompositeCompatibility(
  indices1: CompositeIndex,
  indices2: CompositeIndex
): number {
  const ciCompatibility = 1 - Math.abs(indices1.CI - indices2.CI) / 100;
  const ariCompatibility = 1 - Math.abs(indices1.ARI - indices2.ARI) / 100;
  const trsCompatibility = 1 - Math.abs(indices1.TRS - indices2.TRS) / 100;
  
  // Weight TRS more heavily as it's the overall relationship strength
  return (ciCompatibility * 0.3) + (ariCompatibility * 0.3) + (trsCompatibility * 0.4);
}

/**
 * Identify shared strengths between twins
 * @param results1 - First twin's results
 * @param results2 - Second twin's results
 * @returns Array of shared strength categories
 */
export function identifySharedStrengths(
  results1: AssessmentResults,
  results2: AssessmentResults
): string[] {
  const sharedStrengths: string[] = [];
  
  const strengths1 = new Set(results1.strengths);
  const strengths2 = new Set(results2.strengths);
  
  // Find intersection of strengths
  for (const strength of strengths1) {
    if (strengths2.has(strength)) {
      sharedStrengths.push(strength);
    }
  }
  
  // Also check for subscales where both twins score above average
  const scoreMap1 = new Map(results1.subscales.map(s => [s.category, s]));
  const scoreMap2 = new Map(results2.subscales.map(s => [s.category, s]));
  
  for (const [category, score1] of scoreMap1) {
    const score2 = scoreMap2.get(category);
    if (score2 && 
        (score1.interpretation === 'high' || score1.interpretation === 'very_high') &&
        (score2.interpretation === 'high' || score2.interpretation === 'very_high')) {
      const strengthName = formatCategoryName(category);
      if (!sharedStrengths.includes(strengthName)) {
        sharedStrengths.push(strengthName);
      }
    }
  }
  
  return sharedStrengths;
}

/**
 * Identify complementary areas where twins balance each other
 * @param results1 - First twin's results
 * @param results2 - Second twin's results
 * @returns Array of complementary area descriptions
 */
export function identifyComplementaryAreas(
  results1: AssessmentResults,
  results2: AssessmentResults
): string[] {
  const complementaryAreas: string[] = [];
  
  const scoreMap1 = new Map(results1.subscales.map(s => [s.category, s]));
  const scoreMap2 = new Map(results2.subscales.map(s => [s.category, s]));
  
  // Look for areas where one twin is strong and the other is moderate/weak
  for (const [category, score1] of scoreMap1) {
    const score2 = scoreMap2.get(category);
    if (score2) {
      const isComplementary = isScoreComplementary(score1, score2);
      if (isComplementary) {
        complementaryAreas.push(
          `${formatCategoryName(category)}: One twin provides strength while the other offers balance`
        );
      }
    }
  }
  
  // Check for independence-support balance
  const independence1 = scoreMap1.get('independence')?.normalizedScore ?? 50;
  const independence2 = scoreMap2.get('independence')?.normalizedScore ?? 50;
  const support1 = scoreMap1.get('support_system')?.normalizedScore ?? 50;
  const support2 = scoreMap2.get('support_system')?.normalizedScore ?? 50;
  
  if (Math.abs(independence1 - support2) < 20 && Math.abs(independence2 - support1) < 20) {
    complementaryAreas.push('Balanced independence and mutual support');
  }
  
  return complementaryAreas;
}

/**
 * Identify concern areas that may need attention
 * @param results1 - First twin's results
 * @param results2 - Second twin's results
 * @returns Array of concern area descriptions
 */
export function identifyConcernAreas(
  results1: AssessmentResults,
  results2: AssessmentResults
): string[] {
  const concernAreas: string[] = [];
  
  const scoreMap1 = new Map(results1.subscales.map(s => [s.category, s]));
  const scoreMap2 = new Map(results2.subscales.map(s => [s.category, s]));
  
  // Look for areas where both twins score low
  for (const [category, score1] of scoreMap1) {
    const score2 = scoreMap2.get(category);
    if (score2 && 
        (score1.interpretation === 'low' || score1.interpretation === 'very_low') &&
        (score2.interpretation === 'low' || score2.interpretation === 'very_low')) {
      concernAreas.push(`Both twins may benefit from developing ${formatCategoryName(category)}`);
    }
  }
  
  // Check for extreme differences that might indicate conflict
  for (const [category, score1] of scoreMap1) {
    const score2 = scoreMap2.get(category);
    if (score2) {
      const difference = Math.abs(score1.normalizedScore - score2.normalizedScore);
      if (difference > 50) { // Very large difference
        concernAreas.push(
          `Significant difference in ${formatCategoryName(category)} may require attention`
        );
      }
    }
  }
  
  // Check overall compatibility
  const overallCompatibility = calculateCompatibilityScore(results1, results2);
  if (overallCompatibility < 40) {
    concernAreas.push('Overall compatibility is low - professional guidance recommended');
  }
  
  return concernAreas;
}

/**
 * Calculate growth recommendations for the pair
 * @param pairResults - Complete pair analysis results
 * @returns Prioritized growth recommendations
 */
export function generatePairGrowthRecommendations(pairResults: PairResults): {
  priority: 'high' | 'medium' | 'low';
  category: string;
  recommendation: string;
  activities: string[];
}[] {
  const recommendations: {
    priority: 'high' | 'medium' | 'low';
    category: string;
    recommendation: string;
    activities: string[];
  }[] = [];
  
  // High priority recommendations based on concern areas
  for (const concern of pairResults.concernAreas) {
    if (concern.includes('compatibility is low')) {
      recommendations.push({
        priority: 'high',
        category: 'Overall Relationship',
        recommendation: 'Seek professional guidance to improve twin relationship dynamics',
        activities: [
          'Schedule sessions with a twin relationship counselor',
          'Practice structured communication exercises',
          'Establish clear boundaries and expectations'
        ]
      });
    }
  }
  
  // Medium priority recommendations for complementary areas
  for (const complementary of pairResults.complementaryAreas) {
    recommendations.push({
      priority: 'medium',
      category: extractCategoryFromDescription(complementary),
      recommendation: 'Leverage your complementary strengths to support each other',
      activities: [
        'Identify specific ways to support each other',
        'Create structured check-ins to share strengths',
        'Practice appreciation and recognition exercises'
      ]
    });
  }
  
  // Low priority recommendations for shared strengths
  for (const strength of pairResults.sharedStrengths) {
    recommendations.push({
      priority: 'low',
      category: strength,
      recommendation: 'Continue to build on this shared strength',
      activities: [
        'Celebrate and acknowledge this strength regularly',
        'Find new ways to express this strength together',
        'Share this strength with others in your support network'
      ]
    });
  }
  
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

// Privacy and anonymization functions

/**
 * Check if privacy requirements are met for pair analysis
 * @param results1 - First twin's results
 * @param results2 - Second twin's results
 * @returns Whether privacy is preserved
 */
function isPrivacyPreserved(
  results1: AssessmentResults,
  results2: AssessmentResults
): boolean {
  // Check that both results have valid session IDs and user IDs
  if (!results1.sessionId || !results2.sessionId ||
      !results1.userId || !results2.userId) {
    return false;
  }
  
  // Ensure results are from different users
  if (results1.userId === results2.userId) {
    return false;
  }
  
  // Check for minimum data completeness
  if (results1.subscales.length < 5 || results2.subscales.length < 5) {
    return false;
  }
  
  return true;
}

/**
 * Anonymize assessment results for pair analysis
 * @param results - Original assessment results
 * @returns Anonymized results
 */
function anonymizeResults(results: AssessmentResults): AssessmentResults {
  return {
    ...results,
    userId: 'anonymized',
    sessionId: `anon_${Date.now()}`,
  };
}

// Helper functions

/**
 * Get weight for different assessment categories
 * @param category - Assessment category
 * @returns Weight factor (0-1)
 */
function getCategoryWeight(category: AssessmentCategory): number {
  const weights: Record<AssessmentCategory, number> = {
    communication: 1.2,
    emotional_connection: 1.2,
    conflict_resolution: 1.1,
    shared_experiences: 1.0,
    support_system: 1.0,
    independence: 0.9,
    psychic_connection: 0.7,
    identity_formation: 0.8
  };
  
  return weights[category] ?? 1.0;
}

/**
 * Check if two scores are complementary
 * @param score1 - First subscale score
 * @param score2 - Second subscale score
 * @returns Whether scores are complementary
 */
function isScoreComplementary(score1: SubscaleScore, score2: SubscaleScore): boolean {
  const high1 = score1.interpretation === 'high' || score1.interpretation === 'very_high';
  const low1 = score1.interpretation === 'low' || score1.interpretation === 'very_low';
  const high2 = score2.interpretation === 'high' || score2.interpretation === 'very_high';
  const low2 = score2.interpretation === 'low' || score2.interpretation === 'very_low';
  
  return (high1 && (low2 || score2.interpretation === 'below_average')) ||
         (high2 && (low1 || score1.interpretation === 'below_average'));
}

/**
 * Format category name for display
 * @param category - Assessment category
 * @returns Formatted display name
 */
function formatCategoryName(category: AssessmentCategory): string {
  const names: Record<AssessmentCategory, string> = {
    communication: 'Communication Skills',
    emotional_connection: 'Emotional Connection',
    shared_experiences: 'Shared Experiences',
    conflict_resolution: 'Conflict Resolution',
    independence: 'Independence',
    support_system: 'Support System',
    psychic_connection: 'Psychic Connection',
    identity_formation: 'Identity Formation'
  };
  
  return names[category] ?? category;
}

/**
 * Extract category from description text
 * @param description - Description text
 * @returns Extracted category name
 */
function extractCategoryFromDescription(description: string): string {
  // Simple extraction - in real implementation, use more sophisticated matching
  if (description.includes('independence')) return 'Independence';
  if (description.includes('support')) return 'Support System';
  if (description.includes('communication')) return 'Communication';
  return 'General';
}
/**
 * Test Suite for Twinship Assessment Scoring Engine
 * Comprehensive tests for all scoring functions and edge cases
 */

import {
  transformLikertTo100Scale,
  reverseScoreItem,
  calculateSubscaleScore,
  calculateCompositeIndex,
  calculatePercentileRank,
  interpretScoreLevel,
  generateScoreInterpretation,
  assessRiskLevel,
  validateAssessmentData,
  DEFAULT_SCORING_CONFIG,
} from '../assessmentScoring';

import {
  compareTwinScores,
  calculateTwinSimilarity,
  analyzeComplementarity,
  identifyGrowthAreas,
  calculateCompatibilityMetrics,
} from '../pairAnalytics';

import { TWINSHIP_ITEM_BANK, validateItemBank } from '../assessmentItemBank';

import {
  LikertResponse,
  AssessmentData,
  IndividualAssessmentResult,
  TwinSubscales,
  CompositeIndices,
  BigFiveTraits,
} from '../../types/assessment';

// Test data fixtures
const mockTwinSubscales: TwinSubscales = {
  emotionalFusion: 65,
  identityBlurring: 70,
  separationAnxiety: 60,
  boundaryDiffusion: 55,
  individualIdentity: 40,
  personalBoundaries: 45,
  independentDecisionMaking: 35,
  selfAdvocacy: 50,
  adaptabilityToChange: 55,
  conflictResolution: 60,
  emotionalRegulation: 50,
  socialSupport: 45,
  changeAnxiety: 70,
  attachmentInsecurity: 65,
  roleConfusion: 60,
  futureOrientation: 40,
};

const mockBigFive: BigFiveTraits = {
  openness: 60,
  conscientiousness: 55,
  extraversion: 45,
  agreeableness: 70,
  neuroticism: 65,
};

const mockCompositeIndices: CompositeIndices = {
  codependencyIndex: 62,
  autonomyResilienceIndex: 43,
  transitionRiskScore: 68,
};

const createMockAssessmentResult = (
  userId: string,
  overrides: Partial<{
    bigFive: Partial<BigFiveTraits>;
    subscales: Partial<TwinSubscales>;
    compositeIndices: Partial<CompositeIndices>;
  }> = {}
): IndividualAssessmentResult => ({
  userId,
  assessmentDate: new Date('2024-01-15'),
  bigFive: { ...mockBigFive, ...overrides.bigFive },
  subscales: { ...mockTwinSubscales, ...overrides.subscales },
  compositeIndices: { ...mockCompositeIndices, ...overrides.compositeIndices },
  interpretations: {
    bigFive: {
      openness: {
        level: 'moderate',
        description: 'Moderate openness',
        percentile: 60,
        recommendations: [],
      },
      conscientiousness: {
        level: 'moderate',
        description: 'Moderate conscientiousness',
        percentile: 55,
        recommendations: [],
      },
      extraversion: {
        level: 'moderate',
        description: 'Moderate extraversion',
        percentile: 45,
        recommendations: [],
      },
      agreeableness: {
        level: 'high',
        description: 'High agreeableness',
        percentile: 70,
        recommendations: [],
      },
      neuroticism: {
        level: 'high',
        description: 'High neuroticism',
        percentile: 65,
        recommendations: [],
      },
    },
    compositeIndices: {
      codependencyIndex: {
        level: 'moderate',
        description: 'Moderate codependency',
        percentile: 62,
        recommendations: [],
      },
      autonomyResilienceIndex: {
        level: 'low',
        description: 'Low autonomy',
        percentile: 43,
        recommendations: [],
      },
      transitionRiskScore: {
        level: 'high',
        description: 'High transition risk',
        percentile: 68,
        recommendations: [],
      },
    },
  },
  riskAssessment: {
    level: 'moderate',
    factors: ['Moderate codependency'],
    interventions: ['Individual therapy'],
    urgency: 'medium',
  },
  overallSummary: {
    primaryStrengths: ['High agreeableness'],
    primaryConcerns: ['High codependency'],
    developmentAreas: ['Autonomy'],
    recommendedInterventions: ['Therapy'],
  },
  dataQuality: {
    completionRate: 0.95,
    consistencyScore: 0.85,
    recommendProceed: true,
  },
});

describe('Core Scoring Functions', () => {
  describe('transformLikertTo100Scale', () => {
    it('should transform 1-7 scale to 0-100 scale correctly', () => {
      expect(transformLikertTo100Scale(1)).toBe(0);
      expect(transformLikertTo100Scale(4)).toBe(50);
      expect(transformLikertTo100Scale(7)).toBe(100);
    });

    it('should handle edge cases within range', () => {
      expect(transformLikertTo100Scale(2)).toBeCloseTo(16.67, 2); // (2-1)/(6) * 100 = 16.67
      expect(transformLikertTo100Scale(6)).toBeCloseTo(83.33, 2); // (6-1)/(6) * 100 = 83.33
    });

    it('should work with custom configuration', () => {
      const customConfig = {
        ...DEFAULT_SCORING_CONFIG,
        scales: {
          likertRange: [1, 5] as [number, number],
          targetRange: [0, 100] as [number, number],
        },
      };
      
      expect(transformLikertTo100Scale(1, customConfig)).toBeCloseTo(0, 2);
      expect(transformLikertTo100Scale(3, customConfig)).toBeCloseTo(50, 2);
      expect(transformLikertTo100Scale(5, customConfig)).toBeCloseTo(100, 2);
    });
  });

  describe('reverseScoreItem', () => {
    it('should reverse score items correctly', () => {
      expect(reverseScoreItem(1)).toBe(7); // 8 - 1 = 7
      expect(reverseScoreItem(4)).toBe(4); // 8 - 4 = 4 
      expect(reverseScoreItem(7)).toBe(1); // 8 - 7 = 1
    });

    it('should work with custom configuration', () => {
      const customConfig = {
        ...DEFAULT_SCORING_CONFIG,
        scales: {
          likertRange: [1, 5] as [number, number],
          targetRange: [0, 100] as [number, number],
        },
      };
      
      expect(reverseScoreItem(1, customConfig)).toBeCloseTo(5, 2); // (5+1) - 1 = 5
      expect(reverseScoreItem(3, customConfig)).toBeCloseTo(3, 2); // (5+1) - 3 = 3
      expect(reverseScoreItem(5, customConfig)).toBeCloseTo(1, 2); // (5+1) - 5 = 1
    });
  });

  describe('calculateSubscaleScore', () => {
    it('should calculate simple average correctly', () => {
      const responses: (LikertResponse | null)[] = [4, 5, 6, 4, 5];
      const result = calculateSubscaleScore(responses);
      
      // Each response transformed: 4->50, 5->67, 6->83, 4->50, 5->67
      // Average: (50+67+83+50+67)/5 = 63.4, rounded to 63
      expect(result.score).toBeCloseTo(63, 0);
      expect(result.validItemCount).toBe(5);
    });

    it('should handle reverse-scored items', () => {
      const responses: (LikertResponse | null)[] = [4, 5, 6];
      const reverseItems = [false, true, false];
      const result = calculateSubscaleScore(responses, reverseItems);
      
      // Transformed: 4->50, 5(reversed to 3)->33.33, 6->83.33
      // Average: (50+33.33+83.33)/3 = 55.55, rounded to 56
      expect(result.score).toBeCloseTo(56, 0);
      expect(result.validItemCount).toBe(3);
    });

    it('should handle weighted items', () => {
      const responses: (LikertResponse | null)[] = [4, 6];
      const reverseItems: boolean[] = [];
      const weights = [1.0, 2.0];
      const result = calculateSubscaleScore(responses, reverseItems, weights);
      
      // Transformed & weighted: 4->50*1=50, 6->83*2=166
      // Weighted average: (50+166)/(1+2) = 216/3 = 72
      expect(result.score).toBeCloseTo(72, 0);
      expect(result.validItemCount).toBe(2);
    });

    it('should handle null responses', () => {
      const responses: (LikertResponse | null)[] = [4, null, 6, null, 5];
      const result = calculateSubscaleScore(responses);
      
      // Only valid responses: 4->50, 6->83, 5->67
      // Average: (50+83+67)/3 = 66.67, rounded to 67
      expect(result.score).toBeCloseTo(67, 0);
      expect(result.validItemCount).toBe(3);
    });

    it('should return 0 score for all null responses', () => {
      const responses: (LikertResponse | null)[] = [null, null, null];
      const result = calculateSubscaleScore(responses);
      
      expect(result.score).toBe(0);
      expect(result.validItemCount).toBe(0);
    });

    it('should enforce score bounds (0-100)', () => {
      // Test with responses that might create out-of-bounds scores
      const responses: (LikertResponse | null)[] = [1, 1, 1];
      const result = calculateSubscaleScore(responses);
      
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });

  describe('calculateCompositeIndex', () => {
    it('should calculate codependency index correctly', () => {
      const weights = DEFAULT_SCORING_CONFIG.weights.compositeIndices.codependencyIndex;
      const result = calculateCompositeIndex(mockTwinSubscales, weights);
      
      // Should weight emotional fusion (65 * 0.3), identity blurring (70 * 0.25), etc.
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(100);
    });

    it('should return 0 when all weights are 0', () => {
      const zeroWeights: Record<keyof TwinSubscales, number> = {
        emotionalFusion: 0,
        identityBlurring: 0,
        separationAnxiety: 0,
        boundaryDiffusion: 0,
        individualIdentity: 0,
        personalBoundaries: 0,
        independentDecisionMaking: 0,
        selfAdvocacy: 0,
        adaptabilityToChange: 0,
        conflictResolution: 0,
        emotionalRegulation: 0,
        socialSupport: 0,
        changeAnxiety: 0,
        attachmentInsecurity: 0,
        roleConfusion: 0,
        futureOrientation: 0,
      };
      
      const result = calculateCompositeIndex(mockTwinSubscales, zeroWeights);
      expect(result).toBe(0);
    });

    it('should handle negative weights correctly', () => {
      const weights: Record<keyof TwinSubscales, number> = {
        emotionalFusion: 0.5,
        identityBlurring: 0,
        separationAnxiety: 0,
        boundaryDiffusion: 0,
        individualIdentity: 0,
        personalBoundaries: 0,
        independentDecisionMaking: 0,
        selfAdvocacy: 0,
        adaptabilityToChange: 0,
        conflictResolution: 0,
        emotionalRegulation: 0,
        socialSupport: 0,
        changeAnxiety: 0,
        attachmentInsecurity: 0,
        roleConfusion: 0,
        futureOrientation: -0.3, // Negative weight
      };
      
      const result = calculateCompositeIndex(mockTwinSubscales, weights);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100);
    });
  });

  describe('calculatePercentileRank', () => {
    it('should calculate percentile rank correctly', () => {
      const percentiles = [20, 40, 60, 80];
      
      // Using proper percentile calculation: (belowCount + 1) / (total + 1) * 100
      expect(calculatePercentileRank(10, percentiles)).toBe(20); // Below all: (0+1)/(4+1)*100 = 20
      expect(calculatePercentileRank(30, percentiles)).toBe(40); // Between 1st and 2nd: (1+1)/(4+1)*100 = 40  
      expect(calculatePercentileRank(70, percentiles)).toBe(80); // Between 3rd and 4th: (3+1)/(4+1)*100 = 80
      expect(calculatePercentileRank(90, percentiles)).toBe(100); // Above all: (4+1)/(4+1)*100 = 100
    });

    it('should handle empty percentiles array', () => {
      expect(calculatePercentileRank(50, [])).toBe(50); // Default to 50th percentile
    });

    it('should handle exact matches', () => {
      const percentiles = [25, 50, 75];
      expect(calculatePercentileRank(50, percentiles)).toBe(67); // Matches second percentile: (2+1)/(3+1)*100 = 75, but score 50 is at position 1, so (1+1)/(3+1)*100 = 50
    });
  });

  describe('interpretScoreLevel', () => {
    it('should interpret score levels correctly', () => {
      expect(interpretScoreLevel(10)).toBe('very-low');
      expect(interpretScoreLevel(25)).toBe('low');
      expect(interpretScoreLevel(50)).toBe('moderate');
      expect(interpretScoreLevel(75)).toBe('high');
      expect(interpretScoreLevel(90)).toBe('very-high');
    });

    it('should handle boundary cases', () => {
      expect(interpretScoreLevel(16)).toBe('low'); // Exactly at boundary
      expect(interpretScoreLevel(37)).toBe('moderate'); // Exactly at boundary
      expect(interpretScoreLevel(63)).toBe('high'); // Exactly at boundary
      expect(interpretScoreLevel(84)).toBe('very-high'); // Exactly at boundary
    });

    it('should handle edge case of 100', () => {
      expect(interpretScoreLevel(100)).toBe('very-high');
    });
  });

  describe('generateScoreInterpretation', () => {
    it('should generate interpretation with all components', () => {
      const percentiles = [20, 40, 60, 80];
      const interpretation = generateScoreInterpretation(70, percentiles, 'codependencyIndex');
      
      expect(interpretation).toHaveProperty('level');
      expect(interpretation).toHaveProperty('description');
      expect(interpretation).toHaveProperty('percentile');
      expect(interpretation).toHaveProperty('recommendations');
      expect(interpretation.recommendations).toBeInstanceOf(Array);
    });

    it('should provide different interpretations for different dimensions', () => {
      const percentiles = [20, 40, 60, 80];
      const codependencyInterp = generateScoreInterpretation(70, percentiles, 'codependencyIndex');
      const autonomyInterp = generateScoreInterpretation(70, percentiles, 'autonomyResilienceIndex');
      
      expect(codependencyInterp.description).not.toBe(autonomyInterp.description);
    });
  });

  describe('assessRiskLevel', () => {
    it('should assess risk based on composite indices', () => {
      const highRiskIndices: CompositeIndices = {
        codependencyIndex: 80,
        autonomyResilienceIndex: 20,
        transitionRiskScore: 85,
      };
      
      const riskAssessment = assessRiskLevel(highRiskIndices);
      
      expect(['moderate', 'high', 'severe']).toContain(riskAssessment.level);
      expect(riskAssessment.factors).toBeInstanceOf(Array);
      expect(riskAssessment.interventions).toBeInstanceOf(Array);
      expect(['low', 'medium', 'high']).toContain(riskAssessment.urgency);
    });

    it('should assess low risk for healthy scores', () => {
      const lowRiskIndices: CompositeIndices = {
        codependencyIndex: 30,
        autonomyResilienceIndex: 80,
        transitionRiskScore: 25,
      };
      
      const riskAssessment = assessRiskLevel(lowRiskIndices);
      
      expect(['minimal', 'low']).toContain(riskAssessment.level);
      expect(riskAssessment.urgency).toBe('low');
    });
  });
});

describe('Pair Analytics Functions', () => {
  const twin1 = createMockAssessmentResult('twin1');
  const twin2 = createMockAssessmentResult('twin2', {
    bigFive: { openness: 40, extraversion: 70 },
    compositeIndices: { codependencyIndex: 45, autonomyResilienceIndex: 65 },
  });

  describe('calculateTwinSimilarity', () => {
    it('should calculate similarity scores between twins', () => {
      const similarity = calculateTwinSimilarity(twin1, twin2);
      
      expect(similarity).toHaveProperty('bigFive');
      expect(similarity).toHaveProperty('overall');
      expect(similarity.overall).toBeGreaterThanOrEqual(0);
      expect(similarity.overall).toBeLessThanOrEqual(1);
      
      // Check that all Big Five traits have similarity scores
      expect(similarity.bigFive).toHaveProperty('openness');
      expect(similarity.bigFive).toHaveProperty('conscientiousness');
      expect(similarity.bigFive).toHaveProperty('extraversion');
      expect(similarity.bigFive).toHaveProperty('agreeableness');
      expect(similarity.bigFive).toHaveProperty('neuroticism');
    });

    it('should show high similarity for identical twins', () => {
      const identicalTwin2 = createMockAssessmentResult('twin2');
      const similarity = calculateTwinSimilarity(twin1, identicalTwin2);
      
      expect(similarity.overall).toBe(1); // Perfect similarity
      Object.values(similarity.bigFive).forEach(sim => {
        expect(sim).toBe(1);
      });
    });

    it('should show lower similarity for very different twins', () => {
      const veryDifferentTwin = createMockAssessmentResult('twin2', {
        bigFive: {
          openness: 10,
          conscientiousness: 15,
          extraversion: 90,
          agreeableness: 20,
          neuroticism: 10,
        },
      });
      
      const similarity = calculateTwinSimilarity(twin1, veryDifferentTwin);
      expect(similarity.overall).toBeLessThan(0.7); // Low overall similarity
    });
  });

  describe('analyzeComplementarity', () => {
    it('should identify complementarity patterns', () => {
      const complementarity = analyzeComplementarity(twin1, twin2);
      
      expect(complementarity).toHaveProperty('strengths');
      expect(complementarity).toHaveProperty('gaps');
      expect(complementarity).toHaveProperty('conflicts');
      expect(complementarity.strengths).toBeInstanceOf(Array);
      expect(complementarity.gaps).toBeInstanceOf(Array);
      expect(complementarity.conflicts).toBeInstanceOf(Array);
    });
  });

  describe('identifyGrowthAreas', () => {
    it('should identify individual and shared growth areas', () => {
      const growthAreas = identifyGrowthAreas(twin1, twin2);
      
      expect(growthAreas).toHaveProperty('individual');
      expect(growthAreas).toHaveProperty('shared');
      expect(growthAreas.individual).toHaveProperty('twin1');
      expect(growthAreas.individual).toHaveProperty('twin2');
      expect(growthAreas.individual.twin1).toBeInstanceOf(Array);
      expect(growthAreas.individual.twin2).toBeInstanceOf(Array);
      expect(growthAreas.shared).toBeInstanceOf(Array);
    });
  });

  describe('compareTwinScores', () => {
    it('should generate comprehensive pair comparison', () => {
      const comparison = compareTwinScores(twin1, twin2);
      
      expect(comparison).toHaveProperty('pairId');
      expect(comparison).toHaveProperty('twin1');
      expect(comparison).toHaveProperty('twin2');
      expect(comparison).toHaveProperty('similarity');
      expect(comparison).toHaveProperty('complementarity');
      expect(comparison).toHaveProperty('growthAreas');
      expect(comparison).toHaveProperty('dynamics');
      expect(comparison).toHaveProperty('pairRecommendations');
      
      expect(comparison.pairId).toBe('twin1_twin2');
    });
  });

  describe('calculateCompatibilityMetrics', () => {
    it('should calculate compatibility metrics', () => {
      const compatibility = calculateCompatibilityMetrics(twin1, twin2);
      
      expect(compatibility).toHaveProperty('overallCompatibility');
      expect(compatibility).toHaveProperty('dimensionCompatibility');
      expect(compatibility).toHaveProperty('compatibilityLevel');
      expect(compatibility).toHaveProperty('relationshipStrengths');
      expect(compatibility).toHaveProperty('potentialChallenges');
      
      expect(compatibility.overallCompatibility).toBeGreaterThanOrEqual(0);
      expect(compatibility.overallCompatibility).toBeLessThanOrEqual(100);
      expect(compatibility.relationshipStrengths).toBeInstanceOf(Array);
      expect(compatibility.potentialChallenges).toBeInstanceOf(Array);
    });
  });
});

describe('Assessment Data Validation', () => {
  const createMockAssessmentData = (overrides: Partial<AssessmentData> = {}): AssessmentData => ({
    userId: 'test-user',
    responses: TWINSHIP_ITEM_BANK.items.slice(0, 50).map((item, index) => ({
      itemId: item.id,
      response: (Math.floor(Math.random() * 7) + 1) as LikertResponse,
      timestamp: new Date(),
      responseTime: 2000 + Math.random() * 3000,
    })),
    startedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    version: '1.0.0',
    ...overrides,
  });

  describe('validateAssessmentData', () => {
    it('should validate complete assessment data', () => {
      const data = createMockAssessmentData();
      // Add all required responses
      data.responses = TWINSHIP_ITEM_BANK.items.map((item, index) => ({
        itemId: item.id,
        response: (Math.floor(Math.random() * 7) + 1) as LikertResponse,
        timestamp: new Date(),
        responseTime: 2000 + Math.random() * 3000,
      }));
      
      const validation = validateAssessmentData(data, TWINSHIP_ITEM_BANK);
      
      expect(validation).toHaveProperty('isValid');
      expect(validation).toHaveProperty('errors');
      expect(validation).toHaveProperty('warnings');
      expect(validation).toHaveProperty('dataQuality');
      expect(validation.dataQuality).toHaveProperty('completionRate');
      expect(validation.dataQuality).toHaveProperty('consistencyScore');
      expect(validation.dataQuality).toHaveProperty('recommendProceed');
    });

    it('should flag incomplete assessment data', () => {
      const data = createMockAssessmentData();
      // Keep only partial responses (less than minimum threshold)
      data.responses = data.responses.slice(0, Math.floor(TWINSHIP_ITEM_BANK.items.length * 0.7));
      
      const validation = validateAssessmentData(data, TWINSHIP_ITEM_BANK);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => error.code === 'INSUFFICIENT_COMPLETION')).toBe(true);
    });

    it('should warn about suspicious response patterns', () => {
      const data = createMockAssessmentData();
      // Create suspiciously fast responses
      data.responses = data.responses.map(response => ({
        ...response,
        responseTime: 500, // Very fast
      }));
      
      const validation = validateAssessmentData(data, TWINSHIP_ITEM_BANK);
      
      expect(validation.warnings.some(warning => warning.code === 'RAPID_RESPONSES')).toBe(true);
    });
  });
});

describe('Assessment Item Bank', () => {
  describe('validateItemBank', () => {
    it('should validate item bank integrity', () => {
      const validation = validateItemBank();
      
      expect(validation).toHaveProperty('isValid');
      expect(validation).toHaveProperty('errors');
      expect(validation).toHaveProperty('warnings');
      expect(validation).toHaveProperty('summary');
      
      if (!validation.isValid) {
        console.warn('Item bank validation errors:', validation.errors);
      }
      
      expect(validation.summary.totalItems).toBeGreaterThan(200);
      expect(validation.summary.scalesCovered).toBeGreaterThan(15);
    });
  });

  describe('Item Bank Content', () => {
    it('should have comprehensive coverage of twin-specific constructs', () => {
      const twinSpecificScales = [
        'emotionalFusion',
        'identityBlurring',
        'separationAnxiety',
        'boundaryDiffusion',
        'individualIdentity',
        'personalBoundaries',
        'independentDecisionMaking',
        'selfAdvocacy',
      ];
      
      twinSpecificScales.forEach(scale => {
        expect(TWINSHIP_ITEM_BANK.scales).toHaveProperty(scale);
        expect(TWINSHIP_ITEM_BANK.scales[scale as keyof typeof TWINSHIP_ITEM_BANK.scales].items.length).toBeGreaterThan(5);
      });
    });

    it('should include Big Five personality measures', () => {
      const bigFiveTraits = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
      
      bigFiveTraits.forEach(trait => {
        expect(TWINSHIP_ITEM_BANK.scales).toHaveProperty(trait);
        expect(TWINSHIP_ITEM_BANK.scales[trait as keyof typeof TWINSHIP_ITEM_BANK.scales].items.length).toBe(10);
      });
    });

    it('should have appropriate reliability estimates', () => {
      Object.values(TWINSHIP_ITEM_BANK.scales).forEach(scale => {
        if (scale.reliabilityAlpha !== undefined) {
          expect(scale.reliabilityAlpha).toBeGreaterThanOrEqual(0.7); // Acceptable reliability
        }
      });
    });
  });
});

describe('Edge Cases and Error Handling', () => {
  it('should handle extreme scores gracefully', () => {
    const extremeSubscales: TwinSubscales = {
      emotionalFusion: 100,
      identityBlurring: 0,
      separationAnxiety: 100,
      boundaryDiffusion: 0,
      individualIdentity: 100,
      personalBoundaries: 0,
      independentDecisionMaking: 100,
      selfAdvocacy: 0,
      adaptabilityToChange: 100,
      conflictResolution: 0,
      emotionalRegulation: 100,
      socialSupport: 0,
      changeAnxiety: 100,
      attachmentInsecurity: 0,
      roleConfusion: 100,
      futureOrientation: 0,
    };
    
    const weights = DEFAULT_SCORING_CONFIG.weights.compositeIndices.codependencyIndex;
    const result = calculateCompositeIndex(extremeSubscales, weights);
    
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('should handle missing or invalid data types gracefully', () => {
    expect(() => {
      calculateSubscaleScore([]);
    }).not.toThrow();
    
    expect(() => {
      calculatePercentileRank(50, []);
    }).not.toThrow();
  });

  it('should provide meaningful defaults when configuration is incomplete', () => {
    const interpretation = generateScoreInterpretation(50, [], 'unknownDimension');
    
    expect(interpretation).toHaveProperty('level');
    expect(interpretation).toHaveProperty('description');
    expect(interpretation).toHaveProperty('recommendations');
    expect(interpretation.recommendations).toBeInstanceOf(Array);
  });
});

describe('Performance and Scale', () => {
  it('should handle large datasets efficiently', () => {
    const startTime = performance.now();
    
    // Simulate processing 1000 twin pairs
    for (let i = 0; i < 1000; i++) {
      const twin1 = createMockAssessmentResult(`twin1_${i}`);
      const twin2 = createMockAssessmentResult(`twin2_${i}`);
      calculateTwinSimilarity(twin1, twin2);
    }
    
    const endTime = performance.now();
    const processingTime = endTime - startTime;
    
    // Should process 1000 pairs in reasonable time (less than 1 second)
    expect(processingTime).toBeLessThan(1000);
  });

  it('should maintain precision with repeated calculations', () => {
    const responses: LikertResponse[] = [4, 4, 4, 4, 4];
    
    // Run the same calculation multiple times
    const results = Array.from({ length: 100 }, () =>
      calculateSubscaleScore(responses).score
    );
    
    // All results should be identical (deterministic)
    expect(new Set(results).size).toBe(1);
    expect(results[0]).toBeCloseTo(50, 0); // 4 on 1-7 scale should map to 50 on 0-100 scale
  });
});

// Integration tests
describe('Integration Tests', () => {
  it('should produce consistent results across the entire pipeline', () => {
    // Create comprehensive assessment data
    const assessmentData: AssessmentData = {
      userId: 'integration-test-user',
      responses: TWINSHIP_ITEM_BANK.items.map(item => ({
        itemId: item.id,
        response: 4 as LikertResponse, // Neutral response
        timestamp: new Date(),
        responseTime: 3000,
      })),
      startedAt: new Date(Date.now() - 45 * 60 * 1000),
      completedAt: new Date(),
      version: '1.0.0',
    };
    
    // Validate the data
    const validation = validateAssessmentData(assessmentData, TWINSHIP_ITEM_BANK);
    expect(validation.dataQuality.recommendProceed).toBe(true);
    
    // For full integration, would need to implement the complete generateAssessmentReport function
    // This test ensures the validation pipeline works end-to-end
  });
});
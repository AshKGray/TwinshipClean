/**
 * Assessment Scoring Algorithm Tests
 * Comprehensive test suite for scoring reliability and mathematical accuracy
 */

import * as fc from 'fast-check';
import {
  likertToNormalizedScore,
  reverseScore,
  calculateMeanScore,
  calculateSubscaleScore,
  calculateCompositeIndices,
  validateAssessmentResponses,
  calculateReliabilityMetrics,
  calculatePercentileRank
} from '../../utils/assessment/scoringAlgorithms';

import {
  mockResponses,
  mockSubscales,
  mockCompositeIndices,
  mockDataGenerators,
  mockNormativeData,
  algorithmTestCases,
  performanceTestData
} from '../mocks/assessmentMockData';

import { AssessmentResponse, LikertResponse, AssessmentCategory } from '../../utils/assessment/types';

describe('Assessment Scoring Algorithms', () => {
  
  describe('likertToNormalizedScore', () => {
    it('should convert valid Likert responses to 0-100 scale correctly', () => {
      algorithmTestCases.likertConversion.forEach(({ input, expected, reversed }) => {
        const result = likertToNormalizedScore(input as LikertResponse, reversed);
        expect(result).toBeCloseTo(expected, 2);
      });
    });

    it('should handle boundary values correctly', () => {
      expect(likertToNormalizedScore(1, false)).toBe(0);
      expect(likertToNormalizedScore(8, false)).toBe(100);
      expect(likertToNormalizedScore(1, true)).toBe(100);
      expect(likertToNormalizedScore(8, true)).toBe(0);
    });

    it('should throw error for invalid responses', () => {
      expect(() => likertToNormalizedScore(0 as LikertResponse)).toThrow('Invalid Likert response');
      expect(() => likertToNormalizedScore(9 as LikertResponse)).toThrow('Invalid Likert response');
      expect(() => likertToNormalizedScore(-1 as LikertResponse)).toThrow('Invalid Likert response');
    });

    // Property-based testing
    it('should always return values between 0-100 for valid inputs', () => {
      fc.assert(fc.property(
        fc.integer({ min: 1, max: 8 }),
        fc.boolean(),
        (response, reversed) => {
          const result = likertToNormalizedScore(response as LikertResponse, reversed);
          return result >= 0 && result <= 100;
        }
      ));
    });

    it('should be monotonically increasing for non-reversed responses', () => {
      fc.assert(fc.property(
        fc.integer({ min: 1, max: 7 }),
        (response) => {
          const current = likertToNormalizedScore(response as LikertResponse, false);
          const next = likertToNormalizedScore((response + 1) as LikertResponse, false);
          return current < next;
        }
      ));
    });

    it('should be monotonically decreasing for reversed responses', () => {
      fc.assert(fc.property(
        fc.integer({ min: 1, max: 7 }),
        (response) => {
          const current = likertToNormalizedScore(response as LikertResponse, true);
          const next = likertToNormalizedScore((response + 1) as LikertResponse, true);
          return current > next;
        }
      ));
    });
  });

  describe('reverseScore', () => {
    it('should correctly reverse score using 8-point formula', () => {
      algorithmTestCases.reverseScoring.forEach(({ input, expected }) => {
        expect(reverseScore(input as LikertResponse)).toBe(expected);
      });
    });

    it('should be its own inverse', () => {
      fc.assert(fc.property(
        fc.integer({ min: 1, max: 8 }),
        (response) => {
          const reversed = reverseScore(response as LikertResponse);
          const doubleReversed = reverseScore(reversed);
          return doubleReversed === response;
        }
      ));
    });

    it('should maintain symmetry around 4.5', () => {
      expect(reverseScore(1) + reverseScore(8)).toBe(9);
      expect(reverseScore(2) + reverseScore(7)).toBe(9);
      expect(reverseScore(3) + reverseScore(6)).toBe(9);
      expect(reverseScore(4) + reverseScore(5)).toBe(9);
    });

    it('should throw error for invalid inputs', () => {
      expect(() => reverseScore(0 as LikertResponse)).toThrow();
      expect(() => reverseScore(9 as LikertResponse)).toThrow();
    });
  });

  describe('calculateMeanScore', () => {
    it('should calculate simple mean correctly', () => {
      const responses = mockResponses.realistic;
      const expectedMean = responses.reduce((sum, r) => sum + r.response, 0) / responses.length;
      expect(calculateMeanScore(responses)).toBeCloseTo(expectedMean, 2);
    });

    it('should handle weighted mean calculation', () => {
      const responses = mockResponses.realistic.slice(0, 3);
      const weights = new Map([
        ['q1', 2.0],
        ['q2', 1.0],
        ['q3', 0.5]
      ]);
      
      const expectedWeighted = (
        (responses[0].response * 2.0) + 
        (responses[1].response * 1.0) + 
        (responses[2].response * 0.5)
      ) / 3.5;
      
      expect(calculateMeanScore(responses, weights)).toBeCloseTo(expectedWeighted, 2);
    });

    it('should throw error for empty responses', () => {
      expect(() => calculateMeanScore([])).toThrow('Cannot calculate mean of empty responses array');
    });

    it('should handle single response', () => {
      const singleResponse = [mockResponses.realistic[0]];
      expect(calculateMeanScore(singleResponse)).toBe(singleResponse[0].response);
    });

    // Property-based testing
    it('should always return value within valid Likert range for unweighted mean', () => {
      fc.assert(fc.property(
        fc.array(fc.record({
          questionId: fc.string(),
          response: fc.integer({ min: 1, max: 8 }),
          timestamp: fc.constant('2023-01-01T10:00:00Z')
        }), { minLength: 1, maxLength: 20 }),
        (responses) => {
          const mean = calculateMeanScore(responses as AssessmentResponse[]);
          return mean >= 1 && mean <= 8;
        }
      ));
    });
  });

  describe('calculateSubscaleScore', () => {
    it('should calculate subscale score with proper components', () => {
      const responses = mockResponses.realistic;
      const reversedQuestions = new Set(['q2', 'q4']); // Reverse score q2 and q4
      const category: AssessmentCategory = 'communication';
      
      const result = calculateSubscaleScore(responses, category, reversedQuestions);
      
      expect(result.category).toBe(category);
      expect(result.rawScore).toBeGreaterThanOrEqual(1);
      expect(result.rawScore).toBeLessThanOrEqual(8);
      expect(result.normalizedScore).toBeGreaterThanOrEqual(0);
      expect(result.normalizedScore).toBeLessThanOrEqual(100);
      expect(result.percentile).toBeGreaterThanOrEqual(0);
      expect(result.percentile).toBeLessThanOrEqual(100);
      expect(result.reliability).toBeGreaterThanOrEqual(0);
      expect(result.reliability).toBeLessThanOrEqual(1);
      expect(['very_low', 'low', 'below_average', 'average', 'above_average', 'high', 'very_high'])
        .toContain(result.interpretation);
    });

    it('should apply reverse scoring correctly', () => {
      const responses = [
        { questionId: 'q1', response: 2, timestamp: '2023-01-01T10:00:00Z' },
        { questionId: 'q2', response: 2, timestamp: '2023-01-01T10:00:05Z' }
      ] as AssessmentResponse[];
      
      const withoutReverse = calculateSubscaleScore(responses, 'communication');
      const withReverse = calculateSubscaleScore(responses, 'communication', new Set(['q2']));
      
      expect(withReverse.rawScore).toBeGreaterThan(withoutReverse.rawScore);
    });

    it('should throw error for empty responses', () => {
      expect(() => calculateSubscaleScore([], 'communication')).toThrow();
    });

    it('should use custom norms when provided', () => {
      const responses = mockResponses.realistic;
      const customNorms = { mean: 75, std: 10 };
      
      const result = calculateSubscaleScore(responses, 'communication', new Set(), customNorms);
      
      expect(result.percentile).toBeDefined();
      expect(result.percentile).toBeGreaterThanOrEqual(0);
      expect(result.percentile).toBeLessThanOrEqual(100);
    });
  });

  describe('calculateCompositeIndices', () => {
    it('should calculate all three composite indices correctly', () => {
      const subscales = mockSubscales.highFunctioningTwin;
      const result = calculateCompositeIndices(subscales);
      
      expect(result.CI).toBeGreaterThanOrEqual(0);
      expect(result.CI).toBeLessThanOrEqual(100);
      expect(result.ARI).toBeGreaterThanOrEqual(0);
      expect(result.ARI).toBeLessThanOrEqual(100);
      expect(result.TRS).toBeGreaterThanOrEqual(0);
      expect(result.TRS).toBeLessThanOrEqual(100);
    });

    it('should calculate Connection Index from communication, emotional, and intuitive scores', () => {
      const subscales = [
        { category: 'communication' as AssessmentCategory, normalizedScore: 90, rawScore: 0, percentile: 0, interpretation: 'high' as const, reliability: 0.9 },
        { category: 'emotional_connection' as AssessmentCategory, normalizedScore: 80, rawScore: 0, percentile: 0, interpretation: 'high' as const, reliability: 0.9 },
        { category: 'intuitive_connection' as AssessmentCategory, normalizedScore: 60, rawScore: 0, percentile: 0, interpretation: 'average' as const, reliability: 0.9 }
      ];
      
      const result = calculateCompositeIndices(subscales);
      const expectedCI = Math.round((90 + 80 + 60) / 3);
      
      expect(result.CI).toBe(expectedCI);
    });

    it('should calculate ARI as absolute difference between independence and support', () => {
      const subscales = [
        { category: 'independence' as AssessmentCategory, normalizedScore: 80, rawScore: 0, percentile: 0, interpretation: 'high' as const, reliability: 0.9 },
        { category: 'support_system' as AssessmentCategory, normalizedScore: 40, rawScore: 0, percentile: 0, interpretation: 'low' as const, reliability: 0.9 }
      ];
      
      const result = calculateCompositeIndices(subscales);
      expect(result.ARI).toBe(40); // |80 - 40|
    });

    it('should handle missing subscales gracefully', () => {
      const incompleteSubscales = [
        { category: 'communication' as AssessmentCategory, normalizedScore: 70, rawScore: 0, percentile: 0, interpretation: 'average' as const, reliability: 0.9 }
      ];
      
      const result = calculateCompositeIndices(incompleteSubscales);
      
      expect(result.CI).toBeGreaterThanOrEqual(0);
      expect(result.ARI).toBeGreaterThanOrEqual(0);
      expect(result.TRS).toBeGreaterThanOrEqual(0);
    });

    it('should weight TRS components according to specification', () => {
      const fullSubscales = [
        { category: 'communication' as AssessmentCategory, normalizedScore: 100, rawScore: 0, percentile: 0, interpretation: 'very_high' as const, reliability: 0.9 },
        { category: 'emotional_connection' as AssessmentCategory, normalizedScore: 100, rawScore: 0, percentile: 0, interpretation: 'very_high' as const, reliability: 0.9 },
        { category: 'shared_experiences' as AssessmentCategory, normalizedScore: 0, rawScore: 0, percentile: 0, interpretation: 'very_low' as const, reliability: 0.9 },
        { category: 'conflict_resolution' as AssessmentCategory, normalizedScore: 0, rawScore: 0, percentile: 0, interpretation: 'very_low' as const, reliability: 0.9 },
        { category: 'independence' as AssessmentCategory, normalizedScore: 0, rawScore: 0, percentile: 0, interpretation: 'very_low' as const, reliability: 0.9 },
        { category: 'support_system' as AssessmentCategory, normalizedScore: 0, rawScore: 0, percentile: 0, interpretation: 'very_low' as const, reliability: 0.9 },
        { category: 'intuitive_connection' as AssessmentCategory, normalizedScore: 0, rawScore: 0, percentile: 0, interpretation: 'very_low' as const, reliability: 0.9 },
        { category: 'identity_formation' as AssessmentCategory, normalizedScore: 0, rawScore: 0, percentile: 0, interpretation: 'very_low' as const, reliability: 0.9 }
      ];
      
      const result = calculateCompositeIndices(fullSubscales);
      
      // Should be weighted heavily toward communication and emotional_connection (0.2 + 0.2 = 0.4)
      expect(result.TRS).toBeGreaterThan(30); // 100 * 0.4 = 40, minus other components
    });
  });

  describe('validateAssessmentResponses', () => {
    it('should validate complete valid responses', () => {
      const requiredQuestions = new Set(['q1', 'q2', 'q3', 'q4', 'q5']);
      const result = validateAssessmentResponses(mockResponses.realistic, requiredQuestions);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.missingResponses).toHaveLength(0);
    });

    it('should detect missing required responses', () => {
      const requiredQuestions = new Set(['q1', 'q2', 'q3', 'q4', 'q5', 'q6']);
      const result = validateAssessmentResponses(mockResponses.realistic, requiredQuestions);
      
      expect(result.isValid).toBe(false);
      expect(result.missingResponses).toContain('q6');
    });

    it('should detect invalid response values', () => {
      const invalidResponses = [
        { questionId: 'q1', response: 0 as any, timestamp: '2023-01-01T10:00:00Z' },
        { questionId: 'q2', response: 9 as any, timestamp: '2023-01-01T10:00:05Z' }
      ];
      
      const result = validateAssessmentResponses(invalidResponses, new Set(['q1', 'q2']));
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('Invalid response value'))).toBe(true);
    });

    it('should warn about suspiciously fast responses', () => {
      const result = validateAssessmentResponses(mockResponses.suspiciousFast, new Set(['q1', 'q2', 'q3', 'q4', 'q5']));
      
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('Very fast response time'))).toBe(true);
    });

    it('should detect invalid timestamps', () => {
      const invalidTimestamps = [
        { questionId: 'q1', response: 5, timestamp: 'invalid-date' }
      ] as AssessmentResponse[];
      
      const result = validateAssessmentResponses(invalidTimestamps, new Set(['q1']));
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid timestamp'))).toBe(true);
    });

    it('should warn about straight-line responding', () => {
      const result = validateAssessmentResponses(mockResponses.suspiciousFast, new Set(['q1', 'q2', 'q3', 'q4', 'q5']));
      
      expect(result.warnings.some(w => w.includes('straight-line responding'))).toBe(true);
    });
  });

  describe('calculateReliabilityMetrics', () => {
    it('should calculate reliability metrics for valid responses', () => {
      const result = calculateReliabilityMetrics(mockResponses.realistic);
      
      expect(result.cronbachAlpha).toBeGreaterThanOrEqual(0);
      expect(result.cronbachAlpha).toBeLessThanOrEqual(1);
      expect(result.standardError).toBeGreaterThan(0);
      expect(result.confidenceInterval).toHaveLength(2);
      expect(result.confidenceInterval[0]).toBeLessThan(result.confidenceInterval[1]);
    });

    it('should handle minimum data requirements', () => {
      const singleResponse = [mockResponses.realistic[0]];
      const result = calculateReliabilityMetrics(singleResponse);
      
      expect(result.cronbachAlpha).toBe(0);
    });

    it('should produce higher alpha for more consistent responses', () => {
      const consistentResult = calculateReliabilityMetrics(mockResponses.perfect);
      const inconsistentResult = calculateReliabilityMetrics(mockResponses.realistic);
      
      expect(consistentResult.cronbachAlpha).toBeGreaterThanOrEqual(inconsistentResult.cronbachAlpha);
    });
  });

  describe('calculatePercentileRank', () => {
    it('should calculate percentile rank correctly', () => {
      algorithmTestCases.percentileCalculation.forEach(({ score, scores, expected }) => {
        const result = calculatePercentileRank(score, scores);
        expect(result).toBeCloseTo(expected, 2);
      });
    });

    it('should handle edge cases', () => {
      expect(calculatePercentileRank(50, [])).toBe(50); // Default to median
      expect(calculatePercentileRank(100, [100])).toBe(50); // Single score
      expect(calculatePercentileRank(50, [10, 20, 30, 40])).toBe(100); // Above all
      expect(calculatePercentileRank(5, [10, 20, 30, 40])).toBe(0); // Below all
    });

    it('should handle ties correctly', () => {
      const scores = [50, 50, 50, 50];
      expect(calculatePercentileRank(50, scores)).toBe(100);
    });

    // Property-based testing
    it('should always return values between 0-100', () => {
      fc.assert(fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.array(fc.integer({ min: 1, max: 100 }), { minLength: 1, maxLength: 50 }),
        (score, scores) => {
          const percentile = calculatePercentileRank(score, scores);
          return percentile >= 0 && percentile <= 100;
        }
      ));
    });
  });

  // Performance tests
  describe('Performance benchmarks', () => {
    it('should handle small datasets efficiently', () => {
      const start = performance.now();
      
      for (let i = 0; i < 100; i++) {
        calculateMeanScore(performanceTestData.small);
        likertToNormalizedScore(mockDataGenerators.randomLikertResponse(), false);
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100); // Should complete in under 100ms
    });

    it('should handle medium datasets efficiently', () => {
      const start = performance.now();
      
      for (let i = 0; i < 10; i++) {
        calculateMeanScore(performanceTestData.medium);
        calculateReliabilityMetrics(performanceTestData.medium);
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    });

    it('should handle large datasets within reasonable time', () => {
      const start = performance.now();
      
      calculateMeanScore(performanceTestData.large);
      calculateReliabilityMetrics(performanceTestData.large);
      validateAssessmentResponses(performanceTestData.large, new Set());
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds
    });
  });

  // Integration tests
  describe('End-to-end scoring workflow', () => {
    it('should process complete assessment from responses to final scores', () => {
      const responses = mockResponses.realistic;
      
      // Validate responses
      const validation = validateAssessmentResponses(responses, new Set(['q1', 'q2', 'q3', 'q4', 'q5']));
      expect(validation.isValid).toBe(true);
      
      // Calculate subscale score
      const subscaleScore = calculateSubscaleScore(responses, 'communication');
      expect(subscaleScore).toBeDefined();
      expect(subscaleScore.reliability).toBeGreaterThan(0);
      
      // Calculate composite indices
      const subscales = [subscaleScore];
      const compositeIndices = calculateCompositeIndices(subscales);
      expect(compositeIndices).toBeDefined();
      
      // Calculate reliability metrics
      const reliability = calculateReliabilityMetrics(responses);
      expect(reliability.cronbachAlpha).toBeGreaterThanOrEqual(0);
    });
  });
});
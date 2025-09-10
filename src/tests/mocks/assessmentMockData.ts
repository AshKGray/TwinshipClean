/**
 * Mock Data for Assessment Testing
 * Diverse twin scenarios for comprehensive test coverage
 */

import { 
  AssessmentResponse, 
  AssessmentSession, 
  AssessmentResults,
  SubscaleScore,
  CompositeIndex,
  LikertResponse,
  AssessmentCategory
} from '../../utils/assessment/types';

/**
 * Generate mock assessment responses with various patterns
 */
export const mockResponses = {
  // Perfect responses (all 8s)
  perfect: [
    { questionId: 'q1', response: 8, timestamp: '2023-01-01T10:00:00Z', responseTime: 2000 },
    { questionId: 'q2', response: 8, timestamp: '2023-01-01T10:00:05Z', responseTime: 2500 },
    { questionId: 'q3', response: 8, timestamp: '2023-01-01T10:00:10Z', responseTime: 1800 },
    { questionId: 'q4', response: 8, timestamp: '2023-01-01T10:00:15Z', responseTime: 2200 },
    { questionId: 'q5', response: 8, timestamp: '2023-01-01T10:00:20Z', responseTime: 1900 }
  ] as AssessmentResponse[],

  // Poor responses (all 1s)
  poor: [
    { questionId: 'q1', response: 1, timestamp: '2023-01-01T10:00:00Z', responseTime: 1000 },
    { questionId: 'q2', response: 1, timestamp: '2023-01-01T10:00:05Z', responseTime: 1200 },
    { questionId: 'q3', response: 1, timestamp: '2023-01-01T10:00:10Z', responseTime: 900 },
    { questionId: 'q4', response: 1, timestamp: '2023-01-01T10:00:15Z', responseTime: 1100 },
    { questionId: 'q5', response: 1, timestamp: '2023-01-01T10:00:20Z', responseTime: 950 }
  ] as AssessmentResponse[],

  // Mixed realistic responses
  realistic: [
    { questionId: 'q1', response: 6, timestamp: '2023-01-01T10:00:00Z', responseTime: 3000 },
    { questionId: 'q2', response: 4, timestamp: '2023-01-01T10:00:05Z', responseTime: 4500 },
    { questionId: 'q3', response: 7, timestamp: '2023-01-01T10:00:10Z', responseTime: 2800 },
    { questionId: 'q4', response: 3, timestamp: '2023-01-01T10:00:15Z', responseTime: 5200 },
    { questionId: 'q5', response: 8, timestamp: '2023-01-01T10:00:20Z', responseTime: 2100 }
  ] as AssessmentResponse[],

  // Suspicious fast responses (potential quality issues)
  suspiciousFast: [
    { questionId: 'q1', response: 5, timestamp: '2023-01-01T10:00:00Z', responseTime: 200 },
    { questionId: 'q2', response: 5, timestamp: '2023-01-01T10:00:05Z', responseTime: 150 },
    { questionId: 'q3', response: 5, timestamp: '2023-01-01T10:00:10Z', responseTime: 300 },
    { questionId: 'q4', response: 5, timestamp: '2023-01-01T10:00:15Z', responseTime: 180 },
    { questionId: 'q5', response: 5, timestamp: '2023-01-01T10:00:20Z', responseTime: 220 }
  ] as AssessmentResponse[],

  // Edge case: missing responses
  incomplete: [
    { questionId: 'q1', response: 6, timestamp: '2023-01-01T10:00:00Z', responseTime: 3000 },
    { questionId: 'q3', response: 7, timestamp: '2023-01-01T10:00:10Z', responseTime: 2800 },
    { questionId: 'q5', response: 8, timestamp: '2023-01-01T10:00:20Z', responseTime: 2100 }
  ] as AssessmentResponse[],

  // Large dataset for performance testing
  largePerfect: Array.from({ length: 100 }, (_, i) => ({
    questionId: `q${i + 1}`,
    response: 8 as LikertResponse,
    timestamp: new Date(2023, 0, 1, 10, 0, i * 5).toISOString(),
    responseTime: 2000 + Math.random() * 1000
  })),

  largeRealistic: Array.from({ length: 100 }, (_, i) => ({
    questionId: `q${i + 1}`,
    response: Math.floor(Math.random() * 8 + 1) as LikertResponse,
    timestamp: new Date(2023, 0, 1, 10, 0, i * 5).toISOString(),
    responseTime: 1000 + Math.random() * 4000
  }))
};

/**
 * Mock assessment sessions for different scenarios
 */
export const mockSessions = {
  completed: {
    id: 'session_1',
    userId: 'user_1',
    startTime: '2023-01-01T10:00:00Z',
    endTime: '2023-01-01T10:30:00Z',
    responses: mockResponses.realistic,
    progress: 100,
    isComplete: true,
    version: '1.0.0'
  } as AssessmentSession,

  inProgress: {
    id: 'session_2',
    userId: 'user_2',
    startTime: '2023-01-01T11:00:00Z',
    responses: mockResponses.incomplete,
    progress: 60,
    isComplete: false,
    version: '1.0.0'
  } as AssessmentSession,

  abandoned: {
    id: 'session_3',
    userId: 'user_3',
    startTime: '2023-01-01T12:00:00Z',
    endTime: '2023-01-01T12:05:00Z',
    responses: [mockResponses.realistic[0]],
    progress: 5,
    isComplete: false,
    version: '1.0.0'
  } as AssessmentSession
};

/**
 * Mock subscale scores for different twin profiles
 */
export const mockSubscales = {
  highFunctioningTwin: [
    {
      category: 'communication' as AssessmentCategory,
      rawScore: 7.2,
      normalizedScore: 88.6,
      percentile: 85,
      interpretation: 'high' as const,
      reliability: 0.89
    },
    {
      category: 'emotional_connection' as AssessmentCategory,
      rawScore: 6.8,
      normalizedScore: 82.9,
      percentile: 78,
      interpretation: 'high' as const,
      reliability: 0.91
    },
    {
      category: 'conflict_resolution' as AssessmentCategory,
      rawScore: 6.5,
      normalizedScore: 78.6,
      percentile: 72,
      interpretation: 'above_average' as const,
      reliability: 0.87
    },
    {
      category: 'independence' as AssessmentCategory,
      rawScore: 5.8,
      normalizedScore: 68.6,
      percentile: 58,
      interpretation: 'average' as const,
      reliability: 0.83
    },
    {
      category: 'support_system' as AssessmentCategory,
      rawScore: 7.0,
      normalizedScore: 85.7,
      percentile: 80,
      interpretation: 'high' as const,
      reliability: 0.88
    }
  ] as SubscaleScore[],

  challengedTwin: [
    {
      category: 'communication' as AssessmentCategory,
      rawScore: 3.2,
      normalizedScore: 31.4,
      percentile: 25,
      interpretation: 'below_average' as const,
      reliability: 0.89
    },
    {
      category: 'emotional_connection' as AssessmentCategory,
      rawScore: 2.8,
      normalizedScore: 25.7,
      percentile: 18,
      interpretation: 'low' as const,
      reliability: 0.91
    },
    {
      category: 'conflict_resolution' as AssessmentCategory,
      rawScore: 2.5,
      normalizedScore: 21.4,
      percentile: 12,
      interpretation: 'low' as const,
      reliability: 0.87
    },
    {
      category: 'independence' as AssessmentCategory,
      rawScore: 4.8,
      normalizedScore: 54.3,
      percentile: 52,
      interpretation: 'average' as const,
      reliability: 0.83
    },
    {
      category: 'support_system' as AssessmentCategory,
      rawScore: 3.0,
      normalizedScore: 28.6,
      percentile: 22,
      interpretation: 'below_average' as const,
      reliability: 0.88
    }
  ] as SubscaleScore[],

  balancedTwin: [
    {
      category: 'communication' as AssessmentCategory,
      rawScore: 5.0,
      normalizedScore: 57.1,
      percentile: 52,
      interpretation: 'average' as const,
      reliability: 0.89
    },
    {
      category: 'emotional_connection' as AssessmentCategory,
      rawScore: 4.8,
      normalizedScore: 54.3,
      percentile: 48,
      interpretation: 'average' as const,
      reliability: 0.91
    },
    {
      category: 'conflict_resolution' as AssessmentCategory,
      rawScore: 5.2,
      normalizedScore: 60.0,
      percentile: 55,
      interpretation: 'average' as const,
      reliability: 0.87
    },
    {
      category: 'independence' as AssessmentCategory,
      rawScore: 5.5,
      normalizedScore: 64.3,
      percentile: 62,
      interpretation: 'average' as const,
      reliability: 0.83
    },
    {
      category: 'support_system' as AssessmentCategory,
      rawScore: 4.7,
      normalizedScore: 52.9,
      percentile: 45,
      interpretation: 'average' as const,
      reliability: 0.88
    }
  ] as SubscaleScore[]
};

/**
 * Mock composite indices for different scenarios
 */
export const mockCompositeIndices = {
  highConnection: {
    CI: 85, // High connection index
    ARI: 15, // Low autonomy-relatedness imbalance (good balance)
    TRS: 82 // High twin relationship strength
  } as CompositeIndex,

  lowConnection: {
    CI: 28, // Low connection index
    ARI: 45, // High autonomy-relatedness imbalance
    TRS: 35 // Low twin relationship strength
  } as CompositeIndex,

  balanced: {
    CI: 55, // Average connection
    ARI: 22, // Moderate balance
    TRS: 58 // Average relationship strength
  } as CompositeIndex
};

/**
 * Mock complete assessment results for different twin types
 */
export const mockAssessmentResults = {
  identicalTwinsHighFunctioning: {
    sessionId: 'session_identical_high_1',
    userId: 'twin_1_identical',
    completedAt: '2023-01-01T10:30:00Z',
    subscales: mockSubscales.highFunctioningTwin,
    compositeIndices: mockCompositeIndices.highConnection,
    overallScore: 84,
    growthAreas: [],
    strengths: ['communication', 'emotional_connection', 'support_system'],
    reliabilityMetrics: {
      cronbachAlpha: 0.91,
      standardError: 0.68,
      confidenceInterval: [6.2, 7.8] as [number, number]
    }
  } as AssessmentResults,

  identicalTwinsChallenged: {
    sessionId: 'session_identical_challenged_1',
    userId: 'twin_2_identical',
    completedAt: '2023-01-01T11:30:00Z',
    subscales: mockSubscales.challengedTwin,
    compositeIndices: mockCompositeIndices.lowConnection,
    overallScore: 32,
    growthAreas: [
      {
        category: 'communication' as AssessmentCategory,
        priority: 'high' as const,
        recommendedActions: ['Practice active listening', 'Use structured communication'],
        resources: ['Communication workbook', 'Twin therapy sessions']
      },
      {
        category: 'emotional_connection' as AssessmentCategory,
        priority: 'high' as const,
        recommendedActions: ['Emotion validation exercises', 'Shared activities'],
        resources: ['Emotion coaching guide', 'Twin bonding activities']
      }
    ],
    strengths: ['independence'],
    reliabilityMetrics: {
      cronbachAlpha: 0.88,
      standardError: 0.82,
      confidenceInterval: [2.1, 4.3] as [number, number]
    }
  } as AssessmentResults,

  fraternalTwinsBalanced: {
    sessionId: 'session_fraternal_balanced_1',
    userId: 'twin_1_fraternal',
    completedAt: '2023-01-01T12:30:00Z',
    subscales: mockSubscales.balancedTwin,
    compositeIndices: mockCompositeIndices.balanced,
    overallScore: 57,
    growthAreas: [
      {
        category: 'communication' as AssessmentCategory,
        priority: 'medium' as const,
        recommendedActions: ['Improve clarity in expression'],
        resources: ['Communication skills guide']
      }
    ],
    strengths: ['independence', 'conflict_resolution'],
    reliabilityMetrics: {
      cronbachAlpha: 0.86,
      standardError: 0.74,
      confidenceInterval: [4.2, 5.8] as [number, number]
    }
  } as AssessmentResults
};

/**
 * Mock data generators for property-based testing
 */
export const mockDataGenerators = {
  /**
   * Generate random valid Likert response
   */
  randomLikertResponse: (): LikertResponse => {
    return (Math.floor(Math.random() * 8) + 1) as LikertResponse;
  },

  /**
   * Generate array of random responses for testing
   */
  randomResponseArray: (length: number): AssessmentResponse[] => {
    return Array.from({ length }, (_, i) => ({
      questionId: `q${i + 1}`,
      response: mockDataGenerators.randomLikertResponse(),
      timestamp: new Date(Date.now() - (length - i) * 5000).toISOString(),
      responseTime: 1000 + Math.random() * 4000
    }));
  },

  /**
   * Generate edge case responses (boundary values)
   */
  edgeCaseResponses: (): AssessmentResponse[] => [
    { questionId: 'edge1', response: 1, timestamp: '2023-01-01T10:00:00Z', responseTime: 500 },
    { questionId: 'edge2', response: 8, timestamp: '2023-01-01T10:00:05Z', responseTime: 5000 },
    { questionId: 'edge3', response: 1, timestamp: '2023-01-01T10:00:10Z', responseTime: 100 }, // Very fast
    { questionId: 'edge4', response: 8, timestamp: '2023-01-01T10:00:15Z', responseTime: 10000 } // Very slow
  ],

  /**
   * Generate invalid data for error testing
   */
  invalidResponses: () => [
    // These would cause errors in real usage
    { questionId: 'invalid1', response: 0 as any, timestamp: '2023-01-01T10:00:00Z' },
    { questionId: 'invalid2', response: 9 as any, timestamp: '2023-01-01T10:00:05Z' },
    { questionId: 'invalid3', response: 5 as LikertResponse, timestamp: 'invalid-date' },
    { questionId: '', response: 5 as LikertResponse, timestamp: '2023-01-01T10:00:15Z' }
  ]
};

/**
 * Mock normative data for testing percentile calculations
 */
export const mockNormativeData = {
  communication: { mean: 52.3, std: 14.7 },
  emotional_connection: { mean: 48.9, std: 16.2 },
  shared_experiences: { mean: 51.1, std: 13.8 },
  conflict_resolution: { mean: 49.7, std: 15.4 },
  independence: { mean: 53.2, std: 12.9 },
  support_system: { mean: 50.8, std: 14.1 },
  psychic_connection: { mean: 45.3, std: 18.6 },
  identity_formation: { mean: 52.7, std: 13.5 }
};

/**
 * Performance testing datasets
 */
export const performanceTestData = {
  small: mockDataGenerators.randomResponseArray(10),
  medium: mockDataGenerators.randomResponseArray(100),
  large: mockDataGenerators.randomResponseArray(1000),
  xlarge: mockDataGenerators.randomResponseArray(10000)
};

/**
 * Test data for specific algorithm validation
 */
export const algorithmTestCases = {
  likertConversion: [
    { input: 1, expected: 0, reversed: false },
    { input: 8, expected: 100, reversed: false },
    { input: 1, expected: 100, reversed: true },
    { input: 8, expected: 0, reversed: true },
    { input: 5, expected: 57.14, reversed: false } // (5-1)/7*100 = 57.14
  ],
  
  reverseScoring: [
    { input: 1, expected: 8 },
    { input: 8, expected: 1 },
    { input: 4, expected: 5 },
    { input: 5, expected: 4 }
  ],
  
  percentileCalculation: [
    { score: 75, scores: [50, 60, 70, 75, 80, 90], expected: 66.67 },
    { score: 50, scores: [50, 50, 50, 50], expected: 100 },
    { score: 100, scores: [10, 20, 30, 40], expected: 100 }
  ]
};
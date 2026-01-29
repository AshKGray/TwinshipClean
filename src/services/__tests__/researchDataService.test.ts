/**
 * Research Data Service Tests
 * Epic 5: Research Contribution System
 *
 * Tests anonymization logic and privacy measures
 */

import { researchDataService } from '../researchDataService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock expo-crypto
jest.mock('expo-crypto', () => ({
  digestStringAsync: jest.fn((algorithm, data) => {
    // Simple hash mock for testing
    return Promise.resolve('abc123def456789');
  }),
  getRandomBytesAsync: jest.fn((size) => {
    return Promise.resolve(new Uint8Array(size).fill(255));
  }),
  CryptoDigestAlgorithm: {
    SHA256: 'SHA256',
  },
}));

// Mock Firestore service
jest.mock('../firebase/firestore', () => ({
  firestoreService: {
    createDocument: jest.fn(),
    queryCollectionSimple: jest.fn(),
  },
}));

describe('ResearchDataService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateAnonymousId', () => {
    it('should generate stable anonymous ID for user-study pair', async () => {
      const userId = 'user123';
      const studyId = 'study456';

      const anonymousId = await researchDataService.generateAnonymousId(userId, studyId);

      expect(anonymousId).toBeTruthy();
      expect(anonymousId).toMatch(/^TWIN_[A-Z0-9]{16}$/);
    });

    it('should return same ID for same user-study pair', async () => {
      const userId = 'user123';
      const studyId = 'study456';

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('TWIN_ABC123DEF456789');

      const id1 = await researchDataService.generateAnonymousId(userId, studyId);
      const id2 = await researchDataService.generateAnonymousId(userId, studyId);

      expect(id1).toBe(id2);
    });

    it('should generate different IDs for different users', async () => {
      const user1 = 'user123';
      const user2 = 'user456';
      const studyId = 'study789';

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const id1 = await researchDataService.generateAnonymousId(user1, studyId);
      const id2 = await researchDataService.generateAnonymousId(user2, studyId);

      expect(id1).not.toBe(id2);
    });
  });

  describe('anonymizeData - Game Data', () => {
    it('should remove PII from game data', async () => {
      const rawGameData = {
        id: 'game123',
        userId: 'user123',
        userName: 'John Doe',
        userEmail: 'john@example.com',
        gameType: 'maze',
        completedAt: '2024-01-15T10:00:00Z',
        rawData: {
          completionTime: 120000,
          errorCount: 5,
        },
        result: {
          synchronicity: {
            overallScore: 85,
          },
        },
        twinId: 'twin456',
      };

      const anonymized = await researchDataService.anonymizeData(
        'user123',
        'study456',
        'game',
        rawGameData
      );

      // Should have anonymous ID
      expect(anonymized.anonymousId).toBeTruthy();
      expect(anonymized.anonymousId).toMatch(/^TWIN_/);

      // Should remove PII
      expect(anonymized.data).not.toHaveProperty('userId');
      expect(anonymized.data).not.toHaveProperty('userName');
      expect(anonymized.data).not.toHaveProperty('userEmail');
      expect(anonymized.data).not.toHaveProperty('id');

      // Should keep aggregate data
      expect(anonymized.data.gameType).toBe('maze');
      expect(anonymized.data.synchronicityScore).toBe(85);
    });

    it('should preserve performance metrics without identifying info', async () => {
      const rawGameData = {
        gameType: 'emotion',
        completedAt: '2024-01-15T10:00:00Z',
        rawData: {
          completionTime: 90000,
          errorCount: 2,
        },
        result: {
          synchronicity: {
            overallScore: 92,
          },
        },
      };

      const anonymized = await researchDataService.anonymizeData(
        'user123',
        'study456',
        'game',
        rawGameData
      );

      expect(anonymized.data.performanceMetrics).toBeDefined();
      expect(anonymized.data.performanceMetrics.completionTime).toBe(90000);
      expect(anonymized.data.performanceMetrics.errorCount).toBe(2);
    });
  });

  describe('anonymizeData - Twintuition Data', () => {
    it('should NEVER include message content', async () => {
      const rawTwintuitionData = {
        id: 'alert123',
        userId: 'user123',
        type: 'mood_synchronization',
        confidence: 0.85,
        detectedAt: '2024-01-15T14:30:00Z',
        message: 'Are you thinking about me?', // Should be stripped
        description: 'Feeling connected', // Should be stripped
      };

      const anonymized = await researchDataService.anonymizeData(
        'user123',
        'study456',
        'twintuition',
        rawTwintuitionData
      );

      // Should NEVER include message content
      expect(anonymized.data).not.toHaveProperty('message');
      expect(anonymized.data).not.toHaveProperty('description');
      expect(anonymized.data).not.toHaveProperty('userId');

      // Should keep only patterns
      expect(anonymized.data.alertType).toBe('mood_synchronization');
      expect(anonymized.data.confidence).toBe(0.85);
      expect(anonymized.data.patterns).toBeDefined();
    });

    it('should generalize timestamps to patterns', async () => {
      const rawTwintuitionData = {
        type: 'simultaneous_action',
        confidence: 0.9,
        detectedAt: '2024-01-15T14:30:00Z',
      };

      const anonymized = await researchDataService.anonymizeData(
        'user123',
        'study456',
        'twintuition',
        rawTwintuitionData
      );

      // Should have time patterns, not exact timestamps
      expect(anonymized.data.patterns.timeOfDay).toBeDefined();
      expect(anonymized.data.patterns.dayOfWeek).toBeDefined();

      // Timestamp should be preserved but only for day-level analysis
      expect(anonymized.data.timestamp).toBe('2024-01-15T14:30:00Z');
    });
  });

  describe('anonymizeData - Twincidence Data', () => {
    it('should strip descriptions, media, and locations', async () => {
      const rawTwincidenceData = {
        id: 'twin123',
        userId: 'user123',
        category: 'twintuition_sync',
        detectionType: 'automatic',
        title: 'Same dream',
        description: 'We both had the exact same dream last night!',
        media: {
          photos: ['photo1.jpg', 'photo2.jpg'],
          videos: ['video1.mp4'],
        },
        location: {
          latitude: 37.7749,
          longitude: -122.4194,
          city: 'San Francisco',
        },
        timestamp: '2024-01-15T08:00:00Z',
        metadata: {
          confidenceScore: 0.88,
          twinConfirmed: true,
        },
      };

      const anonymized = await researchDataService.anonymizeData(
        'user123',
        'study456',
        'twincidence',
        rawTwincidenceData
      );

      // Should remove ALL identifying details
      expect(anonymized.data).not.toHaveProperty('userId');
      expect(anonymized.data).not.toHaveProperty('title');
      expect(anonymized.data).not.toHaveProperty('description');
      expect(anonymized.data).not.toHaveProperty('media');
      expect(anonymized.data).not.toHaveProperty('location');

      // Should keep only categorical data
      expect(anonymized.data.category).toBe('twintuition_sync');
      expect(anonymized.data.detectionType).toBe('automatic');
      expect(anonymized.data.confidenceScore).toBe(0.88);
      expect(anonymized.data.hasTwinConfirmation).toBe(true);
    });
  });

  describe('anonymizeData - Assessment Data', () => {
    it('should keep only aggregate scores, no specific answers', async () => {
      const rawAssessmentData = {
        id: 'assessment123',
        userId: 'user123',
        type: 'personality',
        completedAt: '2024-01-15T16:00:00Z',
        answers: [
          { questionId: 1, answer: 'A' },
          { questionId: 2, answer: 'C' },
        ], // Should be stripped
        personalityType: 'INTJ', // Should be stripped
        totalScore: 78,
        subscaleScores: [
          { category: 'extraversion', score: 45 },
          { category: 'openness', score: 82 },
        ],
      };

      const anonymized = await researchDataService.anonymizeData(
        'user123',
        'study456',
        'assessment',
        rawAssessmentData
      );

      // Should NOT include specific answers or personality details
      expect(anonymized.data).not.toHaveProperty('answers');
      expect(anonymized.data).not.toHaveProperty('personalityType');
      expect(anonymized.data).not.toHaveProperty('userId');

      // Should keep only aggregate scores
      expect(anonymized.data.scores.overallScore).toBe(78);
      expect(anonymized.data.scores.subscaleScores).toBeDefined();
      expect(anonymized.data.scores.subscaleScores.length).toBe(2);
    });
  });

  describe('anonymizeData - Communication Data', () => {
    it('should ABSOLUTELY NEVER include message content', async () => {
      const rawCommunicationData = {
        userId: 'user123',
        messages: [
          { content: 'Secret message', timestamp: '2024-01-15T10:00:00Z' },
          { content: 'Private chat', timestamp: '2024-01-15T10:05:00Z' },
        ], // Should be completely stripped
        messageCount: 150,
        averageResponseTime: 300000, // 5 minutes
        peakHours: [14, 15, 16],
        frequency: 'high',
      };

      const anonymized = await researchDataService.anonymizeData(
        'user123',
        'study456',
        'communication',
        rawCommunicationData
      );

      // CRITICAL: Should NEVER include messages
      expect(anonymized.data).not.toHaveProperty('messages');
      expect(anonymized.data).not.toHaveProperty('userId');

      // Should only include timing and frequency
      expect(anonymized.data.messageCount).toBe(150);
      expect(anonymized.data.patterns.averageResponseTime).toBe(300000);
      expect(anonymized.data.patterns.peakActivityHours).toEqual([14, 15, 16]);
    });
  });

  describe('queueDataSubmission', () => {
    it('should queue data for offline submission', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await researchDataService.queueDataSubmission(
        'user123',
        'study456',
        'game',
        { gameType: 'maze' }
      );

      expect(AsyncStorage.setItem).toHaveBeenCalled();
      const savedData = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
      expect(savedData).toHaveLength(1);
      expect(savedData[0].status).toBe('pending');
    });
  });

  describe('calculateContributionScore', () => {
    it('should calculate score based on submissions', async () => {
      const submissions = [
        { dataType: 'game', submittedAt: '2024-01-15T10:00:00Z' } as any,
        { dataType: 'game', submittedAt: '2024-01-16T10:00:00Z' } as any,
        { dataType: 'twintuition', submittedAt: '2024-01-17T10:00:00Z' } as any,
      ];

      // Access private method via reflection for testing
      const score = (researchDataService as any).calculateContributionScore(submissions);

      expect(score).toBeGreaterThan(0);
      // 3 submissions * 10 = 30
      // 2 unique types * 20 = 40
      // Recent submissions bonus
      expect(score).toBeGreaterThanOrEqual(70);
    });

    it('should cap score at 1000', async () => {
      const manySubmissions = Array(200).fill({
        dataType: 'game',
        submittedAt: new Date().toISOString(),
      });

      const score = (researchDataService as any).calculateContributionScore(manySubmissions);

      expect(score).toBeLessThanOrEqual(1000);
    });
  });

  describe('Privacy Validation', () => {
    it('should ensure no PII fields in ANY anonymized data', async () => {
      const piiFields = [
        'userId',
        'userEmail',
        'userName',
        'userPhone',
        'profilePhoto',
        'address',
        'ssn',
        'birthDate',
      ];

      const testData = {
        userId: 'user123',
        userEmail: 'test@example.com',
        userName: 'Test User',
        gameType: 'maze',
      };

      const anonymized = await researchDataService.anonymizeData(
        'user123',
        'study456',
        'game',
        testData
      );

      // Check that NO PII fields exist in anonymized data
      piiFields.forEach(field => {
        expect(anonymized.data).not.toHaveProperty(field);
      });
    });

    it('should include metadata about anonymization', async () => {
      const anonymized = await researchDataService.anonymizeData(
        'user123',
        'study456',
        'game',
        { gameType: 'maze' }
      );

      expect(anonymized.metadata).toBeDefined();
      expect(anonymized.metadata.version).toBe('1.0.0');
      expect(anonymized.metadata.hashAlgorithm).toBe('SHA-256');
      expect(anonymized.metadata.k_anonymity).toBeGreaterThanOrEqual(5);
    });
  });
});

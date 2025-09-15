import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTwinStore } from '../state/twinStore';
import { 
  ResearchStudy, 
  ConsentRecord, 
  ResearchParticipation, 
  DataContribution,
  ResearchInsight,
  AggregatedFindings,
  ParticipantDashboard,
  ResearchDataType,
  WithdrawalRequest
} from '../types/research';
import { AssessmentResults } from '../types/assessment';

class ResearchService {
  private readonly STORAGE_KEYS = {
    CONSENT_RECORDS: '@research_consent_records',
    PARTICIPATION: '@research_participation',
    CONTRIBUTIONS: '@research_contributions',
    INSIGHTS: '@research_insights',
    PREFERENCES: '@research_preferences'
  };

  // Mock data for demonstration - in production, this would come from API
  private mockStudies: ResearchStudy[] = [
    {
      id: 'twin-sync-2024',
      title: 'Twin Synchronicity & Intuition Study',
      description: 'Investigating intuitive connections and synchronicity between twins',
      fullDescription: 'This comprehensive study explores the phenomenon of twin telepathy, synchronicity, and intuitive connections. We analyze communication patterns, simultaneous experiences, and predictive behaviors between twin pairs. Participation is completely voluntary and does not affect your app experience.',
      duration: '12 months',
      compensation: ['Acknowledgment in scientific publications', 'Research newsletter updates', 'Study results when published'],
      participants: 1247,
      status: 'recruiting',
      category: 'synchronicity',
      requirements: ['Both twins must participate', 'Regular app usage', 'Complete assessments'],
      ethicsApproval: 'IRB-2024-TWIN-001',
      leadResearcher: 'Dr. Sarah Chen, PhD',
      institution: 'Stanford Twin Research Institute',
      consentVersion: 2,
      dataTypes: [
        {
          type: 'games',
          description: 'Twin game results and response patterns',
          anonymizationLevel: 'full',
          retentionPeriod: '7 years',
          sharingScope: 'academic'
        },
        {
          type: 'communication',
          description: 'Chat timing and synchronicity patterns (content excluded)',
          anonymizationLevel: 'full',
          retentionPeriod: '5 years',
          sharingScope: 'academic'
        }
      ],
      benefits: ['Contributing to scientific understanding of twin bonds', 'Helping future twins understand their connections', 'Supporting psychological research'],
      voluntaryDisclaimer: 'Participation is completely voluntary and will not affect your access to any app features. You may withdraw at any time without penalty.'
    },
    {
      id: 'emotional-mirror-2024',
      title: 'Emotional Mirroring & Empathy Study',
      description: 'Understanding emotional connections and empathic responses between twins',
      fullDescription: 'This study examines how twins experience and share emotions across distances, investigating the neurological and psychological basis of twin empathy.',
      duration: '6 months',
      compensation: ['Research participation certificate', 'Study results when published', 'Research newsletter updates'],
      participants: 892,
      status: 'active',
      category: 'psychology',
      requirements: ['Complete personality assessments', 'Regular mood tracking', 'Geographic separation data'],
      ethicsApproval: 'IRB-2024-TWIN-002',
      leadResearcher: 'Dr. Michael Rodriguez, PhD',
      institution: 'UC Berkeley Psychology Department',
      consentVersion: 1,
      dataTypes: [
        {
          type: 'assessment',
          description: 'Personality and emotional assessment results',
          anonymizationLevel: 'pseudonymized',
          retentionPeriod: '10 years',
          sharingScope: 'academic'
        },
        {
          type: 'behavioral',
          description: 'App usage patterns and emotional triggers',
          anonymizationLevel: 'full',
          retentionPeriod: '5 years',
          sharingScope: 'internal'
        }
      ],
      benefits: ['Contributing to empathy research', 'Supporting twin psychology studies', 'Helping advance scientific knowledge'],
      voluntaryDisclaimer: 'This is a voluntary research study. Your app experience remains the same whether you participate or not.'
    }
  ];

  async getAvailableStudies(): Promise<ResearchStudy[]> {
    // In production, this would fetch from API
    return this.mockStudies.filter(study => study.status === 'recruiting' || study.status === 'active');
  }

  async getStudyDetails(studyId: string): Promise<ResearchStudy | null> {
    return this.mockStudies.find(study => study.id === studyId) || null;
  }

  async recordConsent(
    userId: string, 
    studyId: string, 
    consentItems: ConsentRecord['consentedTo'],
    ipAddress?: string
  ): Promise<ConsentRecord> {
    const study = await this.getStudyDetails(studyId);
    if (!study) {
      throw new Error('Study not found');
    }

    const consentRecord: ConsentRecord = {
      id: `consent_${userId}_${studyId}_${Date.now()}`,
      userId,
      studyId,
      consentVersion: study.consentVersion,
      consentedAt: new Date().toISOString(),
      consentedTo: consentItems,
      ipAddress,
      location: 'user_location' // In production, get from geolocation with permission
    };

    // Store consent record
    const existingRecords = await this.getConsentRecords(userId);
    const updatedRecords = [...existingRecords, consentRecord];
    await AsyncStorage.setItem(
      `${this.STORAGE_KEYS.CONSENT_RECORDS}_${userId}`,
      JSON.stringify(updatedRecords)
    );

    return consentRecord;
  }

  async getConsentRecords(userId: string): Promise<ConsentRecord[]> {
    try {
      const data = await AsyncStorage.getItem(`${this.STORAGE_KEYS.CONSENT_RECORDS}_${userId}`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting consent records:', error);
      return [];
    }
  }

  async joinStudy(userId: string, studyId: string): Promise<void> {
    const participation = await this.getParticipation(userId);
    
    if (!participation.activeStudies.includes(studyId)) {
      participation.activeStudies.push(studyId);
      participation.totalStudies = Math.max(participation.totalStudies, participation.activeStudies.length);
      
      await this.updateParticipation(userId, participation);
    }
  }

  async withdrawFromStudy(
    userId: string, 
    studyId: string, 
    reason: string, 
    dataDisposition: WithdrawalRequest['dataDisposition']
  ): Promise<WithdrawalRequest> {
    const withdrawal: WithdrawalRequest = {
      id: `withdrawal_${userId}_${studyId}_${Date.now()}`,
      studyId,
      requestedAt: new Date().toISOString(),
      reason,
      dataDisposition,
      status: 'pending'
    };

    // Remove from active studies
    const participation = await this.getParticipation(userId);
    participation.activeStudies = participation.activeStudies.filter(id => id !== studyId);
    participation.withdrawalRequests.push(withdrawal);
    
    await this.updateParticipation(userId, participation);

    return withdrawal;
  }

  async getParticipation(userId: string): Promise<ResearchParticipation> {
    try {
      const data = await AsyncStorage.getItem(`${this.STORAGE_KEYS.PARTICIPATION}_${userId}`);
      
      if (data) {
        return JSON.parse(data);
      }
      
      // Return default participation
      return {
        userId,
        activeStudies: [],
        totalStudies: 0,
        joinedAt: new Date().toISOString(),
        dataContributions: [],
        insights: [],
        preferences: {
          dataSharing: {
            fullAnonymization: true,
            academicSharing: true,
            publicResults: false,
            commercialUse: false
          },
          communication: {
            updates: true,
            insights: true,
            publications: false,
            surveys: true
          },
          participation: {
            maxStudies: 3,
            preferredCategories: [],
            timeCommitment: 'moderate'
          }
        },
        withdrawalRequests: []
      };
    } catch (error) {
      console.error('Error getting participation:', error);
      throw error;
    }
  }

  async updateParticipation(userId: string, participation: ResearchParticipation): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${this.STORAGE_KEYS.PARTICIPATION}_${userId}`,
        JSON.stringify(participation)
      );
    } catch (error) {
      console.error('Error updating participation:', error);
      throw error;
    }
  }

  async contributeAssessmentData(
    userId: string, 
    assessmentResults: AssessmentResults
  ): Promise<void> {
    const participation = await this.getParticipation(userId);
    
    // Create contributions for each active study that accepts assessment data
    for (const studyId of participation.activeStudies) {
      const study = await this.getStudyDetails(studyId);
      if (study?.dataTypes.some(dt => dt.type === 'assessment')) {
        const contribution: DataContribution = {
          id: `contrib_${userId}_${studyId}_${Date.now()}`,
          studyId,
          dataType: 'assessment',
          contributedAt: new Date().toISOString(),
          dataPoints: assessmentResults.subscaleScores.length,
          anonymizedId: this.generateAnonymizedId(userId, studyId),
          status: 'pending'
        };
        
        participation.dataContributions.push(contribution);
      }
    }
    
    await this.updateParticipation(userId, participation);
  }

  async contributeBehavioralData(
    userId: string, 
    behaviorType: string, 
    dataPoints: number
  ): Promise<void> {
    const participation = await this.getParticipation(userId);
    
    for (const studyId of participation.activeStudies) {
      const study = await this.getStudyDetails(studyId);
      if (study?.dataTypes.some(dt => dt.type === 'behavioral')) {
        const contribution: DataContribution = {
          id: `contrib_${userId}_${studyId}_${Date.now()}`,
          studyId,
          dataType: 'behavioral',
          contributedAt: new Date().toISOString(),
          dataPoints,
          anonymizedId: this.generateAnonymizedId(userId, studyId),
          status: 'pending'
        };
        
        participation.dataContributions.push(contribution);
      }
    }
    
    await this.updateParticipation(userId, participation);
  }

  async getParticipantDashboard(userId: string): Promise<ParticipantDashboard> {
    const participation = await this.getParticipation(userId);
    const activeStudies = await Promise.all(
      participation.activeStudies.map(id => this.getStudyDetails(id))
    );
    
    const totalContributions = participation.dataContributions.length;
    const publicationsEnabled = Math.floor(totalContributions / 100); // Mock calculation
    
    return {
      totalContributions,
      activeStudies: activeStudies.filter(Boolean) as ResearchStudy[],
      recentInsights: participation.insights.slice(0, 5),
      impactMetrics: {
        dataPointsContributed: participation.dataContributions.reduce(
          (sum, contrib) => sum + contrib.dataPoints, 
          0
        ),
        studiesSupported: participation.totalStudies,
        publicationsEnabled,
        scientificImpact: Math.min(publicationsEnabled * 10, 100)
      },
      upcomingMilestones: [
        `Contribute to ${Math.ceil(totalContributions / 10) * 10} data points`,
        'Complete 6-month participation milestone',
        'Unlock advanced insights dashboard'
      ],
      recognitions: publicationsEnabled > 0 ? [
        'Research Contributor Badge',
        'Twin Science Supporter',
        ...(publicationsEnabled > 2 ? ['Veteran Researcher'] : [])
      ] : []
    };
  }

  async getResearchInsights(userId: string): Promise<ResearchInsight[]> {
    const participation = await this.getParticipation(userId);
    
    // Mock insights - in production, these would come from actual research results
    const mockInsights: ResearchInsight[] = [
      {
        id: 'insight_1',
        studyId: 'twin-sync-2024',
        title: 'Twin Synchronicity Patterns Identified',
        summary: 'Research reveals strong correlations between twin pairs in simultaneous experiences',
        findings: [
          'Identical twins show 73% synchronicity in emotional states',
          'Geographic distance has minimal impact on twin connection strength',
          'Synchronicity events peak during significant life changes'
        ],
        relevantToUser: participation.activeStudies.includes('twin-sync-2024'),
        publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        significance: 'significant'
      }
    ];
    
    return mockInsights.filter(insight => 
      participation.activeStudies.includes(insight.studyId)
    );
  }

  private generateAnonymizedId(userId: string, studyId: string): string {
    // In production, use proper cryptographic hashing
    const hash = btoa(`${userId}_${studyId}_${Date.now()}`);
    return hash.replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  }

  async deleteAllUserData(userId: string): Promise<void> {
    const keys = [
      `${this.STORAGE_KEYS.CONSENT_RECORDS}_${userId}`,
      `${this.STORAGE_KEYS.PARTICIPATION}_${userId}`,
      `${this.STORAGE_KEYS.CONTRIBUTIONS}_${userId}`,
      `${this.STORAGE_KEYS.INSIGHTS}_${userId}`,
      `${this.STORAGE_KEYS.PREFERENCES}_${userId}`
    ];
    
    await Promise.all(keys.map(key => AsyncStorage.removeItem(key)));
  }

  async exportUserData(userId: string): Promise<object> {
    const [consent, participation] = await Promise.all([
      this.getConsentRecords(userId),
      this.getParticipation(userId)
    ]);
    
    return {
      userId,
      exportedAt: new Date().toISOString(),
      consentRecords: consent,
      participation,
      dataRights: {
        canWithdraw: true,
        canExport: true,
        canDelete: true,
        canModify: true
      }
    };
  }
}

export const researchService = new ResearchService();
export interface ResearchStudy {
  id: string;
  title: string;
  description: string;
  fullDescription: string;
  duration: string;
  compensation: string[];
  participants: number;
  status: 'recruiting' | 'active' | 'completed';
  category: 'synchronicity' | 'psychology' | 'genetics' | 'behavior' | 'communication';
  requirements: string[];
  ethicsApproval: string;
  leadResearcher: string;
  institution: string;
  consentVersion: number;
  dataTypes: ResearchDataType[];
  benefits: string[];
  voluntaryDisclaimer?: string;
}

export interface ResearchDataType {
  type: 'assessment' | 'behavioral' | 'communication' | 'games' | 'biometric';
  description: string;
  anonymizationLevel: 'full' | 'pseudonymized' | 'aggregated';
  retentionPeriod: string;
  sharingScope: 'internal' | 'academic' | 'public';
}

export interface ConsentRecord {
  id: string;
  userId: string;
  studyId: string;
  consentVersion: number;
  consentedAt: string;
  consentedTo: ConsentItem[];
  ipAddress?: string;
  location?: string;
  withdrawnAt?: string;
  withdrawalReason?: string;
}

export interface ConsentItem {
  id: string;
  title: string;
  description: string;
  required: boolean;
  consented: boolean;
  dataTypes: string[];
}

export interface ResearchParticipation {
  userId: string;
  activeStudies: string[];
  totalStudies: number;
  joinedAt: string;
  dataContributions: DataContribution[];
  insights: ResearchInsight[];
  preferences: ResearchPreferences;
  withdrawalRequests: WithdrawalRequest[];
}

export interface DataContribution {
  id: string;
  studyId: string;
  dataType: ResearchDataType['type'];
  contributedAt: string;
  dataPoints: number;
  anonymizedId: string;
  status: 'pending' | 'processed' | 'included' | 'excluded';
}

export interface ResearchInsight {
  id: string;
  studyId: string;
  title: string;
  summary: string;
  findings: string[];
  relevantToUser: boolean;
  publishedAt: string;
  publicationLink?: string;
  significance: 'preliminary' | 'significant' | 'breakthrough';
}

export interface ResearchPreferences {
  dataSharing: {
    fullAnonymization: boolean;
    academicSharing: boolean;
    publicResults: boolean;
    commercialUse: boolean;
  };
  communication: {
    updates: boolean;
    insights: boolean;
    publications: boolean;
    surveys: boolean;
  };
  participation: {
    maxStudies: number;
    preferredCategories: ResearchStudy['category'][];
    timeCommitment: 'minimal' | 'moderate' | 'extensive';
  };
}

export interface WithdrawalRequest {
  id: string;
  studyId: string;
  requestedAt: string;
  reason: string;
  dataDisposition: 'delete' | 'anonymize' | 'retain_aggregated';
  status: 'pending' | 'processing' | 'completed';
  completedAt?: string;
}

export interface ResearchEthics {
  irbApproval: string;
  consentVersion: number;
  dataProtectionCompliance: string[];
  participantRights: string[];
  contactInformation: {
    principalInvestigator: string;
    ethicsBoard: string;
    support: string;
  };
}

export interface AggregatedFindings {
  studyId: string;
  totalParticipants: number;
  keyFindings: string[];
  statisticalSignificance: number;
  confidenceIntervals: Record<string, [number, number]>;
  limitations: string[];
  nextSteps: string[];
  publicationStatus: 'draft' | 'submitted' | 'published';
}

export interface ParticipantDashboard {
  totalContributions: number;
  activeStudies: ResearchStudy[];
  recentInsights: ResearchInsight[];
  impactMetrics: {
    dataPointsContributed: number;
    studiesSupported: number;
    publicationsEnabled: number;
    scientificImpact: number;
  };
  upcomingMilestones: string[];
  recognitions: string[];
}
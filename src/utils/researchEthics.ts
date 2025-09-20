import { ResearchStudy, ConsentRecord, ResearchEthics } from '../types/research';

/**
 * Utility functions for research ethics compliance
 */

export const researchEthicsGuidelines: ResearchEthics = {
  irbApproval: 'IRB-2024-TWIN-MAIN',
  consentVersion: 2,
  dataProtectionCompliance: [
    'GDPR Article 6(1)(a) - Consent',
    'GDPR Article 9(2)(a) - Explicit consent for special categories',
    'HIPAA Privacy Rule (if applicable)',
    'Research Ethics Board Guidelines'
  ],
  participantRights: [
    'Right to withdraw from research at any time',
    'Right to access your contributed data',
    'Right to request data deletion',
    'Right to understand how your data is used',
    'Right to receive research findings',
    'Right to contact researchers with questions'
  ],
  contactInformation: {
    principalInvestigator: 'research@twinshipvibe.com',
    ethicsBoard: 'ethics@twinshipvibe.com',
    support: 'support@twinshipvibe.com'
  }
};

/**
 * Validates that a consent record meets ethical standards
 */
export const validateConsentRecord = (consent: ConsentRecord): boolean => {
  // Check required consents
  const requiredConsents = consent.consentedTo.filter(c => c.required);
  const allRequiredConsented = requiredConsents.every(c => c.consented);
  
  // Check consent is recent (not older than 1 year)
  const consentAge = Date.now() - new Date(consent.consentedAt).getTime();
  const oneYear = 365 * 24 * 60 * 60 * 1000;
  const consentIsFresh = consentAge < oneYear;
  
  // Check not withdrawn
  const notWithdrawn = !consent.withdrawnAt;
  
  return allRequiredConsented && consentIsFresh && notWithdrawn;
};

/**
 * Checks if a study meets ethical standards for recruitment
 */
export const validateStudyEthics = (study: ResearchStudy): boolean => {
  const hasEthicsApproval = study.ethicsApproval && study.ethicsApproval.length > 0;
  const hasInstitution = study.institution && study.institution.length > 0;
  const hasLeadResearcher = study.leadResearcher && study.leadResearcher.length > 0;
  const hasDataTypes = study.dataTypes && study.dataTypes.length > 0;
  const hasValidRetention = study.dataTypes.every(dt => dt.retentionPeriod && dt.retentionPeriod.length > 0);

  return hasEthicsApproval && hasInstitution && hasLeadResearcher && hasDataTypes && Boolean(hasValidRetention);
};

/**
 * Generates anonymized participant ID for research
 */
export const generateAnonymizedParticipantId = (userId: string, studyId: string): string => {
  // In production, use proper cryptographic hashing
  const combined = `${userId}_${studyId}_${Date.now()}`;
  const hash = btoa(combined).replace(/[^a-zA-Z0-9]/g, '');
  return `TWIN_${hash.substring(0, 12)}`;
};

/**
 * Checks if data can be shared according to participant preferences
 */
export const canShareData = (
  consentRecord: ConsentRecord,
  sharingScope: 'internal' | 'academic' | 'public'
): boolean => {
  const dataSharing = consentRecord.consentedTo.find(c => c.id === 'data_sharing');
  if (!dataSharing || !dataSharing.consented) return false;
  
  switch (sharingScope) {
    case 'internal':
      return true; // Always allowed if basic consent given
    case 'academic':
      return dataSharing.consented;
    case 'public':
      const publicConsent = consentRecord.consentedTo.find(c => c.id === 'public_sharing');
      return publicConsent?.consented || false;
    default:
      return false;
  }
};

/**
 * Creates a data retention schedule based on study requirements
 */
export const createRetentionSchedule = (study: ResearchStudy) => {
  const schedules = study.dataTypes.map(dataType => ({
    dataType: dataType.type,
    description: dataType.description,
    retentionPeriod: dataType.retentionPeriod,
    anonymizationLevel: dataType.anonymizationLevel,
    deletionDate: calculateDeletionDate(dataType.retentionPeriod),
    sharingScope: dataType.sharingScope
  }));
  
  return {
    studyId: study.id,
    studyTitle: study.title,
    schedules,
    ethicsApproval: study.ethicsApproval,
    contactInfo: researchEthicsGuidelines.contactInformation
  };
};

/**
 * Calculates when data should be deleted based on retention period
 */
const calculateDeletionDate = (retentionPeriod: string): Date => {
  const now = new Date();
  const match = retentionPeriod.match(/(\d+)\s*(year|month|day)s?/i);
  
  if (!match) return new Date(now.getTime() + 5 * 365 * 24 * 60 * 60 * 1000); // Default 5 years
  
  const amount = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  
  switch (unit) {
    case 'year':
      return new Date(now.getFullYear() + amount, now.getMonth(), now.getDate());
    case 'month':
      return new Date(now.getFullYear(), now.getMonth() + amount, now.getDate());
    case 'day':
      return new Date(now.getTime() + amount * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() + 5 * 365 * 24 * 60 * 60 * 1000);
  }
};

/**
 * Validates that data contribution follows ethical guidelines
 */
export const validateDataContribution = (
  userId: string,
  studyId: string,
  dataType: string,
  consentRecords: ConsentRecord[]
): { allowed: boolean; reason?: string } => {
  // Find valid consent for this study
  const validConsent = consentRecords.find(consent => 
    consent.studyId === studyId && 
    consent.userId === userId && 
    validateConsentRecord(consent)
  );
  
  if (!validConsent) {
    return { 
      allowed: false, 
      reason: 'No valid consent found for this study' 
    };
  }
  
  // Check if specific data type is consented to
  const dataTypeConsent = validConsent.consentedTo.find(c => 
    c.dataTypes.includes(dataType) || c.dataTypes.includes('all')
  );
  
  if (!dataTypeConsent || !dataTypeConsent.consented) {
    return { 
      allowed: false, 
      reason: `No consent found for data type: ${dataType}` 
    };
  }
  
  return { allowed: true };
};

/**
 * Formats research findings for participant consumption
 */
export const formatResearchInsight = (
  finding: string,
  participantLevel: 'basic' | 'detailed' | 'academic'
): string => {
  switch (participantLevel) {
    case 'basic':
      return finding.replace(/statistical|p-value|correlation|regression/gi, 'connection');
    case 'detailed':
      return finding;
    case 'academic':
      return finding; // Include all statistical details
    default:
      return finding;
  }
};
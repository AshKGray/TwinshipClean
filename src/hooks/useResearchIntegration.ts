import { useEffect } from 'react';
import { useTwinStore } from '../state/twinStore';
import { useResearchStore } from '../state/researchStore';
import { researchService } from '../services/researchService';
import { AssessmentResults } from '../types/assessment';
import { TwinGameResult } from '../state/twinStore';

/**
 * Hook to automatically contribute data to research studies
 * when users participate in assessments or activities
 */
export const useResearchIntegration = () => {
  const { userProfile, gameResults, incrementResearchContributions } = useTwinStore();
  const { participation, contributeData } = useResearchStore();

  /**
   * Contribute assessment data to research studies
   */
  const contributeAssessmentData = async (assessmentResults: AssessmentResults) => {
    if (!userProfile || !participation?.activeStudies.length) return;

    try {
      await researchService.contributeAssessmentData(userProfile.id, assessmentResults);
      incrementResearchContributions();
      
      // Update the research store
      if (contributeData) {
        await contributeData(userProfile.id, 'assessment', assessmentResults.subscaleScores.length);
      }
    } catch (error) {
      console.error('Failed to contribute assessment data to research:', error);
    }
  };

  /**
   * Contribute twin game data to research studies
   */
  const contributeTwinGameData = async (gameResult: TwinGameResult) => {
    if (!userProfile || !participation?.activeStudies.length) return;

    try {
      await researchService.contributeBehavioralData(
        userProfile.id, 
        `twin_game_${gameResult.gameType}`, 
        1
      );
      incrementResearchContributions();
      
      // Update the research store
      if (contributeData) {
        await contributeData(userProfile.id, 'games', 1);
      }
    } catch (error) {
      console.error('Failed to contribute twin game data to research:', error);
    }
  };

  /**
   * Contribute communication patterns to research studies
   */
  const contributeCommunicationData = async (messageCount: number) => {
    if (!userProfile || !participation?.activeStudies.length) return;

    try {
      await researchService.contributeBehavioralData(
        userProfile.id, 
        'communication_patterns', 
        messageCount
      );
      incrementResearchContributions();
      
      // Update the research store
      if (contributeData) {
        await contributeData(userProfile.id, 'communication', messageCount);
      }
    } catch (error) {
      console.error('Failed to contribute communication data to research:', error);
    }
  };

  /**
   * Contribute twintuition alert data to research studies
   */
  const contributeTwintuitionData = async (alertType: string) => {
    if (!userProfile || !participation?.activeStudies.length) return;

    try {
      await researchService.contributeBehavioralData(
        userProfile.id, 
        `twintuition_${alertType}`, 
        1
      );
      incrementResearchContributions();
      
      // Update the research store
      if (contributeData) {
        await contributeData(userProfile.id, 'behavioral', 1);
      }
    } catch (error) {
      console.error('Failed to contribute twintuition data to research:', error);
    }
  };

  // Auto-contribute latest game results
  useEffect(() => {
    if (gameResults.length > 0 && participation?.activeStudies.length) {
      const latestGame = gameResults[0];
      // Check if this game result was already contributed
      const gameTimestamp = new Date(latestGame.timestamp).getTime();
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      
      if (gameTimestamp > fiveMinutesAgo) {
        contributeTwinGameData(latestGame);
      }
    }
  }, [gameResults, participation]);

  return {
    contributeAssessmentData,
    contributeTwinGameData,
    contributeCommunicationData,
    contributeTwintuitionData,
    isParticipatingInResearch: participation?.activeStudies.length > 0
  };
};
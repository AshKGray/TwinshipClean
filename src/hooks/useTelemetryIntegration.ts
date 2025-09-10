/**
 * Telemetry Integration Hook
 * Seamlessly integrates telemetry collection with assessment flow
 */

import { useEffect, useRef, useCallback } from 'react';
import { useTelemetryStore } from '../state/telemetryStore';
import { telemetryService } from '../services/telemetryService';
import { anomalyDetector } from '../utils/anomalyDetection';
import { statisticalNorming } from '../utils/statisticalNorming';
import { AssessmentCategory, LikertScale } from '../types/assessment';
import { AnomalyType } from '../types/telemetry';

interface AssessmentContext {
  sessionId: string;
  userId: string;
  assessmentVersion: string;
  totalQuestions: number;
}

interface QuestionContext {
  questionId: string;
  questionCategory: AssessmentCategory;
  questionIndex: number;
  sectionId: string;
}

export const useTelemetryIntegration = (context?: AssessmentContext) => {
  const {
    config,
    userConsent,
    currentSession,
    addAlert,
    incrementEventQueue,
    decrementEventQueue,
    updatePerformanceMetrics,
  } = useTelemetryStore();

  const questionStartTime = useRef<number>(0);
  const sectionStartTime = useRef<number>(0);
  const assessmentStartTime = useRef<number>(0);
  const responseHistory = useRef<Array<{
    questionId: string;
    category: AssessmentCategory;
    response: LikertScale | string | number;
    responseTime: number;
    revisions: number;
  }>>([]);

  // Initialize telemetry service
  useEffect(() => {
    if (userConsent && config.enabled) {
      telemetryService.initialize(true, config);
    }
  }, [userConsent, config.enabled]);

  // Track assessment start
  const trackAssessmentStart = useCallback(async () => {
    if (!isEnabled() || !context) return;

    assessmentStartTime.current = Date.now();
    
    try {
      await telemetryService.trackAssessmentEvent('assessment_started', {
        assessmentVersion: context.assessmentVersion,
        totalQuestions: context.totalQuestions,
        completedQuestions: 0,
        totalTimeSpent: 0,
        totalRevisions: 0,
      });

      // Track performance metric
      await telemetryService.trackPerformance('assessment_start_time', Date.now());
    } catch (error) {
      console.error('Failed to track assessment start:', error);
    }
  }, [context, config.enabled, userConsent]);

  // Track question view
  const trackQuestionView = useCallback(async (questionContext: QuestionContext) => {
    if (!isEnabled()) return;

    questionStartTime.current = Date.now();
    
    try {
      await telemetryService.trackQuestionEvent('question_viewed', {
        questionId: questionContext.questionId,
        questionCategory: questionContext.questionCategory,
        questionIndex: questionContext.questionIndex,
        sectionId: questionContext.sectionId,
        timeOnQuestion: 0,
        revisionCount: 0,
      });

      incrementEventQueue();
    } catch (error) {
      console.error('Failed to track question view:', error);
    }
  }, [config.enabled, userConsent]);

  // Track question response
  const trackQuestionResponse = useCallback(async (
    questionContext: QuestionContext,
    response: LikertScale | string | number,
    revisionCount: number = 0,
    confidenceLevel?: number
  ) => {
    if (!isEnabled()) return;

    const responseTime = Date.now() - questionStartTime.current;
    
    try {
      await telemetryService.trackQuestionEvent('question_answered', {
        questionId: questionContext.questionId,
        questionCategory: questionContext.questionCategory,
        questionIndex: questionContext.questionIndex,
        sectionId: questionContext.sectionId,
        timeOnQuestion: responseTime,
        responseValue: response,
        revisionCount,
        confidenceLevel,
      });

      // Store response for pattern analysis
      responseHistory.current.push({
        questionId: questionContext.questionId,
        category: questionContext.questionCategory,
        response,
        responseTime,
        revisions: revisionCount,
      });

      // Perform real-time anomaly detection
      await performAnomalyCheck(questionContext, response, responseTime, revisionCount);

      incrementEventQueue();
    } catch (error) {
      console.error('Failed to track question response:', error);
    }
  }, [config.enabled, userConsent]);

  // Track question revision
  const trackQuestionRevision = useCallback(async (
    questionContext: QuestionContext,
    newResponse: LikertScale | string | number,
    revisionCount: number
  ) => {
    if (!isEnabled()) return;

    const responseTime = Date.now() - questionStartTime.current;
    
    try {
      await telemetryService.trackQuestionEvent('question_revised', {
        questionId: questionContext.questionId,
        questionCategory: questionContext.questionCategory,
        questionIndex: questionContext.questionIndex,
        sectionId: questionContext.sectionId,
        timeOnQuestion: responseTime,
        responseValue: newResponse,
        revisionCount,
      });

      // Check for excessive revisions
      if (revisionCount > 5) {
        await telemetryService.trackAnomaly('excessive_revisions', {
          severity: revisionCount > 10 ? 'high' : 'medium',
          detectionAlgorithm: 'revision_counter',
          contextData: {
            questionId: questionContext.questionId,
            revisionCount,
            responseTime,
          },
          actionTaken: 'flagged',
        });
      }

      incrementEventQueue();
    } catch (error) {
      console.error('Failed to track question revision:', error);
    }
  }, [config.enabled, userConsent]);

  // Track section completion
  const trackSectionCompletion = useCallback(async (
    sectionId: string,
    sectionCategory: AssessmentCategory,
    questionsInSection: number,
    completionRate: number,
    averageConfidence?: number
  ) => {
    if (!isEnabled()) return;

    const sectionTime = Date.now() - sectionStartTime.current;
    const sectionResponses = responseHistory.current.filter(r => 
      r.questionId.includes(sectionId) // Simplified section matching
    );
    const totalRevisions = sectionResponses.reduce((sum, r) => sum + r.revisions, 0);

    try {
      await telemetryService.trackSectionCompletion({
        sectionId,
        sectionCategory,
        questionsInSection,
        timeInSection: sectionTime,
        completionRate,
        averageConfidence,
        revisionsInSection: totalRevisions,
      });

      // Reset section timer
      sectionStartTime.current = Date.now();

      incrementEventQueue();
    } catch (error) {
      console.error('Failed to track section completion:', error);
    }
  }, [config.enabled, userConsent]);

  // Track assessment completion
  const trackAssessmentCompletion = useCallback(async (
    completedQuestions: number,
    abandonmentPoint?: { sectionId: string; questionIndex: number }
  ) => {
    if (!isEnabled() || !context) return;

    const totalTime = Date.now() - assessmentStartTime.current;
    const totalRevisions = responseHistory.current.reduce((sum, r) => sum + r.revisions, 0);
    const isCompleted = completedQuestions === context.totalQuestions;

    try {
      await telemetryService.trackAssessmentEvent(
        isCompleted ? 'assessment_completed' : 'assessment_abandoned',
        {
          assessmentVersion: context.assessmentVersion,
          totalQuestions: context.totalQuestions,
          completedQuestions,
          totalTimeSpent: totalTime,
          totalRevisions,
          abandonmentPoint: abandonmentPoint ? {
            ...abandonmentPoint,
            timeSpent: totalTime,
          } : undefined,
        }
      );

      // Perform final data analysis if completed
      if (isCompleted && responseHistory.current.length > 0) {
        await performFinalAnalysis();
      }

      // Update performance metrics
      updatePerformanceMetrics({
        averageResponseTime: totalTime / Math.max(1, completedQuestions),
        lastUpdated: new Date().toISOString(),
      });

      incrementEventQueue();
    } catch (error) {
      console.error('Failed to track assessment completion:', error);
    }
  }, [context, config.enabled, userConsent]);

  // Perform real-time anomaly detection
  const performAnomalyCheck = useCallback(async (
    questionContext: QuestionContext,
    response: LikertScale | string | number,
    responseTime: number,
    revisionCount: number
  ) => {
    if (!config.collectAnomalyData) return;

    try {
      // Check for individual question anomalies
      const anomalies: Array<{ type: AnomalyType; severity: string; reason: string }> = [];

      // Too fast response
      if (responseTime < 500) {
        anomalies.push({
          type: 'too_fast_completion',
          severity: responseTime < 200 ? 'high' : 'medium',
          reason: `Response time ${responseTime}ms is unusually fast`,
        });
      }

      // Too slow response (might indicate distraction or difficulty)
      if (responseTime > 120000) { // 2 minutes
        anomalies.push({
          type: 'too_slow_completion',
          severity: 'low',
          reason: `Response time ${Math.round(responseTime / 1000)}s is unusually slow`,
        });
      }

      // Check for pattern anomalies if we have enough history
      if (responseHistory.current.length >= 5) {
        const recentResponses = responseHistory.current.slice(-5);
        const responses = recentResponses.map(r => 
          typeof r.response === 'number' ? r.response : 0
        );
        
        // Simple straight-line detection
        const uniqueResponses = new Set(responses);
        if (uniqueResponses.size === 1 && responses.length >= 5) {
          anomalies.push({
            type: 'straight_line_responding',
            severity: 'high',
            reason: `Last 5 responses are identical (${responses[0]})`,
          });
        }
      }

      // Track detected anomalies
      for (const anomaly of anomalies) {
        await telemetryService.trackAnomaly(anomaly.type, {
          severity: anomaly.severity as any,
          detectionAlgorithm: 'real_time_question_check',
          contextData: {
            questionId: questionContext.questionId,
            responseTime,
            response: response.toString(),
            revisionCount,
            reason: anomaly.reason,
          },
          actionTaken: 'flagged',
        });

        // Add alert for high severity anomalies
        if (anomaly.severity === 'high') {
          addAlert({
            type: 'anomaly_spike',
            severity: 'warning',
            message: `Potential data quality issue detected: ${anomaly.reason}`,
            context: {
              questionId: questionContext.questionId,
              anomalyType: anomaly.type,
            },
          });
        }
      }
    } catch (error) {
      console.error('Failed to perform anomaly check:', error);
    }
  }, [config.collectAnomalyData]);

  // Perform comprehensive analysis at assessment completion
  const performFinalAnalysis = useCallback(async () => {
    if (!config.collectNormingData || responseHistory.current.length === 0) return;

    try {
      // Group responses by question for analysis
      const questionGroups = responseHistory.current.reduce((groups, response) => {
        if (!groups[response.questionId]) {
          groups[response.questionId] = {
            questionId: response.questionId,
            category: response.category,
            responses: [],
            responseTimes: [],
            revisions: [],
            sessionIds: [currentSession?.sessionId || 'unknown'],
          };
        }
        
        groups[response.questionId].responses.push(
          typeof response.response === 'number' ? response.response : 1
        );
        groups[response.questionId].responseTimes.push(response.responseTime);
        groups[response.questionId].revisions.push(response.revisions);
        
        return groups;
      }, {} as Record<string, any>);

      // Perform statistical analysis for each question
      for (const [questionId, data] of Object.entries(questionGroups)) {
        // Skip if insufficient data
        if (data.responses.length < 1) continue;

        // Generate norming statistics (in production, this would accumulate over many sessions)
        const normingStats = statisticalNorming.calculateNormingStatistics(data);
        
        // Perform item analysis
        const itemAnalysis = statisticalNorming.analyzeItem(data);
        
        // Update store with new statistics
        useTelemetryStore.getState().addNormingStatistics(questionId, normingStats);
        useTelemetryStore.getState().addItemAnalysis(questionId, itemAnalysis);

        // Flag problematic items
        if (itemAnalysis.flagged) {
          addAlert({
            type: 'data_concern',
            severity: itemAnalysis.recommendations.some(r => r.priority === 'critical') ? 'error' : 'warning',
            message: `Item ${questionId} flagged for quality issues`,
            context: {
              questionId,
              flagReasons: itemAnalysis.flagReasons,
              recommendations: itemAnalysis.recommendations.length,
            },
          });
        }
      }

      // Perform comprehensive pattern analysis
      const responsePattern = anomalyDetector.createResponsePattern(
        responseHistory.current.map((r, index) => ({
          type: 'question_answered' as const,
          questionId: r.questionId,
          questionCategory: r.category,
          questionIndex: index,
          sectionId: 'section_1', // Simplified
          timeOnQuestion: r.responseTime,
          responseValue: typeof r.response === 'number' ? r.response : 1,
          revisionCount: r.revisions,
          id: `event_${index}`,
          timestamp: new Date().toISOString(),
          sessionId: currentSession?.sessionId || 'unknown',
          privacyLevel: 'anonymous' as const,
        }))
      );

      const timingPattern = anomalyDetector.createTimingPattern(
        responseHistory.current.map((r, index) => ({
          type: 'question_answered' as const,
          questionId: r.questionId,
          questionCategory: r.category,
          questionIndex: index,
          sectionId: 'section_1', // Simplified
          timeOnQuestion: r.responseTime,
          responseValue: typeof r.response === 'number' ? r.response : 1,
          revisionCount: r.revisions,
          id: `event_${index}`,
          timestamp: new Date().toISOString(),
          sessionId: currentSession?.sessionId || 'unknown',
          privacyLevel: 'anonymous' as const,
        }))
      );

      const allAnomalies = anomalyDetector.analyzeAllPatterns(responsePattern, timingPattern);
      
      // Track significant anomalies
      for (const anomaly of allAnomalies.filter(a => a.severity !== 'low')) {
        await telemetryService.trackAnomaly(anomaly.type, {
          severity: anomaly.severity,
          detectionAlgorithm: 'comprehensive_post_assessment',
          contextData: {
            ...anomaly.statisticalEvidence,
            explanation: anomaly.explanation,
          },
          actionTaken: anomaly.recommendedAction,
        });
      }

      // Update data quality score based on anomalies
      const qualityScore = Math.max(0.1, 1.0 - (allAnomalies.length * 0.1));
      updatePerformanceMetrics({
        dataQualityScore: qualityScore,
        anomalyRate: allAnomalies.length / responseHistory.current.length,
      });

    } catch (error) {
      console.error('Failed to perform final analysis:', error);
    }
  }, [config.collectNormingData, currentSession]);

  // Track performance metrics
  const trackPerformanceMetric = useCallback(async (
    metricName: string,
    metricValue: number,
    context: Record<string, any> = {}
  ) => {
    if (!isEnabled() || !config.collectPerformanceMetrics) return;

    try {
      await telemetryService.trackPerformance(metricName, metricValue, context);
      decrementEventQueue();
    } catch (error) {
      console.error('Failed to track performance metric:', error);
    }
  }, [config.enabled, userConsent, config.collectPerformanceMetrics]);

  // Check if telemetry is enabled and consented
  const isEnabled = useCallback(() => {
    return config.enabled && userConsent && currentSession;
  }, [config.enabled, userConsent, currentSession]);

  // Get telemetry status
  const getTelemetryStatus = useCallback(() => {
    return useTelemetryStore.getState().getTelemetryStatus();
  }, []);

  // Reset session data
  const resetSession = useCallback(() => {
    questionStartTime.current = 0;
    sectionStartTime.current = 0;
    assessmentStartTime.current = 0;
    responseHistory.current = [];
  }, []);

  return {
    // Tracking functions
    trackAssessmentStart,
    trackQuestionView,
    trackQuestionResponse,
    trackQuestionRevision,
    trackSectionCompletion,
    trackAssessmentCompletion,
    trackPerformanceMetric,
    
    // Utility functions
    isEnabled,
    getTelemetryStatus,
    resetSession,
    
    // State
    currentSession,
    config,
    userConsent,
  };
};

export default useTelemetryIntegration;
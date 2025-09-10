/**
 * Anomaly Detection for Assessment Response Patterns
 * Identifies suspicious response patterns and data quality issues
 */

import { 
  QuestionTelemetryEvent, 
  AssessmentTelemetryEvent, 
  AnomalyType 
} from '../types/telemetry';
import { LikertScale } from '../types/assessment';

interface AnomalyResult {
  detected: boolean;
  type: AnomalyType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1
  explanation: string;
  statisticalEvidence: Record<string, number>;
  recommendedAction: 'ignore' | 'flag' | 'exclude' | 'manual_review';
}

interface ResponsePattern {
  responses: (number | string)[];
  timestamps: number[];
  revisions: number[];
  categories: string[];
}

interface TimingPattern {
  responseTimes: number[];
  averageTime: number;
  variance: number;
  outliers: number[];
}

class AnomalyDetectionEngine {
  // Configurable thresholds
  private readonly thresholds = {
    // Timing-based thresholds
    minResponseTime: 500, // 500ms minimum reasonable response time
    maxResponseTime: 300000, // 5 minutes maximum reasonable response time
    fastResponseThreshold: 1000, // 1 second for "too fast" detection
    slowResponseThreshold: 120000, // 2 minutes for "too slow" detection
    
    // Pattern-based thresholds
    straightLineThreshold: 0.8, // 80% same responses indicates straight-line
    varianceThreshold: 0.5, // Low variance threshold for response diversity
    
    // Statistical thresholds
    outlierZScore: 3.0, // Z-score for outlier detection
    consistencyThreshold: 0.7, // Consistency score threshold
    
    // Behavioral thresholds
    maxRevisions: 10, // Maximum reasonable revisions per question
    botLikeSpeedThreshold: 800, // Consistent sub-800ms responses indicate bot
    suspiciousPatternLength: 5, // Number of consecutive similar responses
  };

  /**
   * Analyze response patterns for straight-line responding
   */
  analyzeStraightLineResponding(pattern: ResponsePattern): AnomalyResult {
    if (pattern.responses.length < 5) {
      return this.createNormalResult();
    }

    // Count most frequent response
    const responseCounts = this.countResponses(pattern.responses);
    const totalResponses = pattern.responses.length;
    const maxCount = Math.max(...Object.values(responseCounts));
    const straightLineRatio = maxCount / totalResponses;

    // Check for consecutive identical responses
    const consecutiveCount = this.findLongestConsecutiveSequence(pattern.responses);
    const consecutiveRatio = consecutiveCount / totalResponses;

    // Calculate response variance
    const numericResponses = pattern.responses
      .filter(r => typeof r === 'number') as number[];
    const variance = this.calculateVariance(numericResponses);

    const detected = straightLineRatio >= this.thresholds.straightLineThreshold ||
                    consecutiveRatio >= 0.6 ||
                    variance < this.thresholds.varianceThreshold;

    if (!detected) {
      return this.createNormalResult();
    }

    const severity = this.determineSeverity([
      { value: straightLineRatio, threshold: 0.9, weight: 0.4 },
      { value: consecutiveRatio, threshold: 0.7, weight: 0.3 },
      { value: 1 - variance, threshold: 0.8, weight: 0.3 }
    ]);

    return {
      detected: true,
      type: 'straight_line_responding',
      severity,
      confidence: Math.min(0.95, straightLineRatio * 0.8 + consecutiveRatio * 0.2),
      explanation: `${(straightLineRatio * 100).toFixed(1)}% of responses are identical, with ${consecutiveCount} consecutive identical responses`,
      statisticalEvidence: {
        straightLineRatio,
        consecutiveCount,
        consecutiveRatio,
        responseVariance: variance,
        totalResponses,
      },
      recommendedAction: severity === 'critical' ? 'exclude' : 'flag',
    };
  }

  /**
   * Analyze response timing patterns
   */
  analyzeResponseTiming(pattern: TimingPattern): AnomalyResult {
    const { responseTimes, averageTime, variance } = pattern;
    
    if (responseTimes.length < 3) {
      return this.createNormalResult();
    }

    // Check for consistently fast responses (bot-like behavior)
    const fastResponses = responseTimes.filter(t => t < this.thresholds.botLikeSpeedThreshold);
    const fastResponseRatio = fastResponses.length / responseTimes.length;

    // Check for extremely fast responses
    const extremelyFastResponses = responseTimes.filter(t => t < this.thresholds.minResponseTime);
    const extremelyFastRatio = extremelyFastResponses.length / responseTimes.length;

    // Check for timing consistency (too consistent = bot-like)
    const coefficientOfVariation = Math.sqrt(variance) / averageTime;
    const tooConsistent = coefficientOfVariation < 0.2 && averageTime < 2000;

    // Detect different types of timing anomalies
    const anomalies: Array<{type: AnomalyType, score: number, evidence: any}> = [];

    if (fastResponseRatio >= 0.8) {
      anomalies.push({
        type: 'too_fast_completion',
        score: fastResponseRatio,
        evidence: { fastResponseRatio, averageTime, fastCount: fastResponses.length }
      });
    }

    if (extremelyFastRatio >= 0.3) {
      anomalies.push({
        type: 'bot_like_behavior',
        score: extremelyFastRatio * 1.5,
        evidence: { extremelyFastRatio, averageTime, coefficientOfVariation }
      });
    }

    if (tooConsistent && averageTime < 1500) {
      anomalies.push({
        type: 'bot_like_behavior',
        score: 1 - coefficientOfVariation,
        evidence: { coefficientOfVariation, averageTime, tooConsistent }
      });
    }

    if (anomalies.length === 0) {
      return this.createNormalResult();
    }

    // Return the most severe anomaly
    const primaryAnomaly = anomalies.reduce((max, current) => 
      current.score > max.score ? current : max
    );

    const severity = this.determineSeverity([
      { value: primaryAnomaly.score, threshold: 0.7, weight: 1.0 }
    ]);

    return {
      detected: true,
      type: primaryAnomaly.type,
      severity,
      confidence: Math.min(0.9, primaryAnomaly.score),
      explanation: this.getTimingAnomalyExplanation(primaryAnomaly.type, primaryAnomaly.evidence),
      statisticalEvidence: {
        averageResponseTime: averageTime,
        responseVariance: variance,
        coefficientOfVariation,
        fastResponseRatio,
        extremelyFastRatio,
        totalResponses: responseTimes.length,
        ...primaryAnomaly.evidence,
      },
      recommendedAction: severity === 'critical' ? 'exclude' : 'flag',
    };
  }

  /**
   * Analyze response consistency and patterns
   */
  analyzeResponseConsistency(pattern: ResponsePattern): AnomalyResult {
    if (pattern.responses.length < 8) {
      return this.createNormalResult();
    }

    // Check for alternating patterns (1,7,1,7,1,7...)
    const alternatingScore = this.detectAlternatingPattern(pattern.responses);
    
    // Check for sequential patterns (1,2,3,4,5,6,7,1,2,3...)
    const sequentialScore = this.detectSequentialPattern(pattern.responses);
    
    // Check for reverse patterns within sections
    const reverseScore = this.detectReversePattern(pattern.responses);

    // Check for extreme response style (only using endpoints)
    const extremeScore = this.detectExtremeResponseStyle(pattern.responses);

    const anomalies = [
      { type: 'inconsistent_patterns' as AnomalyType, score: alternatingScore, name: 'alternating' },
      { type: 'inconsistent_patterns' as AnomalyType, score: sequentialScore, name: 'sequential' },
      { type: 'inconsistent_patterns' as AnomalyType, score: reverseScore, name: 'reverse' },
      { type: 'suspicious_timing' as AnomalyType, score: extremeScore, name: 'extreme' },
    ].filter(a => a.score > 0.3);

    if (anomalies.length === 0) {
      return this.createNormalResult();
    }

    const primaryAnomaly = anomalies.reduce((max, current) => 
      current.score > max.score ? current : max
    );

    const severity = this.determineSeverity([
      { value: primaryAnomaly.score, threshold: 0.6, weight: 1.0 }
    ]);

    return {
      detected: true,
      type: primaryAnomaly.type,
      severity,
      confidence: Math.min(0.85, primaryAnomaly.score),
      explanation: `Detected ${primaryAnomaly.name} response pattern (score: ${primaryAnomaly.score.toFixed(3)})`,
      statisticalEvidence: {
        alternatingScore,
        sequentialScore,
        reverseScore,
        extremeScore,
        primaryPattern: primaryAnomaly.name,
        totalResponses: pattern.responses.length,
      },
      recommendedAction: severity >= 'high' ? 'flag' : 'ignore',
    };
  }

  /**
   * Analyze excessive revisions
   */
  analyzeRevisionPatterns(pattern: ResponsePattern): AnomalyResult {
    const totalRevisions = pattern.revisions.reduce((sum, r) => sum + r, 0);
    const averageRevisions = totalRevisions / pattern.revisions.length;
    const maxRevisions = Math.max(...pattern.revisions);
    
    // Count questions with excessive revisions
    const excessiveRevisions = pattern.revisions.filter(r => r > this.thresholds.maxRevisions);
    const excessiveRatio = excessiveRevisions.length / pattern.revisions.length;

    const detected = excessiveRatio > 0.2 || 
                    averageRevisions > 3 || 
                    maxRevisions > this.thresholds.maxRevisions;

    if (!detected) {
      return this.createNormalResult();
    }

    const severity = this.determineSeverity([
      { value: excessiveRatio, threshold: 0.4, weight: 0.4 },
      { value: averageRevisions / 5, threshold: 0.6, weight: 0.3 },
      { value: maxRevisions / 15, threshold: 0.8, weight: 0.3 }
    ]);

    return {
      detected: true,
      type: 'excessive_revisions',
      severity,
      confidence: Math.min(0.8, excessiveRatio + (averageRevisions / 10)),
      explanation: `Average ${averageRevisions.toFixed(1)} revisions per question, with ${excessiveRevisions.length} questions having >10 revisions`,
      statisticalEvidence: {
        totalRevisions,
        averageRevisions,
        maxRevisions,
        excessiveCount: excessiveRevisions.length,
        excessiveRatio,
        totalQuestions: pattern.revisions.length,
      },
      recommendedAction: severity === 'high' ? 'manual_review' : 'flag',
    };
  }

  /**
   * Comprehensive anomaly analysis
   */
  analyzeAllPatterns(
    responsePattern: ResponsePattern,
    timingPattern: TimingPattern
  ): AnomalyResult[] {
    const results: AnomalyResult[] = [];

    // Run all detection algorithms
    results.push(this.analyzeStraightLineResponding(responsePattern));
    results.push(this.analyzeResponseTiming(timingPattern));
    results.push(this.analyzeResponseConsistency(responsePattern));
    results.push(this.analyzeRevisionPatterns(responsePattern));

    // Filter out normal results
    return results.filter(r => r.detected);
  }

  /**
   * Create pattern objects from telemetry events
   */
  createResponsePattern(events: QuestionTelemetryEvent[]): ResponsePattern {
    return {
      responses: events.map(e => e.responseValue || 0),
      timestamps: events.map(e => new Date(e.timestamp).getTime()),
      revisions: events.map(e => e.revisionCount),
      categories: events.map(e => e.questionCategory),
    };
  }

  createTimingPattern(events: QuestionTelemetryEvent[]): TimingPattern {
    const responseTimes = events.map(e => e.timeOnQuestion);
    const averageTime = responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length;
    const variance = this.calculateVariance(responseTimes);
    const outliers = this.findTimingOutliers(responseTimes);

    return {
      responseTimes,
      averageTime,
      variance,
      outliers,
    };
  }

  // Private helper methods
  private createNormalResult(): AnomalyResult {
    return {
      detected: false,
      type: 'data_quality_issue',
      severity: 'low',
      confidence: 0,
      explanation: 'No anomalies detected',
      statisticalEvidence: {},
      recommendedAction: 'ignore',
    };
  }

  private countResponses(responses: (number | string)[]): Record<string, number> {
    const counts: Record<string, number> = {};
    responses.forEach(response => {
      const key = response.toString();
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }

  private findLongestConsecutiveSequence(responses: (number | string)[]): number {
    if (responses.length === 0) return 0;
    
    let maxLength = 1;
    let currentLength = 1;
    
    for (let i = 1; i < responses.length; i++) {
      if (responses[i] === responses[i - 1]) {
        currentLength++;
        maxLength = Math.max(maxLength, currentLength);
      } else {
        currentLength = 1;
      }
    }
    
    return maxLength;
  }

  private calculateVariance(numbers: number[]): number {
    if (numbers.length < 2) return 0;
    
    const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
    const variance = numbers.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / (numbers.length - 1);
    
    return variance;
  }

  private determineSeverity(
    factors: Array<{ value: number; threshold: number; weight: number }>
  ): 'low' | 'medium' | 'high' | 'critical' {
    const weightedScore = factors.reduce((sum, factor) => {
      const normalized = Math.min(1, factor.value / factor.threshold);
      return sum + (normalized * factor.weight);
    }, 0) / factors.reduce((sum, factor) => sum + factor.weight, 0);

    if (weightedScore >= 0.95) return 'critical';
    if (weightedScore >= 0.7) return 'high';
    if (weightedScore >= 0.4) return 'medium';
    return 'low';
  }

  private detectAlternatingPattern(responses: (number | string)[]): number {
    if (responses.length < 4) return 0;
    
    let alternatingCount = 0;
    for (let i = 2; i < responses.length; i++) {
      if (responses[i] === responses[i - 2] && responses[i] !== responses[i - 1]) {
        alternatingCount++;
      }
    }
    
    return alternatingCount / (responses.length - 2);
  }

  private detectSequentialPattern(responses: (number | string)[]): number {
    if (responses.length < 5) return 0;
    
    const numericResponses = responses.filter(r => typeof r === 'number') as number[];
    if (numericResponses.length < 5) return 0;
    
    let sequentialCount = 0;
    for (let i = 1; i < numericResponses.length; i++) {
      const diff = numericResponses[i] - numericResponses[i - 1];
      if (Math.abs(diff) === 1) {
        sequentialCount++;
      }
    }
    
    return sequentialCount / (numericResponses.length - 1);
  }

  private detectReversePattern(responses: (number | string)[]): number {
    // Check for patterns like 7,6,5,4,3,2,1 or 1,2,3,4,5,6,7
    if (responses.length < 6) return 0;
    
    const numericResponses = responses.filter(r => typeof r === 'number') as number[];
    if (numericResponses.length < 6) return 0;
    
    let reverseScore = 0;
    for (let i = 0; i <= numericResponses.length - 6; i++) {
      const segment = numericResponses.slice(i, i + 6);
      const isAscending = segment.every((val, idx) => idx === 0 || val > segment[idx - 1]);
      const isDescending = segment.every((val, idx) => idx === 0 || val < segment[idx - 1]);
      
      if (isAscending || isDescending) {
        reverseScore++;
      }
    }
    
    return reverseScore / Math.max(1, numericResponses.length - 5);
  }

  private detectExtremeResponseStyle(responses: (number | string)[]): number {
    const numericResponses = responses.filter(r => typeof r === 'number') as number[];
    if (numericResponses.length < 5) return 0;
    
    // Assuming 7-point Likert scale, check for only 1s and 7s
    const extremeResponses = numericResponses.filter(r => r === 1 || r === 7);
    return extremeResponses.length / numericResponses.length;
  }

  private findTimingOutliers(times: number[]): number[] {
    if (times.length < 3) return [];
    
    const mean = times.reduce((sum, t) => sum + t, 0) / times.length;
    const stdDev = Math.sqrt(this.calculateVariance(times));
    
    return times.filter(time => {
      const zScore = Math.abs(time - mean) / stdDev;
      return zScore > this.thresholds.outlierZScore;
    });
  }

  private getTimingAnomalyExplanation(type: AnomalyType, evidence: any): string {
    switch (type) {
      case 'too_fast_completion':
        return `${(evidence.fastResponseRatio * 100).toFixed(1)}% of responses completed in under ${this.thresholds.botLikeSpeedThreshold}ms (average: ${evidence.averageTime.toFixed(0)}ms)`;
      case 'bot_like_behavior':
        return `Consistent rapid responses with low variation (CV: ${evidence.coefficientOfVariation?.toFixed(3)}, average: ${evidence.averageTime.toFixed(0)}ms)`;
      default:
        return 'Timing anomaly detected';
    }
  }
}

export const anomalyDetector = new AnomalyDetectionEngine();
export default anomalyDetector;
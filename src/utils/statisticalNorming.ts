/**
 * Statistical Norming Engine for Assessment Data
 * Calculates norms, reliability, and validity statistics for psychological assessments
 */

import { 
  NormingStatistics, 
  ItemAnalysis, 
  ItemRecommendation,
  StatisticalMeasure,
  TelemetryDashboardData
} from '../types/telemetry';
import { AssessmentCategory, LikertScale } from '../types/assessment';

interface RawResponseData {
  questionId: string;
  category: AssessmentCategory;
  responses: number[];
  responseTimes: number[];
  revisions: number[];
  sessionIds: string[];
  demographics?: {
    ageGroup?: string;
    gender?: string;
    twinType?: string;
  }[];
}

interface ReliabilityAnalysis {
  cronbachAlpha: number;
  splitHalfReliability: number;
  testRetest?: number;
  standardError: number;
  confidenceInterval: [number, number];
}

interface ValidityAnalysis {
  contentValidity: number;
  constructValidity: number;
  criterionValidity?: number;
  convergentValidity?: number;
  discriminantValidity?: number;
}

interface NormativeScores {
  rawScore: number;
  standardScore: number; // Mean = 50, SD = 10
  tScore: number; // Mean = 50, SD = 10
  zScore: number; // Mean = 0, SD = 1
  percentileRank: number; // 0-100
  stanine: number; // 1-9
  qualitativeDescription: string;
}

class StatisticalNormingEngine {
  private normingDatabase: Map<string, NormingStatistics> = new Map();
  private reliabilityCache: Map<string, ReliabilityAnalysis> = new Map();
  private validityCache: Map<string, ValidityAnalysis> = new Map();

  /**
   * Calculate comprehensive norming statistics for a question
   */
  calculateNormingStatistics(data: RawResponseData): NormingStatistics {
    const responses = data.responses.filter(r => r >= 1 && r <= 7); // Valid Likert responses
    const sampleSize = responses.length;

    if (sampleSize < 10) {
      throw new Error('Insufficient sample size for reliable norming statistics');
    }

    // Basic descriptive statistics
    const mean = this.calculateMean(responses);
    const median = this.calculateMedian(responses);
    const standardDeviation = this.calculateStandardDeviation(responses, mean);
    const variance = Math.pow(standardDeviation, 2);
    const skewness = this.calculateSkewness(responses, mean, standardDeviation);
    const kurtosis = this.calculateKurtosis(responses, mean, standardDeviation);

    // Response distribution
    const responseDistribution = this.createResponseDistribution(responses);

    // Demographic breakdowns (if available)
    const demographicBreakdowns = this.calculateDemographicBreakdowns(
      responses, 
      data.demographics
    );

    // Quality metrics
    const averageResponseTime = this.calculateMean(data.responseTimes);
    const responseVariance = this.calculateResponseVariance(responses);
    const consistencyScore = this.calculateConsistencyScore(responses, data.revisions);
    const anomalyRate = this.calculateAnomalyRate(data);

    // Item difficulty and discrimination
    const difficulty = this.calculateItemDifficulty(responses);
    const discrimination = this.calculateItemDiscrimination(responses, data.sessionIds);

    // Normative data
    const percentileRanks = this.calculatePercentileRanks(responses);
    const zScores = this.calculateZScores(responses, mean, standardDeviation);
    const standardizedScores = this.calculateStandardizedScores(zScores);

    // Confidence interval for the mean
    const standardError = standardDeviation / Math.sqrt(sampleSize);
    const confidenceInterval = 1.96 * standardError; // 95% CI

    const normingStats: NormingStatistics = {
      questionId: data.questionId,
      category: data.category,
      sampleSize,
      statistics: {
        mean,
        median,
        standard_deviation: standardDeviation,
        variance,
        skewness,
        kurtosis,
        item_difficulty: difficulty,
        item_discrimination: discrimination,
      },
      responseDistribution,
      demographicBreakdowns,
      qualityMetrics: {
        averageResponseTime,
        responseVariance,
        consistencyScore,
        anomalyRate,
        reliabilityCoefficient: this.estimateReliability(responses),
      },
      normativeData: {
        percentileRanks,
        zScores,
        standardizedScores,
      },
      lastUpdated: new Date().toISOString(),
      confidenceInterval,
    };

    // Cache the results
    this.normingDatabase.set(data.questionId, normingStats);

    return normingStats;
  }

  /**
   * Perform comprehensive item analysis
   */
  analyzeItem(data: RawResponseData, totalScores?: number[]): ItemAnalysis {
    const responses = data.responses.filter(r => r >= 1 && r <= 7);
    const sampleSize = responses.length;

    if (sampleSize < 30) {
      console.warn(`Small sample size (${sampleSize}) for item analysis of question ${data.questionId}`);
    }

    // Basic item statistics
    const difficulty = this.calculateItemDifficulty(responses);
    const discrimination = totalScores 
      ? this.calculateItemTotalCorrelation(responses, totalScores)
      : this.calculateItemDiscrimination(responses, data.sessionIds);

    // Option analysis (for multiple choice or Likert items)
    const optionAnalysis = this.analyzeResponseOptions(responses);

    // Reliability analysis
    const itemTotalCorrelation = discrimination;
    const alphaIfDeleted = totalScores 
      ? this.calculateAlphaIfItemDeleted(responses, totalScores)
      : 0;

    // Generate recommendations
    const recommendations = this.generateItemRecommendations(
      difficulty,
      discrimination,
      optionAnalysis,
      data
    );

    // Flag problematic items
    const flagged = recommendations.some(r => r.priority === 'high' || r.priority === 'critical');
    const flagReasons = recommendations
      .filter(r => r.priority === 'high' || r.priority === 'critical')
      .map(r => r.reason);

    return {
      questionId: data.questionId,
      category: data.category,
      difficulty,
      discrimination,
      optionAnalysis,
      reliability: {
        itemTotalCorrelation,
        alphaIfDeleted,
      },
      recommendations,
      flagged,
      flagReasons,
    };
  }

  /**
   * Calculate reliability statistics for a scale or subscale
   */
  calculateReliability(
    itemResponses: number[][], // Array of response arrays for each item
    itemIds: string[]
  ): ReliabilityAnalysis {
    const cacheKey = itemIds.sort().join('|');
    
    if (this.reliabilityCache.has(cacheKey)) {
      return this.reliabilityCache.get(cacheKey)!;
    }

    if (itemResponses.length < 2) {
      throw new Error('At least 2 items required for reliability analysis');
    }

    // Calculate Cronbach's Alpha
    const cronbachAlpha = this.calculateCronbachAlpha(itemResponses);

    // Calculate Split-Half Reliability
    const splitHalfReliability = this.calculateSplitHalfReliability(itemResponses);

    // Calculate Standard Error of Measurement
    const totalScores = this.calculateTotalScores(itemResponses);
    const totalVariance = this.calculateVariance(totalScores);
    const standardError = Math.sqrt(totalVariance * (1 - cronbachAlpha));

    // 95% Confidence Interval for reliability
    const n = itemResponses[0].length; // Number of respondents
    const dfReliability = n - 1;
    const reliabilityCI = this.calculateReliabilityCI(cronbachAlpha, dfReliability);

    const reliabilityAnalysis: ReliabilityAnalysis = {
      cronbachAlpha,
      splitHalfReliability,
      standardError,
      confidenceInterval: reliabilityCI,
    };

    this.reliabilityCache.set(cacheKey, reliabilityAnalysis);
    return reliabilityAnalysis;
  }

  /**
   * Convert raw scores to normative scores
   */
  convertToNormativeScores(
    rawScore: number,
    questionId: string
  ): NormativeScores | null {
    const normingData = this.normingDatabase.get(questionId);
    if (!normingData) {
      return null;
    }

    const mean = normingData.statistics.mean || 0;
    const sd = normingData.statistics.standard_deviation || 1;

    // Calculate z-score
    const zScore = (rawScore - mean) / sd;

    // Calculate standard score (M=50, SD=10)
    const standardScore = 50 + (zScore * 10);

    // Calculate T-score (M=50, SD=10, same as standard score in this case)
    const tScore = standardScore;

    // Calculate percentile rank
    const percentileRank = this.zScoreToPercentile(zScore);

    // Calculate stanine (1-9 scale)
    const stanine = this.percentileToStanine(percentileRank);

    // Qualitative description
    const qualitativeDescription = this.getQualitativeDescription(percentileRank);

    return {
      rawScore,
      standardScore,
      tScore,
      zScore,
      percentileRank,
      stanine,
      qualitativeDescription,
    };
  }

  /**
   * Generate dashboard analytics data
   */
  generateDashboardData(
    startDate: string,
    endDate: string
  ): TelemetryDashboardData {
    // This would typically pull from a database
    // For now, we'll generate sample data based on cached norming statistics
    
    const questionMetrics = Array.from(this.normingDatabase.values()).map(stats => ({
      questionId: stats.questionId,
      averageResponseTime: stats.qualityMetrics.averageResponseTime,
      difficultyLevel: stats.statistics.item_difficulty || 0.5,
      discriminationIndex: stats.statistics.item_discrimination || 0.3,
      responseVariance: stats.qualityMetrics.responseVariance,
      anomalyCount: Math.floor(stats.sampleSize * stats.qualityMetrics.anomalyRate),
    }));

    // Group by category for category performance
    const categoryPerformance = this.aggregateByCategory();

    // Calculate quality indicators
    const qualityIndicators = this.calculateQualityIndicators();

    // Generate trends data (would come from time-series data in real implementation)
    const trendsData = this.generateTrendsData(startDate, endDate);

    // Overall statistics
    const overview = this.calculateOverviewStats();

    return {
      timeRange: { start: startDate, end: endDate },
      overview,
      questionMetrics,
      categoryPerformance,
      qualityIndicators,
      trendsData,
    };
  }

  // Private helper methods
  private calculateMean(values: number[]): number {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  private calculateStandardDeviation(values: number[], mean?: number): number {
    const m = mean ?? this.calculateMean(values);
    const variance = values.reduce((sum, val) => sum + Math.pow(val - m, 2), 0) / (values.length - 1);
    return Math.sqrt(variance);
  }

  private calculateVariance(values: number[]): number {
    const mean = this.calculateMean(values);
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1);
  }

  private calculateSkewness(values: number[], mean: number, sd: number): number {
    const n = values.length;
    const skew = values.reduce((sum, val) => sum + Math.pow((val - mean) / sd, 3), 0) / n;
    return skew;
  }

  private calculateKurtosis(values: number[], mean: number, sd: number): number {
    const n = values.length;
    const kurt = values.reduce((sum, val) => sum + Math.pow((val - mean) / sd, 4), 0) / n;
    return kurt - 3; // Excess kurtosis
  }

  private createResponseDistribution(responses: number[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    responses.forEach(response => {
      const key = response.toString();
      distribution[key] = (distribution[key] || 0) + 1;
    });
    return distribution;
  }

  private calculateDemographicBreakdowns(
    responses: number[],
    demographics?: any[]
  ): Record<string, Record<string, number>> | undefined {
    if (!demographics || demographics.length !== responses.length) {
      return undefined;
    }

    const breakdowns: Record<string, Record<string, number>> = {
      ageGroups: {},
      genderGroups: {},
      twinTypes: {},
    };

    demographics.forEach((demo, index) => {
      const response = responses[index];
      
      if (demo.ageGroup) {
        breakdowns.ageGroups[demo.ageGroup] = 
          (breakdowns.ageGroups[demo.ageGroup] || 0) + response;
      }
      
      if (demo.gender) {
        breakdowns.genderGroups[demo.gender] = 
          (breakdowns.genderGroups[demo.gender] || 0) + response;
      }
      
      if (demo.twinType) {
        breakdowns.twinTypes[demo.twinType] = 
          (breakdowns.twinTypes[demo.twinType] || 0) + response;
      }
    });

    return breakdowns;
  }

  private calculateResponseVariance(responses: number[]): number {
    // Calculate the variance in response patterns (not statistical variance)
    const distribution = this.createResponseDistribution(responses);
    const totalResponses = responses.length;
    
    // Calculate entropy as a measure of response diversity
    let entropy = 0;
    Object.values(distribution).forEach(count => {
      const p = count / totalResponses;
      if (p > 0) {
        entropy -= p * Math.log2(p);
      }
    });

    // Normalize entropy to 0-1 scale (max entropy for 7-point scale is log2(7))
    return entropy / Math.log2(7);
  }

  private calculateConsistencyScore(responses: number[], revisions: number[]): number {
    // Higher consistency = fewer revisions and less variance
    const avgRevisions = this.calculateMean(revisions);
    const responseStability = 1 - (avgRevisions / 10); // Normalize revision impact
    const responseVariance = this.calculateResponseVariance(responses);
    
    return Math.max(0, Math.min(1, responseStability * responseVariance));
  }

  private calculateAnomalyRate(data: RawResponseData): number {
    // This would integrate with the anomaly detection system
    // For now, estimate based on extreme response times and patterns
    const { responseTimes, responses } = data;
    
    let anomalies = 0;
    
    // Count extremely fast responses
    anomalies += responseTimes.filter(t => t < 500).length;
    
    // Count straight-line responding patterns
    if (responses.length >= 5) {
      const mostCommon = this.getMostCommonResponse(responses);
      const straightLineCount = responses.filter(r => r === mostCommon).length;
      if (straightLineCount / responses.length > 0.8) {
        anomalies += Math.floor(responses.length * 0.5);
      }
    }

    return Math.min(1, anomalies / responses.length);
  }

  private calculateItemDifficulty(responses: number[]): number {
    // For Likert scales, difficulty = mean response / max possible response
    const mean = this.calculateMean(responses);
    return mean / 7; // Assuming 7-point scale
  }

  private calculateItemDiscrimination(responses: number[], sessionIds: string[]): number {
    // Simplified discrimination index - would need total scores for proper calculation
    // This estimates discrimination based on response variance
    const variance = this.calculateVariance(responses);
    const maxVariance = Math.pow(7 - 1, 2) / 4; // Theoretical max for 7-point scale
    return Math.min(1, variance / maxVariance);
  }

  private calculateItemTotalCorrelation(itemResponses: number[], totalScores: number[]): number {
    if (itemResponses.length !== totalScores.length) {
      throw new Error('Item responses and total scores arrays must have the same length');
    }

    return this.calculateCorrelation(itemResponses, totalScores);
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    const meanX = this.calculateMean(x);
    const meanY = this.calculateMean(y);
    
    let numerator = 0;
    let sumXSquared = 0;
    let sumYSquared = 0;

    for (let i = 0; i < n; i++) {
      const devX = x[i] - meanX;
      const devY = y[i] - meanY;
      numerator += devX * devY;
      sumXSquared += devX * devX;
      sumYSquared += devY * devY;
    }

    const denominator = Math.sqrt(sumXSquared * sumYSquared);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private calculateCronbachAlpha(itemResponses: number[][]): number {
    const k = itemResponses.length; // Number of items
    const n = itemResponses[0].length; // Number of respondents

    // Calculate variance of each item
    const itemVariances = itemResponses.map(responses => this.calculateVariance(responses));
    const sumItemVariances = itemVariances.reduce((sum, variance) => sum + variance, 0);

    // Calculate total scores and their variance
    const totalScores = this.calculateTotalScores(itemResponses);
    const totalVariance = this.calculateVariance(totalScores);

    // Cronbach's Alpha formula
    const alpha = (k / (k - 1)) * (1 - (sumItemVariances / totalVariance));
    return Math.max(0, Math.min(1, alpha));
  }

  private calculateSplitHalfReliability(itemResponses: number[][]): number {
    const k = itemResponses.length;
    if (k < 2) return 0;

    // Split items into two halves
    const half1 = itemResponses.slice(0, Math.floor(k / 2));
    const half2 = itemResponses.slice(Math.floor(k / 2));

    // Calculate total scores for each half
    const scores1 = this.calculateTotalScores(half1);
    const scores2 = this.calculateTotalScores(half2);

    // Calculate correlation between halves
    const r = this.calculateCorrelation(scores1, scores2);

    // Apply Spearman-Brown correction
    return (2 * r) / (1 + r);
  }

  private calculateTotalScores(itemResponses: number[][]): number[] {
    const n = itemResponses[0].length;
    const totalScores: number[] = [];

    for (let i = 0; i < n; i++) {
      const score = itemResponses.reduce((sum, item) => sum + item[i], 0);
      totalScores.push(score);
    }

    return totalScores;
  }

  private calculateAlphaIfItemDeleted(itemResponses: number[], totalScores: number[]): number {
    // This would require recalculating Cronbach's alpha without this item
    // Simplified approximation for now
    const itemTotalCorrelation = this.calculateItemTotalCorrelation(itemResponses, totalScores);
    return Math.max(0, 0.8 - (0.2 * itemTotalCorrelation)); // Rough estimate
  }

  private analyzeResponseOptions(responses: number[]): Record<string, any> {
    const distribution = this.createResponseDistribution(responses);
    const total = responses.length;
    
    const analysis: Record<string, any> = {};
    
    Object.entries(distribution).forEach(([option, frequency]) => {
      analysis[option] = {
        frequency,
        proportion: frequency / total,
        attractiveness: frequency / total, // Proportion selecting this option
        discrimination: 0.5, // Would need more complex calculation
      };
    });

    return analysis;
  }

  private generateItemRecommendations(
    difficulty: number,
    discrimination: number,
    optionAnalysis: Record<string, any>,
    data: RawResponseData
  ): ItemRecommendation[] {
    const recommendations: ItemRecommendation[] = [];

    // Check difficulty
    if (difficulty < 0.2) {
      recommendations.push({
        type: 'reword',
        priority: 'medium',
        reason: 'Item is too difficult (low endorsement)',
        suggestedAction: 'Consider rewording to be more accessible or balanced',
        statisticalEvidence: { difficulty, threshold: 0.2 },
      });
    } else if (difficulty > 0.8) {
      recommendations.push({
        type: 'reword',
        priority: 'medium',
        reason: 'Item is too easy (high endorsement)',
        suggestedAction: 'Consider rewording to increase discrimination',
        statisticalEvidence: { difficulty, threshold: 0.8 },
      });
    }

    // Check discrimination
    if (discrimination < 0.2) {
      recommendations.push({
        type: 'remove',
        priority: 'high',
        reason: 'Item has poor discrimination',
        suggestedAction: 'Consider removing or substantially rewriting this item',
        statisticalEvidence: { discrimination, threshold: 0.2 },
      });
    } else if (discrimination < 0.3) {
      recommendations.push({
        type: 'reword',
        priority: 'medium',
        reason: 'Item has low discrimination',
        suggestedAction: 'Consider rewording to improve discrimination',
        statisticalEvidence: { discrimination, threshold: 0.3 },
      });
    }

    // Check sample size
    if (data.responses.length < 50) {
      recommendations.push({
        type: 'manual_review',
        priority: 'low',
        reason: 'Small sample size affects reliability of statistics',
        suggestedAction: 'Collect more data before making item decisions',
        statisticalEvidence: { sampleSize: data.responses.length, minimumRecommended: 50 },
      });
    }

    return recommendations;
  }

  private estimateReliability(responses: number[]): number {
    // Simplified reliability estimate based on response variance
    const variance = this.calculateVariance(responses);
    const maxVariance = Math.pow(6, 2) / 4; // For 7-point scale (6 = range)
    return Math.min(1, variance / maxVariance);
  }

  private calculatePercentileRanks(responses: number[]): Record<string, number> {
    const sorted = [...responses].sort((a, b) => a - b);
    const ranks: Record<string, number> = {};

    for (let i = 1; i <= 7; i++) {
      const count = sorted.filter(r => r <= i).length;
      ranks[i.toString()] = (count / sorted.length) * 100;
    }

    return ranks;
  }

  private calculateZScores(responses: number[], mean: number, sd: number): Record<string, number> {
    const zScores: Record<string, number> = {};
    
    for (let i = 1; i <= 7; i++) {
      zScores[i.toString()] = (i - mean) / sd;
    }

    return zScores;
  }

  private calculateStandardizedScores(zScores: Record<string, number>): Record<string, number> {
    const standardized: Record<string, number> = {};
    
    Object.entries(zScores).forEach(([key, zScore]) => {
      standardized[key] = Math.round(50 + (zScore * 10)); // Standard score with M=50, SD=10
    });

    return standardized;
  }

  private calculateReliabilityCI(alpha: number, df: number): [number, number] {
    // Simplified CI calculation - would need more sophisticated method for production
    const se = Math.sqrt((2 * alpha * (1 - alpha)) / (df + 1));
    const margin = 1.96 * se; // 95% CI
    
    return [
      Math.max(0, alpha - margin),
      Math.min(1, alpha + margin)
    ];
  }

  private zScoreToPercentile(zScore: number): number {
    // Approximate conversion using standard normal distribution
    // This is a simplified version - would use proper statistical tables in production
    const t = 1 / (1 + 0.2316419 * Math.abs(zScore));
    const d = 0.3989423 * Math.exp(-zScore * zScore / 2);
    let prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    
    if (zScore > 0) prob = 1 - prob;
    
    return Math.round(prob * 100);
  }

  private percentileToStanine(percentile: number): number {
    if (percentile <= 4) return 1;
    if (percentile <= 11) return 2;
    if (percentile <= 23) return 3;
    if (percentile <= 40) return 4;
    if (percentile <= 60) return 5;
    if (percentile <= 77) return 6;
    if (percentile <= 89) return 7;
    if (percentile <= 96) return 8;
    return 9;
  }

  private getQualitativeDescription(percentile: number): string {
    if (percentile >= 98) return 'Extremely High';
    if (percentile >= 91) return 'Very High';
    if (percentile >= 75) return 'High';
    if (percentile >= 60) return 'Above Average';
    if (percentile >= 40) return 'Average';
    if (percentile >= 25) return 'Below Average';
    if (percentile >= 9) return 'Low';
    if (percentile >= 2) return 'Very Low';
    return 'Extremely Low';
  }

  private getMostCommonResponse(responses: number[]): number {
    const distribution = this.createResponseDistribution(responses);
    let maxCount = 0;
    let mostCommon = responses[0];
    
    Object.entries(distribution).forEach(([response, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = parseInt(response);
      }
    });

    return mostCommon;
  }

  private aggregateByCategory(): any[] {
    const categoryData: Record<string, any> = {};
    
    this.normingDatabase.forEach(stats => {
      const category = stats.category;
      if (!categoryData[category]) {
        categoryData[category] = {
          category,
          scores: [],
          sampleSizes: [],
          reliabilities: [],
        };
      }
      
      categoryData[category].scores.push(stats.statistics.mean || 0);
      categoryData[category].sampleSizes.push(stats.sampleSize);
      categoryData[category].reliabilities.push(stats.qualityMetrics.reliabilityCoefficient || 0);
    });

    return Object.values(categoryData).map(cat => ({
      category: cat.category,
      averageScores: cat.scores,
      reliability: this.calculateMean(cat.reliabilities),
      sampleSize: cat.sampleSizes.reduce((sum: number, size: number) => sum + size, 0),
      standardError: this.calculateStandardDeviation(cat.scores) / Math.sqrt(cat.scores.length),
    }));
  }

  private calculateQualityIndicators(): any {
    let totalSessions = 0;
    let straightLineCount = 0;
    let excessiveSpeedCount = 0;
    let inconsistentCount = 0;
    let technicalIssueCount = 0;

    this.normingDatabase.forEach(stats => {
      totalSessions += stats.sampleSize;
      const anomalyCount = Math.floor(stats.sampleSize * stats.qualityMetrics.anomalyRate);
      
      // Distribute anomalies across types (this is simplified)
      straightLineCount += Math.floor(anomalyCount * 0.4);
      excessiveSpeedCount += Math.floor(anomalyCount * 0.3);
      inconsistentCount += Math.floor(anomalyCount * 0.2);
      technicalIssueCount += Math.floor(anomalyCount * 0.1);
    });

    return {
      straightLineResponding: totalSessions > 0 ? straightLineCount / totalSessions : 0,
      excessiveSpeed: totalSessions > 0 ? excessiveSpeedCount / totalSessions : 0,
      inconsistentPatterns: totalSessions > 0 ? inconsistentCount / totalSessions : 0,
      technicalIssues: totalSessions > 0 ? technicalIssueCount / totalSessions : 0,
    };
  }

  private generateTrendsData(startDate: string, endDate: string): any[] {
    // Generate sample trends data - would come from time-series database in production
    const trends = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    for (let i = 0; i < Math.min(daysDiff, 30); i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      
      trends.push({
        date: date.toISOString().split('T')[0],
        completionRate: 0.85 + (Math.random() - 0.5) * 0.1, // Simulate data
        averageQuality: 0.78 + (Math.random() - 0.5) * 0.1,
        anomalyRate: 0.05 + (Math.random() - 0.5) * 0.02,
      });
    }

    return trends;
  }

  private calculateOverviewStats(): any {
    let totalSessions = 0;
    let totalCompleted = 0;
    let totalTimeSpent = 0;
    let totalAnomalies = 0;
    let qualitySum = 0;
    let count = 0;

    this.normingDatabase.forEach(stats => {
      totalSessions += stats.sampleSize;
      totalCompleted += stats.sampleSize; // Assuming all in DB are completed
      totalTimeSpent += stats.qualityMetrics.averageResponseTime * stats.sampleSize;
      totalAnomalies += Math.floor(stats.sampleSize * stats.qualityMetrics.anomalyRate);
      qualitySum += stats.qualityMetrics.consistencyScore;
      count++;
    });

    return {
      totalSessions,
      completedAssessments: totalCompleted,
      averageCompletionTime: totalSessions > 0 ? totalTimeSpent / totalSessions : 0,
      completionRate: totalSessions > 0 ? totalCompleted / totalSessions : 0,
      anomalyRate: totalSessions > 0 ? totalAnomalies / totalSessions : 0,
      dataQualityScore: count > 0 ? qualitySum / count : 0,
    };
  }
}

export const statisticalNorming = new StatisticalNormingEngine();
export default statisticalNorming;
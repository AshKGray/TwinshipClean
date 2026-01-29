/**
 * Decision Analysis Service - Stories 2.6 & 2.7
 * Analyzes temporal decision synchrony and value alignment
 */

import {
  DecisionData,
  DecisionScenario,
  DecisionResult,
  DecisionCategory,
} from '../../state/gamesStore';

export class DecisionAnalysisService {
  /**
   * Calculate overall value alignment percentage
   */
  calculateValueAlignment(data1: DecisionData, data2: DecisionData): number {
    let matches = 0;
    const total = Math.min(data1.scenarios.length, data2.scenarios.length);

    for (let i = 0; i < total; i++) {
      if (
        data1.scenarios[i].id === data2.scenarios[i].id &&
        data1.scenarios[i].selectedOption === data2.scenarios[i].selectedOption
      ) {
        matches++;
      }
    }

    return Math.round((matches / total) * 100);
  }

  /**
   * Analyze alignment by category
   */
  analyzeCategoryAlignment(
    data1: DecisionData,
    data2: DecisionData
  ): {
    risk: number;
    ethics: number;
    practical: number;
    emotional: number;
  } {
    const categories: DecisionCategory[] = ['risk', 'ethics', 'practical', 'emotional'];
    const breakdown: any = {};

    categories.forEach((category) => {
      const scenarios1 = data1.scenarios.filter((s) => s.category === category);
      const scenarios2 = data2.scenarios.filter((s) => s.category === category);

      let matches = 0;
      const total = Math.min(scenarios1.length, scenarios2.length);

      for (let i = 0; i < total; i++) {
        if (
          scenarios1[i].id === scenarios2[i].id &&
          scenarios1[i].selectedOption === scenarios2[i].selectedOption
        ) {
          matches++;
        }
      }

      breakdown[category] = total > 0 ? Math.round((matches / total) * 100) : 0;
    });

    return breakdown;
  }

  /**
   * Analyze stress response patterns under time pressure
   */
  analyzeStressResponse(data: DecisionData): {
    becomesMorePragmatic: boolean;
    speedChange: number;
    changeFrequency: number;
  } {
    const highPressure = data.scenarios.filter((s) => s.timerPressure > 60);
    const lowPressure = data.scenarios.filter((s) => s.timerPressure < 40);

    // Calculate average response time for each pressure level
    const avgHighPressure =
      highPressure.reduce((sum, s) => sum + s.responseTime, 0) /
      Math.max(highPressure.length, 1);
    const avgLowPressure =
      lowPressure.reduce((sum, s) => sum + s.responseTime, 0) /
      Math.max(lowPressure.length, 1);

    // Speed change percentage
    const speedChange = Math.round(
      ((avgLowPressure - avgHighPressure) / avgLowPressure) * 100
    );

    // Change frequency
    const changeFrequency = Math.round(
      (data.changeCount / data.scenarios.length) * 100
    );

    // Determine if becomes more pragmatic (chooses safer options under pressure)
    // This is a simplified heuristic - could be enhanced with option analysis
    const becomesMorePragmatic = speedChange < 0; // Slower = more deliberate

    return {
      becomesMorePragmatic,
      speedChange,
      changeFrequency,
    };
  }

  /**
   * Compare stress patterns between twins
   */
  private compareStressPatterns(
    stress1: ReturnType<typeof this.analyzeStressResponse>,
    stress2: ReturnType<typeof this.analyzeStressResponse>
  ): number {
    let score = 0;

    // Pragmatic tendency match (30 points)
    if (stress1.becomesMorePragmatic === stress2.becomesMorePragmatic) {
      score += 30;
    }

    // Speed change similarity (40 points)
    const speedDiff = Math.abs(stress1.speedChange - stress2.speedChange);
    score += Math.max(0, 40 - speedDiff);

    // Change frequency similarity (30 points)
    const freqDiff = Math.abs(stress1.changeFrequency - stress2.changeFrequency);
    score += Math.max(0, 30 - freqDiff / 2);

    return Math.min(100, Math.round(score));
  }

  /**
   * Compare decision profiles and generate result
   */
  compareDecisionProfiles(
    data1: DecisionData,
    data2: DecisionData
  ): DecisionResult {
    const valueAlignment = this.calculateValueAlignment(data1, data2);
    const categoryBreakdown = this.analyzeCategoryAlignment(data1, data2);
    const stress1 = this.analyzeStressResponse(data1);
    const stress2 = this.analyzeStressResponse(data2);
    const stressMatch = this.compareStressPatterns(stress1, stress2);

    // Overall score weighted by alignment and stress pattern match
    const overallScore = Math.round(valueAlignment * 0.7 + stressMatch * 0.3);

    const insights = this.generateInsights(
      valueAlignment,
      categoryBreakdown,
      stress1,
      stress2,
      overallScore
    );

    return {
      gameType: 'decision',
      completedAt: new Date().toISOString(),
      valueAlignment,
      categoryBreakdown,
      stressResponsePattern: stress1,
      synchronicity: {
        overallScore,
      },
      insights,
      shareable: true,
    };
  }

  /**
   * Generate insight statements
   */
  generateInsights(
    alignment: number,
    categoryBreakdown: {
      risk: number;
      ethics: number;
      practical: number;
      emotional: number;
    },
    stress1: ReturnType<typeof this.analyzeStressResponse>,
    stress2: ReturnType<typeof this.analyzeStressResponse>,
    overallScore: number
  ): string[] {
    const insights: string[] = [];

    // Overall alignment
    if (alignment >= 75) {
      insights.push(
        `Your values align ${alignment}% of the time - you share remarkably similar decision-making frameworks!`
      );
    } else if (alignment >= 50) {
      insights.push(
        `You show ${alignment}% value alignment, demonstrating good synchronicity in decision-making.`
      );
    } else {
      insights.push(
        `You have diverse perspectives with ${alignment}% alignment. Your different viewpoints can lead to balanced decisions!`
      );
    }

    // Category insights
    const strongest = Object.entries(categoryBreakdown).reduce((a, b) =>
      b[1] > a[1] ? b : a
    );
    const weakest = Object.entries(categoryBreakdown).reduce((a, b) =>
      b[1] < a[1] ? b : a
    );

    if (strongest[1] >= 70) {
      insights.push(
        `You both show strong agreement on ${strongest[0]} decisions (${strongest[1]}% alignment).`
      );
    }

    if (weakest[1] < 40) {
      insights.push(
        `You have different approaches to ${weakest[0]} decisions, offering complementary perspectives.`
      );
    }

    // Stress response
    if (stress1.becomesMorePragmatic === stress2.becomesMorePragmatic) {
      const style = stress1.becomesMorePragmatic ? 'more deliberate' : 'quicker';
      insights.push(
        `Under pressure, you both become ${style} in your decision-making.`
      );
    } else {
      insights.push(
        `You handle pressure differently - one becomes more deliberate, the other maintains speed. This balance can be beneficial!`
      );
    }

    // Change frequency
    if (Math.abs(stress1.changeFrequency - stress2.changeFrequency) < 15) {
      insights.push(
        `You both change your minds at similar rates (${stress1.changeFrequency}%), showing similar conviction patterns.`
      );
    }

    // Overall synchronicity
    insights.push(
      `Your decision-making synchronicity score: ${overallScore}/100`
    );

    return insights;
  }
}

export const decisionAnalysisService = new DecisionAnalysisService();

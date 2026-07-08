/**
 * Maze Analysis Service - Stories 2.2 & 2.3
 * Analyzes cognitive synchrony maze data and generates insights
 */

import {
  MazeData,
  MazeMove,
  MazeResult,
  GameResult,
} from '../../state/gamesStore';

export class MazeAnalysisService {
  /**
   * Calculate directional preferences from maze moves
   */
  calculateDirectionPreferences(moves: MazeMove[]): {
    up: number;
    down: number;
    left: number;
    right: number;
  } {
    const total = moves.length;
    if (total === 0) {
      return { up: 0, down: 0, left: 0, right: 0 };
    }

    const counts = moves.reduce(
      (acc, move) => {
        acc[move.direction] = (acc[move.direction] || 0) + 1;
        return acc;
      },
      { up: 0, down: 0, left: 0, right: 0 } as Record<string, number>
    );

    return {
      up: Math.round((counts.up / total) * 100),
      down: Math.round((counts.down / total) * 100),
      left: Math.round((counts.left / total) * 100),
      right: Math.round((counts.right / total) * 100),
    };
  }

  /**
   * Analyze error patterns and correction style
   */
  analyzeErrorPatterns(moves: MazeMove[], completionTime: number): {
    errorRate: number;
    correctionStyle: 'immediate' | 'delayed' | 'persistent';
  } {
    const errorMoves = moves.filter((m) => m.wasError);
    const correctedErrors = errorMoves.filter((m) => m.corrected);

    // Error rate per minute
    const timeInMinutes = completionTime / 60000;
    const errorRate = errorMoves.length / timeInMinutes;

    // Determine correction style based on timing
    const avgCorrectionTime = correctedErrors.reduce((acc, move, idx) => {
      if (idx < errorMoves.length - 1) {
        const timeDiff = errorMoves[idx + 1].timestamp - move.timestamp;
        return acc + timeDiff;
      }
      return acc;
    }, 0) / Math.max(correctedErrors.length, 1);

    let correctionStyle: 'immediate' | 'delayed' | 'persistent';
    if (avgCorrectionTime < 2000) {
      correctionStyle = 'immediate';
    } else if (avgCorrectionTime < 5000) {
      correctionStyle = 'delayed';
    } else {
      correctionStyle = 'persistent';
    }

    return {
      errorRate: Math.round(errorRate * 10) / 10,
      correctionStyle,
    };
  }

  /**
   * Calculate direction alignment between two twins
   */
  private calculateDirectionAlignment(
    prefs1: ReturnType<typeof this.calculateDirectionPreferences>,
    prefs2: ReturnType<typeof this.calculateDirectionPreferences>
  ): number {
    const diff =
      Math.abs(prefs1.up - prefs2.up) +
      Math.abs(prefs1.down - prefs2.down) +
      Math.abs(prefs1.left - prefs2.left) +
      Math.abs(prefs1.right - prefs2.right);

    // Convert difference to similarity score (0-100)
    return Math.round(100 - diff / 4);
  }

  /**
   * Calculate error style match between twins
   */
  private calculateErrorStyleMatch(
    style1: string,
    style2: string,
    rate1: number,
    rate2: number
  ): number {
    // Exact match on style = 50 points
    const styleMatch = style1 === style2 ? 50 : 25;

    // Rate similarity = 50 points (closer rates = higher score)
    const rateDiff = Math.abs(rate1 - rate2);
    const rateScore = Math.max(0, 50 - rateDiff * 5);

    return Math.round(styleMatch + rateScore);
  }

  /**
   * Calculate time proximity score
   */
  private calculateTimeProximity(time1: number, time2: number): number {
    const timeDiff = Math.abs(time1 - time2);
    const timeDiffSeconds = timeDiff / 1000;

    // Perfect match (within 5 seconds) = 100
    // 30 second difference = 50
    // 60+ second difference = 0
    if (timeDiffSeconds <= 5) return 100;
    if (timeDiffSeconds >= 60) return 0;

    return Math.round(100 - (timeDiffSeconds / 60) * 100);
  }

  /**
   * Compare two twin sessions and generate result
   */
  compareTwinSessions(session1: MazeData, session2: MazeData): MazeResult {
    const prefs1 = this.calculateDirectionPreferences(session1.moves);
    const prefs2 = this.calculateDirectionPreferences(session2.moves);

    const error1 = this.analyzeErrorPatterns(
      session1.moves,
      session1.completionTime
    );
    const error2 = this.analyzeErrorPatterns(
      session2.moves,
      session2.completionTime
    );

    const directionAlignment = this.calculateDirectionAlignment(prefs1, prefs2);
    const errorStyleMatch = this.calculateErrorStyleMatch(
      error1.correctionStyle,
      error2.correctionStyle,
      error1.errorRate,
      error2.errorRate
    );
    const timeScore = this.calculateTimeProximity(
      session1.completionTime,
      session2.completionTime
    );

    // Weighted overall score
    const overallScore = Math.round(
      directionAlignment * 0.4 + errorStyleMatch * 0.3 + timeScore * 0.3
    );

    const insights = this.generateInsights(
      { prefs1, prefs2 },
      { error1, error2 },
      { time1: session1.completionTime, time2: session2.completionTime },
      overallScore
    );

    return {
      gameType: 'maze',
      completedAt: new Date().toISOString(),
      directionPreferences: prefs1,
      errorRate: error1.errorRate,
      synchronicity: {
        directionAlignment,
        errorStyleMatch,
        overallScore,
      },
      insights,
      shareable: true,
    };
  }

  /**
   * Generate insight statements from analysis
   */
  generateInsights(
    directions: { prefs1: any; prefs2: any },
    errors: { error1: any; error2: any },
    times: { time1: number; time2: number },
    overallScore: number
  ): string[] {
    const insights: string[] = [];

    // Overall synchronicity
    if (overallScore >= 80) {
      insights.push(
        `You're remarkably in sync! Your problem-solving approaches align ${overallScore}% of the time.`
      );
    } else if (overallScore >= 60) {
      insights.push(
        `You show good synchronicity with a ${overallScore}% alignment in problem-solving.`
      );
    } else {
      insights.push(
        `You have complementary problem-solving styles. Your unique approaches (${overallScore}% sync) can strengthen your twin bond!`
      );
    }

    // Direction preferences
    const { prefs1, prefs2 } = directions;
    const dominantDir1 = Object.entries(prefs1).reduce((a, b) =>
      (b[1] as number) > (a[1] as number) ? b : a
    )[0];
    const dominantDir2 = Object.entries(prefs2).reduce((a, b) =>
      (b[1] as number) > (a[1] as number) ? b : a
    )[0];

    if (dominantDir1 === dominantDir2) {
      insights.push(
        `You both favor ${dominantDir1} moves when navigating challenges, showing aligned strategic thinking.`
      );
    } else {
      insights.push(
        `Your navigational preferences differ - you prefer ${dominantDir1} while your twin prefers ${dominantDir2}, offering diverse problem-solving perspectives.`
      );
    }

    // Error correction
    if (errors.error1.correctionStyle === errors.error2.correctionStyle) {
      insights.push(
        `You both handle mistakes with ${errors.error1.correctionStyle} corrections, showing similar resilience patterns.`
      );
    } else {
      insights.push(
        `You have complementary error-handling styles: you're more ${errors.error1.correctionStyle}, your twin is more ${errors.error2.correctionStyle}.`
      );
    }

    // Completion time
    const timeDiff = Math.abs(times.time1 - times.time2) / 1000;
    if (timeDiff < 10) {
      insights.push(
        `You completed the maze within ${Math.round(timeDiff)} seconds of each other - impressive timing synchrony!`
      );
    }

    return insights;
  }
}

export const mazeAnalysisService = new MazeAnalysisService();

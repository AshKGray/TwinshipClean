/**
 * Duo Matching Service - Stories 2.8 & 2.9
 * Matches quiz results to iconic twin duos
 */

import { DuoData, DuoQuestion, DuoResult, IconicDuo } from '../../state/gamesStore';
import { ICONIC_DUOS } from '../../data/iconicDuos';

export class DuoMatchingService {
  /**
   * Score user's answers against all iconic duo archetypes
   */
  scoreDuos(data: DuoData): Map<string, number> {
    const scores = new Map<string, number>();

    ICONIC_DUOS.forEach((duo) => {
      let totalScore = 0;
      let questionCount = 0;

      data.questions.forEach((question) => {
        const trait = this.mapAnswerToTrait(question);
        const traitScore = this.getTraitScore(duo, trait);
        totalScore += traitScore;
        questionCount++;
      });

      const averageScore = totalScore / Math.max(questionCount, 1);
      scores.set(duo.id, averageScore);
    });

    return scores;
  }

  /**
   * Map answer to personality trait
   */
  private mapAnswerToTrait(question: DuoQuestion): string {
    // This maps question categories and answers to trait keywords
    // In production, this would be more sophisticated
    const category = question.category;
    const answer = question.selfAnswer;

    // Simple mapping based on category
    const traitMap: Record<string, string[]> = {
      relationship: ['inseparable', 'independent', 'collaborative', 'balanced'],
      communication: ['synchronized', 'open', 'telepathic', 'complementary'],
      humor: ['playful', 'witty', 'silly', 'clever'],
      conflict: ['harmonious', 'competitive', 'diplomatic', 'direct'],
    };

    const traits = traitMap[category] || ['balanced'];
    return traits[answer] || 'balanced';
  }

  /**
   * Get score for a trait from duo's profile
   */
  private getTraitScore(duo: IconicDuo, trait: string): number {
    // Check if duo has this trait
    if (duo.traits.includes(trait)) {
      return 10; // High match
    }

    // Check for related traits (simplified)
    const relatedTraits: Record<string, string[]> = {
      inseparable: ['synchronized', 'telepathic', 'harmonious'],
      independent: ['balanced', 'complementary', 'diplomatic'],
      playful: ['silly', 'witty', 'clever'],
      competitive: ['direct', 'clever'],
    };

    const related = relatedTraits[trait] || [];
    const hasRelated = related.some((r) => duo.traits.includes(r));

    return hasRelated ? 5 : 2; // Partial match or neutral
  }

  /**
   * Select best matching duo
   */
  selectBestMatch(scores: Map<string, number>): IconicDuo {
    let bestDuoId = '';
    let bestScore = -1;

    scores.forEach((score, duoId) => {
      if (score > bestScore) {
        bestScore = score;
        bestDuoId = duoId;
      }
    });

    const matchedDuo = ICONIC_DUOS.find((d) => d.id === bestDuoId);
    return matchedDuo || ICONIC_DUOS[0]; // Fallback to first duo
  }

  /**
   * Analyze perception gap (self vs twin answers)
   */
  analyzePerceptionGap(data: DuoData): number {
    let matches = 0;
    const total = data.questions.length;

    data.questions.forEach((question) => {
      if (question.selfAnswer === question.twinAnswer) {
        matches++;
      }
    });

    // Return percentage of matching answers
    return Math.round((matches / total) * 100);
  }

  /**
   * Extract key traits from answers
   */
  private extractKeyTraits(data: DuoData): string[] {
    const traitCounts = new Map<string, number>();

    data.questions.forEach((question) => {
      const trait = this.mapAnswerToTrait(question);
      traitCounts.set(trait, (traitCounts.get(trait) || 0) + 1);
    });

    // Sort by frequency and return top 3
    return Array.from(traitCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([trait]) => trait);
  }

  /**
   * Generate complete duo result
   */
  generateDuoResult(data: DuoData): DuoResult {
    const scores = this.scoreDuos(data);
    const matchedDuo = this.selectBestMatch(scores);
    const perceptionGap = this.analyzePerceptionGap(data);
    const keyTraits = this.extractKeyTraits(data);

    // Self-awareness is inverse of perception gap
    const selfAwareness = 100 - perceptionGap;

    // Overall score based on clarity of match
    const bestScore = scores.get(matchedDuo.id) || 0;
    const secondBest = Array.from(scores.values())
      .sort((a, b) => b - a)[1] || 0;
    const clarity = bestScore - secondBest;
    const overallScore = Math.min(100, Math.round(bestScore * 10 + clarity * 5));

    const insights = this.generateInsights(
      matchedDuo,
      perceptionGap,
      selfAwareness,
      keyTraits
    );

    return {
      gameType: 'duo',
      completedAt: new Date().toISOString(),
      matchedDuo,
      perceptionGap,
      keyTraits,
      selfAwareness,
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
    duo: IconicDuo,
    perceptionGap: number,
    selfAwareness: number,
    keyTraits: string[]
  ): string[] {
    const insights: string[] = [];

    // Duo match
    insights.push(`You're like ${duo.name}! ${duo.description}`);

    // Archetype
    insights.push(`Your twin archetype: "${duo.archetype}"`);

    // Key traits
    if (keyTraits.length > 0) {
      insights.push(
        `Your defining traits: ${keyTraits.join(', ')}. These qualities shaped your match!`
      );
    }

    // Self-awareness
    if (selfAwareness >= 70) {
      insights.push(
        `You know your twin well! ${selfAwareness}% of your predictions about them were accurate.`
      );
    } else if (selfAwareness >= 50) {
      insights.push(
        `You have decent insight into your twin (${selfAwareness}% accuracy). There's always more to discover!`
      );
    } else {
      insights.push(
        `You and your twin might surprise each other! Only ${selfAwareness}% of predictions matched, showing you both have room to learn.`
      );
    }

    // Perception gap
    if (perceptionGap < 20) {
      insights.push(
        `Your self-perception and twin perception are remarkably aligned - you see each other clearly!`
      );
    } else if (perceptionGap > 40) {
      insights.push(
        `There's an interesting gap between how you see yourself and how your twin sees you. Explore these differences together!`
      );
    }

    return insights;
  }

  /**
   * Generate shareable result card data
   */
  generateShareCard(result: DuoResult): {
    title: string;
    subtitle: string;
    traits: string[];
  } {
    return {
      title: result.matchedDuo.name,
      subtitle: result.matchedDuo.archetype,
      traits: result.keyTraits.slice(0, 3),
    };
  }
}

export const duoMatchingService = new DuoMatchingService();

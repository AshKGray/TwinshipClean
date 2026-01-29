/**
 * Emotion Analysis Service - Stories 2.4 & 2.5
 * Analyzes emotional resonance mapping data and calculates vocabulary overlap
 */

import {
  EmotionData,
  EmotionAssociation,
  EmotionResult,
  EmotionWord,
} from '../../state/gamesStore';

export class EmotionAnalysisService {
  /**
   * Calculate Jaccard similarity between two sets
   */
  private jaccardSimilarity<T>(set1: Set<T>, set2: Set<T>): number {
    const intersection = new Set([...set1].filter((x) => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    if (union.size === 0) return 0;
    return intersection.size / union.size;
  }

  /**
   * Calculate vocabulary overlap percentage between twins
   */
  calculateVocabularyOverlap(data1: EmotionData, data2: EmotionData): number {
    // Create sets of emotion-image pairs
    const pairs1 = new Set(
      data1.associations.flatMap((assoc) =>
        assoc.selectedImages.map((img) => `${assoc.emotion}-${img}`)
      )
    );

    const pairs2 = new Set(
      data2.associations.flatMap((assoc) =>
        assoc.selectedImages.map((img) => `${assoc.emotion}-${img}`)
      )
    );

    const similarity = this.jaccardSimilarity(pairs1, pairs2);
    return Math.round(similarity * 100);
  }

  /**
   * Find shared associations between twins for each emotion
   */
  findSharedAssociations(
    data1: EmotionData,
    data2: EmotionData
  ): Array<{
    emotion: EmotionWord;
    images: number[];
    confidence: number;
  }> {
    const shared: Array<{
      emotion: EmotionWord;
      images: number[];
      confidence: number;
    }> = [];

    // For each emotion, find common image selections
    data1.associations.forEach((assoc1) => {
      const assoc2 = data2.associations.find(
        (a) => a.emotion === assoc1.emotion
      );

      if (!assoc2) return;

      const commonImages = assoc1.selectedImages.filter((img) =>
        assoc2.selectedImages.includes(img)
      );

      if (commonImages.length > 0) {
        // Confidence based on percentage of overlap
        const confidence = Math.round(
          (commonImages.length /
            Math.max(
              assoc1.selectedImages.length,
              assoc2.selectedImages.length
            )) *
            100
        );

        shared.push({
          emotion: assoc1.emotion,
          images: commonImages,
          confidence,
        });
      }
    });

    return shared.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Calculate response consistency score
   */
  private calculateConsistency(data1: EmotionData, data2: EmotionData): number {
    // Measure how similar the selection counts are
    const avgSelections1 =
      data1.associations.reduce(
        (sum, a) => sum + a.selectedImages.length,
        0
      ) / data1.associations.length;
    const avgSelections2 =
      data2.associations.reduce(
        (sum, a) => sum + a.selectedImages.length,
        0
      ) / data2.associations.length;

    const diff = Math.abs(avgSelections1 - avgSelections2);
    // Perfect consistency = same average selections
    // 5+ difference in average = low consistency
    return Math.max(0, Math.round(100 - diff * 20));
  }

  /**
   * Compare emotional profiles and generate result
   */
  compareEmotionalProfiles(
    data1: EmotionData,
    data2: EmotionData
  ): EmotionResult {
    const vocabularyOverlap = this.calculateVocabularyOverlap(data1, data2);
    const sharedAssociations = this.findSharedAssociations(data1, data2);
    const consistency = this.calculateConsistency(data1, data2);

    // Overall score weighted by overlap and consistency
    const overallScore = Math.round(
      vocabularyOverlap * 0.7 + consistency * 0.3
    );

    const insights = this.generateInsights(
      vocabularyOverlap,
      sharedAssociations,
      overallScore
    );

    return {
      gameType: 'emotion',
      completedAt: new Date().toISOString(),
      vocabularyOverlap,
      sharedAssociations,
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
    overlap: number,
    shared: Array<{ emotion: EmotionWord; images: number[]; confidence: number }>,
    overallScore: number
  ): string[] {
    const insights: string[] = [];

    // Overall overlap
    if (overlap >= 70) {
      insights.push(
        `Your emotional vocabularies overlap by ${overlap}% - you process and express emotions in remarkably similar ways!`
      );
    } else if (overlap >= 50) {
      insights.push(
        `You share ${overlap}% emotional vocabulary overlap, showing good emotional synchronicity.`
      );
    } else {
      insights.push(
        `You have unique emotional processing styles with ${overlap}% overlap. Your different perspectives can enrich your twin bond!`
      );
    }

    // Strongest shared associations
    if (shared.length > 0) {
      const strongest = shared[0];
      insights.push(
        `You both strongly associate "${strongest.emotion}" with similar imagery (${strongest.confidence}% match), showing deep emotional alignment.`
      );
    }

    // Number of shared patterns
    const highConfidence = shared.filter((s) => s.confidence >= 70).length;
    if (highConfidence >= 4) {
      insights.push(
        `You have ${highConfidence} emotions with strong shared associations - impressive emotional resonance!`
      );
    } else if (highConfidence > 0) {
      insights.push(
        `You share strong associations for ${highConfidence} emotions, with room to explore your unique emotional expressions.`
      );
    }

    // Overall synchronicity
    insights.push(
      `Your emotional processing synchronicity: ${overallScore}/100`
    );

    return insights;
  }
}

export const emotionAnalysisService = new EmotionAnalysisService();

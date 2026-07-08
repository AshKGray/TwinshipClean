# Story 2.5: Emotional Resonance Mapping - Vocabulary Overlap Analysis

Status: drafted

## Story

As a **user who completed the Emotional Resonance Mapping game**,
I want **to see how my emotional vocabulary overlaps with my twin**,
so that **I understand how similarly we process and express emotions**.

## Acceptance Criteria

1. Calculate percentage overlap in image-emotion associations
2. Identify shared emotional patterns between twins
3. Generate insights about emotional synchronicity
4. Visualize shared vs unique associations (e.g., Venn diagram)
5. Highlight strongest commonalities
6. Display synchronicity score (0-100)
7. Store results in assessment store
8. Handle waiting state if twin hasn't completed yet

## Tasks / Subtasks

- [ ] **Task 1**: Implement vocabulary overlap calculation (AC: 1)
  - [ ] Create `src/services/games/emotionAnalysis.ts`
  - [ ] Implement `calculateVocabularyOverlap()`:
    ```typescript
    function calculateVocabularyOverlap(
      data1: EmotionData,
      data2: EmotionData
    ): number {
      // Use Jaccard similarity or similar algorithm
      const intersection = getIntersection(data1, data2);
      const union = getUnion(data1, data2);
      return (intersection.size / union.size) * 100;
    }
    ```
  - [ ] Calculate Jaccard similarity coefficient
  - [ ] Return percentage (0-100)

- [ ] **Task 2**: Identify shared associations (AC: 2, 5)
  - [ ] Implement `findSharedAssociations()`:
    ```typescript
    function findSharedAssociations(
      data1: EmotionData,
      data2: EmotionData
    ): SharedAssociation[] {
      // Find emotions where both twins selected same images
    }
    ```
  - [ ] For each emotion, find common image selections
  - [ ] Calculate confidence score for each shared association
  - [ ] Sort by strength of commonality

- [ ] **Task 3**: Implement comparison algorithm (AC: 1-6)
  - [ ] Implement `compareEmotionalProfiles()`:
    ```typescript
    function compareEmotionalProfiles(
      data1: EmotionData,
      data2: EmotionData
    ): EmotionResult
    ```
  - [ ] Calculate overall vocabulary overlap
  - [ ] Find shared associations
  - [ ] Identify unique patterns for each twin
  - [ ] Calculate synchronicity score
  - [ ] Return EmotionResult object

- [ ] **Task 4**: Implement insight generation (AC: 3)
  - [ ] Implement `generateInsights()`:
    ```typescript
    function generateInsights(result: EmotionResult): string[]
    ```
  - [ ] Create insight templates:
    - "Your emotional vocabularies overlap by {percentage}%"
    - "You both strongly associate {emotion} with {image type}"
    - "You have {count} unique emotional associations"
    - "Your emotional processing synchronicity: {score}/100"
  - [ ] Populate with actual data
  - [ ] Return insight array

- [ ] **Task 5**: Implement EmotionResults UI (AC: 4-6)
  - [ ] Create `src/screens/games/EmotionResults.tsx`
  - [ ] Display synchronicity score prominently
  - [ ] Create Venn diagram or overlap visualization:
    - Shared associations in overlap area
    - Unique associations in separate areas
  - [ ] List shared emotional patterns
  - [ ] Show strongest commonalities
  - [ ] Display generated insights
  - [ ] Add share functionality

- [ ] **Task 6**: Implement visualization (AC: 4)
  - [ ] Create overlap visualization component
  - [ ] Options:
    - Venn diagram (two circles overlapping)
    - Grid view (shared in center, unique on sides)
    - Network graph (connections between emotions and images)
  - [ ] Use React Native SVG or chart library
  - [ ] Make it interactive (tap to see details)

- [ ] **Task 7**: Handle twin pending state (AC: 8)
  - [ ] Check if twin has completed game
  - [ ] Show waiting state if not
  - [ ] Display user's solo stats
  - [ ] Add notification option

- [ ] **Task 8**: Persist results (AC: 7)
  - [ ] Save EmotionResult to assessmentStore
  - [ ] Link to both twin sessions
  - [ ] Mark sessions as analyzed
  - [ ] Persist to AsyncStorage

- [ ] **Task 9**: Write unit tests
  - [ ] Test overlap calculation algorithm
  - [ ] Test shared association detection
  - [ ] Test insight generation
  - [ ] Test edge cases (no overlap, 100% overlap)

- [ ] **Task 10**: Write integration tests
  - [ ] Test complete analysis flow
  - [ ] Test result persistence
  - [ ] Test visualization rendering

## Dev Notes

### Architecture Patterns and Constraints

**Overlap Algorithm:**
- Jaccard similarity for set comparison
- Consider both image selections and emotion mappings
- Weight by frequency of shared selections

**Synchronicity Scoring:**
- Based on vocabulary overlap percentage
- Additional factors: consistency, confidence
- Normalized to 0-100 scale

**Performance:**
- Analysis completes in < 2 seconds
- Calculations done on client side
- Results cached for quick re-display

**Navigation Flow:**
```
EmotionalResonanceGame (Story 2.4)
  → EmotionResults (Story 2.5) ← YOU ARE HERE
  → [Can navigate to other games or dashboard]
```

### Source Tree Components

**Files to Create:**
- `src/screens/games/EmotionResults.tsx` - Results display
- `src/services/games/emotionAnalysis.ts` - Analysis algorithms
- `src/components/games/OverlapVisualization.tsx` - Venn diagram or similar
- `src/components/games/SharedPatternsList.tsx` - List of commonalities

**Files to Modify:**
- `src/state/assessmentStore.ts` - Add result storage
- `src/navigation/AppNavigator.tsx` - Add EmotionResults route

**Design System Components:**
- Galaxy background
- NativeWind for styling
- React Native SVG for visualizations
- Share functionality

### Testing Standards Summary

**Unit Test Coverage Target:** 80%

**Key Test Files:**
- `__tests__/services/games/emotionAnalysis.test.ts`
- `__tests__/screens/games/EmotionResults.test.tsx`
- `__tests__/components/games/OverlapVisualization.test.tsx`

**Testing Framework:**
- Jest + React Native Testing Library
- Mock emotion data
- Test various overlap scenarios

### Project Structure Notes

**Jaccard Similarity:**
```typescript
function jaccardSimilarity<T>(set1: Set<T>, set2: Set<T>): number {
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return intersection.size / union.size;
}
```

**Shared Association Detection:**
```typescript
function findSharedForEmotion(
  emotion: EmotionWord,
  data1: EmotionData,
  data2: EmotionData
): number[] {
  const images1 = data1.associations
    .find(a => a.emotion === emotion)?.selectedImages || [];
  const images2 = data2.associations
    .find(a => a.emotion === emotion)?.selectedImages || [];

  return images1.filter(img => images2.includes(img));
}
```

**Synchronicity Score Formula:**
```typescript
function calculateEmotionSynchronicity(
  data1: EmotionData,
  data2: EmotionData
): number {
  const vocabularyOverlap = calculateVocabularyOverlap(data1, data2);
  const consistencyScore = calculateConsistency(data1, data2);

  return (vocabularyOverlap * 0.7) + (consistencyScore * 0.3);
}
```

**No Detected Conflicts**

### References

- [Source: docs/tech-spec-epic-2.md#Data-Models-and-Contracts] EmotionResult interface
- [Source: docs/tech-spec-epic-2.md#APIs-and-Interfaces] EmotionAnalysisService methods
- [Source: docs/tech-spec-epic-2.md#Workflows-and-Sequencing] Emotion result flow
- [Source: docs/epics.md#Story-2.5] Epic story definition
- [Source: docs/Twinship PRD.md#Emotional-Resonance-Mapping] Insights description

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by story-context workflow -->

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

<!-- Links to debug logs will be added during implementation -->

### Completion Notes List

<!-- Implementation notes will be added here by dev agent -->

### File List

<!-- Files created/modified will be listed here by dev agent -->

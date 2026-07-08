# Story 2.7: Temporal Decision Synchrony - Value Alignment Analysis

Status: drafted

## Story

As a **user who completed the Temporal Decision Synchrony game**,
I want **to see how my values and stress responses align with my twin**,
so that **I understand our decision-making synchronicity under pressure**.

## Acceptance Criteria

1. Calculate value alignment percentage across all decisions
2. Analyze alignment by category (risk, ethics, practical, emotional)
3. Measure stress response patterns (speed changes under pressure)
4. Generate insights about decision-making styles
5. Display synchronicity score (0-100)
6. Visualize category breakdown (charts)
7. Store results in assessment store
8. Handle waiting state if twin hasn't completed

## Tasks / Subtasks

- [ ] **Task 1**: Implement value alignment calculation (AC: 1-2)
  - [ ] Create `src/services/games/decisionAnalysis.ts`
  - [ ] Implement `calculateValueAlignment()`:
    ```typescript
    function calculateValueAlignment(
      data1: DecisionData,
      data2: DecisionData
    ): number {
      const matches = countMatchingDecisions(data1, data2);
      const total = data1.scenarios.length;
      return (matches / total) * 100;
    }
    ```
  - [ ] Calculate category breakdown:
    ```typescript
    function analyzeCategoryAlignment(
      data1: DecisionData,
      data2: DecisionData
    ): CategoryBreakdown {
      return {
        risk: calculateAlignmentForCategory('risk', data1, data2),
        ethics: calculateAlignmentForCategory('ethics', data1, data2),
        practical: calculateAlignmentForCategory('practical', data1, data2),
        emotional: calculateAlignmentForCategory('emotional', data1, data2)
      };
    }
    ```

- [ ] **Task 2**: Implement stress response analysis (AC: 3)
  - [ ] Implement `analyzeStressResponse()`:
    ```typescript
    function analyzeStressResponse(data: DecisionData): StressResponsePattern {
      const highPressure = scenarios.filter(s => s.timerPressure > 60);
      const lowPressure = scenarios.filter(s => s.timerPressure < 40);

      return {
        becomesMorePragmatic: analyzePragmatismShift(highPressure, lowPressure),
        speedChange: calculateSpeedChange(highPressure, lowPressure),
        changeFrequency: data.changeCount / data.scenarios.length
      };
    }
    ```
  - [ ] Compare decision patterns under high vs low pressure
  - [ ] Calculate speed changes

- [ ] **Task 3**: Implement comparison algorithm (AC: 1-5)
  - [ ] Implement `compareDecisionProfiles()`:
    ```typescript
    function compareDecisionProfiles(
      data1: DecisionData,
      data2: DecisionData
    ): DecisionResult
    ```
  - [ ] Calculate overall value alignment
  - [ ] Analyze category breakdowns
  - [ ] Compare stress response patterns
  - [ ] Calculate synchronicity score
  - [ ] Return DecisionResult object

- [ ] **Task 4**: Implement insight generation (AC: 4)
  - [ ] Implement `generateInsights()`:
    ```typescript
    function generateInsights(result: DecisionResult): string[]
    ```
  - [ ] Create insight templates:
    - "Your values align {percentage}% of the time"
    - "You both show strong agreement on {category} decisions"
    - "Under pressure, you both become {X}% more {trait}"
    - "Your decision-making synchronicity: {score}/100"
  - [ ] Populate with data
  - [ ] Return array of insights

- [ ] **Task 5**: Implement DecisionResults UI (AC: 5-6)
  - [ ] Create `src/screens/games/DecisionResults.tsx`
  - [ ] Display synchronicity score prominently
  - [ ] Show category breakdown chart:
    - Radar/spider chart showing alignment per category
    - Or bar chart with categories
  - [ ] Show stress response comparison
  - [ ] Display generated insights
  - [ ] Add share functionality

- [ ] **Task 6**: Create visualizations (AC: 6)
  - [ ] Category alignment chart (radar or bars)
  - [ ] Stress response comparison
  - [ ] Value alignment percentage (progress circle)
  - [ ] Use React Native SVG or chart library

- [ ] **Task 7**: Handle twin pending state (AC: 8)
  - [ ] Check if twin completed
  - [ ] Show waiting state
  - [ ] Display solo stats

- [ ] **Task 8**: Persist results (AC: 7)
  - [ ] Save DecisionResult to assessmentStore
  - [ ] Link to both sessions
  - [ ] Persist to AsyncStorage

- [ ] **Task 9**: Write unit tests
  - [ ] Test alignment calculation
  - [ ] Test category breakdown
  - [ ] Test stress response analysis
  - [ ] Test insight generation

- [ ] **Task 10**: Write integration tests
  - [ ] Test complete analysis flow
  - [ ] Test result display
  - [ ] Test data persistence

## Dev Notes

### Architecture Patterns and Constraints

**Analysis Approach:**
- Compare decision matches across all scenarios
- Weight categories equally or by importance
- Analyze behavioral patterns under time pressure

**Synchronicity Scoring:**
- Based on value alignment + stress response similarity
- Weighted: 70% alignment, 30% stress pattern match
- Normalized to 0-100 scale

**Navigation Flow:**
```
TemporalDecisionGame (Story 2.6)
  → DecisionResults (Story 2.7) ← YOU ARE HERE
  → [Dashboard or other games]
```

### Source Tree Components

**Files to Create:**
- `src/screens/games/DecisionResults.tsx` - Results display
- `src/services/games/decisionAnalysis.ts` - Analysis algorithms
- `src/components/games/CategoryChart.tsx` - Category breakdown visualization

**Files to Modify:**
- `src/state/assessmentStore.ts` - Add result storage
- `src/navigation/AppNavigator.tsx` - Add DecisionResults route

**Design System Components:**
- Galaxy background
- NativeWind styling
- React Native Chart Kit or SVG
- Share functionality

### Testing Standards Summary

**Unit Test Coverage Target:** 80%

**Key Test Files:**
- `__tests__/services/games/decisionAnalysis.test.ts`
- `__tests__/screens/games/DecisionResults.test.tsx`

### Project Structure Notes

**Synchronicity Score:**
```typescript
function calculateDecisionSynchronicity(
  data1: DecisionData,
  data2: DecisionData
): number {
  const alignment = calculateValueAlignment(data1, data2);
  const stressMatch = compareStressPatterns(data1, data2);

  return (alignment * 0.7) + (stressMatch * 0.3);
}
```

**No Detected Conflicts**

### References

- [Source: docs/tech-spec-epic-2.md#Data-Models-and-Contracts] DecisionResult interface
- [Source: docs/tech-spec-epic-2.md#APIs-and-Interfaces] DecisionAnalysisService
- [Source: docs/epics.md#Story-2.7] Epic story definition

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

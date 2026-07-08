# Story 2.9: Iconic Duo Quiz - Result Matching and Display

Status: drafted

## Story

As a **user who completed the Iconic Duo quiz**,
I want **to see which iconic twin duo we match and why**,
so that **I get a fun, shareable result about our twin relationship**.

## Acceptance Criteria

1. Match quiz answers to iconic duo archetypes
2. Display matched duo with image and description
3. Show key traits that led to the match
4. Compare self vs twin perception differences (self-awareness score)
5. Generate shareable result card for social media
6. Store result in assessment history
7. Fun, celebratory presentation style

## Tasks / Subtasks

- [ ] **Task 1**: Create iconic duo database (AC: 1)
  - [ ] Define 8-10 iconic twin/duo pairs:
    ```typescript
    interface IconicDuo {
      id: string;
      name: string; // "Fred & George Weasley"
      description: string;
      image: string; // Asset path
      traits: string[];
      archetype: string; // "Synchronized Mischief"
      traitScores: Map<string, number>; // For matching
    }
    ```
  - [ ] Suggested duos:
    - Fred & George Weasley (synchronized mischief)
    - Mario & Luigi (complementary strengths)
    - Mary-Kate & Ashley Olsen (business partners)
    - Zack & Cody (opposite personalities)
    - And 4-6 more
  - [ ] Store in `src/data/iconicDuos.ts`

- [ ] **Task 2**: Implement matching algorithm (AC: 1-3)
  - [ ] Create `src/services/games/duoMatching.ts`
  - [ ] Implement `scoreDuos()`:
    ```typescript
    function scoreDuos(data: DuoData): Map<string, number> {
      // Score user's answers against each duo's trait profile
      // Return scores for all duos
    }
    ```
  - [ ] Implement `selectBestMatch()`:
    ```typescript
    function selectBestMatch(scores: Map<string, number>): IconicDuo {
      // Return highest-scoring duo
    }
    ```
  - [ ] Extract key traits from answers

- [ ] **Task 3**: Implement self-awareness analysis (AC: 4)
  - [ ] Implement `analyzePerceptionGap()`:
    ```typescript
    function analyzePerceptionGap(data: DuoData): number {
      const matches = data.questions.filter(
        q => q.selfAnswer === q.twinAnswer
      ).length;
      return (matches / data.questions.length) * 100;
    }
    ```
  - [ ] Calculate percentage of matching answers
  - [ ] Generate insights about self-awareness

- [ ] **Task 4**: Implement result generation (AC: 1-4, 6)
  - [ ] Implement `generateDuoResult()`:
    ```typescript
    function generateDuoResult(data: DuoData): DuoResult
    ```
  - [ ] Score all duos
  - [ ] Select best match
  - [ ] Calculate perception gap
  - [ ] Extract key traits
  - [ ] Return complete DuoResult

- [ ] **Task 5**: Implement DuoResults UI (AC: 2-3, 7)
  - [ ] Create `src/screens/games/DuoResults.tsx`
  - [ ] Display matched duo prominently:
    - Duo image/illustration
    - Duo name
    - Archetype tagline
    - Description
  - [ ] Show key matching traits
  - [ ] Display self-awareness score
  - [ ] Fun, celebratory design
  - [ ] Confetti or celebration animation

- [ ] **Task 6**: Implement share card generation (AC: 5)
  - [ ] Implement `generateShareCard()`:
    ```typescript
    function generateShareCard(result: DuoResult): ShareCard
    ```
  - [ ] Create visual result card:
    - Duo image
    - Duo name
    - Key trait
    - Twinship branding
  - [ ] Use React Native ViewShot to capture as image
  - [ ] Add share functionality (React Native Share)

- [ ] **Task 7**: Persist results (AC: 6)
  - [ ] Save DuoResult to assessmentStore
  - [ ] Link to quiz session
  - [ ] Persist to AsyncStorage

- [ ] **Task 8**: Write unit tests
  - [ ] Test duo scoring algorithm
  - [ ] Test best match selection
  - [ ] Test perception gap calculation
  - [ ] Test share card generation

- [ ] **Task 9**: Write integration tests
  - [ ] Test complete result flow
  - [ ] Test result display
  - [ ] Test sharing functionality

## Dev Notes

### Architecture Patterns and Constraints

**Matching Algorithm:**
- Trait-based scoring system
- Each duo has trait profile
- User answers map to traits
- Highest score wins

**Result Presentation:**
- Fun, lighthearted tone
- Celebrate the match
- Shareable format (social media friendly)

**Navigation Flow:**
```
IconicDuoQuiz (Story 2.8)
  → DuoResults (Story 2.9) ← YOU ARE HERE
  → [Share or return to games hub]
```

### Source Tree Components

**Files to Create:**
- `src/screens/games/DuoResults.tsx` - Results display
- `src/services/games/duoMatching.ts` - Matching algorithms
- `src/data/iconicDuos.ts` - Duo database
- `src/components/games/DuoShareCard.tsx` - Shareable card component

**Files to Modify:**
- `src/state/assessmentStore.ts` - Add result storage
- `src/navigation/AppNavigator.tsx` - Add DuoResults route

**Design System Components:**
- Galaxy background
- NativeWind styling
- React Native ViewShot for screenshots
- React Native Share
- Celebration animations (confetti)

**Iconic Duo Examples:**
```typescript
{
  id: 'fred-george',
  name: 'Fred & George Weasley',
  description: 'The ultimate prankster pair who finish each other\'s sentences and schemes.',
  archetype: 'Synchronized Mischief',
  traits: ['playful', 'creative', 'inseparable', 'mischievous'],
  traitScores: {
    humor: 10,
    independence: 3,
    communication: 9,
    adventure: 8
  }
}
```

### Testing Standards Summary

**Unit Test Coverage Target:** 80%

**Key Test Files:**
- `__tests__/services/games/duoMatching.test.ts`
- `__tests__/screens/games/DuoResults.test.tsx`
- `__tests__/data/iconicDuos.test.ts`

### Project Structure Notes

**Scoring Formula:**
```typescript
function scoreForDuo(answers: DuoData, duo: IconicDuo): number {
  let score = 0;
  answers.questions.forEach(q => {
    const trait = mapAnswerToTrait(q.selfAnswer);
    score += duo.traitScores[trait] || 0;
  });
  return score / answers.questions.length;
}
```

**Share Card Template:**
```
┌─────────────────────────┐
│                         │
│    [Duo Illustration]   │
│                         │
│  You're like Fred &     │
│   George Weasley!       │
│                         │
│ "Synchronized Mischief" │
│                         │
│    ~ Twinship ~         │
└─────────────────────────┘
```

**No Detected Conflicts**

### References

- [Source: docs/tech-spec-epic-2.md#Data-Models-and-Contracts] DuoResult interface
- [Source: docs/tech-spec-epic-2.md#APIs-and-Interfaces] DuoMatchingService
- [Source: docs/tech-spec-epic-2.md#Appendix] Iconic duo database examples
- [Source: docs/epics.md#Story-2.9] Epic story definition

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

# Story 2.8: Iconic Duo Quiz - Personality Assessment

Status: drafted

## Story

As a **user taking the Iconic Duo quiz**,
I want **to answer personality questions about myself and my twin**,
so that **I can discover which famous twin duo we most resemble**.

## Acceptance Criteria

1. Present 15-20 personality questions
2. Questions cover: relationship style, communication, humor, conflict resolution
3. Multiple choice answers (4-5 options per question)
4. User answers twice per question: "About You" and "About Your Twin"
5. Track self-perception vs twin-perception differences
6. Fun, engaging copy and visuals (lighthearted tone)
7. Progress indicator
8. Save quiz data on completion

## Tasks / Subtasks

- [ ] **Task 1**: Create quiz question database (AC: 1-3, 6)
  - [ ] Write 20 personality questions covering:
    - Relationship dynamics
    - Communication style
    - Sense of humor
    - Conflict resolution
    - Shared interests
    - Independence vs togetherness
  - [ ] Store in `src/data/duoQuizQuestions.ts`
  - [ ] Fun, lighthearted tone
  - [ ] Each question structure:
    ```typescript
    interface DuoQuestion {
      id: string;
      category: 'relationship' | 'communication' | 'humor' | 'conflict';
      question: string;
      options: string[];
    }
    ```

- [ ] **Task 2**: Implement IconicDuoQuiz UI (AC: 1, 3-4, 7)
  - [ ] Create `src/screens/games/IconicDuoQuiz.tsx`
  - [ ] Display current question
  - [ ] Show two answer sections:
    - "About You" (answer for self)
    - "About Your Twin" (predict twin's answer)
  - [ ] Render option buttons (4-5 per question)
  - [ ] Progress indicator (e.g., "Question 5 of 15")
  - [ ] Next button (enabled after both answers given)

- [ ] **Task 3**: Implement dual-answer tracking (AC: 4-5)
  - [ ] For each question, collect two answers:
    ```typescript
    {
      question: string,
      selfAnswer: number,  // Index of selected option
      twinAnswer: number   // Index of predicted option
    }
    ```
  - [ ] Track if answers match (self-awareness check)
  - [ ] Store both answers before advancing

- [ ] **Task 4**: Implement question progression (AC: 7)
  - [ ] Loop through 15 questions
  - [ ] Animate transitions between questions
  - [ ] Clear selections for next question
  - [ ] Track overall progress

- [ ] **Task 5**: Complete quiz and save data (AC: 8)
  - [ ] Create DuoData object:
    ```typescript
    {
      questions: DuoQuestion[],
      // each with selfAnswer and twinAnswer
    }
    ```
  - [ ] Save to assessmentStore GameSession
  - [ ] Navigate to DuoResults (Story 2.9)

- [ ] **Task 6**: Add visual polish (AC: 6)
  - [ ] Fun illustrations or icons for each question
  - [ ] Galaxy-themed card design
  - [ ] Smooth animations
  - [ ] Haptic feedback on selections

- [ ] **Task 7**: Write unit tests
  - [ ] Test dual-answer collection
  - [ ] Test question progression
  - [ ] Test data structure creation

- [ ] **Task 8**: Write integration tests
  - [ ] Test complete quiz flow
  - [ ] Test data persistence

## Dev Notes

### Architecture Patterns and Constraints

**Quiz Structure:**
- 15 questions (keeps it concise and engaging)
- Dual-answer format unique to this game
- Lighthearted, fun tone

**State Management:**
- Local state for current question and answers
- assessmentStore for completed session
- No complex calculations (saved for Story 2.9)

**Navigation Flow:**
```
PsychicGamesHub
  → IconicDuoQuiz (Story 2.8) ← YOU ARE HERE
  → DuoResults (Story 2.9)
```

### Source Tree Components

**Files to Create:**
- `src/screens/games/IconicDuoQuiz.tsx` - Main quiz screen
- `src/data/duoQuizQuestions.ts` - Question database
- `src/components/games/DualAnswerSection.tsx` - Two-answer UI component

**Files to Modify:**
- `src/state/assessmentStore.ts` - Add duo quiz session
- `src/navigation/AppNavigator.tsx` - Add IconicDuoQuiz route

**Design System Components:**
- Galaxy background
- NativeWind styling
- Fun illustrations/icons
- Smooth animations

**Example Questions:**
```typescript
{
  id: 'q1',
  category: 'relationship',
  question: 'How do you typically spend time together?',
  options: [
    'Constant adventures and new experiences',
    'Comfortable routines and familiar activities',
    'A mix of both depending on the mood',
    'Separate activities, checking in regularly'
  ]
},
{
  id: 'q2',
  category: 'communication',
  question: 'How do you communicate when apart?',
  options: [
    'Constant messaging all day long',
    'Regular check-ins but independent',
    'Telepathic connection (just kidding... mostly)',
    'Only when something important happens'
  ]
}
```

### Testing Standards Summary

**Unit Test Coverage Target:** 80%

**Key Test Files:**
- `__tests__/screens/games/IconicDuoQuiz.test.tsx`
- `__tests__/data/duoQuizQuestions.test.ts`

### Project Structure Notes

**Dual Answer UI:**
```
┌─────────────────────────────┐
│ Question text here          │
├─────────────────────────────┤
│ About You:                  │
│ ○ Option 1                  │
│ ○ Option 2                  │
│ ○ Option 3                  │
├─────────────────────────────┤
│ About Your Twin:            │
│ ○ Option 1                  │
│ ○ Option 2                  │
│ ○ Option 3                  │
└─────────────────────────────┘
```

**No Detected Conflicts**

### References

- [Source: docs/tech-spec-epic-2.md#Data-Models-and-Contracts] DuoData interface
- [Source: docs/tech-spec-epic-2.md#Workflows-and-Sequencing] Duo quiz flow
- [Source: docs/epics.md#Story-2.8] Epic story definition

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

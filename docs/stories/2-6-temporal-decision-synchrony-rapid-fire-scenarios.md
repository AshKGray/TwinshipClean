# Story 2.6: Temporal Decision Synchrony - Rapid-Fire Scenarios

Status: drafted

## Story

As a **user playing the Temporal Decision Synchrony game**,
I want **to make quick decisions on various scenarios under time pressure**,
so that **my decision-making patterns and stress responses can be analyzed**.

## Acceptance Criteria

1. Present 20-25 decision scenarios sequentially
2. Display 5-second countdown timer per scenario
3. Provide binary or multiple choice options (2-4 options)
4. Record decision and exact response time for each scenario
5. Track if user changes their answer before timer expires
6. Visual pressure feedback as timer counts down
7. Haptic feedback at critical time points (< 2 seconds remaining)
8. Save all decision data to game session on completion
9. Scenarios cover different categories (risk, ethics, practical, emotional)

## Tasks / Subtasks

- [ ] **Task 1**: Create scenario database (AC: 1, 9)
  - [ ] Write 25+ decision scenarios covering:
    - Risk tolerance (financial, physical)
    - Ethical dilemmas (moral choices)
    - Practical decisions (everyday choices)
    - Emotional responses (relationship scenarios)
  - [ ] Store in `src/data/decisionScenarios.ts`
  - [ ] Each scenario structure:
    ```typescript
    interface Scenario {
      id: string;
      category: 'risk' | 'ethics' | 'practical' | 'emotional';
      question: string;
      options: string[];
    }
    ```

- [ ] **Task 2**: Implement TemporalDecisionGame UI (AC: 1-3, 6)
  - [ ] Create `src/screens/games/TemporalDecisionGame.tsx`
  - [ ] Display current scenario question
  - [ ] Show 5-second countdown timer (circular or bar)
  - [ ] Render option buttons (2-4 depending on scenario)
  - [ ] Visual timer pressure:
    - Green: > 3 seconds
    - Yellow: 2-3 seconds
    - Red: < 2 seconds
  - [ ] Progress indicator (e.g., "Scenario 5 of 20")

- [ ] **Task 3**: Implement timer logic (AC: 2, 6-7)
  - [ ] Start 5-second countdown when scenario appears
  - [ ] Update timer display every 100ms for smooth animation
  - [ ] Trigger haptic feedback at 2 seconds remaining
  - [ ] Auto-advance when timer reaches 0 (record no-answer if needed)
  - [ ] Pause timer when user makes selection (optional)
  - [ ] Color-code timer based on remaining time

- [ ] **Task 4**: Implement decision tracking (AC: 4-5)
  - [ ] Record when user taps option
  - [ ] Calculate exact response time (ms from scenario start)
  - [ ] Track answer changes:
    - If user taps different option before timer ends
    - Record both initial and final choice
  - [ ] Calculate timer pressure metric (% of time used)
  - [ ] Create DecisionScenario data structure:
    ```typescript
    {
      id: string,
      category: string,
      selectedOption: number,
      responseTime: number,
      changed: boolean,
      timerPressure: number
    }
    ```

- [ ] **Task 5**: Implement scenario progression (AC: 1)
  - [ ] Loop through 20 scenarios (randomly selected from database)
  - [ ] Animate transition between scenarios
  - [ ] Brief pause after each selection (show choice highlight)
  - [ ] No going back to previous scenarios
  - [ ] Track overall progress

- [ ] **Task 6**: Complete game and save data (AC: 8)
  - [ ] Create DecisionData object:
    ```typescript
    {
      scenarios: DecisionScenario[],
      averageResponseTime: number,
      changeCount: number
    }
    ```
  - [ ] Save to assessmentStore GameSession
  - [ ] Navigate to DecisionResults (Story 2.7)

- [ ] **Task 7**: Add UI enhancements
  - [ ] Smooth animations between scenarios
  - [ ] Option selection feedback (highlight, haptic)
  - [ ] Galaxy-themed styling
  - [ ] Optional: Sound effects for timer urgency

- [ ] **Task 8**: Write unit tests
  - [ ] Test timer countdown logic
  - [ ] Test response time calculation
  - [ ] Test answer change detection
  - [ ] Test data structure creation
  - [ ] Test scenario randomization

- [ ] **Task 9**: Write integration tests
  - [ ] Test complete game flow (20 scenarios)
  - [ ] Test data persistence
  - [ ] Test navigation to results

## Dev Notes

### Architecture Patterns and Constraints

**Timer Implementation:**
- Use `setInterval` or `requestAnimationFrame` for smooth countdown
- Millisecond precision for response time tracking
- Clear timer on component unmount

**Scenario Selection:**
- Random selection from database
- Ensure variety across categories
- No duplicate scenarios in one game session

**Performance:**
- Smooth 60 FPS timer animation
- Instant response to user taps
- Preload next scenario during countdown

**Navigation Flow:**
```
PsychicGamesHub
  → TemporalDecisionGame (Story 2.6) ← YOU ARE HERE
  → DecisionResults (Story 2.7)
```

### Source Tree Components

**Files to Create:**
- `src/screens/games/TemporalDecisionGame.tsx` - Main game screen
- `src/data/decisionScenarios.ts` - Scenario database
- `src/components/games/CountdownTimer.tsx` - Timer component
- `src/components/games/OptionButton.tsx` - Decision option button
- `src/types/decision.ts` - Decision-specific types

**Files to Modify:**
- `src/state/assessmentStore.ts` - Add decision session management
- `src/navigation/AppNavigator.tsx` - Add TemporalDecisionGame route

**Design System Components:**
- Galaxy background
- NativeWind for styling
- React Native Reanimated for timer animations
- Expo Haptics for urgency feedback
- Circular progress indicator for timer

**Example Scenarios:**
```typescript
{
  id: 'd1',
  category: 'risk',
  question: 'Your friend asks to borrow $500. They have a history of not paying back loans.',
  options: ['Lend it', 'Refuse politely', 'Offer smaller amount', 'Suggest alternatives']
},
{
  id: 'd2',
  category: 'ethics',
  question: 'You see someone shoplifting baby formula from a grocery store.',
  options: ['Report it', 'Ignore it', 'Offer to buy it for them']
}
```

### Testing Standards Summary

**Unit Test Coverage Target:** 80%

**Key Test Files:**
- `__tests__/screens/games/TemporalDecisionGame.test.tsx`
- `__tests__/components/games/CountdownTimer.test.tsx`
- `__tests__/data/decisionScenarios.test.ts`

**Testing Framework:**
- Jest + React Native Testing Library
- Mock timers (jest.useFakeTimers())
- Mock assessmentStore

### Project Structure Notes

**Timer Pressure Calculation:**
```typescript
function calculateTimerPressure(responseTime: number, totalTime: number = 5000): number {
  return ((totalTime - responseTime) / totalTime) * 100;
}
// Lower pressure = answered quickly
// Higher pressure = waited until last second
```

**Answer Change Detection:**
```typescript
let initialAnswer: number | null = null;
let finalAnswer: number | null = null;
let changeDetected = false;

function handleOptionSelect(optionIndex: number) {
  if (initialAnswer === null) {
    initialAnswer = optionIndex;
  } else if (optionIndex !== initialAnswer) {
    changeDetected = true;
  }
  finalAnswer = optionIndex;
}
```

**No Detected Conflicts**

### References

- [Source: docs/tech-spec-epic-2.md#Data-Models-and-Contracts] DecisionData interface
- [Source: docs/tech-spec-epic-2.md#Workflows-and-Sequencing] Decision game flow
- [Source: docs/epics.md#Story-2.6] Epic story definition
- [Source: docs/Twinship PRD.md#Temporal-Decision-Synchrony] Game description

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

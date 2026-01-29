# Story 2.1: Psychic Games Hub Screen

Status: drafted

## Story

As a **paired user**,
I want **to see all available games in one central place**,
so that **I can easily choose which game to play and track my completion progress**.

## Acceptance Criteria

1. Display 4 game cards in grid layout (2x2)
2. Each card shows: game title, description, icon, and completion status
3. Visual indication of completed vs incomplete games
4. Completion percentage displayed for overall game progress
5. Tap on game card navigates to that game's intro/start screen
6. Galaxy-themed UI consistent with app design
7. Back button returns to main app (Twindex)
8. Loading state while fetching game completion status
9. Empty state if no games available (shouldn't happen)

## Tasks / Subtasks

- [ ] **Task 1**: Implement PsychicGamesHub UI component (AC: 1-2, 6)
  - [ ] Create `src/screens/games/PsychicGamesHub.tsx`
  - [ ] Design 2x2 grid layout for 4 game cards
  - [ ] Create game card component with:
    - Galaxy-themed card background
    - Game icon/illustration
    - Game title and description
    - Play button or status indicator
  - [ ] Apply galaxy background image
  - [ ] Use NativeWind styling

- [ ] **Task 2**: Define game metadata (AC: 2)
  - [ ] Create game configuration file:
    ```typescript
    const GAMES = [
      {
        id: 'maze',
        title: 'Cognitive Synchrony Maze',
        description: 'Navigate mazes and discover your problem-solving sync',
        icon: require('../../assets/games/maze-icon.png'),
        route: 'MazeGame'
      },
      // ... other games
    ];
    ```
  - [ ] Store in `src/config/games.ts` or similar

- [ ] **Task 3**: Implement completion tracking (AC: 3-4, 8)
  - [ ] Query `assessmentStore` for completed game sessions
  - [ ] Calculate completion status for each game
  - [ ] Display badge/checkmark for completed games
  - [ ] Calculate overall completion percentage (X/4 games)
  - [ ] Show loading spinner while fetching data
  - [ ] Handle empty state (no sessions yet)

- [ ] **Task 4**: Implement navigation (AC: 5, 7)
  - [ ] Add tap handlers for each game card
  - [ ] Navigate to appropriate game screen:
    - Maze → MazeGame
    - Emotion → EmotionGame
    - Decision → DecisionGame
    - Duo → DuoQuiz
  - [ ] Pass session data if resuming incomplete game
  - [ ] Add back button to return to Twindex/Home

- [ ] **Task 5**: Add micro-interactions (enhancement)
  - [ ] Card hover/press animations
  - [ ] Haptic feedback on tap
  - [ ] Completion badge animation when achieved
  - [ ] Subtle pulse on unplayed games

- [ ] **Task 6**: Write unit tests
  - [ ] Test game metadata renders correctly
  - [ ] Test completion status calculation
  - [ ] Test navigation to each game
  - [ ] Test loading and empty states
  - [ ] Test completion percentage calculation

- [ ] **Task 7**: Write integration tests
  - [ ] Test complete flow: load hub → tap game → navigate
  - [ ] Test completion status persists correctly
  - [ ] Test back navigation

## Dev Notes

### Architecture Patterns and Constraints

**State Management Pattern:**
- Query `assessmentStore` for game session history
- No local state needed (read-only view)
- Use Zustand selectors for efficient queries

**Game Metadata:**
- Static game configuration in separate file
- Allows easy addition of new games in future
- Metadata includes: id, title, description, icon, route name

**Navigation Flow:**
```
Twindex/Home
  → PsychicGamesHub (Story 2.1) ← YOU ARE HERE
  → Individual Game (Stories 2.2-2.8)
  → Game Results (Stories 2.3-2.9)
  → Results Dashboard (Story 2.10)
```

### Source Tree Components

**Files to Create:**
- `src/screens/games/PsychicGamesHub.tsx` - Main hub screen
- `src/components/games/GameCard.tsx` - Reusable game card component
- `src/config/games.ts` - Game metadata configuration
- `src/assets/games/` - Game icons and illustrations (if custom)

**Files to Modify:**
- `src/navigation/AppNavigator.tsx` - Add PsychicGamesHub route
- `src/state/assessmentStore.ts` - May need completion query selectors

**Design System Components to Use:**
- Galaxy background: `require("../../../assets/galaxybackground.png")`
- NativeWind classes for card styling
- React Native Reanimated for card animations
- Expo Haptics for tap feedback
- SafeAreaView for proper screen insets

**Game Icons:**
- Maze: Labyrinth/path icon
- Emotion: Abstract art/color palette icon
- Decision: Clock/timer icon
- Duo: Twin silhouettes icon

### Testing Standards Summary

**Unit Test Coverage Target:** 80%

**Key Test Files:**
- `__tests__/screens/games/PsychicGamesHub.test.tsx`
- `__tests__/components/games/GameCard.test.tsx`
- `__tests__/config/games.test.ts`

**Testing Framework:**
- Jest + React Native Testing Library
- Mock assessmentStore
- Mock navigation
- Snapshot tests for card layout

### Project Structure Notes

**Alignment with Unified Structure:**
- Screen in `/src/screens/games/`
- Components in `/src/components/games/`
- Configuration in `/src/config/`
- Assets in `/src/assets/games/`
- Tests mirror source structure

**Completion Status Logic:**
```typescript
interface CompletionStatus {
  gameType: GameType;
  isCompleted: boolean;
  lastPlayed?: Date;
  resultAvailable: boolean; // Both twins completed
}

function getCompletionStatus(gameType: GameType): CompletionStatus {
  const sessions = assessmentStore.getGamesByType(gameType);
  const userSession = sessions.find(s => s.userId === currentUserId);
  const twinSession = sessions.find(s => s.userId === twinId);

  return {
    gameType,
    isCompleted: !!userSession?.completedAt,
    lastPlayed: userSession?.completedAt,
    resultAvailable: !!(userSession?.result && twinSession?.result)
  };
}
```

**No Detected Conflicts**

### References

- [Source: docs/tech-spec-epic-2.md#Overview] Epic 2 objectives and game overview
- [Source: docs/tech-spec-epic-2.md#Data-Models-and-Contracts] GameSession interface
- [Source: docs/tech-spec-epic-2.md#Workflows-and-Sequencing] Game hub flow
- [Source: docs/epics.md#Story-2.1] Epic story definition and effort estimate
- [Source: docs/Twinship PRD.md#Twin-Connection-Games-Laboratory] Game descriptions

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

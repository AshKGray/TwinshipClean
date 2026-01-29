# Story 2.2: Cognitive Synchrony Maze - Game Mechanics

Status: drafted

## Story

As a **user playing the Cognitive Synchrony Maze game**,
I want **to navigate through an interactive maze and have my decisions recorded**,
so that **my problem-solving patterns can be analyzed and compared with my twin**.

## Acceptance Criteria

1. Display interactive 10x10 maze grid
2. User can swipe or tap to move through maze (up/down/left/right)
3. Record each directional choice with timestamp
4. Track errors (hitting walls, dead ends)
5. Record correction patterns when user backtracks
6. Track total completion time from start to finish
7. Prevent cheating (no visualization of full solution path)
8. Visual feedback for valid/invalid moves
9. Progress indicator showing position in maze
10. Save move history to game session on completion

## Tasks / Subtasks

- [ ] **Task 1**: Design maze generation algorithm (AC: 1)
  - [ ] Research maze generation algorithms (recursive backtracking, Prim's, etc.)
  - [ ] Implement simple maze generator OR use predefined mazes
  - [ ] Ensure maze is solvable with single solution path
  - [ ] Create 10x10 grid data structure
  - [ ] Store maze layout in session for consistency

- [ ] **Task 2**: Implement maze rendering (AC: 1, 7, 9)
  - [ ] Create `src/screens/games/CognitiveSynchronyMaze.tsx`
  - [ ] Render 10x10 grid with walls and paths
  - [ ] Show user's current position (highlight/icon)
  - [ ] Hide solution path (only show walls and current cell)
  - [ ] Add start and end markers
  - [ ] Apply galaxy theme to maze cells

- [ ] **Task 3**: Implement gesture controls (AC: 2, 8)
  - [ ] Integrate React Native Gesture Handler
  - [ ] Add swipe gesture recognition:
    - Swipe up → move up
    - Swipe down → move down
    - Swipe left → move left
    - Swipe right → move right
  - [ ] Add alternative: directional arrow buttons
  - [ ] Validate move is legal (not into wall)
  - [ ] Provide visual feedback:
    - Valid move: smooth transition
    - Invalid move: shake animation, haptic feedback
  - [ ] Update user position after valid move

- [ ] **Task 4**: Implement move tracking (AC: 3-5)
  - [ ] Create MazeMove data structure:
    ```typescript
    interface MazeMove {
      direction: 'up' | 'down' | 'left' | 'right';
      timestamp: number; // milliseconds from start
      wasError: boolean; // hit wall or went wrong direction
      corrected: boolean; // backtracked to fix error
    }
    ```
  - [ ] Record every move attempt (even invalid ones)
  - [ ] Detect backtracking (returning to previous cell)
  - [ ] Mark corrections in move history

- [ ] **Task 5**: Implement completion tracking (AC: 6, 10)
  - [ ] Start timer when maze begins
  - [ ] Detect when user reaches end position
  - [ ] Calculate total completion time
  - [ ] Create MazeData object:
    ```typescript
    {
      moves: MazeMove[],
      completionTime: number,
      errorCount: number,
      correctionsCount: number,
      mazeId: string
    }
    ```
  - [ ] Save to GameSession in assessmentStore
  - [ ] Navigate to MazeResults screen (Story 2.3)

- [ ] **Task 6**: Add UI enhancements
  - [ ] Show timer display (optional - may add pressure)
  - [ ] Add pause button
  - [ ] Add restart button
  - [ ] Show move counter (optional)
  - [ ] Add instructions overlay on first play

- [ ] **Task 7**: Write unit tests
  - [ ] Test maze generation produces valid maze
  - [ ] Test move validation (legal vs illegal moves)
  - [ ] Test swipe gesture recognition
  - [ ] Test move recording accuracy
  - [ ] Test error and correction detection
  - [ ] Test completion time calculation

- [ ] **Task 8**: Write integration tests
  - [ ] Test complete maze playthrough
  - [ ] Test move history persistence
  - [ ] Test navigation to results after completion

## Dev Notes

### Architecture Patterns and Constraints

**Maze Generation:**
- Option 1: Procedural generation (different maze each time)
- Option 2: Predefined mazes (consistent comparison across twins)
- **Recommendation**: Predefined mazes for better twin comparison

**State Management:**
- Local component state for current position
- assessmentStore for session persistence
- Move history accumulated in memory, saved on completion

**Performance:**
- 60 FPS target for smooth animations
- Use React Native Reanimated for position transitions
- Optimize re-renders (only update changed cells)

**Navigation Flow:**
```
PsychicGamesHub
  → CognitiveSynchronyMaze (Story 2.2) ← YOU ARE HERE
  → MazeResults (Story 2.3)
```

### Source Tree Components

**Files to Create:**
- `src/screens/games/CognitiveSynchronyMaze.tsx` - Main maze gameplay
- `src/components/games/MazeGrid.tsx` - Maze rendering component
- `src/components/games/MazeControls.tsx` - Directional controls
- `src/utils/mazeGenerator.ts` - Maze generation logic
- `src/types/maze.ts` - Maze-specific type definitions

**Files to Modify:**
- `src/state/assessmentStore.ts` - Add maze session management
- `src/navigation/AppNavigator.tsx` - Add CognitiveSynchronyMaze route

**Design System Components:**
- Galaxy background
- NativeWind for grid styling
- React Native Gesture Handler for swipes
- React Native Reanimated for animations
- Expo Haptics for invalid move feedback

**Maze Rendering:**
- Use View components for cells
- Walls: Dark/opaque cells
- Paths: Lighter/transparent cells
- Current position: Highlighted with accent color
- Start: Green marker
- End: Goal marker (different color)

### Testing Standards Summary

**Unit Test Coverage Target:** 80%

**Key Test Files:**
- `__tests__/screens/games/CognitiveSynchronyMaze.test.tsx`
- `__tests__/utils/mazeGenerator.test.ts`
- `__tests__/components/games/MazeGrid.test.tsx`

**Testing Framework:**
- Jest + React Native Testing Library
- Mock React Native Gesture Handler
- Mock Reanimated
- Mock assessmentStore

### Project Structure Notes

**Maze Data Structure:**
```typescript
type MazeCell = 'wall' | 'path' | 'start' | 'end';
type MazeGrid = MazeCell[][];

interface MazeLayout {
  id: string;
  grid: MazeGrid;
  startPosition: { row: number; col: number };
  endPosition: { row: number; col: number };
  solutionPath: { row: number; col: number }[];
}
```

**Predefined Mazes:**
- Store 5-10 predefined maze layouts
- Randomly select one when game starts
- Store mazeId with session for analysis

**Error Detection:**
```typescript
function isErrorMove(
  currentPos: Position,
  attemptedDirection: Direction,
  maze: MazeGrid
): boolean {
  const nextPos = calculateNextPosition(currentPos, attemptedDirection);
  return maze[nextPos.row][nextPos.col] === 'wall';
}
```

**Backtracking Detection:**
```typescript
function isBacktracking(
  currentMove: MazeMove,
  previousMoves: MazeMove[]
): boolean {
  if (previousMoves.length < 2) return false;
  const lastMove = previousMoves[previousMoves.length - 1];
  return isOppositeDirection(currentMove.direction, lastMove.direction);
}
```

**No Detected Conflicts**

### References

- [Source: docs/tech-spec-epic-2.md#Data-Models-and-Contracts] MazeData interface
- [Source: docs/tech-spec-epic-2.md#Workflows-and-Sequencing] Maze game flow
- [Source: docs/epics.md#Story-2.2] Epic story definition and effort estimate
- [Source: docs/Twinship PRD.md#Cognitive-Synchrony-Maze] Game description

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

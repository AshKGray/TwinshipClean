# Story 2.4: Emotional Resonance Mapping - Abstract Image Selection

Status: drafted

## Story

As a **user playing the Emotional Resonance Mapping game**,
I want **to choose abstract images that represent different emotions**,
so that **my emotional vocabulary and processing can be mapped and analyzed**.

## Acceptance Criteria

1. Display 10-15 abstract images in a grid layout
2. Present 8-10 emotion words one at a time
3. User can select one or multiple images for each emotion
4. Allow multiple selections per emotion (multi-select mode)
5. Record all image-emotion associations
6. Smooth animations between emotion prompts
7. Visual feedback for selected/unselected images
8. Progress indicator showing current emotion (e.g., "3 of 8")
9. Save association data to game session on completion

## Tasks / Subtasks

- [ ] **Task 1**: Prepare abstract image assets (AC: 1)
  - [ ] Source or create 12-15 abstract images
  - [ ] Images should vary in: color, shape, pattern, complexity
  - [ ] Store in `/assets/games/emotions/`
  - [ ] Optimize for mobile (< 100KB each)
  - [ ] Define image metadata (ID, dominant colors, pattern type)

- [ ] **Task 2**: Implement EmotionalResonanceGame UI (AC: 1-2, 8)
  - [ ] Create `src/screens/games/EmotionalResonanceGame.tsx`
  - [ ] Display current emotion word prominently at top
  - [ ] Render image grid (3-4 columns, scrollable)
  - [ ] Show progress indicator (e.g., "Joy - 1 of 8")
  - [ ] Apply galaxy background styling
  - [ ] Add "Next" button to advance to next emotion

- [ ] **Task 3**: Implement image selection logic (AC: 3-4, 7)
  - [ ] Enable multi-select mode (tap to toggle selection)
  - [ ] Visual feedback:
    - Selected: Border highlight, scale up slightly
    - Unselected: Default state
  - [ ] Track selections in local state
  - [ ] Allow deselection by tapping again
  - [ ] Require at least 1 selection before advancing

- [ ] **Task 4**: Implement emotion progression (AC: 2, 6)
  - [ ] Define emotion word list:
    ```typescript
    const EMOTIONS: EmotionWord[] = [
      'joy', 'sadness', 'anger', 'fear',
      'surprise', 'disgust', 'trust', 'anticipation'
    ];
    ```
  - [ ] Loop through emotions sequentially
  - [ ] Animate transition between emotions (fade out/in)
  - [ ] Record association data before advancing
  - [ ] Clear selections for next emotion

- [ ] **Task 5**: Implement data tracking (AC: 5, 9)
  - [ ] Create EmotionAssociation structure:
    ```typescript
    interface EmotionAssociation {
      emotion: EmotionWord;
      selectedImages: number[]; // Image IDs
      selectionOrder: number[]; // Order selected
      responseTime: number; // Time spent on this emotion
    }
    ```
  - [ ] Track selection order and timing
  - [ ] Store all associations in array
  - [ ] Create EmotionData object on completion
  - [ ] Save to assessmentStore
  - [ ] Navigate to EmotionResults (Story 2.5)

- [ ] **Task 6**: Add micro-interactions
  - [ ] Haptic feedback on image selection
  - [ ] Image scale animation on tap
  - [ ] Smooth fade transitions between emotions
  - [ ] Celebration animation on completion

- [ ] **Task 7**: Write unit tests
  - [ ] Test image selection/deselection
  - [ ] Test multi-select functionality
  - [ ] Test emotion progression logic
  - [ ] Test association data structure
  - [ ] Test completion and save logic

- [ ] **Task 8**: Write integration tests
  - [ ] Test complete game flow (all 8 emotions)
  - [ ] Test data persistence
  - [ ] Test navigation to results

## Dev Notes

### Architecture Patterns and Constraints

**Image Selection:**
- Multi-select mode (checkbox-like behavior)
- No limit on number of selections per emotion
- At least 1 selection required to advance

**State Management:**
- Local component state for current selections
- assessmentStore for persisting completed session
- Track timing data for each emotion

**Performance:**
- Lazy load images (only visible ones)
- Use memoization for image grid
- Optimize re-renders when toggling selections

**Navigation Flow:**
```
PsychicGamesHub
  → EmotionalResonanceGame (Story 2.4) ← YOU ARE HERE
  → EmotionResults (Story 2.5)
```

### Source Tree Components

**Files to Create:**
- `src/screens/games/EmotionalResonanceGame.tsx` - Main game screen
- `src/components/games/AbstractImageGrid.tsx` - Image grid component
- `src/components/games/EmotionPrompt.tsx` - Emotion display component
- `src/assets/games/emotions/` - Abstract image assets
- `src/types/emotion.ts` - Emotion-specific types

**Files to Modify:**
- `src/state/assessmentStore.ts` - Add emotion session management
- `src/navigation/AppNavigator.tsx` - Add EmotionalResonanceGame route

**Design System Components:**
- Galaxy background
- NativeWind for grid and card styling
- React Native Reanimated for animations
- Expo Haptics for selection feedback
- FlatList for image grid

**Abstract Image Characteristics:**
- Variety of colors (warm, cool, neutral)
- Different patterns (geometric, organic, chaotic)
- Various complexity levels (simple to complex)
- No recognizable objects (purely abstract)

### Testing Standards Summary

**Unit Test Coverage Target:** 80%

**Key Test Files:**
- `__tests__/screens/games/EmotionalResonanceGame.test.tsx`
- `__tests__/components/games/AbstractImageGrid.test.tsx`

**Testing Framework:**
- Jest + React Native Testing Library
- Mock image assets
- Mock assessmentStore
- Test with different emotion sequences

### Project Structure Notes

**Emotion Word List:**
```typescript
type EmotionWord =
  | 'joy'
  | 'sadness'
  | 'anger'
  | 'fear'
  | 'surprise'
  | 'disgust'
  | 'trust'
  | 'anticipation';
```

**Abstract Image Metadata:**
```typescript
interface AbstractImage {
  id: number;
  url: string;
  dominantColors: string[]; // Hex codes
  pattern: 'geometric' | 'organic' | 'abstract';
  complexity: 'simple' | 'medium' | 'complex';
}
```

**Selection State:**
```typescript
const [currentEmotion, setCurrentEmotion] = useState(0);
const [selections, setSelections] = useState<number[]>([]);
const [allAssociations, setAllAssociations] = useState<EmotionAssociation[]>([]);
```

**No Detected Conflicts**

### References

- [Source: docs/tech-spec-epic-2.md#Data-Models-and-Contracts] EmotionData interface
- [Source: docs/tech-spec-epic-2.md#Workflows-and-Sequencing] Emotion game flow
- [Source: docs/epics.md#Story-2.4] Epic story definition
- [Source: docs/Twinship PRD.md#Emotional-Resonance-Mapping] Game description

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

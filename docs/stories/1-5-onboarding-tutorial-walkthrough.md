# Story 1.5: Onboarding Tutorial Walkthrough

Status: drafted

## Story

As a **newly paired user**,
I want **to see a quick tutorial of key Twinship features**,
so that **I understand how to use the app effectively and discover what's available**.

## Acceptance Criteria

1. Display 4-5 screen tutorial carousel highlighting key features
2. Tutorial screens cover: Games, Twintuition, Stories, Research (optional 5th: Home navigation)
3. Swipeable interface using horizontal scrolling
4. Visual indicators show current position (dots/progress bar)
5. "Skip" button available on all screens
6. "Next" button on screens 1-4
7. "Get Started" button on final screen
8. Smooth transitions between screens using animations
9. Tutorial shown only once per user (completion tracked)
10. Completion flag stored in AsyncStorage
11. Navigate to Home/Twindex screen after completion or skip

## Tasks / Subtasks

- [ ] **Task 1**: Implement TutorialScreen UI component (AC: 1-4)
  - [ ] Create `src/screens/onboarding/TutorialScreen.tsx`
  - [ ] Implement swipeable carousel using:
    - React Native FlatList with horizontal scrolling
    - Or React Native Snap Carousel
    - Or custom ScrollView with pagination
  - [ ] Create 4-5 tutorial content screens
  - [ ] Add visual progress indicators (dots)
  - [ ] Apply galaxy background to each screen
  - [ ] Use NativeWind for consistent styling

- [ ] **Task 2**: Design tutorial content screens (AC: 2)
  - [ ] **Screen 1: Welcome**
    - Title: "Welcome to Twinship!"
    - Description: "Explore your unique twin connection through games, insights, and shared experiences"
    - Visual: App logo or twin illustration
  - [ ] **Screen 2: Psychic Games**
    - Title: "Play Psychic Games"
    - Description: "Discover how in-sync you are through fun psychological games"
    - Visual: Game controller or maze icon
  - [ ] **Screen 3: Twintuition**
    - Title: "Send Twintuition Alerts"
    - Description: "Instantly notify your twin when you're thinking of them"
    - Visual: Thought bubble or lightning bolt icon
  - [ ] **Screen 4: Stories**
    - Title: "Share Your Story"
    - Description: "Create collaborative stories celebrating your twin journey"
    - Visual: Book or story icon
  - [ ] **Screen 5 (optional): Research**
    - Title: "Contribute to Research"
    - Description: "Help advance twin science (optional)"
    - Visual: Science/microscope icon

- [ ] **Task 3**: Implement navigation controls (AC: 5-7)
  - [ ] Add "Skip" button (top-right, all screens)
  - [ ] Add "Next" button (bottom, screens 1-4)
  - [ ] Add "Get Started" button (bottom, final screen)
  - [ ] Implement skip handler → navigate to Home
  - [ ] Implement next handler → scroll to next screen
  - [ ] Implement finish handler → mark complete, navigate to Home
  - [ ] Add haptic feedback on button taps

- [ ] **Task 4**: Implement animations (AC: 8)
  - [ ] Use React Native Reanimated for smooth transitions
  - [ ] Fade in/out animations between screens
  - [ ] Slide animations for screen changes
  - [ ] Optional: Parallax effect on background
  - [ ] Maintain 60 FPS performance

- [ ] **Task 5**: Implement completion tracking (AC: 9-10)
  - [ ] Check for tutorial completion on mount
  - [ ] If already completed, skip tutorial (navigate to Home)
  - [ ] Store completion flag in AsyncStorage:
    - Key: `twinship:v1:tutorialCompleted`
    - Value: `{ completed: true, completedAt: ISO_timestamp }`
  - [ ] Optionally store in twinStore for easy access
  - [ ] Handle edge case: tutorial interrupted (allow re-entry)

- [ ] **Task 6**: Implement navigation flow (AC: 11)
  - [ ] Navigate to Twindex/Home screen after completion
  - [ ] Clear onboarding navigation stack (prevent back navigation)
  - [ ] Update `AppNavigator.tsx` with TutorialScreen route
  - [ ] Ensure tutorial only shows for newly paired users

- [ ] **Task 7**: Write unit tests
  - [ ] Test carousel navigation (next, previous)
  - [ ] Test skip functionality
  - [ ] Test completion tracking (AsyncStorage)
  - [ ] Test "already completed" skip logic
  - [ ] Test final screen "Get Started" button
  - [ ] Test navigation to Home screen

- [ ] **Task 8**: Write integration tests
  - [ ] Test complete tutorial flow: screen 1 → 2 → 3 → 4 → finish
  - [ ] Test skip flow: screen 1 → skip → navigate Home
  - [ ] Test completion persistence across app restart
  - [ ] Test tutorial not shown on subsequent logins

## Dev Notes

### Architecture Patterns and Constraints

**State Management Pattern:**
- Tutorial completion stored in AsyncStorage for persistence
- Optional: Add tutorialCompleted flag to twinStore for easy access
- No complex state needed during tutorial (local component state)

**Carousel Implementation:**
- Option 1: FlatList with horizontal={true} and pagingEnabled
- Option 2: react-native-snap-carousel (smoother UX)
- Option 3: Custom ScrollView with PanGestureHandler
- Recommendation: FlatList for simplicity and performance

**Navigation Flow:**
```
PairScreen (Story 1.4)
  ↓ (after successful pairing)
TwinTalk Screen
  ↓ (optional after first message)
TutorialScreen (Story 1.5) ← YOU ARE HERE
  ↓ (after completion or skip)
Twindex/Home Screen
```

**Conditional Display:**
- Only show tutorial for users who haven't completed it
- Skip if `tutorialCompleted === true` in AsyncStorage
- Allow skip at any point (user preference)

### Source Tree Components

**Files to Create:**
- `src/screens/onboarding/TutorialScreen.tsx` - Main tutorial component
- `src/components/onboarding/TutorialSlide.tsx` - Individual slide component
- `src/components/onboarding/TutorialProgress.tsx` - Progress indicator dots
- `src/assets/tutorial/` - Tutorial illustrations/icons (if custom)

**Files to Modify:**
- `src/navigation/AppNavigator.tsx` - Add TutorialScreen route
- `src/state/twinStore.ts` - Optionally add tutorialCompleted flag
- `src/services/storageService.ts` - Tutorial completion helpers (optional)

**Design System Components to Use:**
- Galaxy background: `require("../../../assets/galaxybackground.png")`
- NativeWind classes for styling
- React Native Reanimated for smooth animations
- Expo Haptics for button feedback
- SafeAreaView for proper screen insets

**External Dependencies:**
- Consider: `react-native-snap-carousel` for better carousel UX
- Alternative: Use built-in FlatList (no extra dependency)

### Testing Standards Summary

**Unit Test Coverage Target:** 80%

**Key Test Files:**
- `__tests__/screens/onboarding/TutorialScreen.test.tsx`
- `__tests__/components/onboarding/TutorialSlide.test.tsx`
- `__tests__/components/onboarding/TutorialProgress.test.tsx`

**Testing Framework:**
- Jest + React Native Testing Library
- Mock AsyncStorage
- Mock navigation
- Mock Reanimated for animations
- Snapshot tests for slide content

### Project Structure Notes

**Alignment with Unified Structure:**
- Screen in `/src/screens/onboarding/`
- Components in `/src/components/onboarding/`
- Assets in `/src/assets/tutorial/` (if custom)
- Tests mirror source structure

**Tutorial Content Data:**
```typescript
interface TutorialSlide {
  id: string;
  title: string;
  description: string;
  icon: string | ImageSourcePropType;
  color?: ThemeColor; // Optional accent color per slide
}

const tutorialSlides: TutorialSlide[] = [
  {
    id: '1',
    title: 'Welcome to Twinship!',
    description: 'Explore your unique twin connection through games, insights, and shared experiences',
    icon: require('../../../assets/tutorial/welcome.png'),
  },
  // ... more slides
];
```

**Progress Indicator:**
- Dots at bottom of screen
- Current dot highlighted with accent color
- Total dots = number of slides
- Optional: Number indicator "1 of 5"

**Skip vs Complete:**
- Skip: tutorialCompleted = true, skippedAt = timestamp
- Complete: tutorialCompleted = true, completedAt = timestamp
- Both count as "completed" for re-entry logic

**No Detected Conflicts**

### References

- [Source: docs/tech-spec-epic-1.md#Workflows-and-Sequencing] Tutorial flow sequence
- [Source: docs/tech-spec-epic-1.md#Test-Strategy-Summary] Unit test requirements
- [Source: docs/epics.md#Story-1.5] Epic story definition and effort estimate
- [Source: docs/Twinship PRD.md] Onboarding and user education requirements
- [Source: docs/navigation-flow-documentation.md] App navigation patterns

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

# Story 1.2: Galaxy Theme Accent Color Selection

Status: drafted

## Story

As a **new user who has completed registration**,
I want **to choose my personal accent color from galaxy-themed options**,
so that **I can personalize my app experience and express my cosmic identity**.

## Acceptance Criteria

1. Display 8 galaxy-themed color options with distinct visual previews
2. Each color option shows name and color swatch
3. User can select one accent color by tapping
4. Live preview shows selected color applied to sample UI elements
5. Selected color persists to user profile in twinStore
6. Selected color saves to AsyncStorage for persistence
7. Submit button enabled only after color selection
8. Navigation proceeds to Invitation screen after save
9. UI maintains galaxy aesthetic with smooth animations

## Tasks / Subtasks

- [ ] **Task 1**: Implement ColorSelectionScreen UI component (AC: 1-2)
  - [ ] Create `src/screens/onboarding/ColorSelectionScreen.tsx` with galaxy layout
  - [ ] Define 8 galaxy theme colors in color palette:
    - nebula-rose, stellar-blue, orbit-sage, solar-amber
    - celestial-indigo, comet-coral, aurora-teal, meteor-copper
  - [ ] Create color option cards with swatches and names
  - [ ] Apply galaxy background (`galaxybackground.png`)
  - [ ] Use NativeWind styling for consistency

- [ ] **Task 2**: Implement color selection logic (AC: 3-5)
  - [ ] Add tap handler for color selection
  - [ ] Update selected state with chosen color
  - [ ] Create live preview component showing sample UI with selected color
  - [ ] Preview elements: buttons, cards, text highlights
  - [ ] Use React Native Reanimated for smooth color transitions
  - [ ] Add Expo Haptics feedback on selection

- [ ] **Task 3**: Implement state management (AC: 5-6)
  - [ ] Update `src/state/twinStore.ts` to include accentColor field
  - [ ] Save selected color to UserProfile.accentColor
  - [ ] Persist to AsyncStorage with key `twinship:v1:userProfile`
  - [ ] Ensure color loads correctly on app restart

- [ ] **Task 4**: Implement navigation flow (AC: 7-8)
  - [ ] Add submit button with disabled state until color selected
  - [ ] Navigate to Invitation screen on submit
  - [ ] Pass complete profile data as navigation params
  - [ ] Add back button to return to RegisterScreen

- [ ] **Task 5**: Write unit tests
  - [ ] Test color selection updates state correctly
  - [ ] Test all 8 colors can be selected
  - [ ] Test live preview updates when color changes
  - [ ] Test AsyncStorage persistence of selected color
  - [ ] Test submit button disabled/enabled states
  - [ ] Test navigation with profile data

- [ ] **Task 6**: Write integration tests
  - [ ] Test complete flow: select color → preview updates → save → navigate
  - [ ] Test color persistence across screen navigation
  - [ ] Test back navigation preserves previous selections

## Dev Notes

### Architecture Patterns and Constraints

**State Management Pattern:**
- Use Zustand `twinStore` to store selected accent color
- Transfer from `tempTwinStore` after color selection
- AsyncStorage persistence middleware handles automatic save/restore

**Color System Integration:**
- Galaxy theme colors defined in `src/theme/colors.ts`
- Colors used throughout app for consistency
- NativeWind configuration for dynamic theming

**Navigation Flow:**
```
RegisterScreen (Story 1.1)
  → ColorSelectionScreen (Story 1.2) ← YOU ARE HERE
  → InvitationScreen (Story 1.3)
```

### Source Tree Components

**Files to Create:**
- `src/screens/onboarding/ColorSelectionScreen.tsx` - Main color selection UI
- `src/theme/colors.ts` - Galaxy color palette definitions (if not exists)
- `src/components/onboarding/ColorPreview.tsx` - Live preview component

**Files to Modify:**
- `src/state/twinStore.ts` - Add accentColor to UserProfile
- `src/navigation/AppNavigator.tsx` - Add ColorSelectionScreen route
- `src/types/index.ts` - Add ThemeColor type if needed

**Design System Components to Use:**
- Galaxy background: `require("../../../assets/galaxybackground.png")`
- NativeWind classes for styling
- React Native Reanimated for color transitions
- Expo Haptics for selection feedback
- SafeAreaView for proper screen insets

### Testing Standards Summary

**Unit Test Coverage Target:** 80%

**Key Test Files:**
- `__tests__/screens/onboarding/ColorSelectionScreen.test.tsx`
- `__tests__/components/onboarding/ColorPreview.test.tsx`
- `__tests__/theme/colors.test.ts`

**Testing Framework:**
- Jest + React Native Testing Library
- Mock AsyncStorage using @react-native-async-storage/async-storage mock
- Mock navigation using @react-navigation/native mock
- Mock Reanimated for animation testing

### Project Structure Notes

**Alignment with Unified Structure:**
- Screens follow `/src/screens/{feature}/{ScreenName}.tsx` pattern
- Components in `/src/components/{feature}/{ComponentName}.tsx`
- Theme utilities in `/src/theme/{utilityName}.ts`
- Tests co-located: `__tests__/` mirroring source structure

**Galaxy Theme Colors:**
```typescript
type ThemeColor =
  | 'nebula-rose'      // #FF6B9D - Soft pink
  | 'stellar-blue'     // #4A9FFF - Bright blue
  | 'orbit-sage'       // #7FD1AE - Soft green
  | 'solar-amber'      // #FFB84D - Warm orange
  | 'celestial-indigo' // #9B7EDE - Purple
  | 'comet-coral'      // #FF8B7B - Coral
  | 'aurora-teal'      // #4ECDC4 - Teal
  | 'meteor-copper';   // #D4936D - Copper
```

**No Detected Conflicts**

### References

- [Source: docs/tech-spec-epic-1.md#Data-Models-and-Contracts] UserProfile interface with accentColor
- [Source: docs/tech-spec-epic-1.md#Data-Models-and-Contracts] ThemeColor type definition
- [Source: docs/tech-spec-epic-1.md#Workflows-and-Sequencing] Color selection flow sequence
- [Source: docs/tech-spec-epic-1.md#Test-Strategy-Summary] Unit test requirements
- [Source: docs/epics.md#Story-1.2] Epic story definition and effort estimate
- [Source: docs/Twinship PRD.md] Galaxy theme design requirements

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

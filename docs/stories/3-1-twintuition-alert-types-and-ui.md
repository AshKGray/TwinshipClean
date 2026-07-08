# Story 3.1: Twintuition Alert Types and UI

Status: drafted

## Story

As a **paired user**,
I want **to send different types of Twintuition alerts to my twin**,
so that **I can share what I'm experiencing in the moment**.

## Acceptance Criteria

1. Display three alert type options: Feeling, Thought, Action
2. Each alert type has distinct icon and color
3. One-tap selection with haptic feedback
4. Floating quick-access button visible on Twindex and TwinTalk screens
5. Quick-access button navigates to AlertComposer
6. Smooth animation when opening composer (slide up from bottom)
7. Galaxy background consistent with app theme
8. Back button to cancel and return to previous screen

## Tasks / Subtasks

- [ ] **Task 1**: Create TwintuitionScreen with alert type selection (AC: 1-3)
  - [ ] Create `src/screens/twintuition/TwintuitionScreen.tsx` with galaxy layout
  - [ ] Define three alert type options: Feeling, Thought, Action
  - [ ] Create AlertTypeCard component with icon, label, color
  - [ ] Implement tap handler for type selection
  - [ ] Add Expo Haptics feedback on selection
  - [ ] Use NativeWind styling for consistency
  - [ ] Apply galaxy background (`galaxybackground.png`)

- [ ] **Task 2**: Implement quick-access floating button (AC: 4-5)
  - [ ] Create `src/components/twintuition/TwintuitionQuickSend.tsx`
  - [ ] Implement FloatingActionButton with Twintuition icon
  - [ ] Position button in bottom-right corner (above tab bar)
  - [ ] Add button to Twindex and TwinTalk screens
  - [ ] Implement navigation to TwintuitionScreen on tap
  - [ ] Add pulse animation to attract attention
  - [ ] Ensure button doesn't overlap critical UI elements

- [ ] **Task 3**: Implement screen transitions and animations (AC: 6)
  - [ ] Add React Native Reanimated slide-up animation
  - [ ] Implement modal-style presentation for TwintuitionScreen
  - [ ] Add backdrop overlay with opacity transition
  - [ ] Ensure 60 FPS performance during animation
  - [ ] Add spring physics for natural feel

- [ ] **Task 4**: Implement navigation and back button (AC: 7-8)
  - [ ] Add TwintuitionScreen to navigation stack
  - [ ] Implement custom header with close button
  - [ ] Add back button functionality to dismiss modal
  - [ ] Handle Android hardware back button
  - [ ] Apply SafeAreaView for proper insets

- [ ] **Task 5**: Create alert type data models
  - [ ] Define AlertType enum in `src/types/index.ts`
  - [ ] Create alert type metadata (icons, colors, labels)
  - [ ] Add alert type to twintuitionStore state

- [ ] **Task 6**: Write unit tests
  - [ ] Test three alert types render correctly
  - [ ] Test alert type selection updates state
  - [ ] Test haptic feedback triggers on tap
  - [ ] Test quick-access button navigates to composer
  - [ ] Test back button dismisses modal

- [ ] **Task 7**: Write integration tests
  - [ ] Test complete flow: open quick button → select type → state updates
  - [ ] Test animation plays smoothly
  - [ ] Test navigation from multiple screens (Twindex, TwinTalk)

## Dev Notes

### Architecture Patterns and Constraints

**State Management Pattern:**
- Use Zustand `twintuitionStore` to store selected alert type
- Store updates immediately on type selection
- No AsyncStorage needed until alert is sent (Story 3.2)

**Navigation Pattern:**
- Modal presentation style for TwintuitionScreen
- Overlay on top of current screen (doesn't replace it)
- Dismissible via back button, backdrop tap, or swipe down

**Alert Type Definitions:**
```typescript
type AlertType = 'feeling' | 'thought' | 'action';

interface AlertTypeMetadata {
  type: AlertType;
  label: string;
  icon: IconName;
  color: string;
  description: string;
}

const ALERT_TYPES: AlertTypeMetadata[] = [
  {
    type: 'feeling',
    label: 'Feeling',
    icon: 'heart',
    color: '#FF6B9D', // nebula-rose
    description: 'Share an emotion you\'re experiencing'
  },
  {
    type: 'thought',
    label: 'Thought',
    icon: 'lightbulb',
    color: '#4A9FFF', // stellar-blue
    description: 'Send a quick thought or idea'
  },
  {
    type: 'action',
    label: 'Action',
    icon: 'flash',
    color: '#FFB84D', // solar-amber
    description: 'Tell them what you\'re doing right now'
  }
];
```

**Navigation Flow:**
```
Twindex OR TwinTalk
  ↓
User taps FloatingActionButton
  ↓
TwintuitionScreen slides up (modal)
  ↓
User selects alert type
  ↓
Navigate to AlertComposer (Story 3.2) OR Back button dismisses
```

### Source Tree Components

**Files to Create:**
- `src/screens/twintuition/TwintuitionScreen.tsx` - Alert type selection modal
- `src/components/twintuition/TwintuitionQuickSend.tsx` - Floating action button
- `src/components/twintuition/AlertTypeCard.tsx` - Individual type option card
- `src/state/twintuitionStore.ts` - Twintuition state management

**Files to Modify:**
- `src/screens/HomeScreen.tsx` (Twindex) - Add FloatingActionButton
- `src/screens/chat/TwinTalkScreen.tsx` - Add FloatingActionButton
- `src/navigation/AppNavigator.tsx` - Add TwintuitionScreen route (modal)
- `src/types/index.ts` - Add AlertType and related types

**Design System Components to Use:**
- Galaxy background: `require("../../../assets/galaxybackground.png")`
- NativeWind classes for styling
- React Native Reanimated for slide animation
- Expo Haptics for selection feedback
- SafeAreaView for proper screen insets
- Expo Vector Icons for alert type icons

### Testing Standards Summary

**Unit Test Coverage Target:** 80%

**Key Test Files:**
- `__tests__/screens/twintuition/TwintuitionScreen.test.tsx`
- `__tests__/components/twintuition/TwintuitionQuickSend.test.tsx`
- `__tests__/components/twintuition/AlertTypeCard.test.tsx`
- `__tests__/state/twintuitionStore.test.ts`

**Testing Framework:**
- Jest + React Native Testing Library
- Mock navigation using @react-navigation/native mock
- Mock Reanimated for animation testing
- Mock Haptics for feedback testing

**Key Test Scenarios:**
1. All three alert types render with correct icons and colors
2. Tapping alert type triggers haptic and updates store
3. Quick-access button appears on Twindex and TwinTalk
4. Tapping quick-access button navigates to TwintuitionScreen
5. Back button dismisses modal and returns to previous screen
6. Animation plays smoothly (60 FPS check)

### Project Structure Notes

**Alignment with Unified Structure:**
- Screens follow `/src/screens/twintuition/{ScreenName}.tsx` pattern
- Components in `/src/components/twintuition/{ComponentName}.tsx`
- State in `/src/state/twintuitionStore.ts`
- Tests co-located: `__tests__/` mirroring source structure

**Alert Type Color Mapping:**
```typescript
{
  feeling: '#FF6B9D',  // nebula-rose - warm, emotional
  thought: '#4A9FFF',  // stellar-blue - intellectual, calm
  action:  '#FFB84D'   // solar-amber - energetic, active
}
```

**Floating Button Position:**
- Bottom-right corner
- 16px from right edge
- 80px from bottom (above tab bar height ~60px)
- Z-index: 999 to ensure visibility

**No Detected Conflicts**

### References

- [Source: docs/tech-spec-epic-3.md#Data-Models-and-Contracts] AlertType enum and metadata
- [Source: docs/tech-spec-epic-3.md#Workflows-and-Sequencing] Alert type selection flow
- [Source: docs/tech-spec-epic-3.md#Test-Strategy-Summary] Unit test requirements
- [Source: docs/epics.md#Story-3.1] Epic story definition and effort estimate
- [Source: docs/Twinship PRD.md#Twintuition-Button] Twintuition feature requirements
- [Source: docs/tech-spec-epic-1.md#Design-System-Integration] Galaxy theme patterns

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

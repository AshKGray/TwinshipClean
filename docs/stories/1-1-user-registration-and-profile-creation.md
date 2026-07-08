# Story 1.1: User Registration and Profile Creation

Status: drafted

## Story

As a **new user**,
I want **to create my account and basic profile**,
so that **I can start using Twinship and identify myself to my twin**.

## Acceptance Criteria

1. User can input name (1-50 characters, letters/spaces/hyphens/apostrophes only)
2. User can input email (valid email format required)
3. User can input birthdate (age 13-120 enforced for COPPA compliance)
4. User can select twin type from: identical, fraternal, other
5. Form validates all fields in real-time with clear error messages
6. Submit button disabled until all fields valid
7. Profile data persists to AsyncStorage upon successful submission
8. Profile data loads in twinStore with correct UserProfile schema
9. Navigation proceeds to ColorSelection screen after save

## Tasks / Subtasks

- [ ] **Task 1**: Implement RegisterScreen UI component (AC: 1-4)
  - [ ] Create `src/screens/auth/RegisterScreen.tsx` with form layout
  - [ ] Add TextInput for name with real-time validation
  - [ ] Add TextInput for email with real-time validation
  - [ ] Add DatePicker for birthdate with age calculation
  - [ ] Add Picker for twin type selection
  - [ ] Apply galaxy background and NativeWind styling

- [ ] **Task 2**: Implement form validation logic (AC: 5-6)
  - [ ] Create validation functions for each field:
    - Name: regex `/^[a-zA-Z\s'-]+$/`, length 1-50
    - Email: regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
    - Age: calculate from birthdate, enforce 13-120 range
    - Twin type: enum validation
  - [ ] Implement real-time error message display
  - [ ] Add debounced validation (300ms) for email
  - [ ] Disable submit button when form invalid

- [ ] **Task 3**: Implement state management (AC: 7-8)
  - [ ] Update `src/state/tempTwinStore.ts` to store registration data
  - [ ] Create UserProfile object with all required fields:
    - id (UUID v4), name, email, birthdate, age, twinType
    - createdAt/updatedAt timestamps (ISO 8601)
  - [ ] Save to tempTwinStore during registration
  - [ ] Persist data to AsyncStorage with key `twinship:v1:userProfile`
  - [ ] Transfer from tempTwinStore to twinStore after color selection

- [ ] **Task 4**: Implement navigation flow (AC: 9)
  - [ ] Add navigation handler for form submission
  - [ ] Navigate to ColorSelection screen on success
  - [ ] Pass partial profile data as navigation params

- [ ] **Task 5**: Write unit tests
  - [ ] Test name validation (valid names, invalid characters, length boundaries)
  - [ ] Test email validation (valid formats, invalid formats)
  - [ ] Test age calculation (edge cases: 12, 13, 120, 121 years)
  - [ ] Test twin type enum validation
  - [ ] Test form submission disabled/enabled states
  - [ ] Test AsyncStorage persistence

- [ ] **Task 6**: Write integration tests
  - [ ] Test complete registration flow: fill form → validate → save → navigate
  - [ ] Test data persistence across screens
  - [ ] Test form recovery if user navigates away and returns

## Dev Notes

### Architecture Patterns and Constraints

**State Management Pattern:**
- Use Zustand `tempTwinStore` during registration flow
- Transfer to main `twinStore` after color selection in Story 1.2
- AsyncStorage persistence middleware handles automatic save/restore

**Form Validation Strategy:**
- Real-time validation on blur and keystroke (debounced)
- Regex patterns from tech spec validation schema
- Clear, actionable error messages below each field

**Navigation Flow:**
```
RegisterScreen (Story 1.1)
  → ColorSelectionScreen (Story 1.2)
  → InvitationScreen (Story 1.3)
```

### Source Tree Components

**Files to Create:**
- `src/screens/auth/RegisterScreen.tsx` - Main registration UI
- `src/utils/validation.ts` - Reusable validation functions (if not exists)
- `src/utils/dateUtils.ts` - Age calculation utility (if not exists)

**Files to Modify:**
- `src/state/tempTwinStore.ts` - Add registration form state
- `src/state/twinStore.ts` - Ensure UserProfile interface matches spec
- `src/navigation/AppNavigator.tsx` - Add RegisterScreen to stack (if not present)

**Design System Components to Use:**
- Galaxy background: `require("../../assets/galaxybackground.png")`
- NativeWind classes for styling
- SafeAreaView for proper screen insets
- Expo Haptics for button feedback

### Testing Standards Summary

**Unit Test Coverage Target:** 80%

**Key Test Files:**
- `__tests__/screens/auth/RegisterScreen.test.tsx`
- `__tests__/utils/validation.test.ts`
- `__tests__/utils/dateUtils.test.ts`

**Testing Framework:**
- Jest + React Native Testing Library
- Mock AsyncStorage using @react-native-async-storage/async-storage mock
- Mock navigation using @react-navigation/native mock

### Project Structure Notes

**Alignment with Unified Structure:**
- Screens follow `/src/screens/{feature}/{ScreenName}.tsx` pattern
- State management in `/src/state/{storeName}.ts`
- Utilities in `/src/utils/{utilityName}.ts`
- Tests co-located with source: `__tests__/` mirroring source structure

**No Detected Conflicts**

### References

- [Source: docs/tech-spec-epic-1.md#Data-Models-and-Contracts] UserProfile interface definition
- [Source: docs/tech-spec-epic-1.md#Acceptance-Criteria] AC-1.1 detailed acceptance criteria
- [Source: docs/tech-spec-epic-1.md#Workflows-and-Sequencing] Registration flow sequence
- [Source: docs/tech-spec-epic-1.md#Test-Strategy-Summary] Unit test requirements
- [Source: docs/epics.md#Story-1.1] Epic story definition and effort estimate
- [Source: docs/Twinship PRD.md] Business requirements and user personas

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

# Story 1.3: Generate Twin Invitation Link

Status: drafted

## Story

As a **registered user with a completed profile**,
I want **to generate a unique invitation link for my twin**,
so that **I can invite them to pair with me securely and easily**.

## Acceptance Criteria

1. Generate unique 8-character alphanumeric invitation code (e.g., "AB12CD34")
2. Code must be uppercase letters and numbers only (A-Z, 0-9)
3. Create shareable invitation link with embedded code
4. Display invitation code prominently on screen
5. Provide copy-to-clipboard functionality with haptic feedback
6. Support sharing via email with pre-filled message template
7. Support sharing via SMS with pre-filled message template
8. Store invitation in `invitationStore` with status "pending"
9. Invitation expires after 7 days from creation
10. Show creation timestamp and expiration date
11. Navigation option to proceed to Pair screen or skip to tutorial

## Tasks / Subtasks

- [ ] **Task 1**: Implement invitation code generation (AC: 1-2, 8-9)
  - [ ] Create `src/services/invitationService.ts`
  - [ ] Implement `generateCode()` method:
    - Use nanoid or crypto for unique ID generation
    - Format as 8 uppercase alphanumeric characters
    - Ensure uniqueness by checking existing invitations
  - [ ] Implement `createInvitation(userId)` method:
    - Generate code
    - Create Invitation object with timestamps
    - Set expiration to 7 days from creation
    - Set status to 'pending'
    - Store in invitationStore

- [ ] **Task 2**: Implement InvitationScreen UI component (AC: 3-5, 10)
  - [ ] Create `src/screens/onboarding/InvitationScreen.tsx`
  - [ ] Display large, prominent invitation code
  - [ ] Show creation and expiration timestamps
  - [ ] Add copy-to-clipboard button with icon
  - [ ] Implement clipboard copy with Expo Clipboard API
  - [ ] Add haptic feedback on successful copy
  - [ ] Show toast/snackbar confirmation message
  - [ ] Apply galaxy background styling

- [ ] **Task 3**: Implement sharing functionality (AC: 6-7)
  - [ ] Add React Native Share integration
  - [ ] Create email sharing option:
    - Subject: "Join me on Twinship!"
    - Body template with invitation code and app description
    - Include invitation link if available
  - [ ] Create SMS sharing option:
    - Message template with invitation code
    - Concise format for SMS character limits
  - [ ] Add sharing UI buttons (Email, SMS, More options)
  - [ ] Handle share success/failure states

- [ ] **Task 4**: Implement state management (AC: 8)
  - [ ] Create/update `src/state/invitationStore.ts`
  - [ ] Define Invitation interface:
    ```typescript
    interface Invitation {
      id: string;
      code: string;
      createdBy: string;
      createdAt: string;
      expiresAt: string;
      status: 'pending' | 'accepted' | 'expired';
      acceptedBy?: string;
      acceptedAt?: string;
    }
    ```
  - [ ] Add invitation to store on creation
  - [ ] Persist invitations to AsyncStorage
  - [ ] Add action to mark invitation as expired

- [ ] **Task 5**: Implement navigation flow (AC: 11)
  - [ ] Add "Continue" button to proceed to next step
  - [ ] Add "Skip" option to go directly to tutorial
  - [ ] Update `AppNavigator.tsx` with InvitationScreen route
  - [ ] Handle navigation params (profile data)

- [ ] **Task 6**: Write unit tests
  - [ ] Test generateCode() produces valid 8-char alphanumeric codes
  - [ ] Test code uniqueness (no duplicates)
  - [ ] Test createInvitation() creates valid Invitation object
  - [ ] Test expiration date is 7 days from creation
  - [ ] Test clipboard copy functionality
  - [ ] Test share functionality (mock React Native Share)
  - [ ] Test invitation persistence to AsyncStorage

- [ ] **Task 7**: Write integration tests
  - [ ] Test complete flow: generate code → display → copy → share
  - [ ] Test invitation stored correctly in invitationStore
  - [ ] Test navigation to next screen
  - [ ] Test invitation data persists across app restart

## Dev Notes

### Architecture Patterns and Constraints

**State Management Pattern:**
- Use Zustand `invitationStore` for invitation management
- AsyncStorage persistence for invitation history
- Separate from `twinStore` for clearer separation of concerns

**Code Generation Strategy:**
- Use `nanoid` with custom alphabet (A-Z, 0-9)
- Length: 8 characters for memorability vs uniqueness balance
- Collision detection: Check existing codes before assigning
- Uppercase only for clarity (avoids 0/O, 1/I confusion)

**Sharing Integration:**
- React Native Share API for cross-platform compatibility
- Pre-filled message templates for ease of use
- Graceful handling of share cancellation

**Navigation Flow:**
```
RegisterScreen (Story 1.1)
  → ColorSelectionScreen (Story 1.2)
  → InvitationScreen (Story 1.3) ← YOU ARE HERE
  → PairScreen (Story 1.4) or TutorialScreen (Story 1.5)
```

### Source Tree Components

**Files to Create:**
- `src/screens/onboarding/InvitationScreen.tsx` - Main invitation UI
- `src/services/invitationService.ts` - Code generation and management
- `src/state/invitationStore.ts` - Invitation state management
- `src/types/invitation.ts` - Invitation type definitions
- `src/components/onboarding/ShareButtons.tsx` - Share option buttons

**Files to Modify:**
- `src/navigation/AppNavigator.tsx` - Add InvitationScreen route
- `src/types/index.ts` - Export invitation types

**Design System Components to Use:**
- Galaxy background: `require("../../../assets/galaxybackground.png")`
- NativeWind classes for styling
- Expo Haptics for copy confirmation
- Expo Clipboard for copy-to-clipboard
- React Native Share for sharing
- SafeAreaView for proper screen insets

**External Dependencies:**
- `nanoid` - Unique ID generation (may need to install)
- `@react-native-clipboard/clipboard` or `expo-clipboard`
- `react-native-share` or use built-in Share API

### Testing Standards Summary

**Unit Test Coverage Target:** 80%

**Key Test Files:**
- `__tests__/screens/onboarding/InvitationScreen.test.tsx`
- `__tests__/services/invitationService.test.ts`
- `__tests__/state/invitationStore.test.ts`

**Testing Framework:**
- Jest + React Native Testing Library
- Mock AsyncStorage
- Mock React Native Share
- Mock Expo Clipboard
- Mock nanoid for deterministic code generation

### Project Structure Notes

**Alignment with Unified Structure:**
- Screens in `/src/screens/onboarding/`
- Services in `/src/services/`
- State in `/src/state/`
- Types in `/src/types/`
- Tests mirror source structure

**Invitation Code Format:**
- Pattern: `/^[A-Z0-9]{8}$/`
- Example: "AB12CD34", "XY78ZQ90"
- Avoid ambiguous characters in display (optional enhancement)

**Message Templates:**

Email template:
```
Subject: Join me on Twinship!

Hey! I'm using Twinship to connect with my twin and explore our unique bond.
I'd love for you to join me!

Use this invitation code to pair with me: [CODE]

Download Twinship and enter the code when prompted.

Can't wait to connect!
```

SMS template:
```
Join me on Twinship! Use code [CODE] to pair with me. Download: [APP_URL]
```

**No Detected Conflicts**

### References

- [Source: docs/tech-spec-epic-1.md#Data-Models-and-Contracts] Invitation interface definition
- [Source: docs/tech-spec-epic-1.md#APIs-and-Interfaces] InvitationService method signatures
- [Source: docs/tech-spec-epic-1.md#Workflows-and-Sequencing] Invitation flow sequence
- [Source: docs/tech-spec-epic-1.md#Test-Strategy-Summary] Unit test requirements
- [Source: docs/epics.md#Story-1.3] Epic story definition and effort estimate
- [Source: docs/Twinship PRD.md] Invitation and pairing requirements

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

# Story 1.4: Accept Twin Invitation and Pair

Status: drafted

## Story

As a **new user with an invitation code from my twin**,
I want **to accept the invitation and pair with them**,
so that **we can access twin-specific features together**.

## Acceptance Criteria

1. Input field accepts 8-character alphanumeric invitation code
2. Real-time validation displays format errors (must be 8 uppercase chars)
3. Enter key on keyboard submits the code
4. Validate code exists in system and is not expired
5. Show twin preview (name, twin type) before final confirmation
6. User can confirm or cancel pairing
7. Create TwinConnection linking both user profiles
8. Update both profiles with twinId references
9. Mark invitation as "accepted" with timestamp
10. Display celebration animation (particles, haptic feedback)
11. Auto-navigate to TwinTalk after 1.5 second delay
12. Handle error cases: invalid code, expired code, already used code

## Tasks / Subtasks

- [ ] **Task 1**: Implement PairScreen UI component (AC: 1-3, 10)
  - [ ] Update/enhance `src/screens/PairScreen.tsx`
  - [ ] Add TextInput for 8-character code entry
  - [ ] Configure keyboard: uppercase, no autocorrect
  - [ ] Add real-time format validation display
  - [ ] Support Enter key submission
  - [ ] Add "Connect" button (disabled until valid format)
  - [ ] Apply galaxy background styling
  - [ ] Add celebration animation components (confetti/particles)
  - [ ] Implement haptic feedback on success

- [ ] **Task 2**: Implement code validation logic (AC: 2, 4, 12)
  - [ ] Create format validation function:
    - Pattern: `/^[A-Z0-9]{8}$/`
    - Real-time feedback on input
  - [ ] Implement `validateCode()` in invitationService:
    - Check code exists in invitationStore
    - Verify status is 'pending'
    - Verify not expired (expiresAt > now)
    - Return validation result with error details
  - [ ] Add error state management and display
  - [ ] Error messages:
    - "Invalid code format"
    - "Code not found"
    - "Code expired"
    - "Code already used"

- [ ] **Task 3**: Implement twin preview and confirmation (AC: 5-6)
  - [ ] Fetch creating user's profile from code
  - [ ] Display twin preview card:
    - Name
    - Twin type (identical/fraternal/other)
    - Optional: accent color preview
  - [ ] Add confirmation UI:
    - "Pair with [Name]?" prompt
    - Confirm button
    - Cancel button
  - [ ] Handle cancellation (return to code input)

- [ ] **Task 4**: Implement pairing logic (AC: 7-9)
  - [ ] Enhance `src/services/invitationService.ts` with `pairTwins()`:
    ```typescript
    async pairTwins(code: string, acceptingUserId: string): Promise<{
      success: boolean;
      connection?: TwinConnection;
      error?: string;
    }>
    ```
  - [ ] Create TwinConnection object:
    - Generate unique connection ID
    - Link twin1Id and twin2Id
    - Store invitationId reference
    - Set pairedAt timestamp
  - [ ] Update both UserProfile objects:
    - Set twinId for both users
    - Update updatedAt timestamps
  - [ ] Update invitation status:
    - Set status to 'accepted'
    - Set acceptedBy to accepting user ID
    - Set acceptedAt to current timestamp
  - [ ] Save all changes to twinStore and AsyncStorage

- [ ] **Task 5**: Implement post-pairing flow (AC: 10-11)
  - [ ] Trigger celebration sequence:
    - Show particle/confetti animation
    - Play success haptic feedback pattern
    - Display "Successfully paired!" message
  - [ ] Add 1.5 second delay
  - [ ] Auto-navigate to TwinTalk screen
  - [ ] Send welcome message from mock twin (development mode)

- [ ] **Task 6**: Handle development test codes (existing feature)
  - [ ] Maintain TEST/TESTTWIN development codes
  - [ ] Create mock twin profiles for testing
  - [ ] Auto-complete pairing for dev codes
  - [ ] Ensure test codes work with new validation

- [ ] **Task 7**: Write unit tests
  - [ ] Test code format validation
  - [ ] Test validateCode() with various states:
    - Valid pending code → success
    - Invalid format → format error
    - Non-existent code → not found error
    - Expired code → expired error
    - Already accepted code → already used error
  - [ ] Test pairTwins() creates correct TwinConnection
  - [ ] Test profile updates (both twins get twinId)
  - [ ] Test invitation status updates
  - [ ] Test AsyncStorage persistence

- [ ] **Task 8**: Write integration tests
  - [ ] Test complete flow: enter code → validate → preview → confirm → pair → celebrate → navigate
  - [ ] Test error handling and retry flow
  - [ ] Test cancellation returns to input
  - [ ] Test twin connection persists across app restart
  - [ ] Test both users can access each other's profiles

## Dev Notes

### Architecture Patterns and Constraints

**State Management Pattern:**
- Use `invitationStore` for code validation and invitation management
- Use `twinStore` for twin connection and profile updates
- Bidirectional update: both twins' profiles must be updated atomically
- AsyncStorage persistence ensures offline access to connection

**Validation Strategy:**
- Client-side format validation (immediate feedback)
- Service-layer business logic validation (code exists, not expired)
- Atomic pairing transaction (all-or-nothing updates)

**Navigation Flow:**
```
PairScreen (Story 1.4) ← YOU ARE HERE
  ↓ (after successful pairing)
TwinTalk Screen
  ↓ (optional)
TutorialScreen (Story 1.5)
```

**Existing Implementation:**
- PairScreen already exists with TEST/TESTTWIN functionality
- Need to enhance with production invitation code validation
- Maintain development test codes alongside production logic

### Source Tree Components

**Files to Modify:**
- `src/screens/PairScreen.tsx` - Enhance with invitation validation
- `src/services/invitationService.ts` - Add validateCode() and pairTwins()
- `src/state/invitationStore.ts` - Add validation actions
- `src/state/twinStore.ts` - Add pairing actions

**Files to Create:**
- `src/components/pairing/TwinPreviewCard.tsx` - Twin preview component
- `src/components/pairing/CelebrationAnimation.tsx` - Success animation
- `src/types/twinConnection.ts` - TwinConnection type definitions

**Design System Components to Use:**
- Galaxy background: `require("../../assets/galaxybackground.png")`
- NativeWind classes for styling
- React Native Reanimated for celebration animations
- Expo Haptics for success feedback
- SafeAreaView for proper screen insets

**Animation Libraries:**
- React Native Reanimated for particle effects
- Or use Lottie for pre-made celebration animations
- React Native Confetti for confetti effect (optional)

### Testing Standards Summary

**Unit Test Coverage Target:** 80%

**Key Test Files:**
- `__tests__/screens/PairScreen.test.tsx`
- `__tests__/services/invitationService.test.ts`
- `__tests__/components/pairing/TwinPreviewCard.test.tsx`

**Testing Framework:**
- Jest + React Native Testing Library
- Mock AsyncStorage
- Mock navigation
- Mock invitation data
- Mock Reanimated for animations

### Project Structure Notes

**Alignment with Unified Structure:**
- Screen in `/src/screens/`
- Services in `/src/services/`
- State in `/src/state/`
- Components in `/src/components/pairing/`
- Tests mirror source structure

**TwinConnection Data Model:**
```typescript
interface TwinConnection {
  id: string;                    // UUID v4 for the connection
  twin1Id: string;               // User ID of first twin (creator)
  twin2Id: string;               // User ID of second twin (acceptor)
  pairedAt: string;              // ISO 8601 timestamp
  invitationId: string;          // Reference to invitation used
}
```

**Validation Error Codes:**
```typescript
type ValidationError =
  | 'INVALID_FORMAT'      // Not 8 chars or wrong pattern
  | 'CODE_NOT_FOUND'      // No invitation with this code
  | 'CODE_EXPIRED'        // expiresAt < now
  | 'CODE_ALREADY_USED'   // status === 'accepted'
  | 'NETWORK_ERROR';      // Future: API call failed
```

**Development Test Codes:**
- "TEST" → Creates Jordan/Alex pair (you as Jordan)
- "TESTTWIN" → Creates Alex/Jordan pair (you as Alex)
- These bypass invitation validation for development testing

**No Detected Conflicts** with existing PairScreen implementation

### References

- [Source: docs/tech-spec-epic-1.md#Data-Models-and-Contracts] TwinConnection interface
- [Source: docs/tech-spec-epic-1.md#APIs-and-Interfaces] invitationService.pairTwins()
- [Source: docs/tech-spec-epic-1.md#Workflows-and-Sequencing] Twin pairing flow sequence
- [Source: docs/tech-spec-epic-1.md#Workflows-and-Sequencing] Error handling sequences
- [Source: docs/tech-spec-epic-1.md#Test-Strategy-Summary] Unit test requirements
- [Source: docs/epics.md#Story-1.4] Epic story definition and effort estimate
- [Source: docs/Twinship PRD.md] Twin pairing and security requirements
- [Source: CLAUDE.md#PairScreen-Improvements] Existing PairScreen implementation notes

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

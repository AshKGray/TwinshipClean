# Story 5.1: Research Consent and Opt-In Flow

**Story ID**: 5-1
**Epic**: Epic 5 - Research & Analytics Infrastructure
**Status**: Drafted
**Priority**: High
**Estimated Effort**: Medium (4-5 hours)
**Dependencies**: Epic 1 (user profiles)

---

## Story

**As a** paired user
**I want** to choose whether to participate in research
**So that** I control how my data is used

---

## Acceptance Criteria

1. User can access ConsentScreen from onboarding or settings
2. Clear explanation of research participation displayed
3. Four consent level options presented: None, Anonymous, Aggregate, Full
4. Each level has clear description of what data is collected
5. Privacy policy link accessible before consent
6. User can select consent level and confirm
7. Consent saved with timestamp and policy version
8. Annual review reminder set for 1 year from consent
9. User can change consent level later in settings
10. User can revoke consent completely
11. Consent status persists across app restarts

---

## Tasks

### Task 1: Create ResearchConsent Data Model
**Estimated**: 30 minutes
- Define ResearchConsent interface in TypeScript
- Create ConsentLevel enum (NONE, ANONYMOUS, AGGREGATE, FULL)
- Add policyVersion field
- Add annualReviewDue timestamp calculation

**Files**:
- `src/models/ResearchConsent.ts`

### Task 2: Implement ConsentService
**Estimated**: 1 hour
- Create consentService.ts with methods:
  - grantConsent(userId, level)
  - updateConsentLevel(userId, level)
  - revokeConsent(userId)
  - isConsentValid(userId)
  - needsAnnualReview(userId)
- Add consent timestamp tracking
- Calculate annual review date (1 year from consent)

**Files**:
- `src/services/research/consentService.ts`

### Task 3: Create ResearchStore
**Estimated**: 45 minutes
- Create researchStore.ts with Zustand
- Add consent state management
- Add AsyncStorage persistence middleware
- Implement actions: setConsent, updateConsent, revokeConsent
- Add selectors: getConsent, needsAnnualReview

**Files**:
- `src/state/researchStore.ts`

### Task 4: Design ConsentScreen UI
**Estimated**: 1.5 hours
- Create ConsentScreen.tsx with galaxy background
- Add research explanation section with clear copy
- Design consent level cards (4 options)
- Add description for each level:
  - None: "Don't participate in research"
  - Anonymous: "Fully anonymized data only"
  - Aggregate: "Contribute to aggregate statistics"
  - Full: "Identified data for future research"
- Add privacy policy link
- Add confirm/cancel buttons
- Add haptic feedback on selection

**Files**:
- `src/screens/research/ConsentScreen.tsx`
- `src/components/research/ConsentCard.tsx`

### Task 5: Implement Consent Selection Logic
**Estimated**: 45 minutes
- Handle consent level selection state
- Validate selection before confirmation
- Call consentService.grantConsent() on confirm
- Show success confirmation message
- Navigate back or forward based on context (onboarding vs settings)

**Files**:
- `src/screens/research/ConsentScreen.tsx`

### Task 6: Add Consent Settings Management
**Estimated**: 30 minutes
- Add research consent section to Settings screen
- Display current consent level
- Add "Change Consent" button
- Add "Revoke Consent" button with confirmation dialog
- Show last updated date

**Files**:
- `src/screens/settings/SettingsScreen.tsx` (update)
- `src/components/research/ConsentStatusCard.tsx`

### Task 7: Implement Annual Review Reminder
**Estimated**: 30 minutes
- Check on app startup if annual review needed
- Show notification if due
- Navigate to ConsentScreen in review mode
- Display contribution summary from past year
- Allow user to confirm or update consent

**Files**:
- `src/services/research/consentService.ts` (update)
- `src/screens/research/ConsentScreen.tsx` (update for review mode)

---

## Development Notes

**Key Implementation Details:**
- Consent is completely optional - no blocking users who don't opt in
- Default consent level is NONE
- Annual review is a reminder, not a forced re-consent
- Revoking consent should clear submission queue (Story 5.3 dependency)
- Privacy policy should be in-app, not external link (better UX)

**Edge Cases:**
- User starts consent flow but doesn't complete (save draft?)
- User revokes consent with queued submissions (clear queue)
- User changes consent level multiple times (log all changes)
- App upgrade with new policy version (prompt for re-consent)

**Privacy Considerations:**
- Make NONE option prominent (not dark pattern)
- Clear, plain-language explanations (no legal jargon)
- Examples of what data is collected for each level
- Emphasize user control and revocability

---

## Architecture Decisions

**State Management:**
- Zustand for consent state (lightweight, simple)
- AsyncStorage for persistence (offline-first)
- No backend sync in MVP (local only)

**UI Patterns:**
- Card-based selection (like color selection in Epic 1)
- Clear visual distinction between levels
- Preview of what each level means
- Confirmation step before saving

**Data Flow:**
```
User selects level
  ↓
ConsentScreen validates
  ↓
Call consentService.grantConsent()
  ↓
Save to researchStore
  ↓
Persist to AsyncStorage
  ↓
Set annual review reminder
  ↓
Show confirmation
```

---

## Testing Requirements

### Unit Tests
- ConsentLevel enum validation
- Consent timestamp generation
- Annual review date calculation (1 year from consent)
- Revocation sets revokedDate correctly
- isConsentValid() logic

### Integration Tests
- Grant consent → Store updated → AsyncStorage persisted
- Update consent level → Store updated
- Revoke consent → Store cleared
- Annual review check on app startup

### UI Tests
- All 4 consent level cards render
- Privacy policy link works
- Confirm button disabled until selection made
- Success confirmation displays
- Settings screen shows current consent level

### E2E Tests
- Complete consent flow from onboarding
- Change consent level in settings
- Revoke consent and verify no future contributions

---

## Related Documentation

- [Source: docs/tech-spec-epic-5.md#Consent-Flow] Detailed workflow
- [Source: docs/Twinship PRD.md#Research-Participation] PRD requirements
- [Source: docs/tech-spec-epic-5.md#Data-Models] ResearchConsent interface
- [Source: docs/tech-spec-epic-5.md#Privacy-Requirements] GDPR compliance

---

## Story Completion Checklist

- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (80%+ coverage)
- [ ] Integration tests written and passing
- [ ] UI tests written and passing
- [ ] E2E test for consent flow passing
- [ ] Code reviewed and approved
- [ ] Manual testing on iOS and Android
- [ ] Privacy policy content reviewed
- [ ] No high-severity bugs
- [ ] Documentation updated
- [ ] Sprint status updated to "done"

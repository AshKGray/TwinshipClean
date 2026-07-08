# Story 5.3: Anonymized Data Submission Pipeline

**Story ID**: 5-3
**Epic**: Epic 5 - Research & Analytics Infrastructure
**Status**: Drafted
**Priority**: Critical
**Estimated Effort**: Medium (6-7 hours)
**Dependencies**: Story 5.2 (contribution tracking)

---

## Story

**As the** system
**I want** to anonymize and submit research data
**So that** user privacy is protected

---

## Acceptance Criteria

1. PII stripped from all game session data before submission
2. User IDs consistently hashed to anonymous IDs
3. Twin pair IDs hashed for linkage
4. Timestamps rounded to nearest hour
5. Exact birthdates converted to age ranges
6. Names, emails, photos removed
7. Automated PII validation before submission
8. Data encrypted before transmission (HTTPS)
9. Batch submissions supported (up to 50 items)
10. Failed submissions queued for retry
11. Exponential backoff on retries (3 max attempts)
12. Submission logs track status and errors
13. Offline queue processes when connection restored

---

## Tasks

### Task 1: Create AnonymizedData Data Model
**Estimated**: 30 minutes
- Define AnonymizedData interface
- Add metadata fields (appVersion, platform, consentLevel)
- Create anonymization version tracking
- Define PII-free payload structure

**Files**:
- `src/models/AnonymizedData.ts`

### Task 2: Implement DataAnonymizationService
**Estimated**: 2 hours
- Create dataAnonymization.ts
- Implement anonymizeGameSession(session):
  - Strip name, email, photos
  - Hash userId and twinId (SHA-256)
  - Round timestamps to nearest hour
  - Convert birthdate to age range (18-25, 26-35, etc.)
  - Remove location precision (country only)
- Implement anonymizeUserProfile(profile)
- Implement hashUserId(userId) with salt
- Implement stripMetadata(data)
- Implement validateAnonymization(data):
  - Check for email regex
  - Check for name patterns
  - Check for precise timestamps
  - Check for exact ages

**Files**:
- `src/services/research/dataAnonymization.ts`
- `src/utils/crypto.ts` (hash utilities)

### Task 3: Create SubmissionService
**Estimated**: 1.5 hours
- Create submissionService.ts
- Implement submitData(data):
  - Encrypt payload
  - POST to research API
  - Handle success/failure
  - Return submissionId
- Implement submitBatch(dataArray):
  - Batch up to 50 items
  - Single POST request
  - Track individual failures
- Implement queueForRetry(data)
- Implement processQueue():
  - Exponential backoff (1s, 2s, 4s)
  - Max 3 retry attempts
  - Remove after 3 failures
- Implement encryptPayload(data) using crypto-js

**Files**:
- `src/services/research/submissionService.ts`

### Task 4: Update ResearchStore for Submission Queue
**Estimated**: 1 hour
- Add submission queue state
- Implement queueSubmission(data)
- Implement getSubmissionQueue()
- Implement markSubmitted(submissionId)
- Implement retryFailed()
- Add queue persistence to AsyncStorage
- Add queue size limit (500 items max)

**Files**:
- `src/state/researchStore.ts` (update)

### Task 5: Implement Auto-Submission on Game Completion
**Estimated**: 1 hour
- Hook into game completion event (assessmentStore)
- Check consent level (skip if NONE)
- Anonymize game session data
- Validate anonymization
- Queue for submission
- Check network connectivity
- Submit immediately if online
- Show toast notification on contribution

**Files**:
- `src/state/assessmentStore.ts` (update)
- `src/services/research/autoSubmission.ts`

### Task 6: Implement Offline Queue Processing
**Estimated**: 1 hour
- Listen for network state changes (NetInfo)
- Process queue when connection restored
- Show sync status indicator
- Handle batch submission failures
- Update contribution logs on success
- Notify user if queue is large (> 100 items)

**Files**:
- `src/services/research/submissionService.ts` (update)
- `src/components/research/SyncStatusIndicator.tsx`

### Task 7: Add PII Validation Tests
**Estimated**: 1 hour
- Create comprehensive test suite
- Test anonymization removes all PII:
  - Names (various formats)
  - Emails (regex detection)
  - Exact birthdates
  - Precise timestamps
  - Location coordinates
- Test hash consistency (same input → same hash)
- Test age range conversion
- Test timestamp rounding

**Files**:
- `src/services/research/__tests__/dataAnonymization.test.ts`

---

## Development Notes

**Critical Security Requirements:**
- **Zero PII Leakage**: Automated validation must catch all PII
- **Consistent Hashing**: Same userId always produces same anonymousId
- **Irreversibility**: Hashes cannot be reversed
- **Encryption**: All data encrypted in transit (HTTPS)

**PII Stripping Checklist:**
```typescript
// Before Anonymization:
{
  userId: "123e4567-e89b-12d3-a456-426614174000",
  name: "Jordan Smith",
  email: "jordan@example.com",
  birthdate: "1995-06-15",
  twinId: "789e4567-e89b-12d3-a456-426614174999",
  gameData: {
    timestamp: "2025-11-18T14:32:45.123Z",
    moves: [...]
  }
}

// After Anonymization:
{
  anonymousId: "a7b3c2d1e4f5g6h7i8j9k0l1m2n3o4p5",
  twinPairId: "x1y2z3a4b5c6d7e8f9g0h1i2j3k4l5m6",
  ageRange: "26-35",
  gameData: {
    timestamp: "2025-11-18T14:00:00.000Z", // Rounded to hour
    moves: [...]
  },
  metadata: {
    appVersion: "1.0.0",
    platform: "ios",
    consentLevel: "anonymous"
  }
}
```

**Edge Cases:**
- Submission fails 3 times (remove from queue, log error)
- Queue grows > 500 items (alert user, pause new submissions)
- Network flaps (don't retry immediately, wait for stable connection)
- Backend rejects anonymized data (log error, don't retry)
- User revokes consent with queued data (clear queue immediately)

**Performance Considerations:**
- Anonymization should be fast (< 100ms per session)
- Batch submissions reduce API calls
- Queue processing should not block UI
- Use background tasks for large queues (expo-task-manager)

---

## Architecture Decisions

**Anonymization Flow:**
```
Game session completes
  ↓
Check consent level
  ↓
[If ANONYMOUS or higher]
  ↓
dataAnonymization.anonymizeGameSession(session)
  ↓
PII stripped:
  - Hash user IDs
  - Remove names, emails
  - Round timestamps
  - Convert birthdate to age range
  ↓
validateAnonymization(anonymizedData)
  ↓
[If valid]
  ↓
contributionTracker.trackContribution()
  ↓
submissionService.queueForRetry(anonymizedData)
  ↓
Check network
  ↓
[If online] → submitData()
[If offline] → Keep in queue
```

**Retry Logic:**
```
Submission fails
  ↓
Add to retry queue with attemptCount = 1
  ↓
Wait exponential backoff (2^attemptCount seconds)
  ↓
Retry submission
  ↓
[If success] → Remove from queue
[If failure] → attemptCount++
  ↓
[If attemptCount < 3] → Retry again
[If attemptCount >= 3] → Remove from queue, log error
```

**Hash Generation:**
```typescript
function hashUserId(userId: string): string {
  const salt = "twinship-research-salt-v1"; // App-wide constant
  const hash = SHA256(userId + salt).toString();
  return hash.substring(0, 32); // 32-character anonymous ID
}
```

---

## Testing Requirements

### Unit Tests (Critical)
- anonymizeGameSession() removes all PII
- hashUserId() produces consistent hashes
- validateAnonymization() detects PII leakage:
  - Detects email patterns
  - Detects name patterns (common names)
  - Detects precise timestamps (not rounded)
  - Detects exact ages (not ranges)
- Age range conversion: 24 → "18-25", 35 → "26-35", etc.
- Timestamp rounding: 14:32:45 → 14:00:00
- Encryption/decryption roundtrip

### Integration Tests
- Complete game → Anonymize → Queue → Submit → Success
- Submission failure → Retry 3 times → Remove from queue
- Offline → Queue → Come online → Process queue
- Revoke consent → Clear queue

### Security Tests (Critical)
- No PII in 1000 anonymized samples (random testing)
- Hash collision rate (should be zero)
- Encryption strength validation
- HTTPS enforcement (reject HTTP)

### E2E Tests
- Complete game → Verify anonymized submission
- Simulate network failure → Verify queue
- Restore network → Verify queue processes

### Performance Tests
- Anonymization speed: < 100ms per session
- Batch submission: 50 items in < 5 seconds
- Queue processing: 500 items in < 30 seconds

---

## Related Documentation

- [Source: docs/tech-spec-epic-5.md#Anonymization] Detailed anonymization logic
- [Source: docs/tech-spec-epic-5.md#Security] PII stripping requirements
- [Source: docs/tech-spec-epic-5.md#Data-Models] AnonymizedData interface
- [Source: docs/Twinship PRD.md#Privacy-Requirements] Privacy framework

---

## Story Completion Checklist

- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (80%+ coverage)
- [ ] Integration tests written and passing
- [ ] Security tests passing (no PII leakage)
- [ ] E2E test for submission flow passing
- [ ] Performance tests passing (anonymization < 100ms)
- [ ] Code reviewed and approved by security team
- [ ] Manual testing on iOS and Android
- [ ] Penetration testing for PII leakage
- [ ] Privacy audit by legal team
- [ ] No high-severity bugs
- [ ] Documentation updated
- [ ] Sprint status updated to "done"

---

## Security Review Checklist

- [ ] All PII stripping logic reviewed
- [ ] Hash algorithm approved (SHA-256)
- [ ] Encryption strength validated (AES-256)
- [ ] No hardcoded secrets in code
- [ ] Automated PII validation comprehensive
- [ ] Edge cases tested (unicode names, special chars)
- [ ] No PII in error logs or crash reports
- [ ] HTTPS enforced for all API calls

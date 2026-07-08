# Story 4.5: Automatic Twintuition Sync Detection

Status: drafted

## Story

As **the system**,
I want **to detect when both twins press the Twintuition button simultaneously**,
so that **mutual synchronicity can be automatically logged as a twincidence**.

## Acceptance Criteria

1. Listens for Twintuition button presses from both twins via Firebase Realtime Database
2. "Simultaneous" defined as within 30 seconds of each other
3. Creates twincidence automatically when mutual press detected
4. Metadata includes both press timestamps and calculated time delta
5. Confidence score calculated using formula: `1 - (deltaSeconds / 30)`
6. Higher confidence (<5 seconds) displays special "strong sync" badge in timeline
7. Push notification sent to both twins upon detection with personalized message
8. Notification includes delta time (e.g., "3 seconds apart!")
9. Timeline shows mutual twintuition with unique icon (double lightning bolt) and neon glow effect
10. Haptic feedback (success pattern) triggered on both devices when detected

## Tasks / Subtasks

- [ ] **Task 1**: Create Twintuition detection service (AC: 1-5)
- [ ] **Task 2**: Implement twincidence creation for mutual press (AC: 3-4)
- [ ] **Task 3**: Implement strong sync badge (AC: 6)
- [ ] **Task 4**: Implement push notifications (AC: 7-8)
- [ ] **Task 5**: Add visual indicators in timeline (AC: 9)
- [ ] **Task 6**: Implement haptic feedback (AC: 10)
- [ ] **Task 7**: Write unit tests
- [ ] **Task 8**: Write integration tests
- [ ] **Task 9**: Write E2E tests

## Dev Notes

### References
- [Source: docs/tech-spec-epic-4.md#Workflows] Twintuition detection flow
- [Source: docs/epics.md#Story-4.5] Effort: 6-7 hours

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

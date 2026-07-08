# Story 4.4: Twincidence Detail View

Status: drafted

## Story

As a **paired user**,
I want **to view full details of any twincidence**,
so that **I can see all associated data, media, and context**.

## Acceptance Criteria

1. Full-screen detail view for selected twincidence
2. Display all metadata: category, timestamp, detection type, confidence score (if automatic)
3. Full description with formatting preserved (markdown rendering)
4. Photo gallery (swipeable, pinch-to-zoom, full-screen mode)
5. Video playback inline with standard controls (play, pause, seek, fullscreen)
6. Voice note playback with waveform visualization and progress indicator
7. For automatic detections: Display detection method explanation and data visualization
8. For biometric sync: Charts showing synchronized data for both twins (heart rate graph, sleep timeline, activity comparison)
9. Show both twins' data side-by-side when available
10. Share button exports as image card or formatted text
11. Edit button (manual entries only) opens edit modal
12. Delete button (manual entries only) with confirmation dialog
13. Annotation section showing twin perspectives with color-coded avatars

## Tasks / Subtasks

- [ ] **Task 1**: Create TwincidenceDetail screen (AC: 1-3)
- [ ] **Task 2**: Implement media gallery and playback (AC: 4-6)
- [ ] **Task 3**: Create biometric chart components (AC: 7-9)
- [ ] **Task 4**: Implement share, edit, delete actions (AC: 10-12)
- [ ] **Task 5**: Add annotations section (AC: 13)
- [ ] **Task 6**: Write unit and integration tests

## Dev Notes

### References
- [Source: docs/tech-spec-epic-4.md#Acceptance-Criteria] AC-4.4
- [Source: docs/epics.md#Story-4.4] Effort: 8-9 hours

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

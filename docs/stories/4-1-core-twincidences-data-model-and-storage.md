# Story 4.1: Core Twincidences Data Model & Storage

Status: drafted

## Story

As a **developer**,
I want **a robust data model and storage system for twincidences**,
so that **both automated and manual entries can be consistently stored, queried, and persisted locally**.

## Acceptance Criteria

1. Twincidence TypeScript interface defined with all required fields (id, timestamp, category, detectionType, title, description, metadata, media, tags, etc.)
2. TwincidenceCategory enum includes all automatic types (TWINTUITION_SYNC, BIOMETRIC_SYNC, LOCATION_COINCIDENCE) and manual types (MANUAL_ESP, MANUAL_DREAM, MANUAL_TWIN_TALK, MANUAL_OTHER)
3. AsyncStorage schema supports twincidence persistence with versioned key (`twinship:v1:twincidences`)
4. Unique ID generation (UUID v4) for each twincidence
5. Metadata structure supports all detection types with flexible rawData field
6. Media array supports photos, videos, voice notes with type, URI, and metadata
7. Version history tracks all edits with timestamps and twin IDs
8. Annotations array for collaborative twin comments
9. CRUD operations implemented in twincidencesStore (create, read, update, delete, query)
10. Data persists across app restarts using Zustand persist middleware
11. Query methods support filtering by category, date range, tags, and search text
12. Analytics aggregation methods (count by category, trend data, synchronicity scoring)

## Tasks / Subtasks

- [ ] **Task 1**: Define TypeScript interfaces and types (AC: 1-2, 5-8)
  - [ ] Create `src/models/Twincidence.ts` with:
    - Twincidence interface (all fields from tech spec)
    - TwincidenceCategory enum (9 categories)
    - TwincidenceMetadata interface (flexible for all detection types)
    - BiometricSyncData, SleepData, ActivityData interfaces
    - LocationData, PlaceVisit interfaces
    - MediaItem interface (photo/video/voice)
    - Annotation interface
    - TwincidenceVersion interface for history
  - [ ] Export all types from models/index.ts

- [ ] **Task 2**: Create AsyncStorage persistence layer (AC: 3, 10)
  - [ ] Create `src/services/storage/twincidenceStorage.ts`
  - [ ] Implement saveTwincidences(twincidences: Twincidence[]): Promise<void>
  - [ ] Implement loadTwincidences(): Promise<Twincidence[]>
  - [ ] Implement appendTwincidence(twincidence: Twincidence): Promise<void>
  - [ ] Use versioned key: `twinship:v1:twincidences`
  - [ ] Handle JSON serialization with Date conversion
  - [ ] Add error handling with fallback to in-memory storage

- [ ] **Task 3**: Implement Zustand twincidencesStore (AC: 9-12)
  - [ ] Create `src/state/twincidencesStore.ts`
  - [ ] Define store state:
    - twincidences: Twincidence[]
    - loading: boolean
    - error: string | null
  - [ ] Implement CRUD actions:
    - createTwincidence(data: Partial<Twincidence>): Promise<Twincidence>
    - updateTwincidence(id: string, updates: Partial<Twincidence>): Promise<void>
    - deleteTwincidence(id: string): Promise<void>
    - getTwincidence(id: string): Twincidence | null
  - [ ] Implement query actions:
    - getAllTwincidences(): Twincidence[]
    - getTwincidencesByCategory(category: TwincidenceCategory): Twincidence[]
    - getTwincidencesByDateRange(start: Date, end: Date): Twincidence[]
    - searchTwincidences(query: string): Twincidence[]
    - filterTwincidences(filters: TwincidenceFilters): Twincidence[]
  - [ ] Implement analytics actions:
    - getAnalytics(dateRange?: { start: Date; end: Date }): TwincidenceAnalytics
    - getSynchronicityTrend(): number[]
    - getTopCategories(limit: number)
  - [ ] Add Zustand persist middleware with AsyncStorage
  - [ ] Sort twincidences by timestamp (newest first) in queries

- [ ] **Task 4**: Implement utility functions (AC: 4)
  - [ ] Create `src/utils/twincidenceUtils.ts`
  - [ ] Implement generateTwincidenceId(): string using uuid
  - [ ] Implement formatTimestamp(date: Date): string (ISO 8601)
  - [ ] Implement calculateConfidenceScore(deltaSeconds: number): number
  - [ ] Implement sortByTimestamp(twincidences: Twincidence[]): Twincidence[]
  - [ ] Implement filterBySearchQuery(twincidences: Twincidence[], query: string): Twincidence[]

- [ ] **Task 5**: Create sample data factory for testing
  - [ ] Create `src/tests/factories/twincidenceFactory.ts`
  - [ ] Implement createMockTwincidence(overrides?: Partial<Twincidence>): Twincidence
  - [ ] Implement createMockTwintuitionSync(): Twincidence
  - [ ] Implement createMockBiometricSync(): Twincidence
  - [ ] Implement createMockLocationCoincidence(): Twincidence
  - [ ] Implement createMockManualEntry(): Twincidence
  - [ ] Generate realistic timestamps and metadata

- [ ] **Task 6**: Write unit tests
  - [ ] Test Twincidence interface validation (all required fields present)
  - [ ] Test TwincidenceCategory enum (all 9 categories)
  - [ ] Test CRUD operations:
    - Create: generates UUID, sets timestamps, saves to storage
    - Read: retrieves by ID, returns null if not found
    - Update: merges updates, preserves other fields, updates timestamp
    - Delete: removes from array, persists change
  - [ ] Test query operations:
    - By category: returns only matching category
    - By date range: returns only within range
    - Search: matches title, description, tags (case-insensitive)
    - Filter: combines multiple filters correctly
  - [ ] Test AsyncStorage persistence:
    - Data saves successfully
    - Data loads on app restart
    - Handles corrupted data gracefully
  - [ ] Test sorting (newest first)

- [ ] **Task 7**: Write integration tests
  - [ ] Test complete flow: create → save → reload from storage → verify
  - [ ] Test bulk operations: create 100 twincidences → query → verify performance
  - [ ] Test concurrent updates (optimistic locking)
  - [ ] Test data migration from v0 to v1 (if schema changes)

## Dev Notes

### Architecture Patterns and Constraints

**Data Model Design:**
- Flexible metadata structure using union types for detection-specific data
- Version history for audit trail and collaborative editing
- Annotations separated from main content for clarity
- Media stored as references (URIs) not embedded data

**State Management Pattern:**
- Zustand store with persist middleware (AsyncStorage)
- Immutable updates using spread operators
- Optimistic UI updates with rollback on error
- Selectors memoized for performance

**Storage Strategy:**
- Single AsyncStorage key for all twincidences (JSON array)
- Versioned key for schema evolution (`v1`, `v2`, etc.)
- Append operations for new twincidences (avoid full rewrite)
- Periodic cleanup to prevent unbounded growth

### Source Tree Components

**Files to Create:**
- `src/models/Twincidence.ts` - All TypeScript interfaces and types
- `src/state/twincidencesStore.ts` - Zustand store with CRUD operations
- `src/services/storage/twincidenceStorage.ts` - AsyncStorage persistence layer
- `src/utils/twincidenceUtils.ts` - Helper functions (ID generation, sorting, filtering)
- `src/tests/factories/twincidenceFactory.ts` - Test data factory

**Files to Modify:**
- None (foundation story)

**Design System Components to Use:**
- N/A (backend logic only)

### Data Flow

```
User Action (e.g., create manual twincidence)
  ↓
Component calls twincidencesStore.createTwincidence(data)
  ↓
Store generates UUID, adds timestamps
  ↓
Store adds to twincidences array (immutably)
  ↓
Zustand persist middleware triggers
  ↓
twincidenceStorage.saveTwincidences(updatedArray)
  ↓
AsyncStorage.setItem('twinship:v1:twincidences', JSON.stringify(array))
  ↓
Store returns created twincidence to component
  ↓
Component updates UI optimistically
```

### Testing Standards Summary

**Unit Test Coverage Target:** 85%

**Key Test Files:**
- `__tests__/models/Twincidence.test.ts` - Interface validation
- `__tests__/state/twincidencesStore.test.ts` - Store actions and selectors
- `__tests__/services/storage/twincidenceStorage.test.ts` - AsyncStorage operations
- `__tests__/utils/twincidenceUtils.test.ts` - Utility functions

**Testing Framework:**
- Jest + React Native Testing Library
- Mock AsyncStorage using @react-native-async-storage/async-storage mock
- Mock UUID generation for deterministic tests

**Edge Cases to Test:**
- Empty twincidences array
- Corrupted JSON in AsyncStorage
- Very large datasets (1000+ twincidences)
- Concurrent updates to same twincidence
- Date range spanning years
- Search with special characters
- Filter with no results

### Project Structure Notes

**Alignment with Unified Structure:**
- Models in `/src/models/`
- State management in `/src/state/`
- Services in `/src/services/storage/`
- Utilities in `/src/utils/`
- Tests co-located: `__tests__/` mirroring source structure

**Schema Versioning Strategy:**
- v1: Initial schema (this story)
- Future versions: Add migration functions in `src/services/migration/schemaVersioning.ts`
- Migration runs on app startup if version mismatch detected

**No Detected Conflicts**

### References

- [Source: docs/tech-spec-epic-4.md#Data-Models-and-Contracts] Twincidence interface definition
- [Source: docs/tech-spec-epic-4.md#APIs-and-Interfaces] Store actions specification
- [Source: docs/tech-spec-epic-4.md#Acceptance-Criteria] AC-4.1 detailed requirements
- [Source: docs/epics.md#Story-4.1] Epic story definition and effort estimate (5-6 hours)
- [Source: docs/Twinship PRD.md#Twincidences-Log] Feature requirements

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
